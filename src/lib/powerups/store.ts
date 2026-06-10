// src/lib/powerups/store.ts
//
// Persistencia y APLICACIÓN de los comodines de pago. Server-only.
//
// El flujo de una compra:
//   1. /api/powerups/checkout valida la elegibilidad AHORA y crea la fila
//      'pending' + la Checkout Session de Stripe.
//   2. El webhook (checkout.session.completed, product:"powerup") revalida y
//      aplica el efecto con applyPowerup(). Si la ventana se cerró mientras el
//      usuario pagaba (p.ej. arrancó la 2ª parte), la compra pasa a 'failed' y
//      se reembolsa automáticamente: NUNCA cobramos sin aplicar.
//   3. double_down queda 'applied' hasta que la resolución del partido lo
//      multiplica y lo marca 'consumed'.
//
// Todos los aplicadores son IDEMPOTENTES: Stripe reintenta el webhook si no
// respondemos 2xx, así que reaplicar no puede duplicar efectos.

import { adminClient } from "@/lib/predictions/admin";
import { validatePredictionData } from "@/lib/predictions/rules";
import { getMatchMeta } from "@/lib/predictions/match-data";
import { getLastSnapshot } from "@/lib/match-center/store";
import { snapshotStarted } from "@/lib/fantasy/scoring.live";
import { getSession, saveSession } from "@/lib/trivia/store";
import type { PredictionData, PredictionRow } from "@/lib/predictions/types";
import type { PowerupSku, PowerupStatus } from "./catalog";

export interface PowerupPurchaseRow {
  id: string;
  user_id: string;
  sku: PowerupSku;
  status: PowerupStatus;
  match_id: string | null;
  prediction_id: string | null;
  trivia_session_id: string | null;
  payload: PredictionData | null;
  amount: number;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  error: string | null;
  created_at: string;
  paid_at: string | null;
  applied_at: string | null;
  consumed_at: string | null;
  refunded_at: string | null;
}

// ─── Reglas de ventana ───────────────────────────────────────────────────────

/** Tipos de predicción que admiten Segunda Oportunidad. Deliberadamente NO
 *  incluye mercados resolubles a mitad de partido (first_scorer, minute_drama,
 *  over_under…): cambiarlos con información del 1er tiempo sería un exploit. */
export const SECOND_CHANCE_TYPES = ["winner", "exact_score"] as const;

// Tipos planos (no discriminated unions): el tsconfig del repo tiene
// strict:false y sin strictNullChecks TS no estrecha por `!x.ok`.
export interface WindowCheck {
  ok: boolean;
  error?: string;
  message?: string;
}

/**
 * Ventana de la Segunda Oportunidad: desde el cierre de predicciones hasta el
 * FINAL DEL DESCANSO. Con feed en vivo: status NS/1H/HT. Sin feed aún (cerró
 * hace poco o el feed va con retraso) se permite mientras no conste 2ª parte.
 */
export async function secondChanceWindow(matchId: string): Promise<WindowCheck> {
  const meta = getMatchMeta(matchId);
  const matchNum = parseInt(matchId, 10);
  if (!meta?.kickoff_at || Number.isNaN(matchNum)) {
    return { ok: false, error: "match_not_found", message: "Partido no encontrado" };
  }
  const snap = await getLastSnapshot(matchNum);
  if (snap && snap.mode === "live" && snapshotStarted(snap)) {
    if (["FT", "AET", "PEN"].includes(snap.status)) {
      return { ok: false, error: "match_finished", message: "El partido ya terminó" };
    }
    if (!["NS", "1H", "HT"].includes(snap.status)) {
      return { ok: false, error: "too_late", message: "La Segunda Oportunidad cierra en el descanso" };
    }
    return { ok: true };
  }
  // Sin feed: corte duro por reloj en kickoff + 65' (45' + descanso con margen).
  // Si el feed cae, no dejamos cambiar un pick con la 2ª parte ya jugada.
  const cutoff = new Date(meta.kickoff_at).getTime() + 65 * 60_000;
  if (Date.now() >= cutoff) {
    return { ok: false, error: "too_late", message: "La Segunda Oportunidad cierra en el descanso" };
  }
  return { ok: true };
}

/**
 * Ventana del Partido x2 al APLICAR el pago: la compra solo pudo crearse antes
 * del cierre de predicciones, pero el pago puede llegar minutos más tarde.
 * Toleramos hasta el minuto 10 del partido; más allá, refund (el usuario ya vio
 * demasiado fútbol como para que la compra "a ciegas" siga siendo justa).
 */
export async function doubleDownApplyWindow(matchId: string): Promise<WindowCheck> {
  const matchNum = parseInt(matchId, 10);
  if (Number.isNaN(matchNum)) return { ok: false, error: "match_not_found", message: "Partido no encontrado" };
  const snap = await getLastSnapshot(matchNum);
  if (!snap || snap.mode !== "live" || !snapshotStarted(snap)) return { ok: true }; // aún no empezó
  if (snap.status === "NS") return { ok: true };
  if (snap.status === "1H" && (snap.elapsed ?? 0) <= 10) return { ok: true };
  return { ok: false, error: "too_late", message: "El partido ya está demasiado avanzado" };
}

// ─── CRUD básico ─────────────────────────────────────────────────────────────

export async function createPendingPurchase(input: {
  userId: string;
  sku: PowerupSku;
  amount: number;
  currency: string;
  matchId?: string | null;
  predictionId?: string | null;
  triviaSessionId?: string | null;
  payload?: PredictionData | null;
}): Promise<PowerupPurchaseRow> {
  const { data, error } = await adminClient()
    .from("powerup_purchases")
    .insert({
      user_id: input.userId,
      sku: input.sku,
      amount: input.amount,
      currency: input.currency,
      match_id: input.matchId ?? null,
      prediction_id: input.predictionId ?? null,
      trivia_session_id: input.triviaSessionId ?? null,
      payload: input.payload ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PowerupPurchaseRow;
}

export async function attachStripeSession(purchaseId: string, stripeSessionId: string): Promise<void> {
  await adminClient()
    .from("powerup_purchases")
    .update({ stripe_session_id: stripeSessionId })
    .eq("id", purchaseId);
}

export async function getPurchase(id: string): Promise<PowerupPurchaseRow | null> {
  const { data } = await adminClient()
    .from("powerup_purchases")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as PowerupPurchaseRow | null) ?? null;
}

/** ¿Tiene el usuario un Partido x2 efectivo en este partido? */
export async function activeDoubleDown(userId: string, matchId: string): Promise<boolean> {
  const { count } = await adminClient()
    .from("powerup_purchases")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .eq("sku", "double_down")
    .in("status", ["applied", "consumed"]);
  return (count ?? 0) > 0;
}

/** ¿Ya gastó una Segunda Oportunidad en esta predicción? */
export async function secondChanceUsed(userId: string, predictionId: string): Promise<boolean> {
  const { count } = await adminClient()
    .from("powerup_purchases")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("prediction_id", predictionId)
    .eq("sku", "second_chance")
    .eq("status", "applied");
  return (count ?? 0) > 0;
}

/** Usuarios con Partido x2 'applied' en un partido (lo usa resolveMatch). */
export async function getDoubleDownUsers(matchId: string): Promise<Set<string>> {
  const { data } = await adminClient()
    .from("powerup_purchases")
    .select("user_id")
    .eq("match_id", matchId)
    .eq("sku", "double_down")
    .eq("status", "applied");
  return new Set(((data ?? []) as { user_id: string }[]).map((r) => r.user_id));
}

/** Marca consumidos los Partido x2 de un partido resuelto. Idempotente. */
export async function consumeDoubleDowns(matchId: string): Promise<void> {
  await adminClient()
    .from("powerup_purchases")
    .update({ status: "consumed", consumed_at: new Date().toISOString() })
    .eq("match_id", matchId)
    .eq("sku", "double_down")
    .eq("status", "applied");
}

/** Marca refund externo (charge.refunded / dispute). Un double_down reembolsado
 *  deja de estar 'applied', así que la resolución ya no lo multiplica. */
export async function markPowerupRefunded(purchaseId: string): Promise<void> {
  await adminClient()
    .from("powerup_purchases")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("id", purchaseId)
    .neq("status", "refunded");
}

// ─── Aplicadores (los llama el webhook tras el pago) ─────────────────────────

export interface ApplyResult {
  ok: boolean;
  alreadyApplied?: boolean;
  error?: string;
  message?: string;
}

/**
 * Aplica el efecto de una compra pagada. Idempotente: si la fila ya está
 * 'applied' devuelve ok sin tocar nada (reintento del webhook).
 * Si devuelve ok:false, el webhook reembolsa y marca 'failed'.
 */
export async function applyPowerup(purchase: PowerupPurchaseRow): Promise<ApplyResult> {
  if (purchase.status === "applied" || purchase.status === "consumed") {
    return { ok: true, alreadyApplied: true };
  }
  if (purchase.status !== "pending") {
    // failed/refunded: no reaplicar un efecto ya descartado.
    return { ok: false, error: "bad_status", message: `Compra en estado ${purchase.status}` };
  }

  switch (purchase.sku) {
    case "second_chance":
      return applySecondChance(purchase);
    case "double_down":
      return applyDoubleDown(purchase);
    case "trivia_revive":
      return applyTriviaRevive(purchase);
  }
}

async function applySecondChance(purchase: PowerupPurchaseRow): Promise<ApplyResult> {
  const admin = adminClient();
  if (!purchase.prediction_id || !purchase.payload) {
    return { ok: false, error: "bad_purchase", message: "Compra sin predicción o sin nuevo pick" };
  }

  const { data } = await admin
    .from("predictions")
    .select("*")
    .eq("id", purchase.prediction_id)
    .maybeSingle();
  const row = data as PredictionRow | null;
  if (!row || row.user_id !== purchase.user_id) {
    return { ok: false, error: "not_found", message: "La predicción ya no existe" };
  }
  if (row.resolved_at) return { ok: false, error: "already_resolved", message: "La predicción ya se resolvió" };
  if (row.secured_at) return { ok: false, error: "secured", message: "La predicción está asegurada" };
  if (!SECOND_CHANCE_TYPES.includes(row.prediction_type as (typeof SECOND_CHANCE_TYPES)[number])) {
    return { ok: false, error: "bad_type", message: "Tipo de predicción no admitido" };
  }

  // Revalidar la ventana AHORA (el pago pudo llegar con el descanso ya acabado).
  const win = await secondChanceWindow(row.match_id);
  if (!win.ok) return win;

  // El nuevo pick se validó al crear el checkout; revalidamos por si acaso.
  const v = validatePredictionData(row.prediction_type, purchase.payload, true, row.match_id);
  if (!v.ok) return { ok: false, error: v.error ?? "invalid", message: v.message ?? "Pick inválido" };

  // Update directo (no updatePredictionData): NO tocamos changed_at — el cambio
  // pagado no debe quemar el cambio gratuito diario del usuario (changesUsedToday
  // cuenta por ese timestamp). CAS contra resolución/aseguramiento concurrentes.
  const { data: claimed, error } = await admin
    .from("predictions")
    .update({ prediction_data: purchase.payload })
    .eq("id", row.id)
    .is("resolved_at", null)
    .is("secured_at", null)
    .select("id");
  if (error) throw error;
  if (!claimed || claimed.length === 0) {
    return { ok: false, error: "conflict", message: "La predicción cambió de estado durante el pago" };
  }
  return { ok: true };
}

async function applyDoubleDown(purchase: PowerupPurchaseRow): Promise<ApplyResult> {
  if (!purchase.match_id) return { ok: false, error: "bad_purchase", message: "Compra sin partido" };
  // El efecto real es la propia fila en 'applied' (la lee resolveMatch); la
  // transición la hace markPurchaseApplied, cuyo índice único parcial
  // (user, match) rechaza duplicados. Aquí solo validamos la ventana.
  return doubleDownApplyWindow(purchase.match_id);
}

async function applyTriviaRevive(purchase: PowerupPurchaseRow): Promise<ApplyResult> {
  if (!purchase.trivia_session_id) {
    return { ok: false, error: "bad_purchase", message: "Compra sin partida de trivia" };
  }
  const session = await getSession(purchase.trivia_session_id);
  if (!session) {
    return { ok: false, error: "session_expired", message: "Tu partida expiró antes de completarse el pago" };
  }
  // Idempotencia: este pago ya revivió esta sesión (reintento del webhook).
  if (session.revivedPurchaseIds?.includes(purchase.id)) return { ok: true, alreadyApplied: true };

  if (session.finished) return { ok: false, error: "finished", message: "La partida ya terminó" };
  if (session.mode !== "muerte-subita") return { ok: false, error: "bad_mode", message: "Solo en Muerte Súbita" };
  if (!session.gameOver) return { ok: false, error: "not_game_over", message: "La partida no está en game over" };
  if ((session.revives ?? 0) >= 1) return { ok: false, error: "revive_limit", message: "Solo un revive por partida" };

  session.gameOver = false;
  session.streak = session.streakBeforeMiss ?? 0;
  session.revives = (session.revives ?? 0) + 1;
  session.revivedPurchaseIds = [...(session.revivedPurchaseIds ?? []), purchase.id];
  session.lastTickAt = Date.now();
  await saveSession(session);
  return { ok: true };
}

// ─── Transiciones post-aplicación (las llama el webhook) ─────────────────────

export interface MarkAppliedResult {
  ok: boolean;
  duplicate?: boolean;
}

/**
 * pending → applied con los datos del pago. Devuelve ok también si la fila ya
 * estaba applied (reintento del webhook). duplicate=true cuando el índice único
 * parcial rechaza un segundo double_down/second_chance efectivo → refund.
 */
export async function markPurchaseApplied(
  purchaseId: string,
  stripePaymentIntentId: string | null,
): Promise<MarkAppliedResult> {
  const now = new Date().toISOString();
  const { error } = await adminClient()
    .from("powerup_purchases")
    .update({
      status: "applied",
      paid_at: now,
      applied_at: now,
      stripe_payment_intent_id: stripePaymentIntentId,
    })
    .eq("id", purchaseId)
    .eq("status", "pending");
  if (error) {
    if (error.code === "23505") return { ok: false, duplicate: true };
    throw error;
  }
  return { ok: true };
}

export async function markPurchaseFailed(
  purchaseId: string,
  stripePaymentIntentId: string | null,
  reason: string,
): Promise<void> {
  await adminClient()
    .from("powerup_purchases")
    .update({
      status: "failed",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: stripePaymentIntentId,
      error: reason,
    })
    .eq("id", purchaseId)
    .eq("status", "pending");
}

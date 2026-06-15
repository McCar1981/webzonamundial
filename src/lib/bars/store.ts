// src/lib/bars/store.ts
//
// Capa de datos del módulo "Porras Digitales para Bares" (FASE 1).
//
// Clave de diseño: la porra de un bar ES una liga de predicciones. Al crear un
// bar se crea su `prediction_league` (bars.league_id) y el ranking del bar se
// calcula con leagueLeaderboard() ya existente — sin duplicar scoring.
//
// Server-only: usa el cliente admin (SERVICE ROLE) para lecturas públicas
// (página/ranking/TV del bar) y escrituras cruzadas (unir cliente, contar
// escaneos, registrar eventos), igual que el resto de stores del proyecto.

import { adminClient } from "@/lib/predictions/admin";
import { leagueCode } from "@/lib/predictions/gamification";
import { leagueLeaderboard, type LeagueStanding } from "@/lib/predictions/gamification-store";
import { DEFAULT_THEME_ID } from "./themes";

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface BarRow {
  id: string;
  owner_user_id: string;
  league_id: string | null;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  welcome_message: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  instagram: string | null;
  website: string | null;
  theme_id: string;
  cta_label: string;
  entry_fee_note: string | null; // texto informativo de inscripción (lo cobra el bar; ZM no procesa pago)
  status: string;          // draft | pending_payment | published | paused
  plan_id: string | null;  // null (sin plan) | arranque | completo | pro
  kind: string;            // bar | empresa — elige el cartel del kit (default 'bar')
  created_at: string;
  updated_at: string;
}

export interface QrSource {
  id: string;
  bar_id: string;
  code: string;
  source_type: string;
  label: string | null;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  scans_count: number;
}

export interface BarPrize {
  id: string;
  bar_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prize_type: string;       // principal | semanal | final
  valid_until: string | null;
  conditions: string | null;
  status: string;           // active | delivered | expired
  winner_user_id: string | null;
  delivered_at: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "bar";
}

function randomCode(len = 7): string {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alpha[Math.floor(Math.random() * alpha.length)];
  return out;
}

async function uniqueSlug(base: string): Promise<string> {
  const admin = adminClient();
  let slug = base;
  for (let i = 0; i < 6; i++) {
    const { data } = await admin.from("bars").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${randomCode(3).toLowerCase()}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function uniqueQrCode(): Promise<string> {
  const admin = adminClient();
  let code = randomCode(7);
  for (let i = 0; i < 6; i++) {
    const { data } = await admin.from("bar_qr_sources").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
    code = randomCode(7);
  }
  return randomCode(10);
}

// ─── Lecturas ────────────────────────────────────────────────────────────────
export async function getBarBySlug(slug: string): Promise<BarRow | null> {
  const admin = adminClient();
  const { data } = await admin.from("bars").select("*").eq("slug", slug).maybeSingle();
  return (data as BarRow | null) ?? null;
}

export async function getBarByOwner(uid: string): Promise<BarRow | null> {
  const admin = adminClient();
  const { data } = await admin.from("bars").select("*")
    .eq("owner_user_id", uid).order("created_at", { ascending: true }).limit(1).maybeSingle();
  return (data as BarRow | null) ?? null;
}

export async function getBarById(id: string): Promise<BarRow | null> {
  const admin = adminClient();
  const { data } = await admin.from("bars").select("*").eq("id", id).maybeSingle();
  return (data as BarRow | null) ?? null;
}

export async function listQrSources(barId: string): Promise<QrSource[]> {
  const admin = adminClient();
  const { data } = await admin.from("bar_qr_sources").select("*")
    .eq("bar_id", barId).order("created_at", { ascending: true });
  return (data as QrSource[] | null) ?? [];
}

export async function getMainQr(barId: string): Promise<QrSource | null> {
  const admin = adminClient();
  const { data } = await admin.from("bar_qr_sources").select("*")
    .eq("bar_id", barId).eq("source_type", "main").maybeSingle();
  return (data as QrSource | null) ?? null;
}

/** Busca una fuente QR del bar por su código (cualquier zona, no solo la principal). */
export async function getQrSourceByCode(barId: string, code: string): Promise<QrSource | null> {
  const admin = adminClient();
  const { data } = await admin.from("bar_qr_sources").select("*")
    .eq("bar_id", barId).eq("code", code).maybeSingle();
  return (data as QrSource | null) ?? null;
}

export async function countQrSources(barId: string): Promise<number> {
  const admin = adminClient();
  const { count } = await admin.from("bar_qr_sources")
    .select("id", { count: "exact", head: true }).eq("bar_id", barId);
  return count ?? 0;
}

export interface CreateQrInput { sourceType?: string; label?: string; }

/** Crea una fuente QR de zona para el bar del dueño. Devuelve null si no es suyo. */
export async function createQrSource(uid: string, barId: string, input: CreateQrInput): Promise<QrSource | null> {
  const admin = adminClient();
  const bar = await getBarById(barId);
  if (!bar || bar.owner_user_id !== uid) return null;
  const code = await uniqueQrCode();
  const sourceType = (input.sourceType || "zona").slice(0, 20);
  const { data } = await admin.from("bar_qr_sources").insert({
    bar_id: barId, code, source_type: sourceType,
    label: input.label?.trim().slice(0, 40) || sourceType,
    utm_source: "qr", utm_medium: "bar", utm_campaign: "mundial2026", utm_content: sourceType,
  }).select("*").single();
  return (data as QrSource | null) ?? null;
}

/** Elimina una fuente QR del bar del dueño. No permite borrar la principal. */
export async function deleteQrSource(uid: string, barId: string, qrId: string): Promise<boolean> {
  const admin = adminClient();
  const bar = await getBarById(barId);
  if (!bar || bar.owner_user_id !== uid) return false;
  const { data: qr } = await admin.from("bar_qr_sources").select("source_type").eq("id", qrId).eq("bar_id", barId).maybeSingle();
  if (!qr || (qr as { source_type: string }).source_type === "main") return false;
  await admin.from("bar_qr_sources").delete().eq("id", qrId).eq("bar_id", barId);
  return true;
}

export async function listPrizes(barId: string): Promise<BarPrize[]> {
  const admin = adminClient();
  const { data } = await admin.from("bar_prizes").select("*")
    .eq("bar_id", barId).order("created_at", { ascending: true });
  return (data as BarPrize[] | null) ?? [];
}

/** Ranking del bar = clasificación de su liga de predicciones (reuso total). */
export async function barLeaderboard(bar: BarRow): Promise<LeagueStanding[]> {
  if (!bar.league_id) return [];
  return leagueLeaderboard(bar.league_id);
}

export async function participantCount(barId: string): Promise<number> {
  const admin = adminClient();
  const { count } = await admin.from("bar_participants")
    .select("user_id", { count: "exact", head: true }).eq("bar_id", barId);
  return count ?? 0;
}

// ─── Escrituras ──────────────────────────────────────────────────────────────
export interface CreateBarInput {
  name: string;
  city?: string;
  themeId?: string;
  kind?: "bar" | "empresa";  // tipo de porra; por defecto 'bar'
}

/** Crea el bar + su liga de predicciones + el QR principal, y une al dueño. */
export async function createBar(uid: string, input: CreateBarInput): Promise<BarRow> {
  const admin = adminClient();
  const name = input.name.trim().slice(0, 80) || "Mi bar";
  const slug = await uniqueSlug(slugify(name));

  // 1) La porra = una liga de predicciones (hereda scoring/ranking).
  let code = leagueCode(`bar:${uid}:${Date.now()}`);
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await admin.from("prediction_leagues").select("id").eq("code", code).maybeSingle();
    if (!exists) break;
    code = leagueCode(`bar:${uid}:${Date.now()}:${i}`);
  }
  const { data: league, error: lErr } = await admin.from("prediction_leagues")
    .insert({ name: `Porra ${name}`.slice(0, 60), code, owner_id: uid }).select("id").single();
  if (lErr) throw lErr;
  const leagueId = (league as { id: string }).id;
  await admin.from("prediction_league_members").insert({ league_id: leagueId, user_id: uid });

  // 2) El bar. SIN plan por defecto: queda en borrador hasta que se paga.
  const { data: bar, error: bErr } = await admin.from("bars").insert({
    owner_user_id: uid, league_id: leagueId, name, slug,
    city: input.city?.trim().slice(0, 80) || null,
    theme_id: input.themeId || DEFAULT_THEME_ID, plan_id: null, status: "draft",
    kind: input.kind === "empresa" ? "empresa" : "bar",
  }).select("*").single();
  if (bErr) throw bErr;
  const row = bar as BarRow;

  // 3) QR principal con tracking.
  const qr = await uniqueQrCode();
  await admin.from("bar_qr_sources").insert({
    bar_id: row.id, code: qr, source_type: "main", label: "Principal",
    utm_source: "qr", utm_medium: "bar", utm_campaign: "mundial2026", utm_content: "main",
  });

  // 4) Atribución del propio dueño como participante.
  await admin.from("bar_participants")
    .upsert({ bar_id: row.id, user_id: uid, source: "manual" }, { onConflict: "bar_id,user_id" });

  return row;
}

const EDITABLE_FIELDS = [
  "name", "logo_url", "cover_url", "description", "welcome_message",
  "address", "city", "phone", "instagram", "website",
  "theme_id", "cta_label", "entry_fee_note", "status",
] as const;

/** H-001-13: quita tags HTML y control chars de texto libre. */
function sanitizeText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/<[^]*?>/g, "").replace(/[\x00-\x1F\x7F]/g, "").trim();
  return cleaned || null;
}

/** Actualiza campos editables del bar del dueño. Ignora claves no permitidas. */
export async function updateBar(uid: string, patch: Record<string, unknown>): Promise<BarRow | null> {
  const admin = adminClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of EDITABLE_FIELDS) {
    if (k in patch && patch[k] !== undefined) {
      const val = patch[k];
      // Sanitizar campos de texto libre (H-001-13)
      const textFields = ["name", "description", "welcome_message", "address", "city", "phone", "instagram", "website", "cta_label", "entry_fee_note"];
      update[k] = textFields.includes(k) ? sanitizeText(val) ?? val : val;
    }
  }
  const { data } = await admin.from("bars").update(update)
    .eq("owner_user_id", uid).select("*").maybeSingle();
  return (data as BarRow | null) ?? null;
}

export interface JoinResult { ok: boolean; alreadyMember: boolean; barId: string; }

/** Une un usuario a la porra del bar (idempotente) y registra atribución. */
export async function joinBarPorra(
  uid: string, bar: BarRow, opts: { source?: string; qrSourceId?: string | null } = {},
): Promise<JoinResult> {
  const admin = adminClient();
  if (!bar.league_id) return { ok: false, alreadyMember: false, barId: bar.id };

  const { data: existing } = await admin.from("bar_participants")
    .select("user_id").eq("bar_id", bar.id).eq("user_id", uid).maybeSingle();
  const alreadyMember = !!existing;

  await admin.from("prediction_league_members")
    .upsert({ league_id: bar.league_id, user_id: uid }, { onConflict: "league_id,user_id" });

  // La atribución (qr_source_id/source) se fija SOLO en el primer ingreso: es el
  // origen de captación. Reescaneos posteriores no la sobrescriben.
  if (!alreadyMember) {
    await admin.from("bar_participants").insert({
      bar_id: bar.id, user_id: uid,
      source: opts.source ?? "qr", qr_source_id: opts.qrSourceId ?? null,
    });
    await logEvent(bar.id, "bar_user_joined", { user_id: uid, qr_source_id: opts.qrSourceId ?? null });
  }
  return { ok: true, alreadyMember, barId: bar.id };
}

/** Resuelve un código QR: devuelve la URL de destino y cuenta el escaneo. */
export async function resolveQrScan(code: string): Promise<{ bar: BarRow; qr: QrSource } | null> {
  const admin = adminClient();
  const { data: qr } = await admin.from("bar_qr_sources").select("*").eq("code", code).maybeSingle();
  if (!qr) return null;
  const q = qr as QrSource;
  const bar = await getBarById(q.bar_id);
  if (!bar) return null;

  await admin.from("bar_qr_sources").update({ scans_count: q.scans_count + 1 }).eq("id", q.id);
  await logEvent(bar.id, "bar_qr_scan", { qr_source_id: q.id, source_type: q.source_type });
  return { bar, qr: q };
}

// ─── Premios ─────────────────────────────────────────────────────────────────
export interface PrizeInput {
  title: string; description?: string; prizeType?: string; conditions?: string; validUntil?: string | null;
}

export async function createPrize(uid: string, barId: string, input: PrizeInput): Promise<BarPrize | null> {
  const admin = adminClient();
  const bar = await getBarById(barId);
  if (!bar || bar.owner_user_id !== uid) return null;
  const { data } = await admin.from("bar_prizes").insert({
    bar_id: barId,
    // H-001-13: sanitizar texto libre
    title: sanitizeText(input.title)?.slice(0, 120) ?? input.title.trim().slice(0, 120),
    description: sanitizeText(input.description) ?? null,
    prize_type: input.prizeType || "principal",
    conditions: sanitizeText(input.conditions) ?? null,
    valid_until: input.validUntil || null,
  }).select("*").single();
  return (data as BarPrize | null) ?? null;
}

export async function deletePrize(uid: string, barId: string, prizeId: string): Promise<boolean> {
  const admin = adminClient();
  const bar = await getBarById(barId);
  if (!bar || bar.owner_user_id !== uid) return false;
  await admin.from("bar_prizes").delete().eq("id", prizeId).eq("bar_id", barId);
  return true;
}

// ─── Eventos / estadísticas ──────────────────────────────────────────────────
export async function logEvent(
  barId: string, eventType: string, meta: Record<string, unknown> = {},
): Promise<void> {
  const admin = adminClient();
  const userId = (meta.user_id as string | undefined) ?? null;
  const qrSourceId = (meta.qr_source_id as string | undefined) ?? null;
  await admin.from("bar_events").insert({
    bar_id: barId, event_type: eventType, user_id: userId, qr_source_id: qrSourceId, meta,
  });
}

// ─── Pagos / planes (FASE 2) ───────────────────────────────────────────────────
export interface BarPayment {
  id: string;
  bar_id: string;
  plan_id: string;
  amount: number;       // céntimos
  currency: string;     // eur | usd
  status: string;       // active | refunded
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  receipt_url: string | null;
  purchased_at: string;
  refunded_at: string | null;
}

/** Pago/plan vigente del bar (o null si nunca pagó). */
export async function getBarPayment(barId: string): Promise<BarPayment | null> {
  const admin = adminClient();
  const { data } = await admin.from("bar_payments").select("*").eq("bar_id", barId).maybeSingle();
  return (data as BarPayment | null) ?? null;
}

/** Todo gratis: publicar y usar la porra ya no requiere plan ni pago. */
export async function barHasActivePlan(_barId: string): Promise<boolean> {
  return true;
}

/**
 * True si la porra es PÚBLICA: publicada Y con plan activo. Es la condición que
 * deben cumplir las páginas públicas (/b, /ranking, /tv) y el ingreso de clientes.
 */
export async function barIsLive(bar: BarRow): Promise<boolean> {
  return bar.status === "published" && (await barHasActivePlan(bar.id));
}

export interface RecordPaymentInput {
  planId: string;
  amount: number;
  currency: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  receiptUrl: string | null;
}

/** Registra (o reactiva) el pago de un plan y actualiza bars.plan_id. Idempotente. */
export async function recordBarPlanPayment(barId: string, input: RecordPaymentInput): Promise<void> {
  const admin = adminClient();
  const now = new Date().toISOString();

  await admin.from("bar_payments").upsert({
    bar_id: barId,
    plan_id: input.planId,
    amount: input.amount,
    currency: input.currency,
    status: "active",
    stripe_session_id: input.stripeSessionId,
    stripe_payment_intent_id: input.stripePaymentIntentId,
    stripe_customer_id: input.stripeCustomerId,
    receipt_url: input.receiptUrl,
    purchased_at: now,
    refunded_at: null,
    updated_at: now,
  }, { onConflict: "bar_id" });

  await admin.from("bars").update({ plan_id: input.planId, updated_at: now }).eq("id", barId);
  await logEvent(barId, "bar_plan_purchased", {
    plan_id: input.planId, amount: input.amount, currency: input.currency,
  });
}

/**
 * Marca el pago del bar como reembolsado (lo dispara charge.refunded) y degrada
 * el bar: le quita el plan (plan_id = null) y, si estaba publicado, lo pasa a
 * "pending_payment" para que deje de ser público y se bloqueen las funciones
 * premium. No borra datos del bar ni participantes.
 */
export async function markBarPaymentRefunded(barId: string): Promise<void> {
  const admin = adminClient();
  const now = new Date().toISOString();
  await admin.from("bar_payments")
    .update({ status: "refunded", refunded_at: now, updated_at: now })
    .eq("bar_id", barId);

  const bar = await getBarById(barId);
  const update: Record<string, unknown> = { plan_id: null, updated_at: now };
  if (bar?.status === "published") update.status = "pending_payment";
  await admin.from("bars").update(update).eq("id", barId);

  await logEvent(barId, "bar_plan_refunded", {});
}

export interface BarStats {
  participants: number;
  scans: number;
  predictions: number;
  joins: number;
}

// ─── Admin (panel interno /admin/bars) ─────────────────────────────────────────
export interface BarAdminRow extends BarRow {
  participants: number;
  paid: boolean;
  payment_amount: number | null;
  payment_currency: string | null;
}

/** Lista todos los bares con métricas básicas para el panel interno. */
export async function listAllBars(limit = 200): Promise<BarAdminRow[]> {
  const admin = adminClient();
  const { data } = await admin.from("bars").select("*")
    .order("created_at", { ascending: false }).limit(limit);
  const bars = (data as BarRow[] | null) ?? [];
  if (!bars.length) return [];

  const ids = bars.map((b) => b.id);
  const [{ data: parts }, { data: pays }] = await Promise.all([
    admin.from("bar_participants").select("bar_id").in("bar_id", ids),
    admin.from("bar_payments").select("bar_id,amount,currency,status,refunded_at").in("bar_id", ids),
  ]);

  const partCount = new Map<string, number>();
  for (const p of (parts ?? []) as { bar_id: string }[]) {
    partCount.set(p.bar_id, (partCount.get(p.bar_id) ?? 0) + 1);
  }
  const payByBar = new Map<string, { amount: number; currency: string; status: string; refunded_at: string | null }>();
  for (const p of (pays ?? []) as { bar_id: string; amount: number; currency: string; status: string; refunded_at: string | null }[]) {
    payByBar.set(p.bar_id, p);
  }

  return bars.map((b) => {
    const pay = payByBar.get(b.id);
    return {
      ...b,
      participants: partCount.get(b.id) ?? 0,
      paid: !!pay && pay.status === "active" && !pay.refunded_at,
      payment_amount: pay?.amount ?? null,
      payment_currency: pay?.currency ?? null,
    };
  });
}

export async function barStats(barId: string): Promise<BarStats> {
  const admin = adminClient();
  const [participants, scans, predictions, joins] = await Promise.all([
    participantCount(barId),
    admin.from("bar_events").select("id", { count: "exact", head: true })
      .eq("bar_id", barId).eq("event_type", "bar_qr_scan").then((r) => r.count ?? 0),
    admin.from("bar_events").select("id", { count: "exact", head: true })
      .eq("bar_id", barId).eq("event_type", "bar_prediction_completed").then((r) => r.count ?? 0),
    admin.from("bar_events").select("id", { count: "exact", head: true })
      .eq("bar_id", barId).eq("event_type", "bar_user_joined").then((r) => r.count ?? 0),
  ]);
  return { participants, scans, predictions, joins };
}

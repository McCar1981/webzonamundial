// src/lib/micro/store.ts
//
// Capa de datos (Supabase) de las Micro-predicciones EN VIVO.
//
// Reparto de clientes, igual que en el módulo de Predicciones:
//   - createSupabaseServerClient (RLS) → lectura/escritura PROPIA del usuario
//     (responder una micro, leer mis respuestas).
//   - adminClient (service role) → operaciones que cruzan usuarios o que el
//     usuario no puede auto-otorgar: crear la micro (la emite el sistema),
//     resolverla y pagar puntos/XP, y leer la racha (Cadena de Fuego).
//
// La micro la EMITE el sistema desde el poller (no el usuario), por eso vive en
// el cliente admin. La respuesta del usuario sí pasa por RLS.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/predictions/admin";
import { addSeasonXp } from "@/lib/predictions/gamification-store";
import { grantCoins } from "@/lib/economy/wallet";
import { sendPushToUsers } from "@/lib/push-notifications";
import {
  MICRO_CATALOG,
  END_OF_MATCH_MIN,
  type MicroKind,
  type ResolveContext,
  eventsInWindow,
  resolveMicro,
  resolveMinuteFor,
  scoreMicro,
  fireBonusXp,
} from "./micro";
import type { MatchEvent } from "@/lib/match-center/types";

// ─── Filas ────────────────────────────────────────────────────────────────────
export interface MicroRow {
  id: string;
  match_id: string;
  kind: string;
  category: string;
  question: string;
  options: { key: string; label: string }[];
  /** Contexto fijado al disparar (side, playerName, scoreAtOpen) + trigger info. */
  trigger_data: ResolveContext & { trigger_event_id?: string; emoji?: string };
  open_minute: number;
  resolve_minute: number;
  window_seconds: number;
  base_points: number;
  match_multiplier: number;
  correct_option: string | null;
  status: "active" | "closed" | "resolved";
  activated_at: string;
  closes_at: string;
  resolved_at: string | null;
}

export interface MicroResponseRow {
  id: string;
  micro_id: string;
  user_id: string;
  selected_option: string;
  response_time_ms: number | null;
  fire_chain_before: number;
  fire_multiplier: number;
  points_earned: number | null;
  is_correct: boolean | null;
  ghost: boolean;
  created_at: string;
  resolved_at: string | null;
}

const MICRO_COLS =
  "id,match_id,kind,category,question,options,trigger_data,open_minute,resolve_minute,window_seconds,base_points,match_multiplier,correct_option,status,activated_at,closes_at,resolved_at";
const RESP_COLS =
  "id,micro_id,user_id,selected_option,response_time_ms,fire_chain_before,fire_multiplier,points_earned,is_correct,ghost,created_at,resolved_at";

// ─── Crear (la emite el sistema desde el poller) ─────────────────────────────
export interface CreateMicroInput {
  matchId: string;
  kind: MicroKind;
  openMinute: number;
  matchMultiplier: number;
  /** Pregunta ya interpolada (con nombres de equipo/jugador resueltos). */
  question?: string;
  options?: { key: string; label: string }[];
  context?: ResolveContext;
  triggerEventId?: string;
  /** Override de la ventana de RESPUESTA (segundos). Por defecto, el catálogo (15s). */
  windowSeconds?: number;
  /**
   * Horizonte del PREDICADO en segundos (solo micros de IA): cuánto abarca la
   * pregunta ("¿gol en los próximos 3 min?" → 180). Fija resolve_minute; la
   * ventana para responder sigue siendo windowSeconds (15s).
   */
  resolveHorizonSeconds?: number;
  /** Override de puntos base. Las micros de IA fijan su propia dificultad. */
  basePoints?: number;
}

/**
 * Crea una micro-predicción ACTIVA. Idempotente por evento: si se pasa
 * `triggerEventId`, un índice único impide emitir dos veces la misma micro para
 * el mismo evento real (polls solapados). Devuelve la fila creada, o la existente
 * si ya estaba (no la duplica), o null si no se pudo.
 */
export async function createMicro(input: CreateMicroInput): Promise<MicroRow | null> {
  const def = MICRO_CATALOG[input.kind];
  const admin = adminClient();
  const now = Date.now();
  const windowSeconds = input.windowSeconds ?? def.windowSeconds;
  const basePoints = input.basePoints ?? def.basePoints;
  const closesAt = new Date(now + windowSeconds * 1000).toISOString();
  // La ventana de respuesta (closesAt) es independiente del horizonte de
  // resolución (resolveMinute): "¿gol antes del 30?" se contesta en 15s pero solo
  // se resuelve cuando el partido llega al minuto 30. En las micros de IA el
  // horizonte lo decide el generador (resolveHorizonSeconds), no la ventana.
  const resolveMinute = resolveMinuteFor(
    input.kind,
    input.openMinute,
    input.resolveHorizonSeconds ?? windowSeconds,
  );

  const row = {
    match_id: input.matchId,
    kind: input.kind,
    category: def.category,
    question: input.question ?? def.question,
    options: input.options ?? def.options ?? [],
    trigger_data: {
      ...(input.context ?? {}),
      trigger_event_id: input.triggerEventId,
      emoji: def.emoji,
    },
    open_minute: input.openMinute,
    resolve_minute: resolveMinute,
    window_seconds: windowSeconds,
    base_points: basePoints,
    match_multiplier: input.matchMultiplier,
    status: "active" as const,
    activated_at: new Date(now).toISOString(),
    closes_at: closesAt,
  };

  const { data, error } = await admin
    .from("micro_predictions")
    .insert(row)
    .select(MICRO_COLS)
    .single();

  if (error) {
    // 23505 = unique_violation: ya existe la micro de este evento. Devolvemos la
    // existente para que el llamador no la trate como fallo.
    if ((error as { code?: string }).code === "23505" && input.triggerEventId) {
      const { data: existing } = await admin
        .from("micro_predictions")
        .select(MICRO_COLS)
        .eq("match_id", input.matchId)
        .eq("kind", input.kind)
        .contains("trigger_data", { trigger_event_id: input.triggerEventId })
        .maybeSingle();
      return (existing as MicroRow | null) ?? null;
    }
    console.error("[micro-store] createMicro failed", (error as Error).message);
    return null;
  }
  return data as MicroRow;
}

/** ¿Ya existe una micro para este evento de disparo? (guarda anti-duplicado). */
export async function microExistsForEvent(matchId: string, triggerEventId: string): Promise<boolean> {
  const admin = adminClient();
  const { count } = await admin
    .from("micro_predictions")
    .select("id", { count: "exact", head: true })
    .eq("match_id", matchId)
    .contains("trigger_data", { trigger_event_id: triggerEventId });
  return (count ?? 0) > 0;
}

/** ¿Ya se emitió una micro temporal de este kind en este partido? (1 por partido). */
export async function temporalEmitted(matchId: string, kind: MicroKind): Promise<boolean> {
  const admin = adminClient();
  const { count } = await admin
    .from("micro_predictions")
    .select("id", { count: "exact", head: true })
    .eq("match_id", matchId)
    .eq("kind", kind);
  return (count ?? 0) > 0;
}

/** Cuántas micros se han emitido en el partido (para el rate-control del motor). */
export async function microCountForMatch(matchId: string): Promise<number> {
  const admin = adminClient();
  const { count } = await admin
    .from("micro_predictions")
    .select("id", { count: "exact", head: true })
    .eq("match_id", matchId);
  return count ?? 0;
}

/** Instante de la última micro emitida en el partido (para el throttle 3 min). */
export async function lastMicroAt(matchId: string): Promise<number | null> {
  const admin = adminClient();
  const { data } = await admin
    .from("micro_predictions")
    .select("activated_at")
    .eq("match_id", matchId)
    .order("activated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const iso = (data as { activated_at?: string } | null)?.activated_at;
  return iso ? new Date(iso).getTime() : null;
}

// ─── Lectura para la UI ───────────────────────────────────────────────────────
/** Micro ACTIVA ahora mismo en el partido (la que el navegador sondea). */
export async function getActiveMicro(matchId: string): Promise<MicroRow | null> {
  const admin = adminClient();
  const { data } = await admin
    .from("micro_predictions")
    .select(MICRO_COLS)
    .eq("match_id", matchId)
    .eq("status", "active")
    .gt("closes_at", new Date().toISOString())
    .order("activated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as MicroRow | null) ?? null;
}

/**
 * Última micro RECIENTE con la ventana ya vencida. Para el estado "llegaste
 * tarde": quien entra desde el push suele llegar cuando los 25-60s de ventana ya
 * pasaron (latencia de entrega + abrir la app); en vez de no mostrar nada, la UI
 * enseña qué micro fue y que la próxima salta en cualquier momento.
 */
export async function latestClosedMicro(matchId: string, withinMs = 5 * 60_000): Promise<MicroRow | null> {
  const admin = adminClient();
  const { data } = await admin
    .from("micro_predictions")
    .select(MICRO_COLS)
    .eq("match_id", matchId)
    .lte("closes_at", new Date().toISOString())
    .gte("activated_at", new Date(Date.now() - withinMs).toISOString())
    .order("activated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as MicroRow | null) ?? null;
}

export async function getMicroById(id: string): Promise<MicroRow | null> {
  const admin = adminClient();
  const { data } = await admin.from("micro_predictions").select(MICRO_COLS).eq("id", id).maybeSingle();
  return (data as MicroRow | null) ?? null;
}

/** Historial de micros del partido (resueltas y abiertas), recientes primero. */
export async function getMatchMicroHistory(matchId: string, limit = 30): Promise<MicroRow[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("micro_predictions")
    .select(MICRO_COLS)
    .eq("match_id", matchId)
    .order("activated_at", { ascending: false })
    .limit(limit);
  return (data as MicroRow[] | null) ?? [];
}

/**
 * Última micro del partido que el usuario YA tiene resuelta, si se resolvió hace
 * poco (`withinMs`). Sirve para el toast de resultado en vivo: el sondeo de la UI
 * lo detecta a los pocos segundos de que el cron la liquide. Excluye fantasma.
 * Consulta de una fila, indexada por (user_id, resolved_at).
 */
export interface RecentMicroResult {
  micro_id: string;
  question: string;
  emoji: string;
  is_correct: boolean;
  points: number;
  selected_label: string | null;
  correct_label: string | null;
  resolved_at: string;
}

export async function latestResolvedResult(
  userId: string,
  matchId: string,
  withinMs = 25_000,
): Promise<RecentMicroResult | null> {
  const admin = adminClient();
  const since = new Date(Date.now() - withinMs).toISOString();
  const { data } = await admin
    .from("micro_responses")
    .select(
      "micro_id,selected_option,is_correct,points_earned,resolved_at," +
        "micro_predictions!inner(match_id,question,options,trigger_data,correct_option)",
    )
    .eq("user_id", userId)
    .eq("ghost", false)
    .eq("micro_predictions.match_id", matchId)
    .not("resolved_at", "is", null)
    .not("is_correct", "is", null) // las ANULADAS no generan toast (ni "fallaste")
    .gte("resolved_at", since)
    .order("resolved_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  const r = data as unknown as {
    micro_id: string;
    selected_option: string;
    is_correct: boolean | null;
    points_earned: number | null;
    resolved_at: string;
    micro_predictions: {
      question: string;
      options: { key: string; label: string }[];
      trigger_data: { emoji?: string } | null;
      correct_option: string | null;
    };
  };
  const micro = r.micro_predictions;
  const labelOf = (k: string | null): string | null =>
    k ? micro.options.find((o) => o.key === k)?.label ?? k : null;

  return {
    micro_id: r.micro_id,
    question: micro.question,
    emoji: micro.trigger_data?.emoji ?? "⚡",
    is_correct: r.is_correct === true,
    points: r.points_earned ?? 0,
    selected_label: labelOf(r.selected_option),
    correct_label: labelOf(micro.correct_option),
    resolved_at: r.resolved_at,
  };
}

// ─── Responder (usuario, RLS) ─────────────────────────────────────────────────
export interface RespondResult {
  ok: boolean;
  error?: string;
  response?: MicroResponseRow;
  fireChainBefore?: number;
  fireMultiplier?: number;
}

/**
 * Registra la respuesta del usuario a una micro ACTIVA, dentro de la ventana.
 * Calcula la Cadena de Fuego vigente (aciertos consecutivos ya resueltos en ESTE
 * partido) para mostrar el multiplicador en vivo; el pago real se hace en la
 * resolución. Un índice único (micro_id,user_id) impide responder dos veces.
 */
export async function respondMicro(
  userId: string,
  microId: string,
  option: string,
  ghost = false,
): Promise<RespondResult> {
  const micro = await getMicroById(microId);
  if (!micro) return { ok: false, error: "not_found" };
  if (!micro.options.some((o) => o.key === option)) return { ok: false, error: "invalid_option" };
  if (!ghost) {
    if (micro.status !== "active") return { ok: false, error: "closed" };
    if (new Date(micro.closes_at).getTime() <= Date.now()) return { ok: false, error: "window_expired" };
  }

  const chainBefore = await currentFireChain(userId, micro.match_id);
  const sc = scoreMicro({
    basePoints: micro.base_points,
    chainBefore,
    matchMultiplier: Number(micro.match_multiplier) || 1,
    ghost,
  });
  const responseTimeMs = Date.now() - new Date(micro.activated_at).getTime();

  const supa = createSupabaseServerClient();
  const { data, error } = await supa
    .from("micro_responses")
    .insert({
      micro_id: microId,
      user_id: userId,
      selected_option: option,
      response_time_ms: responseTimeMs,
      fire_chain_before: chainBefore,
      fire_multiplier: sc.fireMultiplier,
      ghost,
    })
    .select(RESP_COLS)
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") return { ok: false, error: "already_responded" };
    return { ok: false, error: "insert_failed" };
  }
  return {
    ok: true,
    response: data as MicroResponseRow,
    fireChainBefore: chainBefore,
    fireMultiplier: sc.fireMultiplier,
  };
}

// ─── Cadena de Fuego ──────────────────────────────────────────────────────────
/**
 * Racha vigente del usuario en ESTE partido: nº de aciertos consecutivos en las
 * micros YA resueltas, contando desde la última hacia atrás hasta el primer fallo.
 * Es el valor "antes de" la próxima micro (lo que se muestra en vivo).
 */
/** Racha desde la lista CRONOLÓGICA de is_correct: aciertos desde el final hacia
 *  atrás hasta el primer fallo; las anuladas (null) ni suman ni rompen. */
function chainFromResults(results: (boolean | null)[]): number {
  let run = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    const c = results[i];
    if (c === null) continue; // anulada (sin desenlace): no suma ni rompe la racha
    if (c) run++;
    else break;
  }
  return run;
}

export async function currentFireChain(userId: string, matchId: string): Promise<number> {
  const admin = adminClient();
  // Respuestas resueltas del usuario en este partido, en orden cronológico.
  const { data } = await admin
    .from("micro_responses")
    .select("is_correct,resolved_at,micro_predictions!inner(match_id)")
    .eq("user_id", userId)
    .eq("micro_predictions.match_id", matchId)
    .eq("ghost", false) // el Modo Fantasma (replay) no cuenta para la racha real
    .not("resolved_at", "is", null)
    .order("resolved_at", { ascending: true });
  return chainFromResults(((data ?? []) as { is_correct: boolean | null }[]).map((r) => r.is_correct));
}

/**
 * Rachas vigentes de VARIOS usuarios en un partido en consultas POR LOTE (en vez
 * de una por usuario): el settle de una micro con N respuestas pasa de N
 * consultas de racha a ceil(N/150). El IN va troceado para no desbordar la URL
 * de PostgREST.
 */
async function fireChainsForUsers(matchId: string, userIds: string[]): Promise<Map<string, number>> {
  const admin = adminClient();
  const chains = new Map<string, number>();
  if (userIds.length === 0) return chains;
  const byUser = new Map<string, (boolean | null)[]>();
  const CHUNK = 150;
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const { data } = await admin
      .from("micro_responses")
      .select("user_id,is_correct,resolved_at,micro_predictions!inner(match_id)")
      .in("user_id", userIds.slice(i, i + CHUNK))
      .eq("micro_predictions.match_id", matchId)
      .eq("ghost", false)
      .not("resolved_at", "is", null)
      .order("resolved_at", { ascending: true });
    for (const r of (data ?? []) as { user_id: string; is_correct: boolean | null }[]) {
      const arr = byUser.get(r.user_id) ?? [];
      if (arr.length === 0) byUser.set(r.user_id, arr);
      arr.push(r.is_correct);
    }
  }
  for (const uid of userIds) chains.set(uid, chainFromResults(byUser.get(uid) ?? []));
  return chains;
}

// ─── Resolución (admin / worker) ──────────────────────────────────────────────
export interface SettleSummary {
  micro_id: string;
  /** Opción correcta, o null si la micro se ANULÓ (sin desenlace en el feed). */
  correct_option: string | null;
  responses_resolved: number;
  winners: number;
}

interface SettleTarget {
  micro_id: string;
  /** Opción correcta ya fijada, o null si la micro quedó ANULADA. */
  correct_option: string | null;
  base_points: number;
  match_multiplier: number;
}

/**
 * Liquida un lote de respuestas pendientes de UNA micro ya fijada. Los fallos se
 * cierran con UN update por micro_id (sin listas de ids: no desborda la URL y
 * alcanza también a las filas que la consulta no trajo por el tope de PostgREST).
 * Los aciertos se marcan uno a uno con guardia por fila (si otra pasada ya tomó
 * la fila, no se paga doble) y se abonan tras marcar. Si el proceso muere a
 * mitad, las filas restantes siguen con resolved_at NULL y el barrido de
 * reparación las retoma en la siguiente pasada del cron.
 */
async function settleResponsesBatch(
  target: SettleTarget,
  responses: MicroResponseRow[],
  chains: Map<string, number>,
): Promise<number> {
  const admin = adminClient();

  // Micro anulada: cierre masivo, nadie gana ni pierde (is_correct NULL).
  if (target.correct_option === null) {
    await admin
      .from("micro_responses")
      .update({ is_correct: null, points_earned: 0, resolved_at: new Date().toISOString() })
      .eq("micro_id", target.micro_id)
      .is("resolved_at", null);
    return 0;
  }

  // Fallos: un solo update (0 puntos; conservan su fire_chain_before estimado).
  await admin
    .from("micro_responses")
    .update({ is_correct: false, points_earned: 0, resolved_at: new Date().toISOString() })
    .eq("micro_id", target.micro_id)
    .neq("selected_option", target.correct_option)
    .is("resolved_at", null);

  // Aciertos: marca con guardia + pago, en orden de llegada.
  let winners = 0;
  for (const r of responses) {
    if (r.selected_option !== target.correct_option) continue;
    const chainBefore = chains.get(r.user_id) ?? 0;
    const sc = scoreMicro({
      basePoints: target.base_points,
      chainBefore,
      matchMultiplier: Number(target.match_multiplier) || 1,
      ghost: r.ghost,
    });
    const { data: updated } = await admin
      .from("micro_responses")
      .update({
        is_correct: true,
        points_earned: sc.points,
        fire_chain_before: chainBefore,
        fire_multiplier: sc.fireMultiplier,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", r.id)
      .is("resolved_at", null)
      .select("id");
    if (updated && updated.length > 0) {
      winners++;
      const xpBonus = fireBonusXp(chainBefore + 1);
      await payUser(r.user_id, sc.points, sc.points + xpBonus);
    }
  }
  return winners;
}

/**
 * Resuelve UNA micro vencida: fija la opción correcta y paga a cada acertante en
 * orden cronológico de respuesta, recalculando su Cadena de Fuego eslabón a
 * eslabón (un fallo intercalado la rompe). Idempotente: solo procesa respuestas
 * con `resolved_at IS NULL`, y la propia micro pasa a `resolved` con guardia.
 *
 * `events` son los eventos autoritativos del partido hasta el momento (del Match
 * Center). El llamador (cron) garantiza que la ventana de respuesta ya venció;
 * `matchMinute`/`finished` son el estado actual del partido para esperar al
 * horizonte de resolución antes de liquidar.
 */
export async function settleMicro(
  micro: MicroRow,
  events: MatchEvent[],
  matchMinute: number,
  finished: boolean,
): Promise<SettleSummary | null> {
  const admin = adminClient();
  if (!isMicroKindRow(micro.kind)) return null;

  // El penalti resuelve EN CUANTO el feed trae su desenlace (puede tardar más que
  // el horizonte nominal si el VAR se alarga): busca hasta el final del partido y
  // no espera al horizonte. El resto espera a que el partido alcance su horizonte
  // de resolución (o termine): una micro de "antes del final" no es resoluble a
  // los 60s de abrirse. Reintenta en la próxima pasada del cron sin tocar la DB.
  const isPenalty = micro.kind === "penalty_outcome";
  if (!isPenalty && !finished && matchMinute < micro.resolve_minute) return null;

  const windowEnd = isPenalty ? END_OF_MATCH_MIN : micro.resolve_minute;
  const windowEvents = eventsInWindow(events, micro.open_minute, windowEnd);
  const correct = resolveMicro(micro.kind, windowEvents, micro.trigger_data);

  // Irresoluble (penalti aún sin desenlace en el feed): espera otra pasada; si el
  // partido terminó sin desenlace, ANULA (nadie gana ni pierde, racha intacta).
  if (correct === null) {
    if (!finished) return null;
    return voidMicro(micro);
  }

  // Cierra la micro de forma idempotente: solo si seguía sin resolver.
  const { data: locked } = await admin
    .from("micro_predictions")
    .update({ status: "resolved", correct_option: correct, resolved_at: new Date().toISOString() })
    .eq("id", micro.id)
    .neq("status", "resolved")
    .select("id");
  // Si otra pasada ya la resolvió, no repetimos pagos.
  if (!locked || locked.length === 0) return null;

  // Respuestas pendientes de esta micro, en orden de llegada.
  const { data: respData } = await admin
    .from("micro_responses")
    .select(RESP_COLS)
    .eq("micro_id", micro.id)
    .is("resolved_at", null)
    .order("created_at", { ascending: true });
  const responses = (respData ?? []) as MicroResponseRow[];

  // Rachas de TODOS los respondedores en lote (cada usuario responde una sola
  // vez por micro, así que su racha no cambia dentro del propio lote).
  const chains = await fireChainsForUsers(micro.match_id, [...new Set(responses.map((r) => r.user_id))]);
  const winners = await settleResponsesBatch(
    {
      micro_id: micro.id,
      correct_option: correct,
      base_points: micro.base_points,
      match_multiplier: Number(micro.match_multiplier) || 1,
    },
    responses,
    chains,
  );

  return { micro_id: micro.id, correct_option: correct, responses_resolved: responses.length, winners };
}

/**
 * Anula una micro irresoluble (el partido terminó sin el evento que la decide:
 * penalti rescindido o desenlace ausente del feed): la marca `resolved` SIN
 * opción correcta y cierra sus respuestas con is_correct NULL y 0 puntos. Nadie
 * gana ni pierde, y currentFireChain ignora estas respuestas (no rompen racha).
 * Idempotente con la misma guardia de estado que settleMicro.
 */
async function voidMicro(micro: MicroRow): Promise<SettleSummary | null> {
  const admin = adminClient();
  const { data: locked } = await admin
    .from("micro_predictions")
    .update({ status: "resolved", correct_option: null, resolved_at: new Date().toISOString() })
    .eq("id", micro.id)
    .neq("status", "resolved")
    .select("id");
  if (!locked || locked.length === 0) return null;

  const { data: closed } = await admin
    .from("micro_responses")
    .update({ is_correct: null, points_earned: 0, resolved_at: new Date().toISOString() })
    .eq("micro_id", micro.id)
    .is("resolved_at", null)
    .select("id");

  return { micro_id: micro.id, correct_option: null, responses_resolved: closed?.length ?? 0, winners: 0 };
}

/** Suma puntos→monedas y XP al perfil del usuario (mismo patrón que live-picks). */
async function payUser(userId: string, coins: number, xp: number): Promise<void> {
  if (!coins && !xp) return;
  // Abono ATÓMICO por la puerta única: la resolución corre en lote (cron), así que
  // un read-modify-write podía perder Fútcoins entre pagos simultáneos.
  await grantCoins(userId, coins, xp, { seasonXp: false, module: "micro" });
  await addSeasonXp(userId, xp).catch(() => {});
}

function isMicroKindRow(s: string): s is MicroKind {
  return Object.prototype.hasOwnProperty.call(MICRO_CATALOG, s);
}

/**
 * Micros cuya ventana de respuesta ya venció (para que el cron las resuelva).
 * Orden CRONOLÓGICO por apertura: la Cadena de Fuego se recalcula eslabón a
 * eslabón, así que liquidarlas fuera de orden subestimaría/inconsistiría el
 * multiplicador de aciertos consecutivos.
 */
export async function getDueMicros(): Promise<MicroRow[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("micro_predictions")
    .select(MICRO_COLS)
    .neq("status", "resolved")
    .lte("closes_at", new Date().toISOString())
    .order("activated_at", { ascending: true })
    .limit(200); // cota por pasada; lo que no quepa, a la siguiente (cron por minuto)
  return (data as MicroRow[] | null) ?? [];
}

/**
 * Barrido de REPARACIÓN: respuestas que quedaron con resolved_at NULL aunque su
 * micro ya está resuelta. Pasa si un settle muere a mitad (timeout/crash del
 * cron) o si la micro tenía más respuestas que el tope de filas de PostgREST en
 * la consulta del settle. Re-liquida con la correct_option YA fijada (sin pedir
 * eventos). Acotado por pasada; devuelve cuántas respuestas cerró.
 */
export async function repairOrphanResponses(limit = 300): Promise<number> {
  const admin = adminClient();
  const { data } = await admin
    .from("micro_responses")
    .select(`${RESP_COLS},micro_predictions!inner(match_id,status,correct_option,base_points,match_multiplier)`)
    .is("resolved_at", null)
    .eq("micro_predictions.status", "resolved")
    .order("created_at", { ascending: true })
    .limit(limit);

  type OrphanRow = MicroResponseRow & {
    micro_predictions: {
      match_id: string;
      status: string;
      correct_option: string | null;
      base_points: number;
      match_multiplier: number;
    };
  };
  const orphans = (data ?? []) as unknown as OrphanRow[];
  if (orphans.length === 0) return 0;

  // Agrupa por micro y liquida cada grupo con la misma maquinaria del settle.
  const byMicro = new Map<string, OrphanRow[]>();
  for (const o of orphans) {
    const arr = byMicro.get(o.micro_id) ?? [];
    if (arr.length === 0) byMicro.set(o.micro_id, arr);
    arr.push(o);
  }
  let repaired = 0;
  for (const [microId, group] of byMicro) {
    const m = group[0].micro_predictions;
    const chains = await fireChainsForUsers(m.match_id, [...new Set(group.map((r) => r.user_id))]);
    await settleResponsesBatch(
      {
        micro_id: microId,
        correct_option: m.correct_option,
        base_points: m.base_points,
        match_multiplier: Number(m.match_multiplier) || 1,
      },
      group,
      chains,
    );
    repaired += group.length;
  }
  return repaired;
}

/** Mis respuestas a las micros de un partido (RLS, para pintar resultados). */
export async function myMicroResponses(userId: string, matchId: string): Promise<MicroResponseRow[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("micro_responses")
    .select(`${RESP_COLS},micro_predictions!inner(match_id)`)
    .eq("user_id", userId)
    .eq("micro_predictions.match_id", matchId);
  return (data as MicroResponseRow[] | null) ?? [];
}

// ─── Modo Fantasma 👻 (replay, Fase 2) ────────────────────────────────────────
export interface GhostResult {
  ok: boolean;
  error?: string;
  is_correct?: boolean;
  correct_option?: string;
  points?: number;
}

/** El fantasma CADUCA: solo se puede rejugar una micro durante los minutos
 *  siguientes a su resolución ("la que se te acaba de escapar"). Sin esto, el
 *  historial ofrecía elegir micros del minuto 30 cuando el partido iba por el
 *  73 — parecía apuesta en vivo y no lo era. */
export const GHOST_REPLAY_WINDOW_MS = 5 * 60_000;

/**
 * Juega una micro RECIÉN RESUELTA en modo Fantasma (replay/práctica): el usuario
 * adivina a toro pasado, se le dice al instante si acertó y gana XP a ×0.5 —
 * NUNCA Fútcoins: la opción correcta es visible en el historial, así que pagar
 * monedas sería un grifo infinito (anti-cheat). No afecta la Cadena de Fuego
 * real (currentFireChain filtra ghost=false) y la propia respuesta se marca
 * resuelta al vuelo. Un usuario que ya la jugó en vivo no puede repetirla en
 * fantasma (índice único micro_id,user_id). Caduca a los 5 min de resolverse.
 */
export async function respondGhostMicro(userId: string, microId: string, option: string): Promise<GhostResult> {
  const micro = await getMicroById(microId);
  if (!micro) return { ok: false, error: "not_found" };
  if (micro.status !== "resolved" || !micro.correct_option) return { ok: false, error: "not_replayable" };
  const resolvedAtMs = micro.resolved_at ? new Date(micro.resolved_at).getTime() : 0;
  if (!resolvedAtMs || Date.now() - resolvedAtMs > GHOST_REPLAY_WINDOW_MS) {
    return { ok: false, error: "ghost_expired" };
  }
  if (!micro.options.some((o) => o.key === option)) return { ok: false, error: "invalid_option" };

  const isCorrect = option === micro.correct_option;
  const sc = isCorrect
    ? scoreMicro({
        basePoints: micro.base_points,
        chainBefore: 0, // el modo fantasma no usa racha
        matchMultiplier: Number(micro.match_multiplier) || 1,
        ghost: true,
      })
    : { points: 0, fireMultiplier: 1, breakdown: "fallo fantasma" };

  const admin = adminClient();
  const { error } = await admin
    .from("micro_responses")
    .insert({
      micro_id: microId,
      user_id: userId,
      selected_option: option,
      fire_chain_before: 0,
      fire_multiplier: 1,
      points_earned: sc.points,
      is_correct: isCorrect,
      ghost: true,
      resolved_at: new Date().toISOString(),
    });

  if (error) {
    if ((error as { code?: string }).code === "23505") return { ok: false, error: "already_played" };
    return { ok: false, error: "insert_failed" };
  }
  // Solo XP (0 monedas): el fantasma es práctica, no fuente de Fútcoins.
  if (isCorrect && sc.points > 0) await payUser(userId, 0, sc.points);
  return { ok: true, is_correct: isCorrect, correct_option: micro.correct_option, points: sc.points };
}

// ─── Duelo en Vivo ⚔️ (Fase 2) ────────────────────────────────────────────────
// Reto 1v1 a nivel de PARTIDO: quien sume más puntos de micro-predicciones en ese
// partido gana. Las ventanas de las micros son demasiado cortas para retar una a
// una, así que el duelo abarca todo el partido (mismo patrón que prediction_duels).
export interface MicroDuelOut {
  id: string;
  match_id: string;
  status: string;
  challenger_id: string;
  opponent_id: string;
  challenger_points: number | null;
  opponent_points: number | null;
  winner_id: string | null;
  challenger_username?: string | null;
  opponent_username?: string | null;
}

const MD_COLS =
  "id,match_id,status,challenger_id,opponent_id,challenger_points,opponent_points,winner_id";

/** Username de un usuario por id (para los avisos de duelo). Degrada a "alguien". */
async function usernameById(id: string): Promise<string> {
  const admin = adminClient();
  const { data } = await admin.from("profiles").select("username").eq("id", id).maybeSingle();
  return (data as { username: string | null } | null)?.username ?? "alguien";
}

export async function createMicroDuel(
  challengerId: string,
  opponentUsername: string,
  matchId: string,
): Promise<{ ok: boolean; error?: string; duel?: MicroDuelOut }> {
  const admin = adminClient();
  const { data: opp } = await admin.from("profiles").select("id").eq("username", opponentUsername).maybeSingle();
  if (!opp) return { ok: false, error: "opponent_not_found" };
  const opponentId = (opp as { id: string }).id;
  if (opponentId === challengerId) return { ok: false, error: "cannot_duel_self" };
  const { data, error } = await admin
    .from("micro_duels")
    .insert({ challenger_id: challengerId, opponent_id: opponentId, match_id: matchId, status: "pending" })
    .select(MD_COLS)
    .single();
  if (error) {
    if ((error as { code?: string }).code === "23505") return { ok: false, error: "duel_exists" };
    return { ok: false, error: "insert_failed" };
  }

  // Aviso 1v1 al rival (best-effort: no bloquea la creación del duelo).
  try {
    const challengerName = await usernameById(challengerId);
    await sendPushToUsers({
      userIds: [opponentId],
      payload: {
        title: `⚔️ @${challengerName} te retó a un Duelo en Vivo`,
        body: "Gana quien sume más micro-puntos en el partido. ¡Acepta el reto!",
        url: `/app/matchcenter/${matchId}`,
        tag: `micro-duel-${matchId}`,
        icon: "/img/email/logo-zonamundial.png",
        badge: "/icons/badge-72.png",
      },
    });
  } catch (err) {
    console.error("[micro-duel] challenge push failed", (err as Error).message);
  }

  return { ok: true, duel: data as MicroDuelOut };
}

export async function respondMicroDuel(uid: string, duelId: string, accept: boolean): Promise<{ ok: boolean; error?: string }> {
  const admin = adminClient();
  const { data: duel } = await admin.from("micro_duels").select("challenger_id,opponent_id,match_id,status").eq("id", duelId).maybeSingle();
  if (!duel) return { ok: false, error: "duel_not_found" };
  const d = duel as { challenger_id: string; opponent_id: string; match_id: string; status: string };
  if (d.opponent_id !== uid) return { ok: false, error: "not_your_duel" };
  if (d.status !== "pending") return { ok: false, error: "duel_not_pending" };
  await admin.from("micro_duels").update({ status: accept ? "active" : "declined" }).eq("id", duelId);

  // Avisa al retador de la respuesta (best-effort).
  try {
    const opponentName = await usernameById(uid);
    await sendPushToUsers({
      userIds: [d.challenger_id],
      payload: {
        title: accept
          ? `⚔️ @${opponentName} aceptó tu Duelo en Vivo`
          : `@${opponentName} rechazó tu Duelo en Vivo`,
        body: accept
          ? "¡Que empiece el duelo! Suma micro-puntos en el partido."
          : "Reta a otro jugador cuando quieras.",
        url: `/app/matchcenter/${d.match_id}`,
        tag: `micro-duel-${d.match_id}`,
        icon: "/img/email/logo-zonamundial.png",
        badge: "/icons/badge-72.png",
      },
    });
  } catch (err) {
    console.error("[micro-duel] response push failed", (err as Error).message);
  }

  return { ok: true };
}

export async function myMicroDuels(uid: string): Promise<MicroDuelOut[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("micro_duels")
    .select(MD_COLS)
    .or(`challenger_id.eq.${uid},opponent_id.eq.${uid}`)
    .order("created_at", { ascending: false });
  const rows = (data as MicroDuelOut[] | null) ?? [];
  if (rows.length === 0) return rows;

  // Resuelve usernames de todos los participantes en una sola consulta.
  const ids = Array.from(new Set(rows.flatMap((r) => [r.challenger_id, r.opponent_id])));
  const { data: profs } = await admin.from("profiles").select("id,username").in("id", ids);
  const nameById = new Map((profs ?? []).map((p) => [(p as { id: string }).id, (p as { username: string | null }).username]));
  return rows.map((r) => ({
    ...r,
    challenger_username: nameById.get(r.challenger_id) ?? null,
    opponent_username: nameById.get(r.opponent_id) ?? null,
  }));
}

/** Suma de puntos de micro-predicciones de un usuario en un partido (resueltas, no fantasma). */
export async function sumMicroMatchPoints(uid: string, matchId: string): Promise<number> {
  const admin = adminClient();
  const { data } = await admin
    .from("micro_responses")
    .select("points_earned,ghost,micro_predictions!inner(match_id)")
    .eq("user_id", uid)
    .eq("micro_predictions.match_id", matchId)
    .eq("ghost", false)
    .not("resolved_at", "is", null);
  return ((data ?? []) as { points_earned: number | null }[]).reduce((s, r) => s + (r.points_earned ?? 0), 0);
}

/**
 * Resuelve los duelos ACTIVOS de un partido ya finalizado: compara los puntos de
 * micro de cada jugador, fija ganador y paga +50 monedas. Idempotente: solo toca
 * los que siguen en 'active'.
 */
export async function resolveMicroDuelsForMatch(matchId: string): Promise<number> {
  const admin = adminClient();
  const { data: duels } = await admin
    .from("micro_duels")
    .select("id,challenger_id,opponent_id")
    .eq("match_id", matchId)
    .eq("status", "active");
  let resolved = 0;
  for (const d of (duels ?? []) as { id: string; challenger_id: string; opponent_id: string }[]) {
    const cp = await sumMicroMatchPoints(d.challenger_id, matchId);
    const op = await sumMicroMatchPoints(d.opponent_id, matchId);
    const winner = cp > op ? d.challenger_id : op > cp ? d.opponent_id : null;
    const { data: locked } = await admin
      .from("micro_duels")
      .update({
        status: "resolved",
        challenger_points: cp,
        opponent_points: op,
        winner_id: winner,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", d.id)
      .eq("status", "active")
      .select("id");
    if (!locked || locked.length === 0) continue; // otra pasada ya lo resolvió
    resolved++;
    if (winner) await payUser(winner, 50, 0);

    // Aviso del resultado a ambos jugadores (best-effort).
    try {
      const url = `/app/matchcenter/${matchId}`;
      if (winner) {
        const loser = winner === d.challenger_id ? d.opponent_id : d.challenger_id;
        const wp = winner === d.challenger_id ? cp : op;
        const lp = winner === d.challenger_id ? op : cp;
        await sendPushToUsers({
          userIds: [winner],
          payload: {
            title: "🏆 Ganaste tu Duelo en Vivo",
            body: `${wp}–${lp} en micro-puntos. +50 🪙`,
            url, tag: `micro-duel-${matchId}`, icon: "/img/email/logo-zonamundial.png", badge: "/icons/badge-72.png",
          },
        });
        await sendPushToUsers({
          userIds: [loser],
          payload: {
            title: "⚔️ Tu Duelo en Vivo terminó",
            body: `Perdiste ${lp}–${wp} en micro-puntos. ¡La revancha te espera!`,
            url, tag: `micro-duel-${matchId}`, icon: "/img/email/logo-zonamundial.png", badge: "/icons/badge-72.png",
          },
        });
      } else {
        await sendPushToUsers({
          userIds: [d.challenger_id, d.opponent_id],
          payload: {
            title: "🤝 Tu Duelo en Vivo terminó en empate",
            body: `Empate a ${cp} micro-puntos.`,
            url, tag: `micro-duel-${matchId}`, icon: "/img/email/logo-zonamundial.png", badge: "/icons/badge-72.png",
          },
        });
      }
    } catch (err) {
      console.error("[micro-duel] resolution push failed", (err as Error).message);
    }
  }
  return resolved;
}

/** Partidos con duelos micro activos (para que el cron sepa cuáles revisar). */
export async function matchesWithActiveMicroDuels(): Promise<string[]> {
  const admin = adminClient();
  const { data } = await admin.from("micro_duels").select("match_id").eq("status", "active");
  const set = new Set<string>();
  for (const r of (data ?? []) as { match_id: string }[]) set.add(r.match_id);
  return [...set];
}

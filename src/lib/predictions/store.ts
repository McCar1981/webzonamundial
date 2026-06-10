// src/lib/predictions/store.ts
//
// Capa de datos (Supabase) de las Predicciones. Las lecturas/escrituras del
// usuario usan el cliente con RLS (createSupabaseServerClient). La resolución de
// partidos, el agregado social y el leaderboard cruzan usuarios y usan el
// cliente admin (service role) que bypassa RLS.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type PredictionData,
  type PredictionRow,
  type PredictionType,
  type MatchResultReal,
  type SocialData,
  type ExactScoreData,
  type WinnerData,
  type FirstScorerData,
  type OverUnderData,
  type MinuteDramaData,
  type DuelData,
} from "./types";
import { scoreBase, applyBonuses } from "./scoring";
import { isEarlyBird } from "./rules";
import { matchMultiplier } from "./match-data";
import { adminClient } from "./admin";
import { grantMatchRewards } from "./gamification-store";
import { STREAK_THRESHOLD, boostDef, computeStreak } from "./gamification";
import { cosmeticsByUser } from "./cosmetics-store";
import type { CosmeticDisplay } from "./cosmetics";

// ─── Premium ─────────────────────────────────────────────────────────────────
export async function isPremium(userId: string): Promise<boolean> {
  const supa = createSupabaseServerClient();
  const { data } = await supa.from("profiles").select("is_premium").eq("id", userId).maybeSingle();
  return Boolean((data as { is_premium?: boolean } | null)?.is_premium);
}

// ─── Crear / leer / actualizar ───────────────────────────────────────────────
export interface CreateInput {
  userId: string;
  matchId: string;
  type: PredictionType;
  data: PredictionData;
  confidence: number;
  isContrarian: boolean;
  matchMult: number;
  /** Foto del entitlement al crear: los multiplicadores solo aplican si era Pro. */
  wasPro: boolean;
}

export async function findPrediction(userId: string, matchId: string, type: PredictionType): Promise<PredictionRow | null> {
  const supa = createSupabaseServerClient();
  const { data } = await supa
    .from("predictions")
    .select("*")
    .eq("user_id", userId).eq("match_id", matchId).eq("prediction_type", type)
    .maybeSingle();
  return (data as PredictionRow | null) ?? null;
}

export async function createPrediction(input: CreateInput): Promise<PredictionRow> {
  // FIX 1: escritura de predicción con cliente ADMIN (service role), no con el
  // cliente RLS+JWT del usuario. Evita que un usuario inserte columnas sensibles
  // vía PostgREST. Seguro: solo se llama desde rutas server que autentican y
  // pasan userId explícito.
  const supa = adminClient();

  // FIX 6 (Modo Manada): sellar community_pct_at_time e isContrarian en el
  // servidor. Ignoramos por completo lo que mandó el cliente: leemos el % real
  // de la comunidad para la opción elegida ANTES de este voto.
  let data = input.data;
  let isContrarian = input.isContrarian;
  if (input.type === "social") {
    const pct = await communityPctBeforeVote(input.matchId, input.data as SocialData);
    data = { ...(input.data as SocialData), community_pct_at_time: pct };
    isContrarian = pct < 50;
  }

  const { data: row, error } = await supa
    .from("predictions")
    .insert({
      user_id: input.userId,
      match_id: input.matchId,
      prediction_type: input.type,
      prediction_data: data,
      confidence_multiplier: input.confidence,
      is_contrarian: isContrarian,
      match_multiplier: input.matchMult,
      was_pro: input.wasPro,
    })
    .select("*")
    .single();
  if (error) throw error;
  // Cadena: persistir eslabones.
  if (input.type === "chain") {
    const steps = (data as { chain: { step: number; event_type: string; event_data: unknown }[] }).chain;
    await supa.from("prediction_chains").insert(
      steps.map((s) => ({
        prediction_id: (row as PredictionRow).id,
        step_number: s.step,
        event_type: s.event_type,
        event_data: s.event_data as object,
      })),
    );
  }
  // Sumar al agregado social (no bloqueante en caso de error).
  bumpSocialStat(input.matchId, input.type, optionKeyForStats(input.type, data)).catch(() => {});
  return row as PredictionRow;
}

/**
 * FIX 6: % real de la comunidad para la opción del usuario ANTES de su voto.
 * Lee los agregados sociales reales del partido (prediction_social_stats) con el
 * cliente admin, dentro del grupo de la misma question_key (option_key prefijo).
 * pct = round(100 · votos_de_su_opción / total_votos_del_grupo). Si total==0 → 100
 * (es el primero, va con "la mayoría", no contrarian).
 */
async function communityPctBeforeVote(matchId: string, d: SocialData): Promise<number> {
  const admin = adminClient();
  const optionKey = optionKeyForStats("social", d); // "<question_key>:<choice>"
  const group = optionKey.split(":")[0];            // grupo = question_key
  const { data: rows } = await admin
    .from("prediction_social_stats")
    .select("option_key,vote_count")
    .eq("match_id", matchId).eq("prediction_type", group);
  const list = (rows ?? []) as { option_key: string; vote_count: number }[];
  const total = list.reduce((s, r) => s + (r.vote_count ?? 0), 0);
  if (total === 0) return 100; // primer voto del grupo → no contrarian
  const mine = list.find((r) => r.option_key === optionKey)?.vote_count ?? 0;
  return Math.round((100 * mine) / total);
}

export async function getPredictionById(id: string): Promise<PredictionRow | null> {
  const supa = createSupabaseServerClient();
  const { data } = await supa.from("predictions").select("*").eq("id", id).maybeSingle();
  return (data as PredictionRow | null) ?? null;
}

/** Predicciones del usuario entre un conjunto de partidos (cupo Free por jornada). */
export async function countPredictionsForMatches(userId: string, matchIds: string[]): Promise<number> {
  if (matchIds.length === 0) return 0;
  const supa = createSupabaseServerClient();
  const { count } = await supa
    .from("predictions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("match_id", matchIds);
  return count ?? 0;
}

/** Cuántos cambios ha hecho hoy (UTC) el usuario. Premium: máximo 1/día. */
export async function changesUsedToday(userId: string): Promise<number> {
  const supa = createSupabaseServerClient();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await supa
    .from("predictions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("changed_at", start.toISOString());
  return count ?? 0;
}

export async function updatePredictionData(
  id: string,
  type: PredictionType,
  data: PredictionData,
  confidence: number,
  isContrarian: boolean,
): Promise<PredictionRow> {
  // FIX 1: actualización con cliente ADMIN (service role), no con el cliente
  // RLS+JWT del usuario (la ruta ya autentica al dueño y pasa el id).
  const supa = adminClient();
  const { data: row, error } = await supa
    .from("predictions")
    .update({
      prediction_data: data,
      confidence_multiplier: confidence,
      is_contrarian: isContrarian,
      changed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  // Cadena: re-sincronizar eslabones (borra los previos y reinserta).
  if (type === "chain") {
    await supa.from("prediction_chains").delete().eq("prediction_id", id);
    const steps = (data as { chain: { step: number; event_type: string; event_data: unknown }[] }).chain;
    await supa.from("prediction_chains").insert(
      steps.map((s) => ({
        prediction_id: id,
        step_number: s.step,
        event_type: s.event_type,
        event_data: s.event_data as object,
      })),
    );
  }
  return row as PredictionRow;
}

export async function getMatchPredictions(userId: string, matchId: string): Promise<PredictionRow[]> {
  const supa = createSupabaseServerClient();
  const { data } = await supa
    .from("predictions")
    .select("*")
    .eq("user_id", userId).eq("match_id", matchId)
    .order("created_at", { ascending: true });
  return (data as PredictionRow[] | null) ?? [];
}

/**
 * Cuántas predicciones (de los 8 tipos) ha hecho el usuario en cada partido.
 * Devuelve un mapa match_id → nº de tipos predichos. Para marcar las cards del
 * tablero como "Jugar" / "Pendiente" / "Ya predicho". Lectura propia (RLS).
 */
export async function predictedCountsByUser(userId: string): Promise<Record<string, number>> {
  const supa = createSupabaseServerClient();
  const { data } = await supa.from("predictions").select("match_id").eq("user_id", userId);
  const counts: Record<string, number> = {};
  for (const r of (data ?? []) as { match_id: string }[]) {
    counts[r.match_id] = (counts[r.match_id] ?? 0) + 1;
  }
  return counts;
}

// ─── Estadísticas sociales (tipo 8) ──────────────────────────────────────────
export function optionKeyForStats(type: PredictionType, data: PredictionData): string {
  switch (type) {
    case "winner": return `winner:${(data as WinnerData).result}`;
    case "exact_score": { const d = data as ExactScoreData; return `exact_score:${d.home_goals}-${d.away_goals}`; }
    case "first_scorer": { const d = data as FirstScorerData; return d.no_goals ? "first_scorer:no_goals" : `first_scorer:${d.player_id}`; }
    case "over_under": { const d = data as OverUnderData; return `over_under:${d.category}:${d.choice}`; }
    case "minute_drama": { const d = data as MinuteDramaData; return `minute_drama:${d.event}:${d.no_event ? "none" : d.minute_range}`; }
    case "duel": return `duel:${(data as DuelData).winner_player_id}`;
    case "social": { const d = data as SocialData; return `${d.question_key}:${d.choice}`; }
    case "chain": return "chain";
  }
}

async function bumpSocialStat(matchId: string, type: PredictionType, optionKey: string) {
  const admin = adminClient();
  const group = optionKey.split(":")[0]; // "winner", "exact_score", ...
  // Incrementa el voto de esta opción.
  const { data: existing } = await admin
    .from("prediction_social_stats")
    .select("vote_count")
    .eq("match_id", matchId).eq("prediction_type", group).eq("option_key", optionKey)
    .maybeSingle();
  const newCount = ((existing as { vote_count?: number } | null)?.vote_count ?? 0) + 1;
  await admin.from("prediction_social_stats").upsert({
    match_id: matchId, prediction_type: group, option_key: optionKey,
    vote_count: newCount, updated_at: new Date().toISOString(),
  }, { onConflict: "match_id,prediction_type,option_key" });
  // Recalcula porcentajes del grupo.
  const { data: rows } = await admin
    .from("prediction_social_stats")
    .select("option_key,vote_count")
    .eq("match_id", matchId).eq("prediction_type", group);
  const total = (rows ?? []).reduce((s, r) => s + ((r as { vote_count: number }).vote_count ?? 0), 0);
  if (total > 0) {
    for (const r of rows ?? []) {
      const rr = r as { option_key: string; vote_count: number };
      await admin.from("prediction_social_stats")
        .update({ vote_percentage: Math.round((rr.vote_count / total) * 1000) / 10 })
        .eq("match_id", matchId).eq("prediction_type", group).eq("option_key", rr.option_key);
    }
  }
}

export interface SocialStatsOut {
  total_predictions: number;
  stats: Record<string, { option_key: string; count: number; pct: number }[]>;
}
export async function getSocialStats(matchId: string): Promise<SocialStatsOut> {
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_social_stats")
    .select("prediction_type,option_key,vote_count,vote_percentage")
    .eq("match_id", matchId);
  const stats: SocialStatsOut["stats"] = {};
  let total = 0;
  for (const r of (data ?? []) as { prediction_type: string; option_key: string; vote_count: number; vote_percentage: number }[]) {
    (stats[r.prediction_type] ||= []).push({ option_key: r.option_key, count: r.vote_count, pct: r.vote_percentage });
    if (r.prediction_type === "winner") total += r.vote_count;
  }
  for (const k of Object.keys(stats)) stats[k].sort((a, b) => b.count - a.count);
  return { total_predictions: total, stats };
}

// ─── Pulso de actividad (banda "En directo") ─────────────────────────────────
export interface ActivityPulse {
  most_played: { match_id: string; count: number } | null;
  changed_today: number;
  predictions_today: number;
}
/**
 * Agregados de actividad de toda la comunidad para la banda "En directo":
 * partido más jugado, cuántas predicciones se cambiaron hoy y cuántas se
 * crearon hoy (UTC). Solo lectura, cruza usuarios → cliente admin.
 */
export async function getActivityPulse(): Promise<ActivityPulse> {
  const admin = adminClient();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const iso = start.toISOString();

  const [socialRes, changedRes, todayRes] = await Promise.all([
    admin.from("prediction_social_stats").select("match_id,vote_count").eq("prediction_type", "winner"),
    admin.from("predictions").select("id", { count: "exact", head: true }).gte("changed_at", iso),
    admin.from("predictions").select("id", { count: "exact", head: true }).gte("created_at", iso),
  ]);

  const totals = new Map<string, number>();
  for (const r of (socialRes.data ?? []) as { match_id: string; vote_count: number }[]) {
    totals.set(r.match_id, (totals.get(r.match_id) ?? 0) + (r.vote_count ?? 0));
  }
  let most_played: ActivityPulse["most_played"] = null;
  for (const [match_id, count] of totals) {
    if (!most_played || count > most_played.count) most_played = { match_id, count };
  }

  return {
    most_played,
    changed_today: changedRes.count ?? 0,
    predictions_today: todayRes.count ?? 0,
  };
}

// ─── Resolución de partido (interno / worker) ────────────────────────────────
export interface ResolveSummary {
  match_id: string;
  predictions_resolved: number;
  avg_points: number;
  perfect_predictions: number;
  processing_time_ms: number;
}

export async function resolveMatch(matchId: string, result: MatchResultReal): Promise<ResolveSummary> {
  const t0 = Date.now();
  const admin = adminClient();
  // FIX 8: orden estable (created_at, luego id) para que la racha intra-partido
  // y el ×1.5 se apliquen de forma determinista, no según el orden que devuelva PG.
  const { data: rows } = await admin
    .from("predictions")
    .select("*")
    .eq("match_id", matchId)
    .is("resolved_at", null)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  const list = (rows ?? []) as PredictionRow[];

  // Candidatos por usuario (la racha real se calcula sobre filas EFECTIVAMENTE
  // resueltas por esta ejecución — ver CAS más abajo).
  const candidateUsers = [...new Set(list.map((p) => p.user_id))];
  // FIX 7(b): consumir (a lo sumo uno) el boost "Congelar Racha" por usuario y
  // pasar frozen=true a su cálculo de racha para absorber un fallo reciente.
  const frozenUsers = await consumeStreakFreezes(candidateUsers);
  // Racha vigente de cada usuario (aciertos consecutivos ya resueltos).
  const streakByUser = await getActiveStreaks(candidateUsers, frozenUsers);
  // Boosts disponibles por usuario (se consume a lo sumo uno por predicción).
  const boostsByUser = await getAvailableBoostsByUser(candidateUsers);
  // FIX 5: usuarios con al menos una predicción resuelta POR esta ejecución
  // (los que ganaron el compare-and-set). Solo ellos reciben recompensas.
  const usersInMatch = new Set<string>();

  let sum = 0;
  let voidedCount = 0; // FIX 9: filas anuladas resueltas por esta ejecución
  const correctByUser = new Map<string, number>();
  const totalByUser = new Map<string, number>();
  const pointsByUser = new Map<string, number>();

  for (const p of list) {
    const base = scoreBase(p.prediction_type, p.prediction_data, p.confidence_multiplier, result);

    // Elegir el boost aplicable (orden de prioridad simple). OJO: NO lo
    // consumimos todavía — solo tras GANAR el compare-and-set (FIX 5), para que
    // una ejecución concurrente que pierda la fila no queme boosts del usuario.
    const inv = boostsByUser.get(p.user_id) ?? [];
    let boostNote = "";
    let boostToConsume: BoostRow | null = null;
    if (base.points > 0) {
      const dbl = inv.find((b) => boostDef(b.boost_id)?.scoreMultiplier);
      if (dbl) {
        base.points = Math.round(base.points * (boostDef(dbl.boost_id)!.scoreMultiplier ?? 1));
        boostNote = ` · ${boostDef(dbl.boost_id)!.emoji} ${boostDef(dbl.boost_id)!.name}`;
        boostToConsume = dbl;
      }
    } else if (base.points < 0) {
      const shield = inv.find((b) => boostDef(b.boost_id)?.shieldsNegative);
      if (shield) {
        base.points = 0;
        base.detail += " (escudo: 0 pts)";
        boostToConsume = shield;
      }
    }

    // Multiplicadores = beneficio Pro: se gatean con la foto was_pro tomada al
    // crear la predicción (no con el entitlement actual, que pudo cambiar).
    // Las filas históricas tienen was_pro=TRUE por DEFAULT → sin nerf retro.
    const wasPro = p.was_pro !== false;
    const streakActive = wasPro && (streakByUser.get(p.user_id) ?? 0) >= STREAK_THRESHOLD;
    const ctx = {
      matchMultiplier: wasPro ? Number(p.match_multiplier) || 1 : 1,
      isEarlyBird: wasPro && isEarlyBird(matchId, new Date(p.created_at)),
      streakActive,
    };
    const final = applyBonuses(base, ctx);

    // FIX 9: predicción anulada (feed incompleto) → resolvemos con 0 pts e
    // is_correct=null; es NEUTRA: no cuenta como acierto ni como fallo, no toca
    // la racha y no consume boosts.
    const voided = final.voided === true;

    // FIX 5: compare-and-set. Solo "ganamos" la fila si seguía sin resolver.
    // .select("id") nos dice si este UPDATE fue el que la resolvió.
    const { data: claimed } = await admin.from("predictions").update({
      points_before_multiplier: voided ? 0 : final.pointsBeforeMatchMultiplier,
      points_earned: voided ? 0 : final.points,
      is_correct: voided ? null : final.correct,
      resolution_breakdown: final.breakdown + (voided ? "" : boostNote),
      resolved_at: new Date().toISOString(),
    }).eq("id", p.id).is("resolved_at", null).select("id");

    // Otra ejecución ya la resolvió: no contamos nada (ni pago, ni racha, ni boost).
    if (!claimed || claimed.length === 0) continue;

    // Esta ejecución es la dueña de la fila. A partir de aquí: pago + contadores.
    usersInMatch.add(p.user_id);

    if (!voided && boostToConsume) {
      // Consumir el boost solo ahora (ganamos el CAS) y quitarlo del inventario.
      inv.splice(inv.indexOf(boostToConsume), 1);
      await admin.from("prediction_boosts")
        .update({ consumed_at: new Date().toISOString(), applied_to: p.id })
        .eq("id", boostToConsume.id);
    }

    if (voided) {
      // Neutra: no altera la racha en curso ni los contadores de acierto/fallo.
      voidedCount++;
      continue;
    }

    // Actualizar racha en curso para las siguientes predicciones del usuario.
    streakByUser.set(p.user_id, final.correct ? (streakByUser.get(p.user_id) ?? 0) + 1 : 0);

    sum += final.points;
    totalByUser.set(p.user_id, (totalByUser.get(p.user_id) ?? 0) + 1);
    pointsByUser.set(p.user_id, (pointsByUser.get(p.user_id) ?? 0) + final.points);
    if (final.correct) correctByUser.set(p.user_id, (correctByUser.get(p.user_id) ?? 0) + 1);
  }

  // Predicción perfecta: 8/8 aciertos en el partido.
  let perfect = 0;
  for (const [uid, correct] of correctByUser) {
    if (correct >= 8 && totalByUser.get(uid) === 8) perfect++;
  }

  // FIX 5: nº de predicciones EFECTIVAMENTE resueltas por esta ejecución
  // (incluye las anuladas) — no list.length, que cuenta también las que otra
  // ejecución concurrente resolvió.
  const resolvedCount = [...totalByUser.values()].reduce((a, b) => a + b, 0) + voidedCount;

  // Otorgar progresión (XP/monedas/rachas/logros) y resolver duelos del partido.
  // Solo a usuarios con alguna fila resuelta por esta ejecución (ganadores del CAS).
  await grantMatchRewards(matchId, [...usersInMatch]);

  return {
    match_id: matchId,
    predictions_resolved: resolvedCount,
    avg_points: resolvedCount ? Math.round((sum / resolvedCount) * 10) / 10 : 0,
    perfect_predictions: perfect,
    processing_time_ms: Date.now() - t0,
  };
}

// Aciertos consecutivos ya resueltos (antes de este partido) por usuario.
// FIX 7(b): `frozenUsers` = usuarios con un "Congelar Racha" ya consumido para
// este partido; su racha se calcula con computeStreak(..., frozen=true) para que
// el freeze absorba un fallo reciente (antes era un no-op).
async function getActiveStreaks(userIds: string[], frozenUsers?: Set<string>): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!userIds.length) return out;
  const admin = adminClient();
  const { data } = await admin
    .from("predictions")
    .select("user_id,is_correct,resolved_at")
    .in("user_id", userIds)
    .not("resolved_at", "is", null)
    .order("resolved_at", { ascending: true });
  const byUser = new Map<string, boolean[]>();
  for (const r of (data ?? []) as { user_id: string; is_correct: boolean | null }[]) {
    (byUser.get(r.user_id) ?? byUser.set(r.user_id, []).get(r.user_id)!).push(Boolean(r.is_correct));
  }
  for (const [uid, results] of byUser) {
    // Reutilizamos la lógica pura de racha (incluye absorción del freeze).
    out.set(uid, computeStreak(results, frozenUsers?.has(uid) ?? false).current);
  }
  return out;
}

interface BoostRow { id: string; boost_id: string }
async function getAvailableBoostsByUser(userIds: string[]): Promise<Map<string, BoostRow[]>> {
  const out = new Map<string, BoostRow[]>();
  if (!userIds.length) return out;
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_boosts")
    .select("id,user_id,boost_id")
    .in("user_id", userIds)
    .is("consumed_at", null);
  for (const r of (data ?? []) as { id: string; user_id: string; boost_id: string }[]) {
    (out.get(r.user_id) ?? out.set(r.user_id, []).get(r.user_id)!).push({ id: r.id, boost_id: r.boost_id });
  }
  return out;
}

/**
 * FIX 7(b): consume (a lo sumo UNO por usuario) el boost con `freezesStreak`
 * disponible y devuelve el set de usuarios cuya racha debe calcularse con
 * frozen=true. Idempotente: el filtro consumed_at=null garantiza que un boost ya
 * gastado no se vuelva a aplicar; marcamos consumed_at al reservarlo (CAS).
 *
 * NOTA (trade-off conocido): el freeze se consume aunque el usuario no tuviera un
 * fallo reciente que absorber (computeStreak solo lo "usa" si hay un !ok). Es lo
 * que pide la spec ("consumir a lo sumo uno"). Si se quisiera consumir SOLO cuando
 * realmente salva la racha, habría que hacer que computeStreak informe si usó el
 * freeze; se deja así para no ampliar la API ni romper la resolución. TODO opcional.
 */
async function consumeStreakFreezes(userIds: string[]): Promise<Set<string>> {
  const frozen = new Set<string>();
  if (!userIds.length) return frozen;
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_boosts")
    .select("id,user_id,boost_id")
    .in("user_id", userIds)
    .is("consumed_at", null);
  // Un freeze por usuario (el primero que aparezca).
  const pickByUser = new Map<string, string>(); // user_id → boost row id
  for (const r of (data ?? []) as { id: string; user_id: string; boost_id: string }[]) {
    if (boostDef(r.boost_id)?.freezesStreak && !pickByUser.has(r.user_id)) {
      pickByUser.set(r.user_id, r.id);
    }
  }
  for (const [uid, boostRowId] of pickByUser) {
    // CAS sobre el boost: solo lo aplicamos si seguía sin consumir.
    const { data: claimed } = await admin
      .from("prediction_boosts")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", boostRowId)
      .is("consumed_at", null)
      .select("id");
    if (claimed && claimed.length > 0) frozen.add(uid);
  }
  return frozen;
}

/** IDs de partidos con al menos una predicción sin resolver (para el worker). */
export async function getUnresolvedMatchIds(): Promise<string[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("predictions")
    .select("match_id")
    .is("resolved_at", null);
  const set = new Set<string>();
  for (const r of (data ?? []) as { match_id: string }[]) set.add(r.match_id);
  return [...set];
}

// ─── Stats personales ────────────────────────────────────────────────────────
export interface MyStats {
  total_points: number;
  total_predictions: number;
  correct_predictions: number;
  accuracy_pct: number;
  by_type: { type: PredictionType; total: number; correct: number; accuracy: number; avg_points: number }[];
  perfect_matches: number;
}
export async function getMyStats(userId: string): Promise<MyStats> {
  const supa = createSupabaseServerClient();
  const { data } = await supa
    .from("predictions")
    .select("prediction_type,points_earned,is_correct,match_id")
    .eq("user_id", userId)
    .not("resolved_at", "is", null);
  const rows = (data ?? []) as { prediction_type: PredictionType; points_earned: number | null; is_correct: boolean | null; match_id: string }[];

  const byType = new Map<PredictionType, { total: number; correct: number; pts: number }>();
  let totalPoints = 0, correct = 0;
  for (const r of rows) {
    totalPoints += r.points_earned ?? 0;
    if (r.is_correct) correct++;
    const t = byType.get(r.prediction_type) ?? { total: 0, correct: 0, pts: 0 };
    t.total++; t.pts += r.points_earned ?? 0; if (r.is_correct) t.correct++;
    byType.set(r.prediction_type, t);
  }
  const by_type = [...byType.entries()].map(([type, v]) => ({
    type, total: v.total, correct: v.correct,
    accuracy: v.total ? Math.round((v.correct / v.total) * 1000) / 10 : 0,
    avg_points: v.total ? Math.round((v.pts / v.total) * 10) / 10 : 0,
  }));

  // Partidos perfectos: 8/8 correctos en un match.
  const byMatch = new Map<string, { total: number; correct: number }>();
  for (const r of rows) {
    const m = byMatch.get(r.match_id) ?? { total: 0, correct: 0 };
    m.total++; if (r.is_correct) m.correct++;
    byMatch.set(r.match_id, m);
  }
  let perfect = 0;
  for (const m of byMatch.values()) if (m.total === 8 && m.correct === 8) perfect++;

  return {
    total_points: totalPoints,
    total_predictions: rows.length,
    correct_predictions: correct,
    accuracy_pct: rows.length ? Math.round((correct / rows.length) * 1000) / 10 : 0,
    by_type,
    perfect_matches: perfect,
  };
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  position: number;
  user: { id: string; display_name: string; avatar_url: string | null; is_premium: boolean; cosmetics: CosmeticDisplay | null };
  total_points: number;
  predictions_count: number;
  accuracy_pct: number;
}
export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("predictions")
    .select("user_id,points_earned,is_correct")
    .not("resolved_at", "is", null);
  const rows = (data ?? []) as { user_id: string; points_earned: number | null; is_correct: boolean | null }[];

  const agg = new Map<string, { pts: number; count: number; correct: number }>();
  for (const r of rows) {
    const a = agg.get(r.user_id) ?? { pts: 0, count: 0, correct: 0 };
    a.pts += r.points_earned ?? 0; a.count++; if (r.is_correct) a.correct++;
    agg.set(r.user_id, a);
  }
  const sorted = [...agg.entries()].sort((a, b) => b[1].pts - a[1].pts).slice(0, limit);

  // Perfiles para mostrar nombre/avatar.
  const ids = sorted.map(([id]) => id);
  const { data: profs } = ids.length
    ? await admin.from("profiles").select("id,username,avatar_url,is_premium").in("id", ids)
    : { data: [] };
  const pmap = new Map((profs ?? []).map((p) => [(p as { id: string }).id, p as { username: string | null; avatar_url: string | null; is_premium: boolean }]));
  const cmap = await cosmeticsByUser(ids);

  return sorted.map(([id, a], i) => {
    const pr = pmap.get(id);
    return {
      position: i + 1,
      user: {
        id,
        display_name: pr?.username ?? "Anónimo",
        avatar_url: pr?.avatar_url ?? null,
        is_premium: Boolean(pr?.is_premium),
        cosmetics: cmap.get(id) ?? null,
      },
      total_points: a.pts,
      predictions_count: a.count,
      accuracy_pct: a.count ? Math.round((a.correct / a.count) * 1000) / 10 : 0,
    };
  });
}

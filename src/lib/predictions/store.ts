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
import { STREAK_THRESHOLD, boostDef } from "./gamification";

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
  const supa = createSupabaseServerClient();
  const { data, error } = await supa
    .from("predictions")
    .insert({
      user_id: input.userId,
      match_id: input.matchId,
      prediction_type: input.type,
      prediction_data: input.data,
      confidence_multiplier: input.confidence,
      is_contrarian: input.isContrarian,
      match_multiplier: input.matchMult,
    })
    .select("*")
    .single();
  if (error) throw error;
  // Cadena: persistir eslabones.
  if (input.type === "chain") {
    const steps = (input.data as { chain: { step: number; event_type: string; event_data: unknown }[] }).chain;
    await supa.from("prediction_chains").insert(
      steps.map((s) => ({
        prediction_id: (data as PredictionRow).id,
        step_number: s.step,
        event_type: s.event_type,
        event_data: s.event_data as object,
      })),
    );
  }
  // Sumar al agregado social (no bloqueante en caso de error).
  bumpSocialStat(input.matchId, input.type, optionKeyForStats(input.type, input.data)).catch(() => {});
  return data as PredictionRow;
}

export async function getPredictionById(id: string): Promise<PredictionRow | null> {
  const supa = createSupabaseServerClient();
  const { data } = await supa.from("predictions").select("*").eq("id", id).maybeSingle();
  return (data as PredictionRow | null) ?? null;
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
  const supa = createSupabaseServerClient();
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
  const { data: rows } = await admin
    .from("predictions")
    .select("*")
    .eq("match_id", matchId)
    .is("resolved_at", null);
  const list = (rows ?? []) as PredictionRow[];

  // Racha vigente de cada usuario (aciertos consecutivos ya resueltos).
  const usersInMatch = [...new Set(list.map((p) => p.user_id))];
  const streakByUser = await getActiveStreaks(usersInMatch);
  // Boosts disponibles por usuario (se consume a lo sumo uno por predicción).
  const boostsByUser = await getAvailableBoostsByUser(usersInMatch);

  let sum = 0;
  const correctByUser = new Map<string, number>();
  const totalByUser = new Map<string, number>();
  const pointsByUser = new Map<string, number>();

  for (const p of list) {
    const base = scoreBase(p.prediction_type, p.prediction_data, p.confidence_multiplier, result);

    // Consumir un boost aplicable (orden de prioridad simple).
    const inv = boostsByUser.get(p.user_id) ?? [];
    let boostNote = "";
    let consumedBoostId: string | null = null;
    if (base.points > 0) {
      const dbl = inv.find((b) => boostDef(b.boost_id)?.scoreMultiplier);
      if (dbl) {
        base.points = Math.round(base.points * (boostDef(dbl.boost_id)!.scoreMultiplier ?? 1));
        boostNote = ` · ${boostDef(dbl.boost_id)!.emoji} ${boostDef(dbl.boost_id)!.name}`;
        consumedBoostId = dbl.id;
        inv.splice(inv.indexOf(dbl), 1);
      }
    } else if (base.points < 0) {
      const shield = inv.find((b) => boostDef(b.boost_id)?.shieldsNegative);
      if (shield) {
        base.points = 0;
        base.detail += " (escudo: 0 pts)";
        consumedBoostId = shield.id;
        inv.splice(inv.indexOf(shield), 1);
      }
    }

    const streakActive = (streakByUser.get(p.user_id) ?? 0) >= STREAK_THRESHOLD;
    const ctx = {
      matchMultiplier: Number(p.match_multiplier) || 1,
      isEarlyBird: isEarlyBird(matchId, new Date(p.created_at)),
      streakActive,
    };
    const final = applyBonuses(base, ctx);
    await admin.from("predictions").update({
      points_before_multiplier: final.pointsBeforeMatchMultiplier,
      points_earned: final.points,
      is_correct: final.correct,
      resolution_breakdown: final.breakdown + boostNote,
      resolved_at: new Date().toISOString(),
    }).eq("id", p.id);

    if (consumedBoostId) {
      await admin.from("prediction_boosts")
        .update({ consumed_at: new Date().toISOString(), applied_to: p.id })
        .eq("id", consumedBoostId);
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

  // Otorgar progresión (XP/monedas/rachas/logros) y resolver duelos del partido.
  await grantMatchRewards(matchId, usersInMatch);

  return {
    match_id: matchId,
    predictions_resolved: list.length,
    avg_points: list.length ? Math.round((sum / list.length) * 10) / 10 : 0,
    perfect_predictions: perfect,
    processing_time_ms: Date.now() - t0,
  };
}

// Aciertos consecutivos ya resueltos (antes de este partido) por usuario.
async function getActiveStreaks(userIds: string[]): Promise<Map<string, number>> {
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
    let run = 0;
    for (let i = results.length - 1; i >= 0; i--) { if (results[i]) run++; else break; }
    out.set(uid, run);
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
  user: { id: string; display_name: string; avatar_url: string | null; is_premium: boolean };
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

  return sorted.map(([id, a], i) => {
    const pr = pmap.get(id);
    return {
      position: i + 1,
      user: {
        id,
        display_name: pr?.username ?? "Anónimo",
        avatar_url: pr?.avatar_url ?? null,
        is_premium: Boolean(pr?.is_premium),
      },
      total_points: a.pts,
      predictions_count: a.count,
      accuracy_pct: a.count ? Math.round((a.correct / a.count) * 1000) / 10 : 0,
    };
  });
}

// src/lib/predictions/bracket-store.ts
//
// Capa de datos del Bracket conectado a la cuenta (mejora F).
//   - Borrador del usuario: lectura/escritura con RLS (el usuario gestiona lo suyo).
//   - Resultados reales del torneo: staged en Vercel KV por un editor/integración.
//   - Puntuación: la calcula y escribe el backend (service role) graduando cada
//     bracket guardado contra los resultados reales.

import { kv } from "@vercel/kv";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminClient } from "./admin";
import { scoreBracket, type BracketActuals, type KnockoutPhase } from "@/lib/bracket/scoring";
import type { Pick } from "@/lib/bracket/types";

// ─── Resultados reales (KV) ────────────────────────────────────────────────────
const ACTUALS_KEY = "pred:bracket:actuals";

export function bracketActualsAvailable(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}
export async function stageBracketActuals(actuals: BracketActuals): Promise<void> {
  await kv.set(ACTUALS_KEY, actuals);
}
export async function getBracketActuals(): Promise<BracketActuals | null> {
  return (await kv.get<BracketActuals>(ACTUALS_KEY)) ?? null;
}

// ─── Borrador del usuario (RLS) ────────────────────────────────────────────────
export interface SavedBracket {
  picks: Record<string, Pick>;
  champion: string | null;
  total_goals: number;
  updated_at: string | null;
}

export async function getUserBracket(uid: string): Promise<SavedBracket | null> {
  const supa = createSupabaseServerClient();
  const { data } = await supa
    .from("prediction_bracket")
    .select("picks,champion,total_goals,updated_at")
    .eq("user_id", uid).maybeSingle();
  if (!data) return null;
  const r = data as { picks: Record<string, Pick>; champion: string | null; total_goals: number; updated_at: string };
  return { picks: r.picks ?? {}, champion: r.champion ?? null, total_goals: r.total_goals ?? 0, updated_at: r.updated_at ?? null };
}

export async function saveUserBracket(
  uid: string, picks: Record<string, Pick>, champion: string | null, totalGoals: number,
): Promise<void> {
  const supa = createSupabaseServerClient();
  await supa.from("prediction_bracket").upsert({
    user_id: uid,
    picks,
    champion,
    total_goals: totalGoals,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

export interface BracketScoreView {
  score: number;
  reached_counts: Record<KnockoutPhase, number>;
  champion_correct: boolean;
  scored_at: string | null;
}

export async function getUserBracketScore(uid: string): Promise<BracketScoreView | null> {
  const supa = createSupabaseServerClient();
  const { data } = await supa
    .from("prediction_bracket_score")
    .select("score,reached_counts,champion_correct,scored_at")
    .eq("user_id", uid).maybeSingle();
  if (!data) return null;
  const r = data as BracketScoreView;
  return { score: r.score ?? 0, reached_counts: r.reached_counts ?? ({} as Record<KnockoutPhase, number>), champion_correct: Boolean(r.champion_correct), scored_at: r.scored_at ?? null };
}

// ─── Puntuación de todos los brackets (backend) ────────────────────────────────
/** Gradúa todos los brackets guardados contra los resultados reales staged en KV. */
export async function scoreAllBrackets(): Promise<{ scored: number; reason?: string }> {
  if (!bracketActualsAvailable()) return { scored: 0, reason: "kv_not_configured" };
  const actuals = await getBracketActuals();
  if (!actuals) return { scored: 0, reason: "no_actuals" };

  const admin = adminClient();
  const { data } = await admin.from("prediction_bracket").select("user_id,picks,champion");
  const rows = (data ?? []) as { user_id: string; picks: Record<string, Pick>; champion: string | null }[];

  let scored = 0;
  const now = new Date().toISOString();
  for (const r of rows) {
    const result = scoreBracket(r.picks ?? {}, r.champion ?? null, actuals);
    await admin.from("prediction_bracket_score").upsert({
      user_id: r.user_id,
      score: result.score,
      reached_counts: result.reached_counts,
      champion_correct: result.champion_correct,
      scored_at: now,
    }, { onConflict: "user_id" });
    scored++;
  }
  return { scored };
}

// ─── Leaderboard global del bracket (backend) ──────────────────────────────────
export interface BracketStanding {
  position: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  champion_correct: boolean;
}
export async function getBracketLeaderboard(limit = 50): Promise<BracketStanding[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_bracket_score")
    .select("user_id,score,champion_correct")
    .order("score", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as { user_id: string; score: number; champion_correct: boolean }[];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.user_id);
  const { data: profs } = await admin.from("profiles").select("id,username,avatar_url").in("id", ids);
  const pmap = new Map((profs ?? []).map((p) => {
    const r = p as { id: string; username: string | null; avatar_url: string | null };
    return [r.id, r];
  }));
  return rows.map((r, i) => ({
    position: i + 1,
    user_id: r.user_id,
    display_name: pmap.get(r.user_id)?.username ?? "Anónimo",
    avatar_url: pmap.get(r.user_id)?.avatar_url ?? null,
    score: r.score,
    champion_correct: Boolean(r.champion_correct),
  }));
}

/** Puntos de bracket por usuario (para sumarlos a las ligas). */
export async function bracketPointsByUser(userIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!userIds.length) return out;
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_bracket_score")
    .select("user_id,score").in("user_id", userIds);
  for (const r of (data ?? []) as { user_id: string; score: number }[]) {
    out.set(r.user_id, r.score ?? 0);
  }
  return out;
}

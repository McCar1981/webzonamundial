// src/lib/predictions/oracle.ts
//
// EL ORÁCULO — el pronóstico de la casa, uno por partido, igual para todos.
//
// El pick se computa DETERMINISTA con datos reales (ranking FIFA + forma
// reciente del cron del IA Coach) y se SELLA en KV la primera vez que alguien
// lo pide: a partir de ahí es inmutable. Sin LLM en el camino crítico — el
// Oráculo nunca "enmudece" por falta de saldo y no inventa nada: su frase es
// una plantilla con los datos que lo justifican.
//
// El reto: el usuario que ya hizo su predicción de Ganador puede retar al
// Oráculo. Al resolverse el partido, gana quien acertó el ganador real
// (40 Fútcoins + 20 XP); si ambos aciertan o ambos fallan, empate (10).

import { kv } from "@vercel/kv";
import { SELECCIONES } from "@/data/selecciones";
import { BRACKET_TEAMS } from "@/lib/bracket/teams";
import { readTeamForm } from "@/lib/ia-coach/team-form";
import { grantCoins } from "@/lib/economy/wallet";
import { adminClient } from "./admin";
import { getMatchMeta } from "./match-data";
import type { MatchResultReal, WinnerResult } from "./types";

export interface OraclePick {
  winner: WinnerResult;
  score: { home: number; away: number };
  reasoning: string;
  sealed_at: string;
}

export interface OracleChallengeRow {
  user_id: string;
  match_id: string;
  user_pick: { result: WinnerResult };
  oracle_pick: OraclePick;
  outcome: "user" | "oracle" | "tie" | null;
  reward_coins: number | null;
  created_at: string;
  resolved_at: string | null;
}

const PICK_KEY = (matchId: string) => `pred:oracle:pick:v1:${matchId}`;
const PICK_TTL = 60 * 60 * 24 * 14; // 14 días
const BOARD_KEY = "pred:oracle:scoreboard:v1";
const BOARD_TTL = 60;

export const ORACLE_WIN_COINS = 40;
export const ORACLE_WIN_XP = 20;
export const ORACLE_TIE_COINS = 10;

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

// Hash determinista (mismo FNV que usa match-data para las líneas O/U).
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const selByFlag = new Map(SELECCIONES.map((s) => [s.flagCode, s]));
const iso3ByFlag = new Map(BRACKET_TEAMS.map((t) => [t.iso, t.id]));

/** Puntos de forma 0..15 con los últimos 5 partidos reales (W=3, D=1). */
async function formPoints(flag: string): Promise<{ pts: number; summary: string | null }> {
  const iso3 = iso3ByFlag.get(flag);
  if (!iso3) return { pts: 0, summary: null };
  const form = await readTeamForm(iso3).catch(() => null);
  if (!form || form.matches.length === 0) return { pts: 0, summary: null };
  const last5 = form.matches.slice(0, 5);
  const pts = last5.reduce((a, m) => a + (m.result === "W" ? 3 : m.result === "D" ? 1 : 0), 0);
  return { pts, summary: last5.map((m) => m.result).join("-") };
}

/** Computa el pick (sin sellar). Determinista para un mismo día y datos. */
async function computePick(matchId: string): Promise<OraclePick | null> {
  const meta = getMatchMeta(matchId);
  if (!meta) return null;

  const rh = selByFlag.get(meta.home_flag)?.rankingFIFA ?? 90;
  const ra = selByFlag.get(meta.away_flag)?.rankingFIFA ?? 90;
  const [fh, fa] = await Promise.all([formPoints(meta.home_flag), formPoints(meta.away_flag)]);

  const strength = (rank: number, form: number) => (110 - Math.min(rank, 110)) + form * 1.5;
  const diff = strength(rh, fh.pts) - strength(ra, fa.pts);
  const seed = hashStr(`oracle:${matchId}`);

  let winner: WinnerResult;
  let score: { home: number; away: number };
  if (Math.abs(diff) < 6) {
    winner = "draw";
    score = seed % 10 < 7 ? { home: 1, away: 1 } : seed % 10 < 9 ? { home: 0, away: 0 } : { home: 2, away: 2 };
  } else if (diff > 0) {
    winner = "home";
    score = Math.abs(diff) >= 18 ? (seed % 2 ? { home: 2, away: 0 } : { home: 3, away: 1 }) : (seed % 2 ? { home: 1, away: 0 } : { home: 2, away: 1 });
  } else {
    winner = "away";
    score = Math.abs(diff) >= 18 ? (seed % 2 ? { home: 0, away: 2 } : { home: 1, away: 3 }) : (seed % 2 ? { home: 0, away: 1 } : { home: 1, away: 2 });
  }

  const parts = [`Ranking FIFA ${rh} vs ${ra}`];
  if (fh.summary) parts.push(`${meta.home_team}: ${fh.summary}`);
  if (fa.summary) parts.push(`${meta.away_team}: ${fa.summary}`);
  parts.push(Math.abs(diff) < 6 ? "partido cerrado" : `favorito ${winner === "home" ? meta.home_team : meta.away_team}`);

  return {
    winner,
    score,
    reasoning: parts.join(" · "),
    sealed_at: new Date().toISOString(),
  };
}

/** Pick sellado del partido (lo computa y sella la primera vez). */
export async function getOraclePick(matchId: string): Promise<OraclePick | null> {
  if (!kvEnabled()) return computePick(matchId); // sin KV: determinista igualmente
  try {
    const cached = await kv.get<OraclePick>(PICK_KEY(matchId));
    if (cached) return cached;
  } catch { /* cae a computar */ }
  const pick = await computePick(matchId);
  if (!pick) return null;
  try {
    // NX: si dos requests compiten, solo el primero sella; releemos el sellado.
    await kv.set(PICK_KEY(matchId), pick, { nx: true, ex: PICK_TTL });
    return (await kv.get<OraclePick>(PICK_KEY(matchId))) ?? pick;
  } catch {
    return pick;
  }
}

function winnerOf(home: number, away: number): WinnerResult {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

/**
 * Liquida los retos de un partido resuelto. Idempotente (CAS por resolved_at)
 * y fail-soft: un error aquí jamás tumba la resolución de predicciones.
 */
export async function settleOracleChallenges(matchId: string, result: MatchResultReal): Promise<void> {
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_oracle_challenges")
    .select("*")
    .eq("match_id", matchId)
    .is("resolved_at", null);
  const rows = (data ?? []) as OracleChallengeRow[];
  if (rows.length === 0) return;

  const real = winnerOf(result.score.home, result.score.away);

  for (const r of rows) {
    const userOk = r.user_pick?.result === real;
    const oracleOk = r.oracle_pick?.winner === real;
    const outcome: "user" | "oracle" | "tie" =
      userOk && !oracleOk ? "user" : !userOk && oracleOk ? "oracle" : "tie";
    const reward = outcome === "user" ? ORACLE_WIN_COINS : outcome === "tie" ? ORACLE_TIE_COINS : 0;

    // CAS: solo paga la ejecución que marca la fila como resuelta.
    const { data: claimed } = await admin
      .from("prediction_oracle_challenges")
      .update({ outcome, reward_coins: reward, resolved_at: new Date().toISOString() })
      .eq("user_id", r.user_id)
      .eq("match_id", r.match_id)
      .is("resolved_at", null)
      .select("user_id");
    if (!claimed || claimed.length === 0) continue;

    if (reward > 0) {
      await grantCoins(r.user_id, reward, outcome === "user" ? ORACLE_WIN_XP : 0, { module: "predicciones" })
        .catch((e) => console.error(`[oracle] pago fallido ${r.user_id}/${matchId}:`, e));
    }
  }

  // Invalida el marcador global cacheado.
  try { await kv.del(BOARD_KEY); } catch { /* sin drama */ }
}

export interface OracleScoreboard {
  user: number;
  oracle: number;
  tie: number;
}

/** Marcador global Humanos vs Oráculo (cacheado 60s). */
export async function getOracleScoreboard(): Promise<OracleScoreboard> {
  if (kvEnabled()) {
    try {
      const cached = await kv.get<OracleScoreboard>(BOARD_KEY);
      if (cached) return cached;
    } catch { /* recompute */ }
  }
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_oracle_challenges")
    .select("outcome")
    .not("resolved_at", "is", null);
  const board: OracleScoreboard = { user: 0, oracle: 0, tie: 0 };
  for (const r of (data ?? []) as { outcome: "user" | "oracle" | "tie" | null }[]) {
    if (r.outcome === "user") board.user++;
    else if (r.outcome === "oracle") board.oracle++;
    else if (r.outcome === "tie") board.tie++;
  }
  if (kvEnabled()) {
    try { await kv.set(BOARD_KEY, board, { ex: BOARD_TTL }); } catch { /* ok */ }
  }
  return board;
}

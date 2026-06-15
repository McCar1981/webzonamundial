// src/lib/predictions/challenges.ts
//
// PIQUES 1v1 — reto entre amigos con Fútcoins en juego sobre un partido.
//
// Flujo: el creador apuesta (escrow vía la billetera única) y recibe un CÓDIGO
// para compartir por WhatsApp. El rival lo introduce, paga su parte y el pique
// queda sellado. Al resolverse el partido: gana quien acertó el ganador real;
// si ambos aciertan (o ambos fallan), desempata el marcador exacto más cercano;
// sin desempate posible → se devuelven las apuestas. Un pique sin aceptar al
// cierre se reembolsa solo.
//
// Reglas duras: crear/aceptar SOLO antes del cierre de predicciones (los picks
// comparados son los sellados al cierre), escrow SIEMPRE por spendCoins (puerta
// única de gasto), liquidación idempotente con CAS.

import { randomBytes } from "crypto";
import { grantCoins, spendCoins } from "@/lib/economy/wallet";
import { adminClient } from "./admin";
import { getMatchMeta, predictionsCloseAt } from "./match-data";
import type { ExactScoreData, MatchResultReal, PredictionRow, WinnerData, WinnerResult } from "./types";

export const CHALLENGE_STAKES = [25, 50, 100] as const;

export interface ChallengeRow {
  id: string;
  match_id: string;
  creator_id: string;
  opponent_id: string | null;
  stake: number;
  code: string;
  status: "open" | "accepted" | "settled" | "refunded";
  winner_id: string | null;
  created_at: string;
  accepted_at: string | null;
  settled_at: string | null;
}

export type ChallengeError =
  | "bad_stake" | "match_not_found" | "closed" | "no_winner_prediction"
  | "insufficient_coins" | "not_found" | "own_challenge" | "not_open" | "conflict";

const codeAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I/L
function newCode(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += codeAlphabet[bytes[i] % codeAlphabet.length];
  return out;
}

function isOpenForChallenges(matchId: string): boolean {
  const closeAt = predictionsCloseAt(matchId, true);
  return !!closeAt && Date.now() < closeAt.getTime();
}

async function winnerPickOf(userId: string, matchId: string): Promise<WinnerResult | null> {
  const { data } = await adminClient()
    .from("predictions")
    .select("prediction_data")
    .eq("user_id", userId).eq("match_id", matchId).eq("prediction_type", "winner")
    .maybeSingle();
  const row = data as { prediction_data: WinnerData } | null;
  return row?.prediction_data?.result ?? null;
}

export async function createChallenge(
  userId: string,
  matchId: string,
  stake: number,
): Promise<{ ok: true; row: ChallengeRow } | { ok: false; error: ChallengeError }> {
  if (!CHALLENGE_STAKES.includes(stake as (typeof CHALLENGE_STAKES)[number])) {
    return { ok: false, error: "bad_stake" };
  }
  if (!getMatchMeta(matchId)) return { ok: false, error: "match_not_found" };
  if (!isOpenForChallenges(matchId)) return { ok: false, error: "closed" };
  if (!(await winnerPickOf(userId, matchId))) return { ok: false, error: "no_winner_prediction" };

  // Escrow del creador ANTES de crear la fila: si el insert fallara, se repone.
  const paid = await spendCoins(userId, stake);
  if (!paid.ok) return { ok: false, error: "insufficient_coins" };

  const admin = adminClient();
  const { data, error } = await admin
    .from("prediction_challenges")
    .insert({ match_id: matchId, creator_id: userId, stake, code: newCode() })
    .select("*")
    .single();
  if (error || !data) {
    await grantCoins(userId, stake, 0, { module: "predicciones" }); // devolver escrow
    return { ok: false, error: "conflict" };
  }
  return { ok: true, row: data as ChallengeRow };
}

export async function acceptChallenge(
  userId: string,
  code: string,
): Promise<{ ok: true; row: ChallengeRow } | { ok: false; error: ChallengeError }> {
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_challenges")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  const row = data as ChallengeRow | null;
  if (!row) return { ok: false, error: "not_found" };
  if (row.creator_id === userId) return { ok: false, error: "own_challenge" };
  if (row.status !== "open") return { ok: false, error: "not_open" };
  if (!isOpenForChallenges(row.match_id)) return { ok: false, error: "closed" };
  if (!(await winnerPickOf(userId, row.match_id))) return { ok: false, error: "no_winner_prediction" };

  const paid = await spendCoins(userId, row.stake);
  if (!paid.ok) return { ok: false, error: "insufficient_coins" };

  // CAS: solo el primero en aceptar gana la fila.
  const { data: claimed } = await admin
    .from("prediction_challenges")
    .update({ opponent_id: userId, status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("status", "open")
    .select("*");
  const updated = (claimed ?? [])[0] as ChallengeRow | undefined;
  if (!updated) {
    await grantCoins(userId, row.stake, 0, { module: "predicciones" }); // otro llegó antes
    return { ok: false, error: "not_open" };
  }
  return { ok: true, row: updated };
}

export async function myChallenges(userId: string, matchId: string): Promise<ChallengeRow[]> {
  const { data } = await adminClient()
    .from("prediction_challenges")
    .select("*")
    .eq("match_id", matchId)
    .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
    .order("created_at", { ascending: true });
  return (data ?? []) as ChallengeRow[];
}

function winnerOf(home: number, away: number): WinnerResult {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

/** Distancia del marcador exacto del usuario al real (Infinity si no predijo). */
async function exactDistance(userId: string, matchId: string, result: MatchResultReal): Promise<number> {
  const { data } = await adminClient()
    .from("predictions")
    .select("prediction_data")
    .eq("user_id", userId).eq("match_id", matchId).eq("prediction_type", "exact_score")
    .maybeSingle();
  const row = data as { prediction_data: ExactScoreData } | null;
  if (!row?.prediction_data) return Number.POSITIVE_INFINITY;
  return Math.abs(row.prediction_data.home_goals - result.score.home)
    + Math.abs(row.prediction_data.away_goals - result.score.away);
}

/**
 * Liquida los piques de un partido resuelto. Idempotente (CAS por status) y
 * fail-soft. Los abiertos sin rival se reembolsan.
 */
export async function settleChallenges(matchId: string, result: MatchResultReal): Promise<void> {
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_challenges")
    .select("*")
    .eq("match_id", matchId)
    .in("status", ["open", "accepted"]);
  const rows = (data ?? []) as ChallengeRow[];
  if (rows.length === 0) return;

  // Penaltis (KO): el ganador lo decide la tanda, no el empate de los 120'.
  const real = result.winner_override ?? winnerOf(result.score.home, result.score.away);

  for (const r of rows) {
    if (r.status === "open") {
      // Nadie aceptó: devolución al creador.
      const { data: claimed } = await admin
        .from("prediction_challenges")
        .update({ status: "refunded", settled_at: new Date().toISOString() })
        .eq("id", r.id).eq("status", "open")
        .select("id");
      if (claimed && claimed.length > 0) {
        await grantCoins(r.creator_id, r.stake, 0, { module: "predicciones" })
          .catch((e) => console.error(`[piques] reembolso fallido ${r.id}:`, e));
      }
      continue;
    }

    if (!r.opponent_id) continue; // accepted sin rival: imposible, defensivo

    const [pickA, pickB] = await Promise.all([
      winnerPickOf(r.creator_id, r.match_id),
      winnerPickOf(r.opponent_id, r.match_id),
    ]);
    const aOk = pickA === real;
    const bOk = pickB === real;

    let winnerId: string | null = null;
    if (aOk !== bOk) {
      winnerId = aOk ? r.creator_id : r.opponent_id;
    } else {
      // Ambos aciertan (o fallan): desempata el marcador exacto más cercano.
      const [dA, dB] = await Promise.all([
        exactDistance(r.creator_id, r.match_id, result),
        exactDistance(r.opponent_id, r.match_id, result),
      ]);
      if (dA !== dB && (Number.isFinite(dA) || Number.isFinite(dB))) {
        winnerId = dA < dB ? r.creator_id : r.opponent_id;
      }
    }

    const { data: claimed } = await admin
      .from("prediction_challenges")
      .update({
        status: winnerId ? "settled" : "refunded",
        winner_id: winnerId,
        settled_at: new Date().toISOString(),
      })
      .eq("id", r.id).eq("status", "accepted")
      .select("id");
    if (!claimed || claimed.length === 0) continue;

    if (winnerId) {
      await grantCoins(winnerId, r.stake * 2, 10, { module: "predicciones" })
        .catch((e) => console.error(`[piques] pago fallido ${r.id}:`, e));
    } else {
      // Empate total: cada uno recupera su apuesta.
      await Promise.all([
        grantCoins(r.creator_id, r.stake, 0, { module: "predicciones" }),
        grantCoins(r.opponent_id, r.stake, 0, { module: "predicciones" }),
      ]).catch((e) => console.error(`[piques] devolución fallida ${r.id}:`, e));
    }
  }
}

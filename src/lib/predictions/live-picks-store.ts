// src/lib/predictions/live-picks-store.ts
//
// Capa de datos de los micro-picks en vivo. Usa el cliente admin (service role)
// porque resuelve picks y paga recompensas que el usuario no puede auto-otorgar.
//
// Estado AUTORITATIVO del partido (minuto + eventos): proviene del Match Center.
//   - live real (api-football) si hay fixture mapeado y snapshot.
//   - simulación determinista en cualquier otro caso, con el minuto derivado del
//     reloj real (speed = 1 → segundos de reloj == segundos de juego).

import { adminClient } from "./admin";
import { addSeasonXp } from "./gamification-store";
import { grantCoins } from "@/lib/economy/wallet";
import { getMatchMeta } from "./match-data";
import { buildMeta, getFixtureId, getCachedSnapshot, cacheSnapshot } from "@/lib/match-center/store";
import { buildSimulation } from "@/lib/match-center/simulation";
import { fetchLiveSnapshot } from "@/lib/match-center/apiFootball";
import type { MatchEvent } from "@/lib/match-center/types";
import {
  LIVE_MARKETS,
  LIVE_MAX_MINUTE,
  eventsInWindow,
  isLiveMarket,
  resolveLivePick,
} from "./live-picks";

export interface MatchLiveState {
  live: boolean;
  /** Minuto de juego autoritativo (1..90+). */
  minute: number;
  finished: boolean;
  /** Eventos ocurridos hasta `minute`. */
  events: MatchEvent[];
}

const FINISHED_STATUSES = ["FT", "AET", "PEN"];

export async function authoritativeState(matchId: string): Promise<MatchLiveState | null> {
  const pred = getMatchMeta(matchId);
  if (!pred?.kickoff_at) return null;

  const id = parseInt(matchId, 10);
  if (Number.isNaN(id)) return null;
  const kickoffMs = new Date(pred.kickoff_at).getTime();
  const now = Date.now();
  if (now < kickoffMs) return { live: false, minute: 0, finished: false, events: [] };

  const meta = buildMeta(id);
  if (!meta) return null;

  // --- Live real (api-football) ---
  const fixtureId = await getFixtureId(id);
  if (fixtureId) {
    let snap = await getCachedSnapshot(id);
    if (!snap) {
      snap = await fetchLiveSnapshot(fixtureId, meta);
      if (snap) await cacheSnapshot(snap);
    }
    if (snap) {
      const finished = FINISHED_STATUSES.includes(snap.status);
      return { live: !finished, minute: snap.elapsed, finished, events: snap.events };
    }
    // si la API falla, caemos a simulación
  }

  // --- Simulación determinista (minuto derivado del reloj) ---
  const script = buildSimulation(meta);
  const elapsedSec = (now - kickoffMs) / 1000;
  const finished = elapsedSec >= script.durationSeconds;
  const minute = Math.min(Math.floor(elapsedSec / 60) + 1, Math.ceil(script.durationSeconds / 60));
  const events = script.events.filter((e) => e.t <= elapsedSec);
  return { live: !finished, minute, finished, events };
}

export interface LivePickRow {
  id: string;
  match_id: string;
  market: string;
  choice: string;
  open_minute: number;
  resolve_minute: number;
  status: string;
  reward_coins: number;
  reward_xp: number;
  created_at: string;
  resolved_at: string | null;
}

const PICK_COLS = "id,match_id,market,choice,open_minute,resolve_minute,status,reward_coins,reward_xp,created_at,resolved_at";

export async function listLivePicks(uid: string, matchId: string): Promise<LivePickRow[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_live_picks")
    .select(PICK_COLS)
    .eq("user_id", uid)
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as LivePickRow[];
}

export interface CreateLiveResult {
  ok: boolean;
  error?: string;
  pick?: LivePickRow;
}

export async function createLivePick(
  uid: string,
  matchId: string,
  market: string,
  choice: string,
): Promise<CreateLiveResult> {
  if (!isLiveMarket(market)) return { ok: false, error: "invalid_market" };
  const def = LIVE_MARKETS[market];
  if (!def.options.some((o) => o.key === choice)) return { ok: false, error: "invalid_choice" };

  const state = await authoritativeState(matchId);
  if (!state) return { ok: false, error: "match_not_found" };
  if (!state.live) return { ok: false, error: "match_not_live" };
  if (state.minute >= LIVE_MAX_MINUTE) return { ok: false, error: "too_late" };

  const admin = adminClient();
  const openMinute = state.minute;
  const resolveMinute = openMinute + def.windowMin;
  const { data, error } = await admin
    .from("prediction_live_picks")
    .insert({
      user_id: uid,
      match_id: matchId,
      market,
      choice,
      open_minute: openMinute,
      resolve_minute: resolveMinute,
      reward_coins: def.rewardCoins,
      reward_xp: def.rewardXp,
    })
    .select(PICK_COLS)
    .single();

  if (error) {
    // El índice único parcial rechaza un segundo pick pendiente del mismo mercado.
    if ((error as { code?: string }).code === "23505") return { ok: false, error: "pending_exists" };
    return { ok: false, error: "insert_failed" };
  }
  return { ok: true, pick: data as LivePickRow };
}

/**
 * Resuelve los picks pendientes que ya vencieron y paga la recompensa de los
 * acertados. Idempotente: el pago va condicionado a que ESTA llamada sea la que
 * cambia el estado de `pending` a resuelto (update con filtro status=pending +
 * select), evitando doble pago ante polling concurrente.
 */
export async function settleDuePicks(uid: string, matchId: string, state: MatchLiveState): Promise<void> {
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_live_picks")
    .select(PICK_COLS)
    .eq("user_id", uid)
    .eq("match_id", matchId)
    .eq("status", "pending");
  const rows = (data ?? []) as LivePickRow[];
  if (!rows.length) return;

  let gainedCoins = 0;
  let gainedXp = 0;
  for (const r of rows) {
    const due = state.finished || state.minute >= r.resolve_minute;
    if (!due || !isLiveMarket(r.market)) continue;

    const win = resolveLivePick(r.market, r.choice, eventsInWindow(state.events, r.open_minute, r.resolve_minute));
    const { data: updated } = await admin
      .from("prediction_live_picks")
      .update({ status: win ? "won" : "lost", resolved_at: new Date().toISOString() })
      .eq("id", r.id)
      .eq("status", "pending")
      .select("id");

    if (win && updated && updated.length > 0) {
      gainedCoins += r.reward_coins;
      gainedXp += r.reward_xp;
    }
  }

  if (gainedCoins || gainedXp) {
    // Abono ATÓMICO por la puerta única: varios picks en vivo del mismo partido se
    // liquidan en ráfaga, así que un read-modify-write podía perder Fútcoins.
    await grantCoins(uid, gainedCoins, gainedXp, { seasonXp: false, module: "predicciones" });
    await addSeasonXp(uid, gainedXp).catch(() => {});
  }
}

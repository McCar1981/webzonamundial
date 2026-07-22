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
import { isLigaMicroMatchId, fetchLigaSnapshot } from "@/lib/ligas/micro-live";
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
  /** Origen de los datos: "live" = feed real api-football; "sim" = simulación
   *  determinista (fallback). Los consumidores que pagan con dinero/monedas
   *  reales (micro-predicciones) NO deben liquidar con "sim". */
  source: "live" | "sim";
  /** Eventos ocurridos hasta `minute`. */
  events: MatchEvent[];
}

const FINISHED_STATUSES = ["FT", "AET", "PEN"];

export async function authoritativeState(matchId: string): Promise<MatchLiveState | null> {
  // Zona de Ligas: el match_id ES el fixtureId de api-football. Se resuelve
  // SIEMPRE del feed real (autoritativo por sí mismo), sin MATCHES ni simulación.
  // Si el feed no responde, devolvemos null → resolve-micro pospone (nunca paga
  // contra datos inventados). Es más simple que el camino del Mundial.
  const ligaId = parseInt(matchId, 10);
  if (isLigaMicroMatchId(ligaId)) {
    const snap = await fetchLigaSnapshot(ligaId);
    if (!snap) return null;
    const finished = FINISHED_STATUSES.includes(snap.status);
    return { live: !finished, minute: snap.elapsed, finished, source: "live", events: snap.events };
  }

  const pred = getMatchMeta(matchId);
  if (!pred?.kickoff_at) return null;

  const id = parseInt(matchId, 10);
  if (Number.isNaN(id)) return null;
  const kickoffMs = new Date(pred.kickoff_at).getTime();
  const now = Date.now();
  if (now < kickoffMs) return { live: false, minute: 0, finished: false, source: "live", events: [] };

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
      return { live: !finished, minute: snap.elapsed, finished, source: "live", events: snap.events };
    }
    // si la API falla, NO simulamos para un partido del torneo (ver abajo).
  }

  // ANTI-CHEAT: para CUALQUIER partido del torneo (id < 9000) jamás devolvemos un
  // estado SIMULADO. Las micro-predicciones pagan/retiran Fútcoins reales: pagar
  // contra eventos inventados (porque la API falló o aún no hay fixture) sería
  // hacer trampa. Devolvemos null → el endpoint responde "sin datos" y los crones
  // de liquidación POSPONEN la resolución hasta que vuelva el feed real (mejor
  // esperar que liquidar mal). Solo los slots de prueba (id >= 9000) simulan.
  if (id < 9000) return null;

  // --- Simulación determinista (minuto derivado del reloj) — solo slots de prueba ---
  const script = buildSimulation(meta);
  const elapsedSec = (now - kickoffMs) / 1000;
  const finished = elapsedSec >= script.durationSeconds;
  const minute = Math.min(Math.floor(elapsedSec / 60) + 1, Math.ceil(script.durationSeconds / 60));
  const events = script.events.filter((e) => e.t <= elapsedSec);
  return { live: !finished, minute, finished, source: "sim", events };
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
  // NP-04 (auditoría 2026-06-10): NUNCA liquidar picks con dinero/monedas reales
  // contra eventos SIMULADOS. Si el estado autoritativo cae a simulación (la API
  // de fútbol falló o no hay fixture mapeado), dejamos los picks pendientes hasta
  // que vuelva el feed real. Coherente con `source` en authoritativeState.
  if (state.source === "sim") return;

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

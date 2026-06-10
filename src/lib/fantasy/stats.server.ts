// src/lib/fantasy/stats.server.ts
//
// Estadísticas REALES acumuladas por jugador (api-football vía Match Center).
// El pool del cliente arranca EN CERO y estas líneas lo rellenan con lo que pasa
// de verdad en el torneo (applyRealStats). Se agregan bajo demanda con caché en
// KV: cada partido TERMINADO se procesa UNA sola vez (doneMatches) y queda
// sumado para siempre, así el coste api-football es ~1 fetch por partido en todo
// el Mundial. Sin KV no se computa nada y el pool se queda a 0 (seguro). Server-only.

import { kv } from "@vercel/kv";
import { MATCHES, type Match } from "@/data/matches";
import { buildMeta, getFixtureId, getCachedSnapshot, cacheSnapshot } from "@/lib/match-center/store";
import { fetchLiveSnapshots } from "@/lib/match-center/apiFootball";
import type { LiveSnapshot, MatchMeta } from "@/lib/match-center/types";
import { getPlayerPool, type RealPlayerAgg } from "./players";
import { realLineFor, snapshotFinished } from "./scoring.live";
import { matchTier } from "./fixtures";
import { isFantasyLive } from "./season";

export interface RealStatsBlob {
  v: 1;
  updatedAt: number;
  doneMatches: number[]; // partidos ya sumados (no se vuelven a pedir jamás)
  players: Record<string, RealPlayerAgg>;
}

const KEY = "fantasy:realstats:v1";
const LOCK = `${KEY}:lock`;
const STALE_MS = 30 * 60_000; // refresco como mucho cada 30 min

// Fases que cuentan para el Fantasy (excluye el amistoso de prueba i:9002).
const PHASES = new Set([
  "Fase de grupos",
  "Dieciseisavos",
  "Octavos de final",
  "Cuartos de final",
  "Semifinal",
  "Tercer puesto",
  "FINAL",
]);

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

async function readBlob(): Promise<RealStatsBlob | null> {
  if (!kvEnabled()) return null;
  try {
    return (await kv.get<RealStatsBlob>(KEY)) || null;
  } catch {
    return null;
  }
}

/** Snapshots de un conjunto de partidos (caché KV → fixture mapeado → api-football). */
async function fetchSnaps(matches: Match[]): Promise<Record<number, LiveSnapshot>> {
  const out: Record<number, LiveSnapshot> = {};
  const misses: { matchId: number; fixtureId: number; meta: MatchMeta }[] = [];
  for (const m of matches) {
    const meta = buildMeta(m.i);
    if (!meta) continue;
    const cached = await getCachedSnapshot(m.i);
    if (cached) {
      out[m.i] = cached;
      continue;
    }
    const fixtureId = await getFixtureId(m.i);
    if (!fixtureId) continue; // sin fixture mapeado aún → en el próximo refresco
    misses.push({ matchId: m.i, fixtureId, meta });
  }
  if (misses.length > 0) {
    try {
      const fetched = await fetchLiveSnapshots(misses);
      for (const ms of misses) {
        const snap = fetched[ms.matchId];
        if (snap) {
          await cacheSnapshot(snap);
          out[ms.matchId] = snap;
        }
      }
    } catch {
      /* sin datos nuevos: se reintenta en el próximo refresco */
    }
  }
  return out;
}

/**
 * Acumulado real por jugador, refrescado si caducó (≥30 min). Solo computa con
 * el torneo en marcha; cada partido TERMINADO se suma una única vez. Los puntos
 * son base × multiplicador Underdog del partido (sin capitán: eso es por usuario).
 */
export async function getRealPlayerStats(): Promise<RealStatsBlob | null> {
  const blob = await readBlob();
  if (!isFantasyLive() || !kvEnabled()) return blob;
  if (blob && Date.now() - blob.updatedAt < STALE_MS) return blob;

  // Lock anti-estampida: si otro request ya recalcula, se sirve lo que haya.
  try {
    const got = await kv.set(LOCK, 1, { nx: true, ex: 120 });
    if (got !== "OK") return blob;
  } catch {
    return blob;
  }

  const next: RealStatsBlob = blob ?? { v: 1, updatedAt: 0, doneMatches: [], players: {} };
  const done = new Set(next.doneMatches);
  const today = new Date().toISOString().slice(0, 10);
  const candidates = MATCHES.filter(
    (m) => PHASES.has(m.p) && m.d <= today && !done.has(m.i) && m.hf !== "tbd" && m.af !== "tbd",
  );

  if (candidates.length > 0) {
    const snaps = await fetchSnaps(candidates);
    const pool = getPlayerPool();
    for (const m of candidates) {
      const snap = snaps[m.i];
      if (!snap || !snapshotFinished(snap)) continue; // en juego o sin datos: aún no
      const mult = matchTier(m).multiplier;
      for (const p of pool) {
        const side = p.flag === m.hf ? ("home" as const) : p.flag === m.af ? ("away" as const) : null;
        if (!side) continue;
        const line = realLineFor(p, snap, side);
        if (!line.played) continue;
        const agg = next.players[p.id] ?? { pts: 0, played: 0, goals: 0, assists: 0, minutes: 0, cleanSheets: 0 };
        agg.pts += Math.round(line.basePoints * mult);
        agg.played += 1;
        agg.goals += line.goals;
        agg.assists += line.assists;
        agg.minutes += line.minutes;
        agg.cleanSheets += line.cleanSheet ? 1 : 0;
        next.players[p.id] = agg;
      }
      done.add(m.i);
    }
  }

  next.doneMatches = [...done];
  next.updatedAt = Date.now();
  try {
    await kv.set(KEY, next);
  } catch {
    /* mejor servir el cálculo que fallar por la caché */
  }
  return next;
}

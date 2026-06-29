// src/lib/fantasy/scoring.server.ts
//
// Puntuación SERVER-AUTHORITATIVE de una jornada. El ranking global, el semanal,
// las ligas y las Fútcoins NO pueden depender de un número enviado por el
// cliente (sería trivial forjar 200 pts/jornada). Aquí el servidor recalcula los
// puntos de la jornada con DATOS REALES: reutiliza el motor puro
// `scoreGameweekLive` y descarga los snapshots reales del Match Center (las
// mismas fuentes que /api/fantasy/live), partiendo del equipo GUARDADO del
// usuario — nunca de cifras del cliente. Server-only (usa @vercel/kv vía store).

import { buildMeta, getFixtureId, getCachedSnapshot, cacheSnapshot } from "@/lib/match-center/store";
import { fetchLiveSnapshots } from "@/lib/match-center/apiFootball";
import type { LiveSnapshot } from "@/lib/match-center/types";
import { getPlayerById } from "./players";
import { matchForFlag } from "./fixtures";
import { scoreGameweekLive, snapshotFinished, snapshotStarted } from "./scoring.live";
import { validateTeam, transferCost } from "./rules";
import { isValidGameweek } from "./fixtures";
import { isFantasyLive } from "./season";
import { recordGameweekScore, getGameweekScore } from "./store.server";
import type { FantasyTeamState } from "./types";

/** Ids de partido reales de la jornada en los que el equipo tiene jugadores. */
function teamMatchIds(team: FantasyTeamState, gw: number): number[] {
  const seen = new Set<number>();
  for (const s of team.slots) {
    if (!s.playerId) continue;
    const p = getPlayerById(s.playerId);
    if (!p) continue;
    const fix = matchForFlag(p.flag, gw);
    if (fix) seen.add(fix.match.i);
  }
  return [...seen];
}

/**
 * Descarga los snapshots reales de un conjunto de partidos. Mismo orden de
 * resolución que /api/fantasy/live (caché KV → fixture mapeado → api-football),
 * pero sin gate Pro porque aquí solo lo usa el servidor para puntuar al cierre.
 * Los partidos sin fixture mapeado simplemente no aportan snapshot (se puntúan
 * como "no jugó").
 */
async function fetchSnapshots(ids: number[]): Promise<Record<number, LiveSnapshot>> {
  const snapshots: Record<number, LiveSnapshot> = {};
  const misses: { matchId: number; fixtureId: number; meta: ReturnType<typeof buildMeta> }[] = [];

  for (const id of ids) {
    const meta = buildMeta(id);
    if (!meta) continue;
    const cached = await getCachedSnapshot(id);
    if (cached) {
      snapshots[id] = cached;
      continue;
    }
    const fixtureId = await getFixtureId(id);
    if (!fixtureId) continue; // sin fixture real → sin datos (no jugó)
    misses.push({ matchId: id, fixtureId, meta });
  }

  if (misses.length > 0) {
    try {
      const fetched = await fetchLiveSnapshots(
        misses.map((m) => ({ matchId: m.matchId, fixtureId: m.fixtureId, meta: m.meta! })),
      );
      for (const m of misses) {
        const snap = fetched[m.matchId];
        if (snap) {
          await cacheSnapshot(snap);
          snapshots[m.matchId] = snap;
        }
      }
    } catch {
      /* sin datos → se puntúa lo que haya en caché */
    }
  }
  return snapshots;
}

export interface ServerGameweekScore {
  gross: number; // puntos brutos calculados con datos REALES
  penalty: number; // penalización de fichajes (recalculada server-side)
  net: number; // gross − penalty (nunca negativo)
  anyStarted: boolean;
  allFinished: boolean; // todos los partidos del usuario terminaron (FT/AET/PEN)
  valid: boolean; // el equipo cumplía presupuesto/formación/tope por nación
}

/**
 * Puntúa la jornada `gw` del equipo `team` (el GUARDADO en el servidor) con datos
 * reales. Devuelve los puntos netos autoritativos. Si el equipo era inválido los
 * puntos brutos son 0 (no se premia una plantilla ilegal). La penalización de
 * fichajes se recalcula desde `committedSlots` del propio equipo guardado.
 */
export async function scoreGameweekFromState(
  team: FantasyTeamState,
  gw: number,
): Promise<ServerGameweekScore> {
  const ids = teamMatchIds(team, gw);
  const snapshots = await fetchSnapshots(ids);

  const relevant = ids.map((id) => snapshots[id]).filter(Boolean) as LiveSnapshot[];
  const anyStarted = relevant.some(snapshotStarted);
  const allFinished = relevant.length > 0 && relevant.every(snapshotFinished);

  // Congelado de capitán/vice/chip al saque (anti edición retroactiva): si la
  // jornada está bloqueada se puntúa con esos valores, no con los del estado vivo.
  // Las sustituciones de jugadores (slots) siguen contando: ese es el perk Pro.
  const lock = team.gwLock && team.gwLock.gw === gw ? team.gwLock : null;
  const captainId = lock ? lock.captainId : team.captainId;
  const viceId = lock ? lock.viceId : team.viceId;
  const powerUp = lock ? lock.powerUp : team.powerUp;

  const valid = validateTeam(team.slots, getPlayerById, team.formation, team.budgetBonus ?? 0).ok;
  const result = scoreGameweekLive(team.slots, captainId, viceId, powerUp, gw, snapshots);
  const gross = valid ? result.total : 0;

  const tc = transferCost(
    team.committedSlots ?? [],
    team.slots,
    team.freeTransfers ?? 0,
    powerUp === "comodin",
  );
  const net = Math.max(0, gross - tc.penalty);

  return { gross, penalty: tc.penalty, net, anyStarted, allFinished, valid };
}

/**
 * Total PROVISIONAL en vivo de la jornada en curso, server-authoritative. Puntúa
 * con datos reales y, si algún partido del usuario YA empezó, REGISTRA la
 * puntuación como provisional para que el header, el ranking global y las ligas
 * se muevan DURANTE la jornada (no hay que esperar a que termine la semana
 * entera para ver progreso). Es idempotente: la confirmación final (o la propia
 * siguiente visita, cuando ya acabaron todos los partidos) sobrescribe con el
 * mismo valor. NO paga Fútcoins: eso sigue gateado a jornada cerrada en
 * awardGameweekCoins/sweepPendingGameweekCoins. Best-effort: devuelve null si no
 * aplica (pretemporada, equipo incompleto, jornada sin empezar) o si algo falla,
 * sin romper nunca la carga del equipo.
 *
 * NUNCA BAJA un puntaje ya registrado de la MISMA jornada: dentro del cierre de
 * 3h por partido el score solo puede subir (los jugadores que ya jugaron quedan
 * bloqueados), así que un equipo degradado a media jornada — p. ej. tras un
 * "Reiniciar" por error — no debe borrar los puntos ya ganados. Conserva el
 * máximo. La confirmación final (recordGameweekScore directo) sigue mandando.
 */
export async function recordProvisionalGameweek(
  userId: string,
  team: FantasyTeamState,
): Promise<{ gw: number; points: number } | null> {
  const gw = team.gameweek;
  if (!isFantasyLive() || !isValidGameweek(gw)) return null;
  if (team.slots.filter((s) => s.playerId).length < 15) return null;
  try {
    const sc = await scoreGameweekFromState(team, gw);
    if (!sc.anyStarted) return null;
    const prevPts = await getGameweekScore(userId, gw);
    const best = prevPts != null ? Math.max(prevPts, sc.net) : sc.net;
    await recordGameweekScore(userId, gw, best, team.gwLock?.powerUp ?? team.powerUp ?? null);
    return { gw, points: best };
  } catch {
    return null;
  }
}

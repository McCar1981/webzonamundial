// src/lib/predictions/auto-result.ts
//
// Composición AUTOMÁTICA del resultado oficial (MatchResultReal) desde el feed
// real del Match Center (api-football). Cierra NP-03 de la auditoría 2026-06-10:
// hasta ahora el resultado había que entregarlo a mano a /api/predictions/resolve.
//
// Reglas duras heredadas de micro/live-picks: NUNCA componer desde simulación
// (solo snapshots mode:"live" con estado FT/AET/PEN). Si el feed llega sin un
// bloque (stats/ratings), esa categoría se OMITE y el scoring anula esas
// predicciones en neutro (FIX 9) en vez de pagarlas contra un falso cero.

import type { LiveSnapshot } from "@/lib/match-center/types";
import { fetchPlayerRatings } from "@/lib/match-center/apiFootball";
import { namesMatch } from "@/lib/fantasy/scoring.live";
import { getPlayerPool } from "@/lib/fantasy/players";
import type { FantasyPlayer } from "@/lib/fantasy/types";
import type { MatchEventReal, MatchResultReal } from "./types";
import { getMatchMeta } from "./match-data";

/** Estados api-football de partido terminado (mismo criterio que live-picks). */
const FINISHED_STATUSES = ["FT", "AET", "PEN"];

/** true solo si el snapshot es del feed REAL y el partido terminó. */
export function isFinishedRealSnapshot(snap: LiveSnapshot | null | undefined): snap is LiveSnapshot {
  return !!snap && snap.mode === "live" && FINISHED_STATUSES.includes(snap.status);
}

function poolOfSlug(slug: string | null): FantasyPlayer[] {
  if (!slug) return [];
  return getPlayerPool().filter((p) => p.teamSlug === slug);
}

/** id interno (pool) para un nombre del feed, solo si casa SIN ambigüedad. */
function poolIdByName(name: string | undefined, pool: FantasyPlayer[]): string | undefined {
  if (!name) return undefined;
  const hits = pool.filter((p) => namesMatch(p.name, name));
  return hits.length === 1 ? hits[0].id : undefined;
}

/** Mapea un snapshot real terminado al MatchResultReal que consume el scoring. */
export function composeResultFromSnapshot(matchId: string, snap: LiveSnapshot): MatchResultReal {
  const meta = getMatchMeta(matchId);
  const homePool = poolOfSlug(meta?.home_slug ?? null);
  const awayPool = poolOfSlug(meta?.away_slug ?? null);
  const poolOf = (side: "home" | "away") => (side === "home" ? homePool : awayPool);

  const events: MatchEventReal[] = [];
  let firstSub: number | undefined;

  for (const e of snap.events) {
    if (e.side !== "home" && e.side !== "away") continue;
    switch (e.type) {
      case "goal":
      case "penalty_goal": {
        const pid = poolIdByName(e.player, poolOf(e.side));
        const aid = poolIdByName(e.assist, poolOf(e.side));
        events.push({
          type: "goal",
          minute: e.minute,
          ...(e.extra ? { extra: e.extra } : {}),
          team: e.side,
          ...(pid ? { player_id: pid } : {}),
          ...(aid ? { assist_player_id: aid } : {}),
        });
        break;
      }
      case "own_goal":
        // api-football registra el autogol en el lado BENEFICIADO: cuenta para
        // marcador/cadena/franjas, pero sin goleador (nadie predice un autogol).
        events.push({ type: "goal", minute: e.minute, team: e.side, ...(e.extra ? { extra: e.extra } : {}) });
        break;
      case "yellow":
        events.push({ type: "card", card_type: "yellow", minute: e.minute, team: e.side, ...(e.extra ? { extra: e.extra } : {}) });
        break;
      case "red":
      case "second_yellow":
        events.push({ type: "card", card_type: "red", minute: e.minute, team: e.side, ...(e.extra ? { extra: e.extra } : {}) });
        break;
      case "sub":
        if (firstSub == null || e.minute < firstSub) firstSub = e.minute;
        break;
      default:
        break;
    }
  }

  // Si el feed no trajo bloque de estadísticas (todo a cero), se omiten las
  // categorías: el Over/Under de córners/tarjetas/tiros se anula en neutro
  // (FIX 9) en vez de resolverse contra un falso 0. El de goles usa el marcador.
  const s = snap.stats;
  const statsSum =
    s.shots[0] + s.shots[1] + s.shotsOn[0] + s.shotsOn[1] +
    s.corners[0] + s.corners[1] + s.yellow[0] + s.yellow[1] +
    s.red[0] + s.red[1] + s.saves[0] + s.saves[1] + s.passes[0] + s.passes[1];
  const stats = (statsSum > 0
    ? {
        corners: { home: s.corners[0], away: s.corners[1] },
        cards: { home: s.yellow[0] + s.red[0], away: s.yellow[1] + s.red[1] },
        shots_on_target: { home: s.shotsOn[0], away: s.shotsOn[1] },
      }
    : {}) as MatchResultReal["stats"];

  return {
    score: { home: snap.score[0], away: snap.score[1] },
    events,
    stats,
    player_ratings: {},
    ...(firstSub != null ? { first_sub_minute: firstSub } : {}),
  };
}

/**
 * Ratings reales del partido mapeados a ids del pool (resuelve los duelos).
 * Matchea contra AMBAS plantillas: un nombre ambiguo (dos jugadores que casan)
 * se descarta antes que arriesgar un duelo mal pagado. {} si la API no los da.
 */
export async function ratingsForMatch(matchId: string, fixtureId: number): Promise<Record<string, number>> {
  const meta = getMatchMeta(matchId);
  const pool = [...poolOfSlug(meta?.home_slug ?? null), ...poolOfSlug(meta?.away_slug ?? null)];
  if (pool.length === 0) return {};
  const rated = await fetchPlayerRatings(fixtureId);
  const out: Record<string, number> = {};
  for (const r of rated) {
    const id = poolIdByName(r.name, pool);
    if (id && out[id] == null) out[id] = r.rating;
  }
  return out;
}

// src/lib/fantasy/fixtures.ts
//
// Puente entre las JORNADAS del Fantasy (1..7) y los PARTIDOS REALES del Mundial
// (src/data/matches.ts). Permite, dado el equipo del usuario, saber qué partidos
// reales hay que mirar en una jornada y en qué lado (local/visitante) juega cada
// selección. Es la base de la puntuación en vivo (Fase 3): la simulación queda
// solo para la pretemporada/preview.

import { MATCHES, type Match } from "@/data/matches";
import { SELECCIONES } from "@/data/selecciones";
import { etToDate } from "@/lib/bracket/match-time";
import type { MatchTier } from "./types";

/**
 * Mapeo Jornada Fantasy → ronda real. El Mundial 2026 tiene 8 jornadas Fantasy:
 * la fase de grupos (jornadas 1-3, por el campo `j`) y 5 rondas eliminatorias
 * (jornadas 4-8, por la fase `p`). La jornada 8 agrupa el Tercer puesto y la
 * FINAL en la misma ventana, para que los semifinalistas eliminados también
 * puntúen su último partido. En eliminatorias los equipos figuran como "tbd"
 * hasta que el cuadro se completa, así que la resolución por bandera devolverá
 * null hasta entonces (la jornada mostrará "por comenzar").
 */
const GW_TO_ROUND: Record<number, { jornada?: number; phases?: string[] }> = {
  1: { jornada: 1 },
  2: { jornada: 2 },
  3: { jornada: 3 },
  4: { phases: ["Dieciseisavos"] },
  5: { phases: ["Octavos de final"] },
  6: { phases: ["Cuartos de final"] },
  7: { phases: ["Semifinal"] },
  8: { phases: ["Tercer puesto", "FINAL"] },
};

/** Partidos reales que componen una jornada del Fantasy. */
export function gameweekMatches(gw: number): Match[] {
  const round = GW_TO_ROUND[gw];
  if (!round) return [];
  if (round.jornada != null) {
    return MATCHES.filter((m) => m.p === "Fase de grupos" && m.j === round.jornada);
  }
  const phases = new Set(round.phases ?? []);
  return MATCHES.filter((m) => phases.has(m.p));
}

/** Número total de jornadas Fantasy del torneo (grupos 1-3 + eliminatorias 4-8). */
export const TOTAL_GAMEWEEKS = 8;

/** ¿Es `gw` una jornada real del torneo? Bloquea valores fabricados (anti-faucet). */
export function isValidGameweek(gw: number): boolean {
  return Number.isInteger(gw) && gw >= 1 && gw <= TOTAL_GAMEWEEKS;
}

/**
 * ¿La jornada `gw` ya se disputó por completo? Es cobrable solo cuando su último
 * partido real quedó atrás (al menos el día siguiente, en UTC), de modo que NUNCA
 * se pagan Fútcoins por la simulación de pretemporada ni por jornadas futuras.
 * Las fechas `d` son ISO (YYYY-MM-DD), así que la comparación de cadenas basta.
 */
export function gameweekIsOver(gw: number, ref: Date = new Date()): boolean {
  if (!isValidGameweek(gw)) return false;
  const matches = gameweekMatches(gw);
  if (matches.length === 0) return false;
  let last = "";
  for (const m of matches) if (m.d > last) last = m.d;
  return ref.toISOString().slice(0, 10) > last;
}

/** Kickoff del primer partido real de la jornada (null si no resoluble). */
export function gameweekFirstKickoff(gw: number): Date | null {
  let first: Date | null = null;
  for (const m of gameweekMatches(gw)) {
    const k = etToDate(m.d, m.t);
    if (k && (!first || k < first)) first = k;
  }
  return first;
}

/**
 * Bloqueo del plan Free: la plantilla se congela desde `lockHours` horas antes
 * del primer kickoff de la jornada hasta que la jornada termina (Pro hace
 * sustituciones en vivo). Si el calendario no es resoluble, no bloquea.
 */
export function gameweekLockedForFree(gw: number, lockHours: number, ref: Date = new Date()): boolean {
  if (!isValidGameweek(gw)) return false;
  if (gameweekIsOver(gw, ref)) return false;
  const first = gameweekFirstKickoff(gw);
  if (!first) return false;
  return ref.getTime() >= first.getTime() - lockHours * 3_600_000;
}

/** Partido (y lado) de una selección, por código de bandera, en una jornada. */
export function matchForFlag(flag: string, gw: number): { match: Match; side: "home" | "away" } | null {
  if (!flag || flag === "tbd") return null;
  for (const m of gameweekMatches(gw)) {
    if (m.hf === flag) return { match: m, side: "home" };
    if (m.af === flag) return { match: m, side: "away" };
  }
  return null;
}

const RANK_BY_FLAG: Map<string, number> = new Map(
  SELECCIONES.map((s) => [s.flagCode, s.rankingFIFA ?? 90]),
);

// ---- Multiplicador "Modo Underdog" del partido real (por diferencia de ranking
// FIFA entre los dos contendientes). Mismas franjas que el preview de players.ts.
function tierFromGap(gap: number): MatchTier {
  if (gap >= 75) return { multiplier: 2.0, label: "Diamante", emoji: "💎", color: "#67e8f9" };
  if (gap >= 40) return { multiplier: 1.5, label: "Oro", emoji: "🟡", color: "#fbbf24" };
  if (gap >= 15) return { multiplier: 1.25, label: "Bronce", emoji: "🟠", color: "#fb923c" };
  return { multiplier: 1.0, label: "Estelar", emoji: "🟢", color: "#4ade80" };
}

/** Tier "Modo Underdog" de un partido real según la diferencia de ranking. */
export function matchTier(m: Match): MatchTier {
  const a = RANK_BY_FLAG.get(m.hf) ?? 90;
  const b = RANK_BY_FLAG.get(m.af) ?? 90;
  return tierFromGap(Math.abs(a - b));
}

/** Ids de partido únicos a observar para un conjunto de banderas en la jornada. */
export function matchIdsForFlags(flags: string[], gw: number): number[] {
  const ids = new Set<number>();
  for (const f of flags) {
    const r = matchForFlag(f, gw);
    if (r) ids.add(r.match.i);
  }
  return [...ids];
}

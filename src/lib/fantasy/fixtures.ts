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
 * ¿La jornada `gw` es de ELIMINATORIAS (16avos en adelante)? En cada ronda KO cae
 * la mitad de las selecciones, así que muchos jugadores quedan eliminados y TODOS
 * deben reconstruir. Por eso las jornadas de eliminatorias llevan "wildcard de
 * transición": los fichajes van SIN penalización (nadie paga por reemplazar a
 * quien fue eliminado, que no es culpa suya). En grupos (J1-3) la penalización de
 * fichajes normal sí aplica (mismo pool, cambios opcionales).
 */
export function isKnockoutGameweek(gw: number): boolean {
  const round = GW_TO_ROUND[gw];
  return !!round && round.phases != null;
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
 * Kickoff del ÚLTIMO partido real de la jornada (null si no resoluble). Importa
 * para las jornadas que agrupan varios partidos en días distintos: la J8 junta
 * "Tercer puesto" (día previo) y "FINAL" (día siguiente). El cierre de la
 * plantilla debe medirse contra el ÚLTIMO partido (la FINAL), no contra el
 * primero, para no congelar la alineación de la FINAL por el saque del 3.º puesto.
 */
export function gameweekLastKickoff(gw: number): Date | null {
  let last: Date | null = null;
  for (const m of gameweekMatches(gw)) {
    const k = etToDate(m.d, m.t);
    if (k && (!last || k > last)) last = k;
  }
  return last;
}

/**
 * Jornada Fantasy VIGENTE del torneo según el calendario real: la mayor jornada
 * cuyo primer partido ya empezó. Sirve para AUTO-AVANZAR a los usuarios que se
 * quedaron en una jornada antigua (el avance manual por "Confirmar" dejaba a casi
 * todos atascados). Antes del pitido inicial devuelve 1; con el torneo acabado,
 * TOTAL_GAMEWEEKS.
 */
export function currentGameweek(ref: Date = new Date()): number {
  let cur = 1;
  for (let gw = 1; gw <= TOTAL_GAMEWEEKS; gw++) {
    const first = gameweekFirstKickoff(gw);
    if (first && ref.getTime() >= first.getTime()) cur = gw;
  }
  return cur;
}

/**
 * Bloqueo del plan Free: la plantilla se congela desde `lockHours` horas antes
 * del ÚLTIMO kickoff de la jornada hasta que la jornada termina (Pro hace
 * sustituciones en vivo). Se ancla al ÚLTIMO partido —no al primero— para que
 * una jornada con partidos en días distintos (J8: Tercer puesto + FINAL) siga
 * siendo editable hasta el saque de su último partido: así el fichaje de cara a
 * la FINAL no queda cerrado por el saque del 3.º puesto del día anterior. El
 * anti-retrovisor por jugador ya jugado lo garantiza el cierre por partido de 3h
 * (playerMatchLocked), autoritativo para todos los planes. Si el calendario no es
 * resoluble, no bloquea.
 */
export function gameweekLockedForFree(gw: number, lockHours: number, ref: Date = new Date()): boolean {
  if (!isValidGameweek(gw)) return false;
  if (gameweekIsOver(gw, ref)) return false;
  const last = gameweekLastKickoff(gw);
  if (!last) return false;
  return ref.getTime() >= last.getTime() - lockHours * 3_600_000;
}

/**
 * Jornada Fantasy a PREPARAR: la primera que aún NO ha terminado (o la última del
 * torneo). A diferencia de currentGameweek() —que solo avanza cuando el primer
 * saque de la jornada ya pasó— ésta alcanza la jornada entrante en cuanto la
 * anterior queda "over", ANTES de su kickoff. Con esto el auto-avance deposita al
 * usuario sobre la jornada entrante con días de antelación, dándole ventana real
 * para armar/fichar su equipo antes de que empiece (currentGameweek lo dejaba
 * aterrizar justo cuando la jornada ya había arrancado). Antes del torneo → 1.
 */
export function preparableGameweek(ref: Date = new Date()): number {
  for (let gw = 1; gw <= TOTAL_GAMEWEEKS; gw++) {
    if (!gameweekIsOver(gw, ref)) return gw;
  }
  return TOTAL_GAMEWEEKS;
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

/** Horas antes del saque en que un jugador queda CERRADO (ni entra ni sale). */
export const MATCH_LOCK_HOURS = 3;

/**
 * Cierre por partido: ¿está cerrado el jugador de la selección `flag` en la
 * jornada `gw`? Un jugador queda CONGELADO desde MATCH_LOCK_HOURS horas antes
 * del saque de SU partido y ya no se libera en esa jornada (durante el partido
 * y tras el pitido final sigue cerrado): ni entra, ni sale, ni se mueve entre
 * campo y banquillo. Al confirmar la jornada el equipo avanza y el candado se
 * abre solo (los partidos de la siguiente aún no llegaron). Sin partido
 * resoluble (KO con "tbd" o selección ya eliminada) no hay candado.
 */
export function playerMatchLocked(flag: string, gw: number, ref: Date = new Date()): boolean {
  const fix = matchForFlag(flag, gw);
  if (!fix) return false;
  const k = etToDate(fix.match.d, fix.match.t);
  if (!k) return false;
  return ref.getTime() >= k.getTime() - MATCH_LOCK_HOURS * 3_600_000;
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

// src/lib/modo-carrera/suspensions.ts
//
// SANCIONES POR TARJETAS (lógica pura, sin React ni servidor). En el fútbol de
// selecciones la otra "baja forzada" del DT, junto a las lesiones, es la sanción:
// una roja directa o la acumulación de amarillas dejan a un titular fuera del
// próximo partido. Mismo efecto que una lesión —pierdes fuerza en su zona— pero
// con otra causa y narrativa.
//
// Modelo honesto y simétrico al de lesiones:
//   · Tras un partido hay una probabilidad de que un jugador vea roja o complete
//     ciclo de amarillas y quede sancionado.
//   · Mientras cumple sanción, resta fuerza al ATAQUE o la DEFENSA según su pos.
//   · Cada partido jugado descuenta una fecha de sanción; al llegar a 0, vuelve.
//
// Todo inmutable: las funciones devuelven datos nuevos, no mutan el estado.

import type { CareerState, Injury, Suspension } from "./types";
import { FANTASY_ROSTERS, type RosterPlayer } from "@/data/fantasy-rosters";
import { activeInjuries } from "./injuries";

/** Probabilidad de que se produzca una sanción tras un partido. */
export const SUSPENSION_CHANCE = 0.16;

/** Penalización de fuerza por sancionado (idéntica a la de una lesión: no juega). */
const PENALTY_PER_SUSPENSION = 3.5;

/** Sanciones activas del estado (tolera saves sin el campo). */
export function activeSuspensions(c: CareerState): Suspension[] {
  return c.squad?.suspensions ?? [];
}

/**
 * Penalización de fuerza por las sanciones activas, separada en ataque y defensa
 * según la posición del sancionado (FWD/MID → ataque; DEF/GK → defensa).
 */
export function suspensionPenalty(c: CareerState): { atk: number; def: number } {
  let atk = 0;
  let def = 0;
  for (const s of activeSuspensions(c)) {
    if (s.pos === "FWD" || s.pos === "MID") atk += PENALTY_PER_SUSPENSION;
    else def += PENALTY_PER_SUSPENSION;
  }
  return { atk, def };
}

/** Descuenta una fecha a cada sanción y descarta las ya cumplidas. */
export function tickSuspensions(suspensions: Suspension[]): Suspension[] {
  return suspensions
    .map((s) => ({ ...s, matchesOut: s.matchesOut - 1 }))
    .filter((s) => s.matchesOut > 0);
}

/**
 * Tira por una posible sanción de un jugador de la selección del DT. Devuelve la
 * nueva sanción o null. Excluye a quienes ya están lesionados o sancionados para
 * no acumular dos bajas sobre el mismo jugador. La roja directa (más rara) cuesta
 * 2 fechas; la acumulación de amarillas (lo habitual), 1.
 */
export function rollSuspension(c: CareerState, current: Suspension[]): Suspension | null {
  if (Math.random() >= SUSPENSION_CHANCE) return null;
  const roster: RosterPlayer[] = FANTASY_ROSTERS[c.identity.nationSlug ?? ""] ?? [];
  if (roster.length === 0) return null;

  const unavailable = new Set<string>([
    ...current.map((s) => s.player),
    ...activeInjuries(c).map((i: Injury) => i.player),
  ]);
  const pool = roster.filter((p) => !unavailable.has(p.name));
  if (pool.length === 0) return null;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  // 1 de cada 4 sanciones es roja directa (2 fechas); el resto, ciclo de amarillas.
  const roja = Math.random() < 0.25;
  return {
    player: pick.name,
    pos: pick.pos,
    matchesOut: roja ? 2 : 1,
    reason: roja ? "roja" : "amarillas",
  };
}

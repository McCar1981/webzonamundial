// src/lib/modo-carrera/injuries.ts
//
// LESIONES del plantel (lógica pura, sin React ni servidor). En el fútbol de
// selecciones las lesiones son la única "rotación forzada" real del DT: un titular
// cae, pierdes fuerza en su zona y debes apañártelas hasta que se recupera.
//
// Modelo simple y honesto:
//   · Tras un partido hay una probabilidad de que un jugador clave se lesione.
//   · Mientras está de baja, resta fuerza al ATAQUE o la DEFENSA según su posición.
//   · Cada partido jugado descuenta un partido de baja; al llegar a 0, vuelve.
//
// Todo inmutable: las funciones devuelven datos nuevos, no mutan el estado.

import type { CareerState, Injury } from "./types";
import { FANTASY_ROSTERS, type RosterPlayer } from "@/data/fantasy-rosters";

/**
 * Probabilidad de que ocurra una lesión tras un partido. Calibrada junto a la de
 * sanción (suspensions.ts): antes 0.22 + 0.16 hacían que ~1 de cada 3 partidos
 * dejara una baja nueva y el plantel viviera crónicamente mermado.
 */
export const INJURY_CHANCE = 0.12;

/** Baja mínima y máxima (en partidos) de una lesión. */
const MIN_OUT = 1;
const MAX_OUT = 3;

/** Penalización de fuerza por jugador lesionado (atacante o defensor). */
const PENALTY_PER_INJURY = 3.5;

/** Lesiones activas del estado (tolera saves sin el campo squad). */
export function activeInjuries(c: CareerState): Injury[] {
  return c.squad?.injuries ?? [];
}

/**
 * Penalización de fuerza por las lesiones activas, separada en ataque y defensa
 * según la posición del lesionado (FWD/MID → ataque; DEF/GK → defensa).
 */
export function injuryPenalty(c: CareerState): { atk: number; def: number } {
  let atk = 0;
  let def = 0;
  for (const inj of activeInjuries(c)) {
    if (inj.pos === "FWD" || inj.pos === "MID") atk += PENALTY_PER_INJURY;
    else def += PENALTY_PER_INJURY;
  }
  return { atk, def };
}

/** Descuenta un partido a cada lesión y descarta las ya recuperadas. */
export function tickInjuries(injuries: Injury[]): Injury[] {
  return injuries
    .map((i) => ({ ...i, matchesOut: i.matchesOut - 1 }))
    .filter((i) => i.matchesOut > 0);
}

/**
 * Tira por una posible lesión de un jugador de la selección del DT. Devuelve la
 * nueva lesión o null (sin lesión, o no hay roster, o el elegido ya está de baja).
 * No usa rng inyectable a propósito: igual que el modelo de goles (Poisson), la
 * aleatoriedad vive en el motor y el resultado se persiste en el estado.
 */
export function rollInjury(c: CareerState, current: Injury[]): Injury | null {
  if (Math.random() >= INJURY_CHANCE) return null;
  const roster: RosterPlayer[] = FANTASY_ROSTERS[c.identity.nationSlug ?? ""] ?? [];
  if (roster.length === 0) return null;

  const injuredNames = new Set(current.map((i) => i.player));
  // Los jugadores de campo (no porteros) tienen más peso: son los que más juegan.
  const pool = roster.filter((p) => !injuredNames.has(p.name));
  if (pool.length === 0) return null;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  const matchesOut = MIN_OUT + Math.floor(Math.random() * (MAX_OUT - MIN_OUT + 1));
  return { player: pick.name, pos: pick.pos, matchesOut };
}

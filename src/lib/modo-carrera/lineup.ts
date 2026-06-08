// src/lib/modo-carrera/lineup.ts
//
// ALINEACIÓN Y FORMACIÓN PERSONALIZADAS (decisión real del DT, estilo FIFA). El
// DT elige un DIBUJO (4-4-2, 4-3-3, 5-3-2…) y el ONCE TITULAR de entre los 26
// convocados. Ambas cosas afectan la CALIDAD REAL del equipo en el partido:
//   · La formación aporta un sesgo de ataque/defensa (atkTilt/defTilt).
//   · El once aporta un delta de calidad: si dejas a tus mejores en el banco,
//     el equipo rinde por debajo de su techo.
//
// Como los rosters oficiales solo traen nombre+club (sin rating), la valoración
// de cada jugador se DEDUCE del prestigio de su club + una pequeña varianza
// determinista por nombre. No es un dato oficial: es una aproximación jugable.

import type { CareerState } from "./types";
import { FANTASY_ROSTERS, type RosterPlayer } from "@/data/fantasy-rosters";
import type { FantasyPos } from "@/lib/fantasy/types";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ─── Valoración deducida del jugador (0-99) ──────────────────────────────────
// Clubes de élite europea → base alta; clubes fuertes → media; resto → baja.
const ELITE_CLUBS = [
  "real madrid", "barcelona", "manchester city", "liverpool", "bayern", "psg",
  "paris", "arsenal", "inter", "internazionale", "milan", "juventus", "chelsea",
  "manchester united", "atlético", "atletico", "napoli", "tottenham",
  "borussia dortmund", "bayer leverkusen", "newcastle",
];
const STRONG_CLUBS = [
  "aston villa", "roma", "lazio", "sevilla", "villarreal", "real sociedad",
  "athletic", "benfica", "porto", "sporting", "ajax", "psv", "feyenoord",
  "marsella", "lyon", "mónaco", "monaco", "brighton", "west ham", "leipzig",
  "frankfurt", "stuttgart", "fiorentina", "atalanta", "galatasaray",
  "fenerbahçe", "fenerbahce", "celtic", "rangers", "betis", "wolverhampton",
  "crystal palace", "brentford", "everton", "bournemouth", "nottingham",
  "lafc", "inter miami",
];

function clubTier(club: string): number {
  const c = club.toLowerCase();
  if (ELITE_CLUBS.some((e) => c.includes(e))) return 87;
  if (STRONG_CLUBS.some((e) => c.includes(e))) return 79;
  return 71;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Valoración jugable del jugador (58-93), determinista por club+nombre. */
export function playerRating(p: RosterPlayer): number {
  const variance = (hashStr(p.name) % 9) - 4; // -4..+4
  return clamp(clubTier(p.club) + variance, 58, 93);
}

// ─── Formaciones (dibujo táctico) ────────────────────────────────────────────
export interface Formation {
  id: string;
  name: string;
  /** Plazas de campo por línea (el portero es siempre 1, implícito). */
  def: number;
  mid: number;
  fwd: number;
  /** Sesgo que el dibujo añade al ataque y a la defensa del equipo. */
  atkTilt: number;
  defTilt: number;
  /** Descripción corta del enfoque del dibujo. */
  hint: string;
}

export const FORMATIONS: Formation[] = [
  { id: "4-4-2", name: "4-4-2", def: 4, mid: 4, fwd: 2, atkTilt: 0, defTilt: 0, hint: "Clásico equilibrado. Dos puntas, sin fisuras." },
  { id: "4-3-3", name: "4-3-3", def: 4, mid: 3, fwd: 3, atkTilt: 3, defTilt: -2, hint: "Tridente arriba. Más peligro, más expuesto." },
  { id: "4-2-3-1", name: "4-2-3-1", def: 4, mid: 5, fwd: 1, atkTilt: 1, defTilt: 1, hint: "Control del medio. Dominio y orden." },
  { id: "3-5-2", name: "3-5-2", def: 3, mid: 5, fwd: 2, atkTilt: 2, defTilt: -1, hint: "Carrileros largos. Mucha gente en el medio." },
  { id: "5-3-2", name: "5-3-2", def: 5, mid: 3, fwd: 2, atkTilt: -2, defTilt: 3, hint: "Bloque bajo. Sufres poco, generas menos." },
  { id: "5-4-1", name: "5-4-1", def: 5, mid: 4, fwd: 1, atkTilt: -3, defTilt: 4, hint: "Muro total. Para resistir a un gigante." },
];

export function formationById(id?: string | null): Formation {
  return FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[0];
}

/** Plazas requeridas por posición para un dibujo dado. */
export function slotsFor(f: Formation): Record<FantasyPos, number> {
  return { GK: 1, DEF: f.def, MID: f.mid, FWD: f.fwd };
}

// ─── Once titular ────────────────────────────────────────────────────────────
/** Mejor once posible para un dibujo: los de mayor valoración por línea. */
export function bestXI(roster: RosterPlayer[], f: Formation): RosterPlayer[] {
  const used = new Set<string>();
  const take = (pos: FantasyPos, n: number) => {
    const picks = roster
      .filter((p) => p.pos === pos && !used.has(p.name))
      .sort((a, b) => playerRating(b) - playerRating(a))
      .slice(0, n);
    picks.forEach((p) => used.add(p.name));
    return picks;
  };
  const slots = slotsFor(f);
  const xi = [...take("GK", slots.GK), ...take("DEF", slots.DEF), ...take("MID", slots.MID), ...take("FWD", slots.FWD)];
  // Roster sin suficientes de una línea: se rellena con los mejores disponibles.
  if (xi.length < 11) {
    const rest = roster.filter((p) => !used.has(p.name)).sort((a, b) => playerRating(b) - playerRating(a));
    xi.push(...rest.slice(0, 11 - xi.length));
  }
  return xi;
}

/** Once por defecto (nombres) para inicializar el editor. */
export function defaultLineup(roster: RosterPlayer[], f: Formation): string[] {
  return bestXI(roster, f).map((p) => p.name);
}

/** Resuelve una lista de nombres a jugadores reales del roster (dedupe, en orden). */
export function resolveLineup(names: string[], roster: RosterPlayer[]): RosterPlayer[] {
  const byName = new Map(roster.map((p) => [p.name, p]));
  const out: RosterPlayer[] = [];
  const seen = new Set<string>();
  for (const n of names) {
    const p = byName.get(n);
    if (p && !seen.has(n)) {
      out.push(p);
      seen.add(n);
    }
  }
  return out;
}

/** Valoración media de un once. */
export function xiRating(players: RosterPlayer[]): number {
  if (!players.length) return 0;
  return players.reduce((s, p) => s + playerRating(p), 0) / players.length;
}

/** ¿La alineación cumple el dibujo (11 jugadores, plazas exactas por línea)? */
export function lineupValid(names: string[], roster: RosterPlayer[], f: Formation): boolean {
  const players = resolveLineup(names, roster);
  if (players.length !== 11) return false;
  const slots = slotsFor(f);
  const count: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of players) count[p.pos]++;
  return (["GK", "DEF", "MID", "FWD"] as FantasyPos[]).every((pos) => count[pos] === slots[pos]);
}

// ─── Aporte de la alineación a la fuerza del equipo ───────────────────────────
/**
 * Delta de ataque/defensa que produce el dibujo + el once elegidos. La formación
 * aporta su sesgo; el once aporta un delta de calidad RELATIVO a tu mejor once
 * posible para ese dibujo: alinear a tus cracks ≈ techo; dejarlos en el banco
 * resta de verdad. Si no hay alineación guardada se asume el mejor once (sin
 * penalización) → totalmente compatible con partidas antiguas.
 */
export function squadBonus(c: CareerState): { atk: number; def: number } {
  const roster = FANTASY_ROSTERS[c.identity.nationSlug ?? ""] ?? [];
  const f = formationById(c.squad?.formation);
  if (roster.length < 11) return { atk: f.atkTilt, def: f.defTilt };
  const bestRating = xiRating(bestXI(roster, f));
  const names = c.squad?.lineup ?? [];
  const chosen = resolveLineup(names, roster);
  const chosenRating = lineupValid(names, roster, f) ? xiRating(chosen) : bestRating;
  const delta = clamp((chosenRating - bestRating) * 0.9, -12, 0);
  return { atk: delta + f.atkTilt, def: delta + f.defTilt };
}

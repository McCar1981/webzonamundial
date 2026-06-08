// src/lib/modo-carrera/concentracion.ts
//
// CONCENTRACIÓN: preparación física y entrenamiento ENTRE PARTIDO Y PARTIDO. Es
// la dinámica de gestión que el DT vive en la semana previa a cada encuentro, tal
// y como ocurre en una selección real: se concentra al grupo y se decide en qué
// trabajar. No hay mercado ni fichajes (es fútbol de selecciones); lo que el DT
// controla es CÓMO llega su equipo al partido.
//
// Modelo (honesto y jugable):
//   · El DT elige 3 SESIONES de entre 5 tipos para la semana de concentración.
//   · Cada sesión aporta un delta de ATAQUE/DEFENSA al próximo partido y mueve la
//     FRESCURA del grupo (recurso 0-100 que se arrastra de un partido al otro).
//   · La frescura, además, modula el rendimiento: llegar fundido resta; llegar
//     enchufado suma. Cada partido jugado desgasta; la sesión de recuperación carga.
//   · Las sesiones físicas exigen y conllevan un pequeño RIESGO DE LESIÓN.
//
// Todo inmutable: las funciones devuelven datos nuevos, no mutan el estado.

import type { CareerState, Injury } from "./types";
import { availableRoster } from "./lineup";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ─── Recurso: Frescura ───────────────────────────────────────────────────────
/** Frescura de partida (saves antiguos sin el campo). Punto neutro del modelo. */
export const FRESCURA_START = 75;
/** Desgaste fijo que un partido oficial deja en las piernas del grupo. */
export const MATCH_FATIGUE = 16;

/** Frescura actual del grupo (0-100). Tolera saves sin el campo. */
export function getFrescura(c: CareerState): number {
  const f = c.squad?.frescura;
  return typeof f === "number" ? clamp(f, 0, 100) : FRESCURA_START;
}

// ─── Catálogo de sesiones ────────────────────────────────────────────────────
export type PrepSessionId = "fisico" | "tactico" | "balon_parado" | "analisis" | "recuperacion";

export interface PrepSession {
  id: PrepSessionId;
  name: string;
  hint: string;
  /** Delta de fuerza al ataque y a la defensa del próximo partido. */
  atk: number;
  def: number;
  /** Variación de frescura que deja la sesión (negativa = desgasta). */
  fres: number;
  /** Empuje anímico (moral) que aporta la sesión. */
  morale: number;
  /** Riesgo de lesión por sesión (0-1). Las físicas exigen y arriesgan. */
  injuryRisk: number;
}

/** Número de sesiones que componen la semana de concentración. */
export const SESSIONS_PER_WEEK = 3;

export const PREP_SESSIONS: PrepSession[] = [
  {
    id: "fisico",
    name: "Trabajo físico",
    hint: "Doble sesión de intensidad. Llegas más fuerte, pero desgasta y arriesga lesiones.",
    atk: 0.9,
    def: 0.9,
    fres: -10,
    morale: 0,
    injuryRisk: 0.08,
  },
  {
    id: "tactico",
    name: "Pizarra táctica",
    hint: "Ensayo de movimientos y presión. Mejora la puesta en escena del equipo.",
    atk: 1.2,
    def: 0.7,
    fres: -4,
    morale: 1,
    injuryRisk: 0.01,
  },
  {
    id: "balon_parado",
    name: "Balón parado",
    hint: "Estrategia ensayada a balón parado: un gol más desde la jugada preparada.",
    atk: 1.7,
    def: 0.3,
    fres: -3,
    morale: 0,
    injuryRisk: 0.01,
  },
  {
    id: "analisis",
    name: "Análisis del rival",
    hint: "Estudio del adversario: el equipo sabe dónde hacer daño y dónde protegerse.",
    atk: 0.4,
    def: 1.7,
    fres: -3,
    morale: 0,
    injuryRisk: 0,
  },
  {
    id: "recuperacion",
    name: "Recuperación",
    hint: "Descanso y regeneración: recargas frescura y ánimo, pero no afilas nada.",
    atk: -0.2,
    def: -0.2,
    fres: 14,
    morale: 2,
    injuryRisk: 0,
  },
];

export function prepSessionById(id: string): PrepSession | undefined {
  return PREP_SESSIONS.find((s) => s.id === id);
}

/** Sesiones elegidas para el próximo partido (vacío = sin concentración hecha). */
export function getPrepSessions(c: CareerState): PrepSessionId[] {
  return (c.squad?.prep?.sessions ?? []).filter((s): s is PrepSessionId => !!prepSessionById(s));
}

// ─── Aporte de la concentración a la fuerza del equipo ────────────────────────
/** Factor de la frescura sobre el rendimiento (puntos de fuerza, atk y def). */
function frescuraFactor(frescura: number): number {
  // 100 → +2.5 (enchufado); 75 → 0 (neutro); 0 → -8 (fundido).
  return clamp((frescura - FRESCURA_START) * 0.1, -8, 2.5);
}

/**
 * Delta de ataque/defensa que el DT lleva al PRÓXIMO partido por su semana de
 * concentración: la suma de las sesiones elegidas + el efecto de la frescura
 * actual. Se pliega en attackDefense() igual que el squadBonus de la alineación.
 * Sin concentración hecha, solo cuenta la frescura (saves antiguos → ~neutro).
 */
export function concentracionBonus(c: CareerState): { atk: number; def: number } {
  let atk = 0;
  let def = 0;
  for (const id of getPrepSessions(c)) {
    const s = prepSessionById(id);
    if (!s) continue;
    atk += s.atk;
    def += s.def;
  }
  const ff = frescuraFactor(getFrescura(c));
  return { atk: atk + ff, def: def + ff };
}

// ─── Vista previa para la pantalla de concentración ───────────────────────────
export interface PrepPreview {
  atk: number;
  def: number;
  morale: number;
  frescuraNow: number;
  /** Frescura con la que arrancará la SIGUIENTE semana (tras jugar este partido). */
  frescuraNext: number;
  /** Riesgo combinado de una lesión en la semana (0-1). */
  injuryRisk: number;
}

/** Calcula el efecto de una combinación de sesiones (para previsualizar en la UI). */
export function previewPrep(c: CareerState, sessions: PrepSessionId[]): PrepPreview {
  const now = getFrescura(c);
  let atk = 0;
  let def = 0;
  let morale = 0;
  let fresDelta = 0;
  let stay = 1; // prob. de NO lesionarse en toda la semana
  for (const id of sessions) {
    const s = prepSessionById(id);
    if (!s) continue;
    atk += s.atk;
    def += s.def;
    morale += s.morale;
    fresDelta += s.fres;
    stay *= 1 - s.injuryRisk;
  }
  const ff = frescuraFactor(now);
  const frescuraNext = clamp(now + fresDelta - MATCH_FATIGUE, 0, 100);
  return {
    atk: atk + ff,
    def: def + ff,
    morale,
    frescuraNow: now,
    frescuraNext,
    injuryRisk: 1 - stay,
  };
}

// ─── Riesgo de lesión en el entrenamiento ────────────────────────────────────
/**
 * Tira por una lesión de entrenamiento según las sesiones elegidas (las físicas
 * exigen). Devuelve la nueva baja o null. Se resuelve al CONFIRMAR la semana para
 * que el DT la vea en el parte médico antes del partido.
 */
export function rollTrainingInjury(c: CareerState, sessions: PrepSessionId[], current: Injury[]): Injury | null {
  let stay = 1;
  for (const id of sessions) stay *= 1 - (prepSessionById(id)?.injuryRisk ?? 0);
  if (Math.random() >= 1 - stay) return null;

  const injuredNames = new Set(current.map((i) => i.player));
  const pool = availableRoster(c).filter((p) => !injuredNames.has(p.name));
  if (pool.length === 0) return null;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { player: pick.name, pos: pick.pos, matchesOut: 1 };
}

// ─── Cierre de la semana tras el partido ──────────────────────────────────────
/**
 * Frescura con la que se arranca la siguiente semana tras jugar: la actual más el
 * saldo de las sesiones de la semana menos el desgaste del partido. Se llama al
 * resolver el partido; al hacerlo, la concentración elegida se da por consumida.
 */
export function frescuraAfterMatch(c: CareerState): number {
  let fresDelta = 0;
  for (const id of getPrepSessions(c)) fresDelta += prepSessionById(id)?.fres ?? 0;
  return clamp(getFrescura(c) + fresDelta - MATCH_FATIGUE, 0, 100);
}

/** Empuje anímico total que aportan las sesiones de la semana (para la moral). */
export function prepMorale(c: CareerState): number {
  let morale = 0;
  for (const id of getPrepSessions(c)) morale += prepSessionById(id)?.morale ?? 0;
  return morale;
}

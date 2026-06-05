// src/lib/modo-carrera/engine.ts
//
// Motor de PROGRESIÓN del Modo Carrera (lógica pura, sin deps de servidor ni de
// React). Centraliza dos reglas del juego:
//   1. Ganar XP → subir de nivel (overall +1 y +1 punto de habilidad por nivel).
//   2. Gastar puntos en el árbol de habilidades → sube la rama y un stat de
//      reputación asociado (sin tocar el overall, que solo crece con la XP).
//
// Todas las funciones son inmutables: devuelven un CareerState NUEVO.

import type { CareerState, SkillBranch } from "./types";
import { xpRequired, MAX_SKILL_LEVEL } from "./constants";

const now = () => new Date().toISOString();

// ─── XP / subida de nivel ────────────────────────────────────────────────────
export interface XpResult {
  state: CareerState;
  leveledUp: boolean;
  /** Cuántos niveles (overall) se ganaron de golpe. */
  levelsGained: number;
}

/**
 * Suma `amount` de XP y resuelve todas las subidas de nivel encadenadas. Cada
 * nivel sube el overall en 1 (tope 99) y concede 1 punto de habilidad. La XP
 * sobrante se conserva hacia el siguiente nivel.
 */
export function grantXp(state: CareerState, amount: number): XpResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { state, leveledUp: false, levelsGained: 0 };
  }
  let { overall, xp, xpToNext } = state.progression;
  let points = state.skills.points;
  let gained = 0;
  xp += Math.round(amount);

  while (overall < 99 && xp >= xpToNext) {
    xp -= xpToNext;
    overall += 1;
    points += 1;
    gained += 1;
    xpToNext = xpRequired(overall);
  }
  // Al tope de overall la XP deja de acumularse sin sentido.
  if (overall >= 99) {
    overall = 99;
    xpToNext = xpRequired(99);
    xp = Math.min(xp, xpToNext);
  }

  return {
    state: {
      ...state,
      progression: { ...state.progression, overall, xp, xpToNext },
      skills: { ...state.skills, points },
      updatedAt: now(),
    },
    leveledUp: gained > 0,
    levelsGained: gained,
  };
}

// ─── Árbol de habilidades ────────────────────────────────────────────────────
// Cada rama, al subir, refuerza un stat de reputación concreto.
const BRANCH_REP: Record<SkillBranch, keyof CareerState["reputation"]["stats"]> = {
  ataque: "prestigio",
  defensa: "disciplina",
  mental: "tactica",
  gestion: "cantera",
};

/** ¿Se puede subir esta rama? (hay puntos y no está al máximo). */
export function canUnlockSkill(state: CareerState, branch: SkillBranch): boolean {
  return state.skills.points > 0 && state.skills.levels[branch] < MAX_SKILL_LEVEL;
}

/**
 * Gasta 1 punto para subir una rama del árbol. Sube además el stat de reputación
 * asociado (+4) y recalcula la reputación total. No modifica el overall.
 */
export function unlockSkill(state: CareerState, branch: SkillBranch): CareerState {
  if (!canUnlockSkill(state, branch)) return state;

  const levels = { ...state.skills.levels, [branch]: state.skills.levels[branch] + 1 };
  const repKey = BRANCH_REP[branch];
  const stats = { ...state.reputation.stats, [repKey]: Math.min(100, state.reputation.stats[repKey] + 4) };
  const total = sumReputation(stats);

  return {
    ...state,
    skills: { levels, points: state.skills.points - 1 },
    reputation: { ...state.reputation, stats, total },
    updatedAt: now(),
  };
}

/** Reputación total = suma de los 6 stats (0..600). */
export function sumReputation(stats: CareerState["reputation"]["stats"]): number {
  return (
    stats.prestigio +
    stats.carisma +
    stats.tactica +
    stats.disciplina +
    stats.mediatico +
    stats.cantera
  );
}

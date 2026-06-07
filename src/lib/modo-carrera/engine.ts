// src/lib/modo-carrera/engine.ts
//
// Motor de PROGRESIÓN del Modo Carrera (lógica pura, sin deps de servidor ni de
// React). Centraliza dos reglas del juego:
//   1. Ganar XP → subir de nivel (overall +1 y +1 punto de habilidad por nivel).
//   2. Gastar puntos en el árbol de habilidades → sube la rama y un stat de
//      reputación asociado (sin tocar el overall, que solo crece con la XP).
//
// Todas las funciones son inmutables: devuelven un CareerState NUEVO.

import type { CareerState, SkillBranch, ReputationStats } from "./types";
import { xpRequired, MAX_SKILL_LEVEL } from "./constants";

const now = () => new Date().toISOString();
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

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

// ─── Decisiones de narrativa (Pilar 6) ───────────────────────────────────────
// Cada opción de una rueda de prensa/evento aplica efectos reales sobre la moral
// y la reputación. Las claves coinciden con los `id` de las opciones generadas en
// narrative.ts (calma/ambicion/cantera).
interface DecisionEffect {
  morale?: number;
  /** Variación de la confianza de la federación/público (board.confidence, 0-100). */
  confidence?: number;
  stats?: Partial<ReputationStats>;
}

const DECISION_EFFECTS: Record<string, DecisionEffect> = {
  // Ruedas de prensa "de objetivos" (narrativa clásica).
  calma: { morale: 4, stats: { disciplina: 3 } },
  ambicion: { morale: 2, stats: { mediatico: 6, prestigio: 2, carisma: 3 } },
  cantera: { morale: 3, stats: { cantera: 6 } },
  // Ruedas de prensa POST-PARTIDO (press.ts): cada tono mueve la moral del
  // vestuario (que alimenta el rendimiento) y/o la confianza de la federación.
  humildad: { morale: 3, confidence: 2, stats: { disciplina: 3 } },
  euforia: { morale: 5, confidence: 1, stats: { carisma: 3, mediatico: 3 } },
  // POLÉMICA (alto riesgo / alta recompensa): enciende al grupo y a los medios,
  // pero la federación se incomoda y baja su confianza.
  soberbia: { morale: 7, confidence: -5, stats: { mediatico: 7, carisma: 4 } },
  autocritica: { morale: 2, confidence: 4, stats: { disciplina: 5 } },
  // Proteger al grupo: el vestuario lo adora (moral), tu imagen pública sufre.
  proteger: { morale: 8, confidence: -3, stats: { carisma: 5, prestigio: -3 } },
  // Señalar en público: marcas autoridad de cara a la federación, pero la moral
  // del vestuario se desploma (peor rendimiento).
  senalar: { morale: -10, confidence: 3, stats: { mediatico: 5, disciplina: 2 } },
};

/**
 * Registra la decisión del usuario en una entrada de narrativa y aplica sus
 * efectos (moral + reputación). Idempotente: si la entrada no existe o ya estaba
 * decidida, devuelve el estado sin cambios.
 */
export function applyDecision(state: CareerState, entryId: string, choiceId: string): CareerState {
  const entry = state.narrative.find((e) => e.id === entryId);
  if (!entry || entry.chosen) return state;

  const narrative = state.narrative.map((e) =>
    e.id === entryId && !e.chosen ? { ...e, chosen: choiceId } : e,
  );

  const eff = DECISION_EFFECTS[choiceId];
  if (!eff) {
    return { ...state, narrative, updatedAt: now() };
  }

  const morale = clamp(state.progression.morale + (eff.morale ?? 0), 0, 100);
  const confidence = clamp(state.board.confidence + (eff.confidence ?? 0), 0, 100);
  const stats = { ...state.reputation.stats };
  if (eff.stats) {
    for (const [k, v] of Object.entries(eff.stats) as [keyof ReputationStats, number][]) {
      stats[k] = clamp(stats[k] + v, 0, 100);
    }
  }

  return {
    ...state,
    progression: { ...state.progression, morale },
    board: { ...state.board, confidence },
    reputation: { ...state.reputation, stats, total: sumReputation(stats) },
    narrative,
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

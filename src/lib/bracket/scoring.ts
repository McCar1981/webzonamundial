// src/lib/bracket/scoring.ts
//
// Puntuación PURA del bracket de un usuario contra los resultados reales del
// torneo (mejora F). Sin I/O. Reproducible.
//
// Modelo "progresión" (estándar y robusto): no se compara partido-a-partido del
// knockout (el camino del usuario diverge del real), sino qué EQUIPOS predijo que
// alcanzarían cada ronda frente a los que realmente la alcanzaron. A mayor ronda,
// más valen los aciertos; el campeón es la guinda. La fase de grupos ya se puntúa
// partido a partido en el módulo de Predicciones, así que aquí el valor añadido
// es acertar el cuadro de eliminatorias y el campeón.

import { createInitialState, propagate } from "./engine";
import type { Pick, PhaseId } from "./types";

export type KnockoutPhase = "R32" | "R16" | "QF" | "SF" | "FINAL";
export const KNOCKOUT_PHASES: KnockoutPhase[] = ["R32", "R16", "QF", "SF", "FINAL"];

/** Puntos por cada equipo correctamente predicho en una ronda. */
export const ROUND_POINTS: Record<KnockoutPhase, number> = {
  R32: 1, R16: 3, QF: 6, SF: 10, FINAL: 15,
};
/** Bonus por acertar el campeón. */
export const CHAMPION_POINTS = 25;

/** Equipos que realmente alcanzaron cada ronda + campeón real. */
export interface BracketActuals {
  reached: Record<KnockoutPhase, string[]>;
  champion: string | null;
}

/** Conjunto de equipos que el usuario predijo en cada ronda de eliminatorias. */
export function predictedReached(picks: Record<string, Pick>): Record<KnockoutPhase, string[]> {
  const state = createInitialState();
  state.picks = { ...picks };
  propagate(state);
  const out = {} as Record<KnockoutPhase, string[]>;
  for (const phase of KNOCKOUT_PHASES) {
    const teams = new Set<string>();
    for (const m of state.matches) {
      if (m.phase !== (phase as PhaseId)) continue;
      if (m.a) teams.add(m.a);
      if (m.b) teams.add(m.b);
    }
    out[phase] = [...teams];
  }
  return out;
}

export interface BracketScore {
  score: number;
  reached_counts: Record<KnockoutPhase, number>;
  champion_correct: boolean;
}

/** Puntúa el bracket del usuario contra los resultados reales. */
export function scoreBracket(
  picks: Record<string, Pick>,
  champion: string | null,
  actuals: BracketActuals,
): BracketScore {
  const predicted = predictedReached(picks);
  const reached_counts = {} as Record<KnockoutPhase, number>;
  let score = 0;

  for (const phase of KNOCKOUT_PHASES) {
    const actualSet = new Set(actuals.reached[phase] ?? []);
    let hits = 0;
    for (const team of predicted[phase]) if (actualSet.has(team)) hits++;
    reached_counts[phase] = hits;
    score += hits * ROUND_POINTS[phase];
  }

  const champion_correct = Boolean(champion && actuals.champion && champion === actuals.champion);
  if (champion_correct) score += CHAMPION_POINTS;

  return { score, reached_counts, champion_correct };
}

/** Puntuación máxima posible (bracket perfecto) — para mostrar progreso en la UI. */
export function maxBracketScore(): number {
  const counts: Record<KnockoutPhase, number> = { R32: 32, R16: 16, QF: 8, SF: 4, FINAL: 2 };
  let max = CHAMPION_POINTS;
  for (const phase of KNOCKOUT_PHASES) max += counts[phase] * ROUND_POINTS[phase];
  return max;
}

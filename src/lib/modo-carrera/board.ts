// src/lib/modo-carrera/board.ts
//
// Junta / Federación (presión directiva, estilo FIFA Career Mode). Lógica pura.
//
// La federación fija al inicio de cada temporada un OBJETIVO mínimo (la fase a la
// que como mínimo debe llegar el DT) que se calcula de forma ADAPTATIVA según la
// fuerza de la selección (ranking FIFA) y el overall del DT: una potencia con un
// gran DT está obligada a ganar; un combinado modesto solo a clasificar.
//
// Al cerrar la temporada se EVALÚA lo conseguido contra ese objetivo y se ajusta
// la CONFIANZA (job security). Superar el objetivo sube la confianza y el
// prestigio; quedarse corto la hunde y golpea la moral. Por debajo de 25 el
// puesto del DT peligra. Todo inmutable: las funciones devuelven datos nuevos.

import type { CareerState, BoardState, BoardDemand, BoardVerdict, TournamentStage } from "./types";
import { SELECCIONES } from "@/data/selecciones";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// ─── Etiquetas legibles ──────────────────────────────────────────────────────
export const DEMAND_LABEL: Record<BoardDemand, string> = {
  octavos: "Clasificar a octavos",
  cuartos: "Alcanzar los cuartos",
  semifinal: "Llegar a semifinales",
  final: "Disputar la final",
  campeon: "Ganar el Mundial",
};

export const VERDICT_LABEL: Record<BoardVerdict, string> = {
  pendiente: "Temporada en curso",
  superado: "Objetivo superado",
  cumplido: "Objetivo cumplido",
  fallido: "Objetivo incumplido",
};

// ─── Orden de fases (para comparar lo conseguido con lo exigido) ─────────────
const STAGE_ORDER: Record<TournamentStage, number> = {
  eliminado: 0,
  grupos: 1,
  octavos: 2,
  cuartos: 3,
  semifinal: 4,
  final: 5,
  campeon: 6,
};

const DEMAND_AS_STAGE: Record<BoardDemand, TournamentStage> = {
  octavos: "octavos",
  cuartos: "cuartos",
  semifinal: "semifinal",
  final: "final",
  campeon: "campeon",
};

// ─── Objetivo realista + adaptativo ──────────────────────────────────────────
const DEMAND_BY_INDEX: BoardDemand[] = ["octavos", "cuartos", "semifinal", "final", "campeon"];

/**
 * Ambición REAL de la selección según su fuerza real (ranking FIFA), como índice
 * 0..4 sobre DEMAND_BY_INDEX. Es lo que de verdad se le exige a ese país en un
 * Mundial: una potencia top apunta a la final/título; un debutante, a octavos.
 * Ej.: España (ranking 8) → semifinales.
 */
function realIndex(nationSlug: string | null | undefined): number {
  const rank = SELECCIONES.find((s) => s.slug === nationSlug)?.rankingFIFA ?? 50;
  if (rank <= 2) return 4; // campeón (máximos favoritos)
  if (rank <= 5) return 3; // final
  if (rank <= 12) return 2; // semifinal
  if (rank <= 24) return 1; // cuartos
  return 0; // clasificar a octavos
}

/** Objetivo realista de la selección, independiente del overall del DT. */
export function realObjective(nationSlug: string | null | undefined): BoardDemand {
  return DEMAND_BY_INDEX[realIndex(nationSlug)];
}

/**
 * Objetivo de la federación para la temporada. Parte de la ambición REAL del país
 * (ranking) y sube con el overall del DT: la exigencia crece con la dinastía, pero
 * nunca arranca por debajo de lo que ese país realmente persigue en un Mundial.
 */
export function buildBoardObjective(c: CareerState): BoardDemand {
  const base = realIndex(c.identity.nationSlug);
  const bump = Math.floor((c.progression.overall - 50) / 15); // 0..~3 según overall
  return DEMAND_BY_INDEX[clamp(base + bump, 0, 4)];
}

// ─── Evaluación de cierre de temporada ───────────────────────────────────────
export interface BoardEvaluation {
  board: BoardState;
  verdict: BoardVerdict;
  /** Ajustes a aplicar fuera (el motor de temporada los integra). */
  moraleDelta: number;
  prestigioDelta: number;
}

/**
 * Evalúa la temporada cerrada: compara la fase alcanzada (`reached`) con el
 * objetivo y devuelve la nueva confianza + el veredicto, además de los ajustes de
 * moral/prestigio que el motor debe aplicar al estado.
 */
export function evaluateSeason(c: CareerState, reached: TournamentStage): BoardEvaluation {
  const objective = c.board.objective;
  const target = STAGE_ORDER[DEMAND_AS_STAGE[objective]];
  const got = STAGE_ORDER[reached];

  let verdict: BoardVerdict;
  let confDelta: number;
  let moraleDelta: number;
  let prestigioDelta: number;

  if (got > target) {
    verdict = "superado";
    confDelta = 20;
    moraleDelta = 6;
    prestigioDelta = 5;
  } else if (got === target) {
    verdict = "cumplido";
    confDelta = 9;
    moraleDelta = 2;
    prestigioDelta = 2;
  } else {
    verdict = "fallido";
    // Cuanto más lejos del objetivo, mayor el castigo a la confianza.
    const miss = target - got; // 1..6
    confDelta = -(14 + miss * 6);
    moraleDelta = -10;
    prestigioDelta = 0;
  }

  return {
    board: {
      objective,
      confidence: clamp(c.board.confidence + confDelta, 0, 100),
      lastVerdict: verdict,
    },
    verdict,
    moraleDelta,
    prestigioDelta,
  };
}

/** ¿El puesto del DT está en riesgo de destitución? */
export function jobAtRisk(board: BoardState): boolean {
  return board.confidence < 25;
}

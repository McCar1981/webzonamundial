// src/lib/modo-carrera/match-live.ts
//
// PARTIDO INTERACTIVO (Pilar 1 de la jugabilidad estilo FIFA). En lugar de un
// único clic que escupe el marcador, el DT:
//   1. Elige un PLAN TÁCTICO antes del saque (afecta el ataque y la solidez).
//   2. Toma una DECISIÓN en el minuto 60 según cómo va el marcador.
// Ambas cosas son MULTIPLICADORES sobre las lambdas de goles esperados, así que
// las decisiones cambian de verdad la probabilidad del resultado.
//
// El partido se resuelve en dos ventanas: 0-60' y 60-90'. La lógica es pura
// (Poisson); el marcador final se entrega a resolveMatch() para aplicarlo a
// todos los pilares de la carrera.

import type { CareerState, SeasonMatch } from "./types";
import { matchLambdas, poisson, capScore } from "./season";

// Reparto de goles esperados por ventana (los primeros 60' pesan más).
const W1 = 0.62;
const W2 = 0.38;

// ─── Plan táctico (pre-partido) ──────────────────────────────────────────────
export interface TacticalPlan {
  id: string;
  name: string;
  description: string;
  /** Multiplicador del ataque (goles a favor esperados). */
  atkMult: number;
  /** Multiplicador de la exposición defensiva (goles en contra esperados). */
  defMult: number;
}

export const TACTICAL_PLANS: TacticalPlan[] = [
  {
    id: "equilibrado",
    name: "Equilibrado",
    description: "Bloque medio, sin riesgos. Rinde parecido en ataque y defensa.",
    atkMult: 1.0,
    defMult: 1.0,
  },
  {
    id: "ofensivo",
    name: "Presión alta",
    description: "Vas a por el rival arriba. Más goles a favor… y más espacios atrás.",
    atkMult: 1.35,
    defMult: 1.3,
  },
  {
    id: "defensivo",
    name: "Muro defensivo",
    description: "Cierras atrás y sufres menos, pero generas poco peligro.",
    atkMult: 0.7,
    defMult: 0.62,
  },
  {
    id: "contragolpe",
    name: "Contragolpe",
    description: "Cedes la pelota y golpeas a la espalda. Defensa sólida, ataque punzante.",
    atkMult: 1.15,
    defMult: 0.85,
  },
];

export function planById(id: string): TacticalPlan {
  return TACTICAL_PLANS.find((p) => p.id === id) ?? TACTICAL_PLANS[0];
}

// ─── Decisión en vivo (minuto 60) ────────────────────────────────────────────
export interface InMatchChoice {
  id: string;
  name: string;
  description: string;
  atkMult: number;
  defMult: number;
}

const KEEP: InMatchChoice = {
  id: "mantener",
  name: "Mantener el plan",
  description: "Sin cambios: el partido sigue su curso.",
  atkMult: 1.0,
  defMult: 1.0,
};

/** Opciones del DT en el min. 60, según cómo va el marcador a esa altura. */
export function choicesFor(gf1: number, ga1: number): InMatchChoice[] {
  if (gf1 > ga1) {
    return [
      KEEP,
      {
        id: "cerrar",
        name: "Cerrar el partido",
        description: "Repliegas y aguantas la ventaja. Apenas generarás, pero te blindas.",
        atkMult: 0.6,
        defMult: 0.6,
      },
      {
        id: "sentenciar",
        name: "Ir a sentenciar",
        description: "Buscas el gol que mata el partido… dejando algún hueco atrás.",
        atkMult: 1.4,
        defMult: 1.35,
      },
    ];
  }
  if (gf1 < ga1) {
    return [
      KEEP,
      {
        id: "ordenar",
        name: "Ordenar y empujar",
        description: "Recompones sin volverte loco. Empujas con cabeza.",
        atkMult: 1.2,
        defMult: 1.0,
      },
      {
        id: "todo-ataque",
        name: "Volcarse al ataque",
        description: "Todo o nada por la remontada: máximo riesgo, máxima recompensa.",
        atkMult: 1.7,
        defMult: 1.55,
      },
    ];
  }
  return [
    KEEP,
    {
      id: "buscar",
      name: "Buscar la victoria",
      description: "Das un paso al frente para romper el empate.",
      atkMult: 1.35,
      defMult: 1.2,
    },
    {
      id: "asegurar",
      name: "Asegurar el punto",
      description: "No regalas nada atrás y te conformas con el empate.",
      atkMult: 0.8,
      defMult: 0.7,
    },
  ];
}

// ─── Resolución por ventanas ─────────────────────────────────────────────────
export interface LiveMatchState {
  planId: string;
  /** Goles de la primera ventana (0-60'). */
  gf1: number;
  ga1: number;
  /** Lambdas base del partido (sin multiplicadores), para la 2ª ventana. */
  lamFor: number;
  lamAg: number;
}

/** Pita el inicio: simula los primeros 60' con el plan táctico elegido. */
export function kickoff(c: CareerState, match: SeasonMatch, plan: TacticalPlan): LiveMatchState {
  const { lamFor, lamAg } = matchLambdas(c, match);
  return {
    planId: plan.id,
    gf1: poisson(lamFor * W1 * plan.atkMult),
    ga1: poisson(lamAg * W1 * plan.defMult),
    lamFor,
    lamAg,
  };
}

export interface LiveMatchResult {
  /** Marcador final. */
  gf: number;
  ga: number;
  /** Goles de la segunda ventana (60-90'). */
  gf2: number;
  ga2: number;
}

/** Resuelve los últimos 30' aplicando la decisión del minuto 60. */
export function secondHalf(state: LiveMatchState, choice: InMatchChoice): LiveMatchResult {
  const gf2 = poisson(state.lamFor * W2 * choice.atkMult);
  const ga2 = poisson(state.lamAg * W2 * choice.defMult);
  // Tope de margen creíble sobre el marcador final (evita palizas irreales tipo
  // 9-0 si los planes y la cola de Poisson se alinean a favor de un lado).
  const capped = capScore(state.gf1 + gf2, state.ga1 + ga2, state.lamFor, state.lamAg);
  return { gf: capped.gf, ga: capped.ga, gf2, ga2 };
}

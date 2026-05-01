// src/lib/bracket/types.ts
// Tipos compartidos entre engine, reducer, vista clásica y vista cósmica.

export type PhaseId = "GROUP" | "R32" | "R16" | "QF" | "SF" | "THIRD" | "FINAL";

export interface PhaseDef {
  id: PhaseId;
  name: string;
  short: string;
  /** Radio del anillo en la vista cósmica (px sobre viewBox 1200). */
  radius: number;
  /** Cantidad total de partidos en esa fase. */
  matches: number;
}

export const PHASES: PhaseDef[] = [
  { id: "GROUP", name: "Fase de Grupos",   short: "GRUPOS",   radius: 540, matches: 72 },
  { id: "R32",   name: "32avos de Final",  short: "R32",      radius: 430, matches: 16 },
  { id: "R16",   name: "Octavos",          short: "OCTAVOS",  radius: 340, matches: 8  },
  { id: "QF",    name: "Cuartos",          short: "CUARTOS",  radius: 255, matches: 4  },
  { id: "SF",    name: "Semifinales",      short: "SEMIS",    radius: 180, matches: 2  },
  { id: "THIRD", name: "3er Puesto",       short: "3°PUESTO", radius: 130, matches: 1  },
  { id: "FINAL", name: "Final",            short: "FINAL",    radius: 90,  matches: 1  },
];

export const PHASE_BY_ID = Object.fromEntries(PHASES.map((p) => [p.id, p])) as Record<PhaseId, PhaseDef>;

/** Total de partidos del torneo (72 + 16 + 8 + 4 + 2 + 1 + 1 = 104). */
export const TOTAL_MATCHES = PHASES.reduce((s, p) => s + p.matches, 0);

export interface BracketMatch {
  id: string;
  phase: PhaseId;
  /** Índice del grupo (0-11) sólo en fase de grupos. */
  groupIdx?: number;
  /** Equipos enfrentados — null en knockouts hasta que se complete la fase anterior. */
  a: string | null;
  b: string | null;
  /** Posición del nodo dentro de su fase (para distribución radial). */
  slotIdx: number;
  slotTotal: number;
}

export interface Pick {
  matchId: string;
  /** ID del equipo ganador (null si empate sólo en grupos). */
  winner: string | null;
  scoreA: number;
  scoreB: number;
  ts: number;
}

export interface BracketState {
  matches: BracketMatch[];
  picks: Record<string, Pick>;
  /** Stack para undo (snapshot de picks). */
  history: Array<Record<string, Pick>>;
  /** Índice de la fase activa (0=Grupos, 1=R32, ...). */
  currentPhaseIdx: number;
  champion: string | null;
}

// src/lib/higher-lower/types.ts
// Tipos del minijuego Higher or Lower.

export type HLMode = "jugadores" | "selecciones";
export type HLPhase = "menu" | "playing" | "result";
export type HLGuess = "higher" | "lower";

/** Una carta del juego. */
export interface HLCard {
  id: string;
  name: string;
  subtitle: string; // club (jugadores) o confederación (selecciones)
  image: string; // flagCode o avatar
  value: number;
  displayValue: string;
  metricKey: string;
}

/** Métrica configurable para comparar dos cartas. */
export interface HLMetric {
  key: string;
  labelEs: string;
  labelEn: string;
  /** true si menor valor = "mejor" (ej: ranking FIFA). */
  inverse: boolean;
  format: (v: number) => string;
  extractSeleccion?: (s: any) => number | undefined;
  extractPlayer?: (p: any) => number | undefined;
}

/** Una ronda: carta visible + carta oculta. */
export interface HLRound {
  left: HLCard;
  right: HLCard;
  metric: HLMetric;
}

/** Resultado final de una partida. */
export interface HLResult {
  score: number;
  bestStreak: number;
  totalRounds: number;
  lastRound?: HLRound;
}

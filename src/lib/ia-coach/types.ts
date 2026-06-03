// src/lib/ia-coach/types.ts
//
// Tipos compartidos del IA Coach. Define el contrato JSON que devuelve
// el modelo y consume la UI.

export type Confidence = "baja" | "media" | "alta";

export interface IACoachAnalysis {
  /** Titular del análisis (5-8 palabras, máx 60 chars). Ej: "Argelia favorita ligera". */
  verdict: string;

  /** Código del equipo ganador previsto, o "DRAW" si pronostica empate.
   *  Usa el `id` (3 letras ISO) del BracketTeam. */
  winnerPrediction: string;

  /** Probabilidades para HOME / DRAW / AWAY. Deben sumar ~1.0 (±0.02). */
  probabilities: {
    home: number;
    draw: number;
    away: number;
  };

  /** Marcador más probable, formato "N-N". */
  scoreSuggestion: string;

  /** Confianza del analista en la predicción. */
  confidence: Confidence;

  /** Análisis editorial 300-500 palabras, 4-6 párrafos cortos (\n\n entre ellos). */
  analysis: string;

  /** 3-5 factores clave (frases cortas). */
  keyFactors: string[];

  /** Jugador a seguir en este partido. Puede ser null si no hay info suficiente. */
  watchPlayer: {
    name: string;
    team: string; // ID equipo (home o away)
    reason: string;
  } | null;

  /* ─────────── MODELO PREDICTIVO (Modo 1 ampliado) ───────────
   * Todos OPCIONALES: análisis cacheados con versión de prompt anterior no
   * los traen, y la UI los renderiza solo si están presentes. Son DERIVADOS
   * por el modelo a partir del contexto (forma, cuotas, plantilla) — no datos
   * granulares inventados.
   */

  /** Línea Over/Under de goles totales estimada por el modelo. */
  overUnder?: {
    /** Línea de goles, típicamente .5 (ej. 2.5). */
    line: number;
    /** Lado recomendado. */
    pick: "over" | "under";
    /** Justificación breve (máx 90 chars). */
    reason: string;
  };

  /** Goles esperados (xG) estimados pre-partido para cada equipo. Cualitativo. */
  xgEstimate?: {
    home: number;
    away: number;
  };

  /** Ventana más probable del primer gol (ej. "entre el 20' y el 35'"). */
  firstGoalWindow?: string;

  /** Jugadores con mayor probabilidad de marcar (2-3), ordenados desc. */
  topScorers?: Array<{
    name: string;
    team: string; // ID equipo (home o away)
    /** Probabilidad de marcar en el partido, 0-1. */
    probability: number;
    /** Motivo breve (máx 70 chars). */
    reason: string;
  }>;

  /** Duelo táctico clave del partido (enfrentamiento individual o zonal). */
  tacticalDuel?: {
    /** Titular del duelo (ej. "Mbappé vs el lateral derecho alemán"). */
    matchup: string;
    /** Análisis del duelo (máx 200 chars). */
    analysis: string;
  };

  /** Datos que habrían afinado el pronóstico y que NO venían en el contexto
   *  (forma reciente, bajas/lesiones, cuotas...). Opcional y vacío si no aplica.
   *  0-3 elementos (máx 90 chars c/u). */
  missingData?: string[];
}

/** Respuesta del endpoint /api/ia-coach/analyze. */
export interface IACoachResponse {
  ok: true;
  matchId: string;
  cached: boolean;
  /** Versión del dataset usada — invalidación de cache si cambian datos. */
  dataVersion: string;
  /** ISO timestamp del análisis. */
  generatedAt: string;
  analysis: IACoachAnalysis;
}

export interface IACoachErrorResponse {
  ok: false;
  error: string;
  matchId?: string;
}

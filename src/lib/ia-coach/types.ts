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

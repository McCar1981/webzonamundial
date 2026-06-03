// src/lib/ia-coach/coach-types.ts
//
// Tipos del IA Coach MODO 3: "Entrenador Personal".
//
// A diferencia de los modos 1 (previa de un partido) y 2 (en vivo), este modo
// analiza la QUINIELA COMPLETA del usuario (su bracket): a quién pone campeón,
// qué cruces arriesga, sus sesgos y su estilo de pronosticador. La quiniela vive
// en localStorage del cliente, así que el cliente reenvía su estado (picks +
// matches resueltos + campeón) al endpoint, igual que el Modo 2 con el estado
// en vivo. No requiere Supabase.

import type { Confidence } from "./types";
import type { PhaseId } from "@/lib/bracket/types";

/* ─────────────── ENTRADA (lo que envía el cliente) ─────────────── */

/** Pick individual del usuario (subset de bracket/types.ts Pick). */
export interface BracketPickInput {
  matchId: string;
  /** ID del equipo ganador (null si empate, solo en grupos). */
  winner: string | null;
  scoreA: number;
  scoreB: number;
}

/** Partido del bracket con equipos YA resueltos (subset de BracketMatch). */
export interface BracketMatchInput {
  id: string;
  phase: PhaseId;
  groupIdx?: number;
  a: string | null;
  b: string | null;
}

/** Estado de la quiniela que reenvía el cliente. */
export interface BracketStateInput {
  /** picks indexados por matchId, igual que en el store del cliente. */
  picks: Record<string, BracketPickInput>;
  /** matches con equipos resueltos (para leer cada cruce sin reconstruir el árbol). */
  matches: BracketMatchInput[];
  champion: string | null;
}

/* ─────────────── SALIDA (lo que devuelve el modelo) ─────────────── */

export type PredictionStyle = "conservador" | "equilibrado" | "atrevido";
export type Realism = "solido" | "defendible" | "arriesgado";

export interface IACoachBracketAnalysis {
  /** Titular del perfil del usuario (máx 70 chars). Ej: "Quinielista atrevido con sesgo europeo". */
  coachTitle: string;

  /** Lectura del estilo del usuario, 2-3 frases (máx 320 chars). */
  profile: string;

  /** Estilo de pronosticador deducido del riesgo de sus cruces. */
  predictionStyle: PredictionStyle;

  /** Cuán arriesgada es la quiniela en conjunto, 0-100. */
  riskScore: number;

  /** Veredicto sobre el campeón elegido. */
  championVerdict: {
    /** ID (3 letras) del campeón. */
    team: string;
    /** Lectura del pick de campeón (máx 200 chars). */
    take: string;
    realism: Realism;
  };

  /** 2-4 aciertos / puntos fuertes de la quiniela (máx 90 chars c/u). */
  strengths: string[];

  /** 2-4 cruces arriesgados a reconsiderar. */
  risks: Array<{
    /** matchId si aplica (puede omitirse). */
    matchId?: string;
    /** Etiqueta del riesgo (máx 90 chars). Ej: "Arabia Saudí elimina a España en Octavos". */
    label: string;
    /** Por qué es arriesgado (máx 120 chars). */
    why: string;
  }>;

  /** Sesgos detectados (confederación, favoritismo, goleadas...). 2-4 (máx 90 chars c/u). */
  biases: string[];

  /** Consejos accionables para afinar la quiniela. 2-3 (máx 110 chars c/u). */
  suggestions: string[];

  /** Nota global corta. Ej: "B+", "Notable", "7.5/10". (máx 12 chars) */
  grade: string;

  confidence: Confidence;
}

/* ─────────────── Respuesta del endpoint ─────────────── */

export interface IACoachBracketResponse {
  ok: true;
  cached: boolean;
  /** Huella del bracket usada como clave de cache. */
  bracketVersion: string;
  generatedAt: string;
  analysis: IACoachBracketAnalysis;
}

export interface IACoachBracketErrorResponse {
  ok: false;
  error: string;
}

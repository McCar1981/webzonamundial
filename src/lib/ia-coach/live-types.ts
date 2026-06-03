// src/lib/ia-coach/live-types.ts
//
// Contrato del IA Coach EN VIVO (Modo 2). A diferencia del Modo 1 (pre-partido),
// aquí el coach lee el ESTADO ACTUAL de un partido en curso (marcador, minuto,
// eventos, estadísticas, momentum) y devuelve una lectura táctica del momento.
//
// El estado en vivo se alimenta del Match Center (LiveSnapshot / simulación):
// el cliente ya tiene todos estos datos en pantalla, así que los reenvía tal
// cual al endpoint — sin feed extra ni input manual del usuario.

import type { Confidence } from "./types";
import type { LiveStats } from "@/lib/match-center/types";

/** Evento compacto que el cliente envía (subset de MatchEvent del Match Center). */
export interface LiveEventInput {
  minute: number;
  extra?: number;
  type: string; // MatchEventType
  side: "home" | "away" | "neutral";
  player?: string;
  detail?: string;
}

/** Estado puntual del partido que el cliente envía para pedir la lectura. */
export interface LiveStateInput {
  /** Minuto de juego a mostrar (1..90+). */
  minute: number;
  /** Etiqueta de fase ("1º tiempo", "Descanso", "2º tiempo", "Final"...). */
  phase: string;
  /** Estado api-football crudo si lo hay ("1H","HT","2H","FT"...). */
  status?: string;
  finished: boolean;
  /** Marcador [local, visitante]. */
  score: [number, number];
  stats: LiveStats;
  /** Eventos relevantes ya ocurridos (el server se queda con los últimos). */
  events: LiveEventInput[];
  /** Momentum -1 (visitante) .. +1 (local) calculado por el cliente. */
  momentum: number;
}

/** Análisis en vivo devuelto por el coach. */
export interface IACoachLiveAnalysis {
  /** Titular del momento (máx 70 chars). Ej: "Brasil sufre pese al 1-0". */
  headline: string;

  /** Lectura del estado actual: UNA o dos frases (máx 220 chars). */
  situation: string;

  /** Quién manda ahora mismo según el coach. */
  momentumTeam: "home" | "away" | "none";

  /** Probabilidades de resultado FINAL recalculadas para el estado actual. */
  winProbabilities: {
    home: number;
    draw: number;
    away: number;
  };

  /** Marcador final proyectado desde el estado actual, formato "N-N". */
  projectedScore: string;

  /** 3-4 observaciones derivadas de las stats/eventos en vivo (máx 80 chars c/u). */
  keyObservations: string[];

  /** Ajuste táctico recomendado para cada equipo (máx 120 chars c/u).
   *  Puede omitir un lado si no procede. */
  adjustments?: {
    home?: string;
    away?: string;
  };

  /** Qué esperar en los próximos minutos (máx 160 chars). */
  watchNext: string;

  /** Datos ausentes del contexto que habrían afinado la lectura (stats, alineaciones,
   *  banquillo...). Vacío si el contexto era suficiente. 0-3 (máx 90 chars c/u). */
  missingData: string[];

  confidence: Confidence;
}

/** Respuesta del endpoint /api/ia-coach/live. */
export interface IACoachLiveResponse {
  ok: true;
  matchId: number;
  cached: boolean;
  /** Hash del estado usado (marcador + minuto + eventos) — para depurar caché. */
  stateVersion: string;
  generatedAt: string;
  analysis: IACoachLiveAnalysis;
}

export interface IACoachLiveErrorResponse {
  ok: false;
  error: string;
  matchId?: number;
}

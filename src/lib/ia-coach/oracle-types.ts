// src/lib/ia-coach/oracle-types.ts
//
// Tipos del IA Coach MODO 4: "Oráculo / Monte Carlo".
//
// El núcleo numérico (simulación) vive en oracle-sim.ts (TeamOdds, OracleSimResult).
// Aquí van el contrato del endpoint y la narración del Oráculo (Claude).

import type { Confidence } from "./types";
import type { TeamOdds } from "./oracle-sim";

/* ─────────────── ENTRADA ─────────────── */

export interface OracleRequest {
  /** Campeón elegido por el usuario (id ISO3), opcional. Si se envía, el Oráculo
   *  contrasta su pick con la simulación. */
  champion?: string | null;
}

/* ─────────────── Narración del Oráculo (Claude) ─────────────── */

export interface OracleNarration {
  /** Proclamación/titular del Oráculo (máx 80 chars). */
  proclamation: string;
  /** Lectura del cuadro de probabilidades, 2-3 frases (máx 360 chars). */
  reading: string;
  /** Lectura del gran favorito. */
  favorite: { team: string; take: string };
  /** Tapado/sorpresa con opciones reales pese a no ser top. */
  darkHorse: { team: string; take: string };
  /** Veredicto sobre el campeón del usuario (si lo envió). */
  userVerdict: { team: string; take: string } | null;
  confidence: Confidence;
}

/* ─────────────── Respuesta del endpoint ─────────────── */

export interface OracleResponse {
  ok: true;
  cached: boolean;
  iterations: number;
  generatedAt: string;
  /** Top selecciones por probabilidad de campeón. */
  top: TeamOdds[];
  /** Entrada del campeón del usuario (si lo envió y no está ya en el top). */
  userChampion: TeamOdds | null;
  narration: OracleNarration;
}

export interface OracleErrorResponse {
  ok: false;
  error: string;
}

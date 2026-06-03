// src/lib/ia-coach/debate-types.ts
//
// Tipos del IA Coach MODO 5: "Debate / Reto IA vs Humanos".
//
// A diferencia de los otros modos (one-shot), este es MULTI-TURN: el usuario y
// el Retador (Claude) discuten sobre los pronósticos del Mundial 2026 a lo largo
// de varios mensajes. El cliente mantiene el historial y lo reenvía en cada turno.
//
// Gated: requiere cuenta (getCurrentUser) + Founders Pass (isFounder).

import type { Confidence } from "./types";

/* ─────────────── Historial de conversación ─────────────── */

export interface DebateMessage {
  role: "user" | "assistant";
  /** Texto del mensaje (el del assistant es el campo `reply` de su turno). */
  content: string;
}

/* ─────────────── ENTRADA ─────────────── */

export interface DebateRequest {
  /** Campeón elegido por el usuario (id ISO3), opcional: ancla el debate. */
  champion?: string | null;
  /** Historial completo de la conversación (incluye el último mensaje del user). */
  messages: DebateMessage[];
}

/* ─────────────── Turno del Retador (Claude) ─────────────── */

export interface DebateTurn {
  /** El argumento del Retador para este turno (máx 700 chars). */
  reply: string;
  /** Etiqueta corta de la postura que defiende ahora (máx 70 chars). */
  stance: string;
  /** true si el usuario lo hizo cambiar de opinión en algún punto. */
  concede: boolean;
  /** Pregunta/reto con el que devuelve la pelota al usuario (máx 140 chars), o null. */
  challenge: string | null;
  confidence: Confidence;
}

/* ─────────────── Respuesta del endpoint ─────────────── */

export interface DebateResponse {
  ok: true;
  generatedAt: string;
  /** Nº de turnos del usuario consumidos en esta sesión (para el límite). */
  turnsUsed: number;
  turn: DebateTurn;
}

export interface DebateErrorResponse {
  ok: false;
  error: string;
}

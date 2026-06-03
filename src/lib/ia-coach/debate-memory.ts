// src/lib/ia-coach/debate-memory.ts
//
// Memoria PERSISTENTE del Retador entre sesiones (Modo 5). Server-only.
//
// El Retador es premium y autenticado, así que podemos recordar de qué debatió
// un usuario en visitas anteriores y arrancar la siguiente sesión con contexto:
// "El mes pasado defendías a Brasil, ¿sigues en tus trece?".
//
// Se guarda en Vercel KV keyado por userId (NO por email). Degrada con elegancia:
// si KV no está configurado o falla, simplemente no hay memoria y el debate
// arranca en frío, como siempre.

import { kv } from "@vercel/kv";

const PREFIX = "iacoach:debate:mem:";
const TTL_SECONDS = 60 * 60 * 24 * 60; // 60 días: recuerda entre torneos/parones

export interface DebateMemory {
  /** Campeón que el usuario defendía en la última sesión (id ISO3) o null. */
  lastChampionId: string | null;
  /** Última tesis que sostuvo el Retador (para retomar el hilo). */
  lastStance: string;
  /** Cuántas sesiones de debate ha tenido este usuario. */
  sessions: number;
  updatedAt: string;
}

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

/** Lee la memoria de debate del usuario. null si no hay o KV está apagado. */
export async function readDebateMemory(userId: string): Promise<DebateMemory | null> {
  if (!kvEnabled() || !userId) return null;
  try {
    return (await kv.get<DebateMemory>(`${PREFIX}${userId}`)) ?? null;
  } catch {
    return null;
  }
}

/**
 * Actualiza la memoria del usuario tras un turno.
 *
 * @param isNewSession  true si este turno abre una sesión nueva (incrementa el
 *                      contador de sesiones). Se detecta en el route cuando el
 *                      historial trae un solo turno de usuario.
 */
export async function writeDebateMemory(
  userId: string,
  data: { championId: string | null; stance: string; isNewSession: boolean },
  prior: DebateMemory | null,
): Promise<void> {
  if (!kvEnabled() || !userId) return;
  const sessions = (prior?.sessions ?? 0) + (data.isNewSession ? 1 : 0);
  const memory: DebateMemory = {
    lastChampionId: data.championId,
    lastStance: data.stance.slice(0, 120),
    sessions: Math.max(sessions, 1),
    updatedAt: new Date().toISOString(),
  };
  try {
    await kv.set(`${PREFIX}${userId}`, memory, { ex: TTL_SECONDS });
  } catch {
    /* ignora: la memoria es best-effort */
  }
}

// src/lib/modo-carrera/save-rate-limit.ts
//
// Límite de frecuencia para PUT /api/modo-carrera/save (server-only, KV). El
// guardado es el único endpoint de escritura cruzada del Modo Carrera y alimenta
// el ranking global, así que se protege contra abuso/DoS: un usuario no puede
// machacar el upsert ni inflar el ranking a base de escrituras en bucle.
//
// Ventana fija de SAVE_WINDOW_SEC con 1 guardado permitido. Ante un fallo de KV
// degrada a "permitido" (no romper el guardado por un incidente de infra).

import { kv } from "@vercel/kv";

/** Ventana mínima entre guardados, en segundos. */
export const SAVE_WINDOW_SEC = 5;

/**
 * Reserva un guardado para el usuario. Devuelve false si ya guardó dentro de la
 * ventana actual (el llamador debe responder 429). Atómico vía kv.incr.
 */
export async function allowSave(userId: string): Promise<boolean> {
  const key = `mc:save:rl:${userId}`;
  try {
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, SAVE_WINDOW_SEC);
    }
    return count <= 1;
  } catch {
    return true;
  }
}

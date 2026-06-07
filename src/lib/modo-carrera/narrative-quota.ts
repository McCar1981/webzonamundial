// src/lib/modo-carrera/narrative-quota.ts
//
// Cuota diaria de NARRATIVA IA (server-only, KV). La generación con Claude tiene
// coste marginal real (tokens), así que se monetiza por coste, no por poder:
//   · Pase DT  → ilimitada.
//   · Usuario gratis logueado → FREE_DAILY_AI generaciones IA/día.
//   · Invitado (sin sesión) → cupo global compartido (protege el gasto y deja
//     "probar" la IA; crear cuenta o el Pase DT lo amplía).
// Al agotar el cupo, la ruta sirve la versión por PLANTILLA (sin tokens): el
// usuario nunca se queda sin contenido, solo sin IA.

import { kv } from "@vercel/kv";

export const FREE_DAILY_AI = 3;
export const GUEST_DAILY_AI_GLOBAL = 300;
/** Generaciones IA que añade UNA recarga comprada con Fútcoins. */
export const REFILL_GENERATIONS = 3;

/** Día UTC en formato YYYY-MM-DD (clave determinista en servidor). */
function utcDay(ref: Date = new Date()): string {
  return ref.toISOString().slice(0, 10);
}

/** Clave del cupo EXTRA (comprado con Fútcoins) de un usuario para el día. */
function bonusKey(uid: string, day: string): string {
  return `mc:narrativa:bonus:u:${uid}:${day}`;
}

export interface QuotaResult {
  /** ¿Se permite usar IA en esta petición? */
  allowed: boolean;
  /** Generaciones IA restantes hoy (null = ilimitado). */
  remaining: number | null;
  /** ¿El cupo está agotado (se servirá plantilla)? */
  exceeded: boolean;
}

/**
 * Consume una unidad de cuota de narrativa IA de forma atómica. Devuelve si la
 * petición puede usar IA. Ante un fallo de KV degrada a "permitido" (no romper la
 * experiencia por un incidente de infraestructura; el coste se autolimita igual
 * porque generateNarrative cae a plantilla si la IA falla).
 */
export async function consumeNarrativeQuota(opts: { userId?: string | null; paseDT: boolean }): Promise<QuotaResult> {
  if (opts.paseDT) return { allowed: true, remaining: null, exceeded: false };

  const day = utcDay();
  const isUser = !!opts.userId;
  const key = isUser ? `mc:narrativa:u:${opts.userId}:${day}` : `mc:narrativa:guest:${day}`;
  const base = isUser ? FREE_DAILY_AI : GUEST_DAILY_AI_GLOBAL;

  try {
    // El cupo del usuario = gratis del día + recargas compradas con Fútcoins.
    const bonus = isUser ? ((await kv.get<number>(bonusKey(opts.userId!, day))) ?? 0) : 0;
    const limit = base + bonus;
    const count = await kv.incr(key);
    if (count === 1) {
      // Primera del día: expira en 48 h (cubre cualquier desfase de zona).
      await kv.expire(key, 60 * 60 * 48);
    }
    const allowed = count <= limit;
    return {
      allowed,
      remaining: isUser ? Math.max(0, limit - count) : null,
      exceeded: !allowed,
    };
  } catch {
    return { allowed: true, remaining: null, exceeded: false };
  }
}

/**
 * Añade una RECARGA de cupo IA (comprada con Fútcoins) al usuario para hoy. El
 * cobro de las Fútcoins lo hace la ruta ANTES de llamar aquí; esto solo amplía el
 * cupo. Devuelve cuántas generaciones se añadieron (0 si KV falló: la ruta debe
 * entonces devolver las Fútcoins para no cobrar sin entregar).
 */
export async function addNarrativeBonus(uid: string, generations: number = REFILL_GENERATIONS): Promise<number> {
  const add = Math.max(0, Math.round(generations));
  if (add === 0) return 0;
  const day = utcDay();
  const key = bonusKey(uid, day);
  try {
    const total = await kv.incrby(key, add);
    if (total === add) await kv.expire(key, 60 * 60 * 48);
    return add;
  } catch {
    return 0;
  }
}

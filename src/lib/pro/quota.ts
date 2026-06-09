// src/lib/pro/quota.ts
//
// Cuotas diarias genéricas para los límites del plan Free (server-only, KV).
// Generaliza el patrón de modo-carrera/narrative-quota.ts para cualquier
// feature: IA Coach (1 consulta/día), trivia (5 preguntas diaria, 1 partida
// otros modos), temporadas de Modo Carrera, etc.
//
// Layout KV:  quota:{feature}:{userId}:{YYYY-MM-DD}  (contador, TTL 48h)
//
// Ante fallo de KV degrada a "permitido" (no romper la experiencia por un
// incidente de infraestructura — mismo criterio que narrative-quota). Los
// usuarios Pro NUNCA pasan por aquí: el gate comprueba isPro() antes.

import { kv } from "@vercel/kv";

/** Día UTC en formato YYYY-MM-DD (clave determinista en servidor). */
export function utcDay(ref: Date = new Date()): string {
  return ref.toISOString().slice(0, 10);
}

const quotaKey = (feature: string, userId: string, day: string) => `quota:${feature}:${userId}:${day}`;

export interface DailyQuotaResult {
  /** ¿Se permite esta petición? */
  allowed: boolean;
  /** Usos restantes hoy tras esta petición. */
  remaining: number;
  /** Usos consumidos hoy (incluida esta petición si fue permitida). */
  used: number;
  /** Límite aplicado. */
  limit: number;
}

/**
 * Consume una unidad de cuota diaria de forma atómica (INCR). Si el contador
 * supera el límite, la petición se rechaza pero el contador queda por encima
 * — irrelevante porque solo comparamos contra el límite.
 */
export async function consumeDailyQuota(
  userId: string,
  feature: string,
  limit: number,
): Promise<DailyQuotaResult> {
  const day = utcDay();
  const key = quotaKey(feature, userId, day);
  try {
    const count = await kv.incr(key);
    if (count === 1) {
      // Primera del día: expira en 48h (cubre cualquier desfase de zona).
      await kv.expire(key, 60 * 60 * 48);
    }
    const allowed = count <= limit;
    return {
      allowed,
      remaining: Math.max(0, limit - count),
      used: Math.min(count, limit),
      limit,
    };
  } catch {
    return { allowed: true, remaining: limit, used: 0, limit };
  }
}

/**
 * Consume VARIAS unidades de golpe (p.ej. servir 4 preguntas de trivia
 * descuenta 4). El llamador debe haber comprobado antes el remaining con
 * peekDailyQuota y acotar `units` a él.
 */
export async function consumeDailyQuotaUnits(
  userId: string,
  feature: string,
  limit: number,
  units: number,
): Promise<DailyQuotaResult> {
  const day = utcDay();
  const key = quotaKey(feature, userId, day);
  const add = Math.max(0, Math.round(units));
  try {
    const count = add === 0 ? ((await kv.get<number>(key)) ?? 0) : await kv.incrby(key, add);
    if (count === add && add > 0) {
      await kv.expire(key, 60 * 60 * 48);
    }
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      used: Math.min(count, limit),
      limit,
    };
  } catch {
    return { allowed: true, remaining: limit, used: 0, limit };
  }
}

/**
 * Lee la cuota sin consumir (para pintar contadores "2/3 hoy" en la UI).
 */
export async function peekDailyQuota(
  userId: string,
  feature: string,
  limit: number,
): Promise<Omit<DailyQuotaResult, "allowed"> & { exhausted: boolean }> {
  const day = utcDay();
  try {
    const count = (await kv.get<number>(quotaKey(feature, userId, day))) ?? 0;
    return {
      remaining: Math.max(0, limit - count),
      used: Math.min(count, limit),
      limit,
      exhausted: count >= limit,
    };
  } catch {
    return { remaining: limit, used: 0, limit, exhausted: false };
  }
}

/**
 * Devuelve una unidad consumida (para rutas que consumen ANTES de un trabajo
 * que puede fallar: si la IA revienta, el usuario no pierde su consulta).
 */
export async function refundDailyQuota(userId: string, feature: string): Promise<void> {
  const day = utcDay();
  try {
    const count = await kv.decr(quotaKey(feature, userId, day));
    // No dejar contadores negativos si hubo carreras raras.
    if (count < 0) await kv.set(quotaKey(feature, userId, day), 0, { ex: 60 * 60 * 48 });
  } catch {
    /* best-effort */
  }
}

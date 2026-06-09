// src/lib/modo-carrera/season-quota.ts
//
// Cuota de TEMPORADAS del plan Free: máximo FREE_LIMITS.carrera.maxSeasonsPerDay
// temporadas; al empezar la última arranca un lockout de
// FREE_LIMITS.carrera.cooldownHours horas, pasado el cual el contador se limpia
// y se puede continuar. Pro = temporadas ilimitadas (el gate comprueba isPro
// ANTES de llamar aquí).
//
// Las temporadas del Modo Carrera son cortas (~12 partidos) y el juego corre en
// el cliente, así que el enforcement vive en el PUT de guardado: una partida
// que arranca temporada nueva (progression.season incrementa) consume cupo; si
// está agotado, el guardado se rechaza y el cliente muestra la cuenta atrás.
//
// Layout KV:  mc:seasons:{userId}  (contador, TTL = lockout)
// Ante fallo de KV degrada a "permitido" (criterio narrative-quota).

import { kv } from "@vercel/kv";
import { FREE_LIMITS } from "@/lib/pro/limits";

const KEY = (uid: string) => `mc:seasons:${uid}`;
const LIMIT = FREE_LIMITS.carrera.maxSeasonsPerDay;
const COOLDOWN_SEC = FREE_LIMITS.carrera.cooldownHours * 60 * 60;
// Colchón por si el usuario tarda más de un día en agotar el cupo: el contador
// nunca vive más de 24h aunque no llegue al lockout.
const SAFETY_TTL_SEC = 24 * 60 * 60;

export interface SeasonQuotaResult {
  allowed: boolean;
  /** Temporadas restantes tras esta (0 si se agotó). */
  remaining: number;
  /** Si está bloqueado, cuándo puede continuar (ISO), si KV lo sabe. */
  retryAt: string | null;
}

/** Consume una temporada del cupo Free. Llamar SOLO al detectar temporada nueva. */
export async function consumeSeasonQuota(userId: string): Promise<SeasonQuotaResult> {
  const key = KEY(userId);
  try {
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, SAFETY_TTL_SEC);
    } else if (count === LIMIT) {
      // Última temporada del lote: desde AQUÍ corren las horas de lockout.
      await kv.expire(key, COOLDOWN_SEC);
    }
    if (count <= LIMIT) {
      return { allowed: true, remaining: LIMIT - count, retryAt: null };
    }
    const ttl = await kv.ttl(key);
    const retryAt = ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : null;
    return { allowed: false, remaining: 0, retryAt };
  } catch {
    return { allowed: true, remaining: LIMIT, retryAt: null };
  }
}

/** Estado del cupo sin consumir (para que la UI pinte "2/3 hoy" o la cuenta atrás). */
export async function peekSeasonQuota(userId: string): Promise<SeasonQuotaResult> {
  const key = KEY(userId);
  try {
    const count = (await kv.get<number>(key)) ?? 0;
    if (count < LIMIT) {
      return { allowed: true, remaining: LIMIT - count, retryAt: null };
    }
    const ttl = await kv.ttl(key);
    return {
      allowed: false,
      remaining: 0,
      retryAt: ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : null,
    };
  } catch {
    return { allowed: true, remaining: LIMIT, retryAt: null };
  }
}

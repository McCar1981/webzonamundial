// src/lib/pro/cache.ts
//
// Caché KV del resultado de entitlements (60s por usuario). Vive en su propio
// archivo para que tanto entitlement.ts (lee/escribe) como subscriptions.ts
// (invalida desde el webhook) la compartan sin import circular.

import { kv } from "@vercel/kv";
import type { Entitlements } from "./entitlement";

export const CACHE_TTL_SECONDS = 60;

const cacheKey = (userId: string) => `pro:ent:${userId}`;

export async function readEntitlementsCache(userId: string): Promise<Entitlements | null> {
  try {
    const cached = await kv.get<Entitlements>(cacheKey(userId));
    return cached && typeof cached.isPro === "boolean" ? cached : null;
  } catch {
    return null;
  }
}

export async function writeEntitlementsCache(userId: string, value: Entitlements): Promise<void> {
  try {
    await kv.set(cacheKey(userId), value, { ex: CACHE_TTL_SECONDS });
  } catch {
    /* la caché es best-effort */
  }
}

/**
 * Invalida la caché de entitlements de un usuario. La llama el webhook de
 * Stripe en cada cambio de suscripción (alta, renovación, impago, baja).
 */
export async function clearEntitlementsCache(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await kv.del(cacheKey(userId));
  } catch {
    /* expira solo en 60s de todas formas */
  }
}

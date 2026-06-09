// src/lib/pro/entitlement.ts
//
// Entitlement del plan PRO — la pregunta única "¿este usuario es Pro?" que
// hace toda la app. Server-only: se resuelve siempre desde la sesión
// autenticada, nunca desde el cliente.
//
// Un usuario es Pro si:
//   · tiene suscripción Stripe activa (pro_subscriptions), O
//   · es Founder (los early adopters heredan Pro de por vida).
//
// El resultado se cachea en KV 60s por usuario (pro/cache.ts) para no golpear
// Supabase en cada request — las rutas calientes (predicciones, ia-coach,
// trivia) preguntan esto constantemente. El webhook de Stripe invalida la
// caché al cambiar el estado de la suscripción.

import { isFounder, isFounderByUserId } from "@/lib/founders/store";
import { getSubscription, subscriptionIsActive } from "./subscriptions";
import { readEntitlementsCache, writeEntitlementsCache } from "./cache";

export type ProSource = "subscription" | "founder" | null;

export interface Entitlements {
  isPro: boolean;
  isFounder: boolean;
  /** De dónde sale el acceso Pro (null si no es Pro). */
  source: ProSource;
  /** Fin del periodo pagado (ISO), solo si source = "subscription". */
  periodEnd: string | null;
  /** La suscripción está marcada para no renovar. */
  cancelAtPeriodEnd: boolean;
}

const FREE_ENTITLEMENTS: Entitlements = {
  isPro: false,
  isFounder: false,
  source: null,
  periodEnd: null,
  cancelAtPeriodEnd: false,
};

/**
 * Resuelve los entitlements completos de un usuario. Para gating simple usa
 * el atajo isPro(). Ante fallo de infraestructura degrada a Free (fail-closed
 * para no regalar acceso, igual que el resto de gates premium).
 */
export async function getEntitlements(
  userId: string | null | undefined,
  email?: string | null,
): Promise<Entitlements> {
  if (!userId && !email) return FREE_ENTITLEMENTS;

  if (userId) {
    const cached = await readEntitlementsCache(userId);
    if (cached) return cached;
  }

  const result = await resolveEntitlements(userId ?? null, email ?? null);

  if (userId) {
    await writeEntitlementsCache(userId, result);
  }
  return result;
}

async function resolveEntitlements(userId: string | null, email: string | null): Promise<Entitlements> {
  // 1) Founder (KV, barato). Lookup por email primero, luego por user_id —
  //    mismo orden que isPaseDT histórico.
  let founder = false;
  try {
    if (email) founder = await isFounder(email);
    if (!founder && userId) founder = await isFounderByUserId(userId);
  } catch {
    founder = false;
  }

  // 2) Suscripción Stripe activa.
  if (userId) {
    try {
      const sub = await getSubscription(userId);
      if (sub && subscriptionIsActive(sub)) {
        return {
          isPro: true,
          isFounder: founder,
          source: "subscription",
          periodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
      }
    } catch {
      /* caída de Supabase: el founder check de abajo aún puede salvar */
    }
  }

  if (founder) {
    return { isPro: true, isFounder: true, source: "founder", periodEnd: null, cancelAtPeriodEnd: false };
  }
  return FREE_ENTITLEMENTS;
}

/**
 * Atajo de gating: ¿tiene este usuario acceso Pro?
 * Acepta (userId, email) en cualquier combinación, como isPaseDT.
 */
export async function isPro(userId?: string | null, email?: string | null): Promise<boolean> {
  const ent = await getEntitlements(userId ?? null, email ?? null);
  return ent.isPro;
}

export { clearEntitlementsCache } from "./cache";

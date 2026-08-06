// src/lib/ia-coach/pro-quota.ts
//
// Cuota de negocio del IA Coach: en Free hay FREE_LIMITS.iaCoach.dailyQueries
// consultas IA al DÍA, compartidas entre todos los modos (Analyze, Live,
// Coach, Oracle). Pro = ilimitado. Independiente del rate limit anti-abuso
// (req/60s), que se mantiene para todos.
//
// La cuota se consume SOLO cuando hay generación real con Claude: las
// respuestas servidas desde caché no cuentan (no tienen coste marginal), por
// eso cada ruta llama a esto DESPUÉS del cache-miss, justo antes de llamar a
// Anthropic. Si la generación falla, la ruta devuelve la unidad (refund) para
// que el usuario no pierda su consulta del día por un error nuestro.

import { getEntitlements } from "@/lib/pro/entitlement";
import { isFreeWeekendActive } from "@/lib/pro/free-weekend";
import { consumeDailyQuota, refundDailyQuota } from "@/lib/pro/quota";
import { FREE_LIMITS } from "@/lib/pro/limits";
import { trackLimitHit } from "@/lib/pro/metrics";

const FEATURE = "ia-coach";

// Tope diario del IA Coach para NO pagadores DURANTE el finde gratis. Generoso
// (no se nota en uso humano real) pero finito: protege la única key de Anthropic
// de un agotamiento por pico de tráfico del Mundial. Configurable por env-var
// (FREE_WEEKEND_IA_COACH_CAP) sin redeploy; por defecto 25/día.
const FREE_WEEKEND_IA_COACH_CAP = Number(process.env.FREE_WEEKEND_IA_COACH_CAP) || 25;

export interface IaCoachQuotaResult {
  /** ¿Puede generar con IA esta petición? */
  allowed: boolean;
  /** Consultas restantes hoy (null = ilimitado, usuario Pro). */
  remaining: number | null;
  /** True si el usuario es Pro (para decidir refunds). */
  pro: boolean;
}

export async function consumeIaCoachQuota(user: {
  id: string;
  email: string | null;
}): Promise<IaCoachQuotaResult> {
  // Pagadores REALES (suscripción/founder) → ilimitado. Se mira el entitlement
  // REAL (getEntitlements), NO isPro(): durante el finde gratis isPro() es true
  // para todos y regalaría IA ilimitada a no-pagadores, agotando la key de Anthropic.
  const ent = await getEntitlements(user.id, user.email);
  if (ent.isPro) {
    return { allowed: true, remaining: null, pro: true };
  }
  // No-pagador: en el finde gratis el Coach sigue disponible, pero con un tope
  // diario de seguridad (coste Anthropic, key compartida). Fuera del finde, el
  // límite Free de siempre.
  const limit = isFreeWeekendActive() ? FREE_WEEKEND_IA_COACH_CAP : FREE_LIMITS.iaCoach.dailyQueries;
  const q = await consumeDailyQuota(user.id, FEATURE, limit);
  if (!q.allowed) trackLimitHit("ia_coach_daily");
  return { allowed: q.allowed, remaining: q.remaining, pro: false };
}

/** Devuelve la unidad consumida si la generación IA falló. */
export async function refundIaCoachQuota(userId: string): Promise<void> {
  await refundDailyQuota(userId, FEATURE);
}

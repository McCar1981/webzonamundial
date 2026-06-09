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

import { isPro } from "@/lib/pro/entitlement";
import { consumeDailyQuota, refundDailyQuota } from "@/lib/pro/quota";
import { FREE_LIMITS } from "@/lib/pro/limits";
import { trackLimitHit } from "@/lib/pro/metrics";

const FEATURE = "ia-coach";

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
  if (await isPro(user.id, user.email)) {
    return { allowed: true, remaining: null, pro: true };
  }
  const q = await consumeDailyQuota(user.id, FEATURE, FREE_LIMITS.iaCoach.dailyQueries);
  if (!q.allowed) trackLimitHit("ia_coach_daily");
  return { allowed: q.allowed, remaining: q.remaining, pro: false };
}

/** Devuelve la unidad consumida si la generación IA falló. */
export async function refundIaCoachQuota(userId: string): Promise<void> {
  await refundDailyQuota(userId, FEATURE);
}

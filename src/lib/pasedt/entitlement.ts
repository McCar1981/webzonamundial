// src/lib/pasedt/entitlement.ts
// Entitlement del "Pase DT" — la llave que desbloquea la Temporada en Vivo del
// Modo Carrera (la carrera avanza al ritmo de los resultados REALES del
// Mundial), la narrativa IA ilimitada y el resto de ventajas premium.
//
// DECISIÓN DE PRODUCTO (hoy):
//   El Pase DT está incluido en el plan PRO (y los Founders heredan Pro de
//   por vida), así que esta función delega en isPro(). Se mantiene como
//   alias para no tocar los puntos de llamada históricos del Modo Carrera;
//   código nuevo debe preguntar directamente por isPro() de @/lib/pro.
//
// Server-only: se resuelve siempre desde la sesión autenticada, nunca desde el
// cliente, para que no se pueda falsear el acceso premium.

import { isPro } from "@/lib/pro/entitlement";

/**
 * ¿Tiene este usuario acceso al Pase DT?
 * Equivale a tener Pro activo (suscripción Stripe o Founders Pass).
 */
export async function isPaseDT(email: string, userId?: string | null): Promise<boolean> {
  if (!email && !userId) return false;
  return isPro(userId ?? null, email || null);
}

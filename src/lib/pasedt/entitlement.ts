// src/lib/pasedt/entitlement.ts
// Entitlement del "Pase DT" — la llave que desbloquea la Temporada en Vivo del
// Modo Carrera (la carrera avanza al ritmo de los resultados REALES del
// Mundial), la narrativa IA ilimitada y el resto de ventajas premium.
//
// DECISIÓN DE PRODUCTO (hoy):
//   El Pase DT está incluido en el Founders Pass. No hay un SKU de pago aparte
//   todavía. Toda la app pregunta por `isPaseDT(email)` en lugar de `isFounder`
//   directamente, de modo que el día que exista un add-on independiente baste
//   con ampliar ESTA función (founder OR grant explícito) sin tocar ningún
//   punto de llamada (rutas API, gating de UI, etc.).
//
// Server-only: se resuelve siempre desde la sesión autenticada, nunca desde el
// cliente, para que no se pueda falsear el acceso premium.

import { isFounder, isFounderByUserId } from "@/lib/founders/store";

/**
 * ¿Tiene este usuario acceso al Pase DT?
 * Hoy: equivale a tener Founders Pass activo.
 * Mañana: founder OR miembro del set de Pase DT (add-on independiente).
 *
 * El lookup intenta por email (rápido, compatibilidad histórica) y, si no
 * encuentra, por user_id (robusto ante cambios de email).
 */
export async function isPaseDT(email: string, userId?: string | null): Promise<boolean> {
  if (!email && !userId) return false;
  if (email) {
    const byEmail = await isFounder(email);
    if (byEmail) return true;
  }
  if (userId) {
    return isFounderByUserId(userId);
  }
  return false;
}

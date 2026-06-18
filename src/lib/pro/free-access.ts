// src/lib/pro/free-access.ts
//
// Lista de cuentas con ACCESO LIBRE TOTAL (cortesía): los dueños/operadores de
// ZonaMundial. Estas cuentas resuelven como Pro de por vida sin pasar por Stripe
// ni por el Founders Pass, y SIN contar en las métricas de Founders ni de
// ingresos (no se tocan KV `founders:*`). Es el atajo limpio para que un puñado
// de cuentas internas tengan todo desbloqueado sin tener que "comprarse" nada.
//
// Patrón gemelo de `src/lib/ranking-exclusions.ts`: una sola lista central,
// editable en una línea. Añadir o quitar un email aquí basta — getEntitlements()
// la consulta antes que Stripe/Founders, así que el cambio cubre toda la app
// (predicciones, fantasy, Modo Carrera, IA Coach, trivia, stats, sin anuncios…).
//
// Server-only en la práctica: solo lo importa entitlement.ts, que es server.

/** Emails con acceso Pro de cortesía permanente (normalizados en minúsculas). */
const FREE_ACCESS_EMAILS: ReadonlySet<string> = new Set([
  "sprintmarkt@gmail.com",
  "imprelowcost.zamudio@gmail.com",
]);

/** ¿Esta cuenta tiene acceso libre total de cortesía? Tolerante a null/espacios/mayúsculas. */
export function isFreeAccessEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return FREE_ACCESS_EMAILS.has(email.trim().toLowerCase());
}

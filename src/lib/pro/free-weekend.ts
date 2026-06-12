// src/lib/pro/free-weekend.ts
//
// Campaña "Fin de semana abierto": durante esta ventana, isPro() devuelve true
// para TODO el mundo → se desbloquean TODAS las funciones Pro (un solo punto:
// el chokepoint isPro() en entitlement.ts).
//
// Lo que NO se toca a propósito:
//  · getEntitlements() sigue devolviendo el estado REAL → la landing /pro sigue
//    mostrando el botón de suscripción (para que la gente bloquee el precio
//    fundador antes de que cierre la ventana) y el checkout no cree que ya son Pro.
//  · Los anuncios siguen igual (los pinta el estado real) → no afecta a la
//    revisión de AdSense y deja un motivo más para pasarse a Pro.
//
// Server/client-safe: solo constantes y helpers puros (sin process.env).
//
// Para mover o cerrar la campaña, cambia solo estas dos fechas (hora de España,
// CEST = UTC+2 en junio).

/** Inicio: viernes 12-jun-2026, 00:00 España. */
export const FREE_WEEKEND_START_ISO = "2026-06-12T00:00:00+02:00";
/** Fin: lunes 15-jun-2026, 12:00 (mediodía) España. */
export const FREE_WEEKEND_END_ISO = "2026-06-15T12:00:00+02:00";

export function freeWeekendStart(): Date {
  return new Date(FREE_WEEKEND_START_ISO);
}
export function freeWeekendEnd(): Date {
  return new Date(FREE_WEEKEND_END_ISO);
}

/** ¿Está abierta la ventana de fin de semana gratis ahora mismo? */
export function isFreeWeekendActive(now: number = Date.now()): boolean {
  return now >= freeWeekendStart().getTime() && now < freeWeekendEnd().getTime();
}

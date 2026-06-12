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

/** Milisegundos que quedan hasta el cierre (0 si ya cerró). */
export function freeWeekendMsLeft(now: number = Date.now()): number {
  return Math.max(0, freeWeekendEnd().getTime() - now);
}

/**
 * Recta final: la ventana sigue abierta pero quedan menos de `hours` horas
 * (por defecto 20 → desde el domingo por la tarde). Para el aviso de urgencia.
 */
export function isFreeWeekendUrgency(hours = 20, now: number = Date.now()): boolean {
  if (!isFreeWeekendActive(now)) return false;
  return freeWeekendMsLeft(now) <= hours * 3_600_000;
}

/**
 * Ventana POSTERIOR al finde (cerrado hace < `days` días). Durante ella, el
 * paywall del lunes recuerda "lo probaste gratis este finde". Acota el mensaje
 * para que no se quede colgado para siempre.
 */
export function isPostFreeWeekendWindow(days = 5, now: number = Date.now()): boolean {
  const end = freeWeekendEnd().getTime();
  return now >= end && now < end + days * 86_400_000;
}

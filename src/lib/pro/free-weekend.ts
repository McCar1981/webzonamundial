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
// Helpers puros de fechas. Los dos gates de SERVIDOR (freeWeekendEnd /
// isFreeWeekendActive) además leen dos env-vars OPCIONALES para control en
// runtime sin redeploy: FREE_WEEKEND_UNTIL (mueve la hora de cierre) y
// FREE_WEEKEND_OVERRIDE=off (kill-switch instantáneo). En el bundle de cliente
// esas env-vars son undefined → se usa la fecha por defecto (comportamiento
// estable para la UI).

/** Inicio: viernes 12-jun-2026, 00:00 España. */
export const FREE_WEEKEND_START_ISO = "2026-06-12T00:00:00+02:00";
/**
 * Fin: lunes 15-jun-2026, 12:00 (mediodía) de MÉXICO (CDMX, UTC-6) = 20:00 CEST.
 * Se cierra a mediodía de México (no de España) para que la ventana acabe con la
 * audiencia mexicana DESPIERTA y poder empujar la conversión; antes cerraba a las
 * 04:00 CDMX. Override en runtime con la env-var FREE_WEEKEND_UNTIL.
 */
export const FREE_WEEKEND_END_ISO = "2026-06-15T12:00:00-06:00";

export function freeWeekendStart(): Date {
  return new Date(FREE_WEEKEND_START_ISO);
}
export function freeWeekendEnd(): Date {
  // Si FREE_WEEKEND_UNTIL (ISO) está definida y es válida, MANDA sobre la fecha
  // hardcodeada → permite extender/recortar el cierre desde Vercel sin redeploy.
  const until = process.env.FREE_WEEKEND_UNTIL;
  if (until) {
    const t = Date.parse(until);
    if (Number.isFinite(t)) return new Date(t);
  }
  return new Date(FREE_WEEKEND_END_ISO);
}

/** ¿Está abierta la ventana de fin de semana gratis ahora mismo? */
export function isFreeWeekendActive(now: number = Date.now()): boolean {
  // Kill-switch de emergencia: FREE_WEEKEND_OVERRIDE=off cierra la campaña al
  // instante, sin esperar a la fecha ni redeployar. Cualquier otro valor (o
  // ausencia) deja decidir a la ventana de fechas.
  if ((process.env.FREE_WEEKEND_OVERRIDE ?? "").toLowerCase() === "off") return false;
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

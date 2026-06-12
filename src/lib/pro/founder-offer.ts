// src/lib/pro/founder-offer.ts
//
// Oferta "Precio Fundador": quien se suscribe a Pro ANTES del fin del Mundial
// conserva el precio de lanzamiento DE POR VIDA. Es honesto por arquitectura:
// el checkout usa price_data inline con `recurring`, así que Stripe fija el
// importe del momento en la suscripción; subir PRO_PRICES más adelante NO
// afecta a quienes ya estén suscritos. Tras la fecha límite, el plan sube.
//
// Server/client-safe: solo constantes y helpers puros (sin process.env).

/**
 * Fin de la ventana fundador = final del Mundial 2026 (19-jul-2026, 23:59 hora
 * del Este). Para mover la fecha, cambia solo esta constante.
 */
export const FOUNDER_DEADLINE_ISO = "2026-07-19T23:59:59-04:00";

/** Fecha límite de la oferta fundador como Date. */
export function founderDeadline(): Date {
  return new Date(FOUNDER_DEADLINE_ISO);
}

/** ¿Sigue abierta la ventana fundador? */
export function isFounderWindowOpen(now: number = Date.now()): boolean {
  return now < founderDeadline().getTime();
}

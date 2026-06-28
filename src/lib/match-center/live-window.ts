// src/lib/match-center/live-window.ts
//
// Detector de "¿hay algún partido del Mundial en ventana en vivo ahora mismo?"
// basado EXCLUSIVAMENTE en el calendario estático (src/data/matches.ts). No lee
// Supabase, ni KV, ni api-football: es pura aritmética de fechas, coste cero.
//
// Lo usan los crones de liquidación (settle-live-picks, resolve-micro) que SOLO
// tienen trabajo real alrededor de los partidos: las micro-predicciones y los
// live-picks solo se generan en partidos del Mundial (processMicroGeneration y
// authoritativeState rechazan cualquier match_id que no esté en este calendario).
// Fuera de toda ventana corrían a Supabase cada minuto las 24h sin nada que
// hacer; este detector permite saltarse esa lectura inútil y bajar el egress.

import { MATCHES } from "@/data/matches";

// Mismos márgenes que usa match-center-poll para definir la ventana de sondeo:
// 30 min antes del saque y 210 min después (cubre prórroga + penaltis).
const PREKICK_MS = 30 * 60_000;
const POSTMATCH_MS = 210 * 60_000;

// Cadencia del barrido de seguridad cuando NO hay ningún partido en ventana.
// Garantiza que cualquier rezagado (p. ej. el feed de api-football se cayó justo
// al final de un partido y un pago quedó pendiente más allá de los 210 min) se
// acabe liquidando, solo que en horas muertas y sin nadie mirando la pantalla.
const SWEEP_EVERY_MIN = 15;

// Horarios de MATCHES en Eastern Time (EDT en jun-jul 2026 = UTC-4). Idéntico
// criterio que match-center-poll.kickoffMs para mantener una sola fuente de verdad.
function kickoffMs(date: string, time: string): number {
  const iso = `${date}T${time.length === 5 ? time : "00:00"}:00-04:00`;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NaN : t;
}

/** ¿Hay algún partido del Mundial dentro de su ventana en vivo en `now`?
 *  Pura aritmética sobre el calendario estático: cero lecturas externas. */
export function anyMatchLive(now: number = Date.now()): boolean {
  for (const m of MATCHES) {
    const ko = kickoffMs(m.d, m.t);
    if (Number.isNaN(ko)) continue;
    if (now >= ko - PREKICK_MS && now <= ko + POSTMATCH_MS) return true;
  }
  return false;
}

/** Guarda de coste para los crones de liquidación.
 *  - Si hay partido en ventana → SIEMPRE activo (corre cada minuto, igual que hoy:
 *    la experiencia en vivo no cambia ni un segundo).
 *  - Si no hay ninguno → solo deja pasar un barrido cada SWEEP_EVERY_MIN minutos,
 *    suficiente para cazar rezagados sin pegarle a Supabase cada minuto en balde.
 *  Nunca se pierde un pago: como mucho, en horas sin partido, llega unos minutos
 *  más tarde (y entonces nadie está esperando una liquidación en pantalla). */
export function shouldRunSettlementCron(now: number = Date.now()): boolean {
  if (anyMatchLive(now)) return true;
  return new Date(now).getUTCMinutes() % SWEEP_EVERY_MIN === 0;
}

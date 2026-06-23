"use client";
// src/lib/analytics/track-event.ts
//
// Helper mínimo para emitir eventos de GA4 (gtag) desde componentes cliente.
// Misma propiedad que carga layout.tsx (G-J9NWM9GNRK). El page_view ya lo
// gestiona GoogleAnalyticsRouteTracker; esto cubre los eventos del EMBUDO de
// pago — paywall_view, begin_checkout y purchase — que hasta ahora NO existían,
// de modo que la conversión Free → Pro sea por fin medible en GA4.
//
// Fail-safe: si gtag aún no inicializó (carrera con el consentimiento), encola
// en dataLayer (gtag.js procesa la cola al cargar); nunca lanza: la analítica
// jamás debe romper el flujo de pago.

const GA_MEASUREMENT_ID = "G-J9NWM9GNRK";

// Asocia las sesiones del mismo usuario en GA4 (user_id = uid de Supabase).
// CLAVE para el embudo: el alta por magic-link se completa en una 2.ª sesión
// (el usuario sale al correo y vuelve); sin user_id, GA4 no puede coser esa
// sesión con la visita original (p.ej. la ola de /grupos/mejores-terceros) y la
// conversión queda infravalorada. El uid es un UUID pseudónimo, no PII.
export function setGaUserId(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  try {
    if (typeof w.gtag === "function") {
      w.gtag("set", { user_id: userId });
    } else {
      (w.dataLayer = w.dataLayer || []).push(["set", { user_id: userId }]);
    }
  } catch {
    /* la analítica nunca debe romper la app */
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const payload = { send_to: GA_MEASUREMENT_ID, ...params };
  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  try {
    if (typeof w.gtag === "function") {
      w.gtag("event", name, payload);
    } else {
      (w.dataLayer = w.dataLayer || []).push(["event", name, payload]);
    }
  } catch {
    /* la analítica nunca debe romper el flujo de pago */
  }
}

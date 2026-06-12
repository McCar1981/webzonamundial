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

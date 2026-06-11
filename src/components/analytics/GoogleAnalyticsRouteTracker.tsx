"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Misma propiedad GA4 que carga layout.tsx. El ID es público.
const GA_MEASUREMENT_ID = "G-J9NWM9GNRK";

/**
 * Emite un page_view de GA4 en CADA cambio de ruta del App Router.
 *
 * El problema que resuelve: Next.js navega entre páginas con la History API
 * (sin recarga completa), y el `gtag('config', …)` de layout.tsx solo emite
 * el page_view automático de la PRIMERA carga. Sin esto, toda la navegación
 * interna (lobby → /app/predicciones → /app/fantasy, etc.) dependía solo de
 * la "medición mejorada" de GA4 y del timing del consentimiento — y en la
 * práctica esas vistas SPA no se registraban (tráfico invisible en GA4).
 *
 * El page_view de la carga inicial lo sigue emitiendo el config de layout.tsx,
 * así que aquí saltamos el primer render y emitimos uno por cada navegación
 * posterior: ni se pierde la primera vista ni se duplica.
 */
function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skipFirst = useRef(true);

  useEffect(() => {
    if (!pathname) return;
    // La primera vista ya la cuenta gtag('config') en layout.tsx.
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }

    const qs = searchParams?.toString();
    const pagePath = qs ? `${pathname}?${qs}` : pathname;
    const payload = {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
      send_to: GA_MEASUREMENT_ID,
    };

    const w = window as unknown as {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    if (typeof w.gtag === "function") {
      w.gtag("event", "page_view", payload);
    } else {
      // Carrera rarísima: gtag.js aún no inicializó. Encolamos en dataLayer
      // (gtag.js procesa la cola al cargar), así no se pierde la vista.
      (w.dataLayer = w.dataLayer || []).push(["event", "page_view", payload]);
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * useSearchParams() exige un límite de Suspense en el App Router; sin él la
 * ruta se deopta a CSR y rompe el build estático. Por eso envolvemos aquí.
 */
export default function GoogleAnalyticsRouteTracker() {
  return (
    <Suspense fallback={null}>
      <RouteChangeTracker />
    </Suspense>
  );
}

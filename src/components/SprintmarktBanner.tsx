"use client";

// Banner de casa Sprintmarkt (la agencia que construye ZonaMundial). Imagen
// PROPIA diseñada por Carlos. Responsive con <picture>: en móvil (<=768px) carga
// la versión 3:2, en escritorio la 4:1. Todo el banner enlaza a sprintmarkt.com
// (UTM house) y mide el clic en GA4 (`sprintmarkt_banner_click`). Lo monta
// RootLayoutClient SOLO en páginas públicas (oculto en /app), encima del footer.
// Coste cero, sin red de anuncios. Imágenes optimizadas en /public/img/sprintmarkt.

import { trackEvent } from "@/lib/analytics/track-event";

const SPRINTMARKT_URL =
  "https://sprintmarkt.com/?utm_source=zonamundial&utm_medium=banner&utm_campaign=house";

export default function SprintmarktBanner() {
  return (
    <section style={{ padding: "0 16px", margin: "10px auto 30px", maxWidth: 1100 }}>
      <a
        href={SPRINTMARKT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent("sprintmarkt_banner_click", { placement: "footer" })
        }
        aria-label="Sprintmarkt — IA, software y marketing digital"
        style={{
          display: "block",
          borderRadius: 14,
          overflow: "hidden",
          lineHeight: 0,
        }}
      >
        <picture>
          <source
            media="(max-width: 768px)"
            srcSet="/img/sprintmarkt/sprintmarkt-movil.jpg"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/sprintmarkt/sprintmarkt-desktop.jpg"
            alt="Sprintmarkt — IA, software y marketing digital: webs, software a medida e inteligencia artificial para tu negocio."
            loading="lazy"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </picture>
      </a>
    </section>
  );
}

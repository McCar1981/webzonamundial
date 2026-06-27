"use client";

// Banner "de casa": promociona Sprintmarkt (la agencia que construye ZonaMundial)
// usando la propia plataforma como ESCAPARATE. Coste cero, sin red de anuncios,
// sin intermediarios. Lo monta RootLayoutClient SOLO en paginas publicas (oculto
// en /app), justo encima del footer. Cada clic emite el evento GA4
// `sprintmarkt_banner_click` para medir el interes. Valor por contacto alto:
// un cliente de agencia vale mucho mas que cualquier afiliado.

import { trackEvent } from "@/lib/analytics/track-event";

const SPRINTMARKT_URL =
  "https://www.sprintmarkt.com/?utm_source=zonamundial&utm_medium=banner&utm_campaign=house";

export default function SprintmarktBanner() {
  return (
    <section style={{ padding: "0 16px", margin: "10px auto 30px", maxWidth: 1080 }}>
      <a
        href={SPRINTMARKT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("sprintmarkt_banner_click", { placement: "footer" })}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
          justifyContent: "space-between",
          padding: "18px 22px",
          borderRadius: 18,
          textDecoration: "none",
          background:
            "linear-gradient(135deg, rgba(201,168,76,0.14), rgba(11,24,37,0.65))",
          border: "1px solid rgba(201,168,76,0.32)",
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#8a94b0",
            }}
          >
            Hecho por Sprintmarkt
          </span>
          <h2
            style={{
              margin: "6px 0 5px",
              fontSize: 19,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            ¿Quieres una plataforma así para tu negocio?
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "#a8b2c8", lineHeight: 1.5 }}>
            Agencia digital en Valencia — webs, software a medida, apps e
            inteligencia artificial. Esta plataforma la hemos construido nosotros.
          </p>
        </div>
        <span
          style={{
            flexShrink: 0,
            display: "inline-block",
            padding: "12px 22px",
            borderRadius: 12,
            background: "linear-gradient(135deg,#c9a84c,#e8d48b)",
            color: "#0e1c33",
            fontWeight: 800,
            fontSize: 14.5,
            whiteSpace: "nowrap",
          }}
        >
          Descubre Sprintmarkt →
        </span>
      </a>
    </section>
  );
}

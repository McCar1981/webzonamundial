// src/app/opengraph-image.tsx
//
// OG image dinámico para toda la web (root layout). Tamaño 1200×630 que
// usan Telegram, WhatsApp, Twitter/X, Facebook, LinkedIn, Discord, Slack
// y Google al hacer preview de un link.
//
// Reemplaza el viejo /public/og-image.jpg estático. Servido como PNG
// generado en build/edge.
//
// Para regenerar el preview en Telegram/WhatsApp tras cambios: las apps
// cachean ~24-48h. Si quieres forzar update, comparte el link a tester
// como https://search.google.com/test/rich-results y verifica.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ZonaMundial — Predicciones y Fantasy del Mundial 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LOGO_URL = "https://zonamundial.app/img/email/logo-zonamundial.png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.18), transparent 60%), linear-gradient(180deg, #060B14 0%, #0B1825 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Top accent band */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background:
              "linear-gradient(90deg, #C9A84C 0%, #FDE68A 50%, #C9A84C 100%)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: "70px 80px",
            flex: 1,
            gap: 56,
          }}
        >
          {/* Logo */}
          <img
            src={LOGO_URL}
            width={280}
            height={280}
            alt=""
            style={{
              display: "flex",
              objectFit: "contain",
            }}
          />

          {/* Texto */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 22,
                letterSpacing: "0.18em",
                color: "#C9A84C",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 18,
                display: "flex",
              }}
            >
              · MUNDIAL 2026 ·
            </div>
            <div
              style={{
                fontSize: 86,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                color: "#ffffff",
                display: "flex",
              }}
            >
              ZONA
              <span style={{ color: "#C9A84C", display: "flex" }}>MUNDIAL</span>
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#94A3B8",
                marginTop: 24,
                lineHeight: 1.3,
                fontWeight: 500,
                display: "flex",
              }}
            >
              Predicciones · Fantasy · IA Coach
            </div>
            <div
              style={{
                fontSize: 22,
                color: "#64748B",
                marginTop: 12,
                display: "flex",
              }}
            >
              48 selecciones · 16 sedes · 104 partidos
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 80px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: "#FDE68A",
              fontWeight: 700,
              letterSpacing: "0.04em",
              display: "flex",
            }}
          >
            zonamundial.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

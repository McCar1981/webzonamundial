// src/app/bares/opengraph-image.tsx
//
// OG image dinámico ESPECÍFICO de la landing /bares (Porra Digital para
// Bares). Por convención de Next.js, este archivo hace que las previews de
// WhatsApp, Telegram, Twitter/X, Facebook, LinkedIn, Discord, Slack y Google
// para cualquier URL bajo /bares usen ESTA imagen en vez de la genérica de ZM
// (src/app/opengraph-image.tsx).
//
// Mismo tamaño 1200×630 y estética (azul marino + dorado), pero con copy
// orientado al dueño del bar: QR, ranking del local, premios y pago único.
//
// Las apps cachean el preview ~24-48h. Para forzar el refresco tras deploy:
// usar el Facebook Sharing Debugger (https://developers.facebook.com/tools/debug/)
// y volver a "Scrape", o compartir el link con un sufijo ?v=2.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Porra Digital para Bares — ZonaMundial";
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
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.18), transparent 60%), linear-gradient(180deg, #000000 0%, #0a0906 100%)",
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
            padding: "64px 80px",
            flex: 1,
            gap: 56,
          }}
        >
          {/* Logo */}
          <img
            src={LOGO_URL}
            width={240}
            height={240}
            alt=""
            style={{ display: "flex", objectFit: "contain" }}
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
                letterSpacing: "0.16em",
                color: "#C9A84C",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 16,
                display: "flex",
              }}
            >
              · PORRA DIGITAL · MUNDIAL 2026 ·
            </div>
            <div
              style={{
                fontSize: 76,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1.02,
                color: "#ffffff",
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              La porra de&nbsp;
              <span style={{ color: "#C9A84C", display: "flex" }}>tu bar</span>
            </div>
            <div
              style={{
                fontSize: 30,
                color: "#a69a82",
                marginTop: 22,
                lineHeight: 1.3,
                fontWeight: 500,
                display: "flex",
              }}
            >
              QR en la barra · Ranking del local · Incentivos que pones tú
            </div>
            <div
              style={{
                marginTop: 22,
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid rgba(201,168,76,0.5)",
                background: "rgba(201,168,76,0.10)",
                fontSize: 24,
                color: "#FDE68A",
                fontWeight: 800,
                display: "flex",
              }}
            >
              100% gratis · Sin pagos
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
            zonamundial.app/bares
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

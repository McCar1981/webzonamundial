// src/app/empresas/opengraph-image.tsx
//
// OG image dinámico ESPECÍFICO de la landing /empresas (Porra Corporativa para
// Empresas). Por convención de Next.js, hace que las previews de WhatsApp,
// Telegram, Twitter/X, Facebook, LinkedIn, Discord, Slack y Google para
// cualquier URL bajo /empresas usen ESTA imagen en vez de la genérica de ZM.
//
// Mismo tamaño 1200×630 y estética (azul marino + dorado), con copy orientado a
// RRHH/manager: liga privada, ranking por departamentos, pago único con factura.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Porra Corporativa para Empresas — ZonaMundial";
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
              · PORRA CORPORATIVA · MUNDIAL 2026 ·
            </div>
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1.02,
                color: "#ffffff",
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              La liga del Mundial de&nbsp;
              <span style={{ color: "#C9A84C", display: "flex" }}>tu empresa</span>
            </div>
            <div
              style={{
                fontSize: 30,
                color: "#94A3B8",
                marginTop: 22,
                lineHeight: 1.3,
                fontWeight: 500,
                display: "flex",
              }}
            >
              Liga privada · Ranking por departamentos · Team building
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
              Pago único · Con factura
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
            zonamundial.app/empresas
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

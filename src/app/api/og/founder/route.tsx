// src/app/api/og/founder/route.tsx
// OG image dinámica para que cada Founder pueda compartir su insignia.
//
// GET /api/og/founder?n=42&name=carlos
// Devuelve PNG 1200×630 con: nombre + "FOUNDER #42" + branding + estadio.
//
// Edge runtime (rapidísimo). El número y nombre llegan por query — los
// validamos sin tocar KV (la verificación de quién es founder se hace
// en /api/checkout, aquí sólo es la imagen).

import { ImageResponse } from "next/og";

export const runtime = "edge";

const GOLD_GRAD = "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const num = (url.searchParams.get("n") || "?").slice(0, 6);
  const name = decodeURIComponent(url.searchParams.get("name") || "Founder").slice(0, 28);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.18), transparent 70%), linear-gradient(180deg, #000000, #0a0906)",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* Decorativo: glow superior */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: "50%",
            transform: "translateX(-50%)",
            width: 800,
            height: 320,
            background: "radial-gradient(ellipse, rgba(201,168,76,0.25), transparent 70%)",
            display: "flex",
          }}
        />

        {/* Header brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: GOLD_GRAD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            🏆
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", display: "flex" }}>
              <span>zonamundial</span>
              <span style={{ color: "#C9A84C", marginLeft: 4 }}>.app</span>
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#a69a82",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
                display: "flex",
              }}
            >
              Founders Pass · Mundial 2026
            </div>
          </div>
        </div>

        {/* Cuerpo principal */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#C9A84C",
              fontWeight: 700,
              marginBottom: 18,
              display: "flex",
            }}
          >
            {/* FOUNDER #{num} */}
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 0.96,
              backgroundImage: GOLD_GRAD,
              backgroundClip: "text",
              color: "transparent",
              display: "flex",
              wordBreak: "break-word",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#e6decb",
              marginTop: 24,
              maxWidth: 800,
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            está apoyando ZonaMundial desde el primer día.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 24,
            borderTop: "1px solid rgba(201,168,76,0.25)",
          }}
        >
          <div style={{ fontSize: 18, color: "#a69a82", display: "flex" }}>
            Únete al equipo Founders →
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              padding: "10px 22px",
              borderRadius: 99,
              background: GOLD_GRAD,
              color: "#1A1208",
              display: "flex",
            }}
          >
            zonamundial.app/founders
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    }
  );
}

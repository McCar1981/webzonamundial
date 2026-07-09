// src/app/api/og/ligas-partido/route.tsx
//
// Imagen OG dinámica de un partido de Zona de Ligas: cuando se comparte el enlace
// (WhatsApp, Twitter, Telegram), sale una tarjeta branded 1200×630 con los dos
// equipos, el marcador/estado y la competición. Edge runtime. Basada en texto (no
// escudos externos) para ser rápida y fiable.
//
// GET /api/og/ligas-partido?comp=..&home=..&away=..&score=..&sub=..

import { ImageResponse } from "next/og";

export const runtime = "edge";

const GOLD = "#C9A84C";

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const comp = (p.get("comp") || "Zona de Ligas").slice(0, 40);
  const home = (p.get("home") || "Local").slice(0, 24);
  const away = (p.get("away") || "Visitante").slice(0, 24);
  const score = (p.get("score") || "vs").slice(0, 12);
  const sub = (p.get("sub") || "").slice(0, 40);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.20), transparent 65%), linear-gradient(180deg, #060B14, #0B1825)",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: "56px 72px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: 3, color: GOLD }}>{comp.toUpperCase()}</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#9db0c9" }}>zonamundial.app</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: 28 }}>
          <span style={{ display: "flex", flex: 1, justifyContent: "flex-end", textAlign: "right", fontSize: 56, fontWeight: 800 }}>{home}</span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 180 }}>
            <span style={{ fontSize: 72, fontWeight: 900, color: GOLD }}>{score}</span>
            {sub ? <span style={{ fontSize: 24, fontWeight: 600, color: "#9db0c9", marginTop: 6 }}>{sub}</span> : null}
          </span>
          <span style={{ display: "flex", flex: 1, justifyContent: "flex-start", textAlign: "left", fontSize: 56, fontWeight: 800 }}>{away}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#dbe4f0" }}>No leas el partido. Juégalo.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

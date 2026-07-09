// src/app/api/og/ligas-competicion/route.tsx
//
// Imagen OG dinámica de una competición de Zona de Ligas (página /ligas/[slug]):
// al compartir "LaLiga en ZonaMundial" sale una tarjeta branded 1200×630 con el
// nombre de la competición, el país y el gancho. Edge, basada en texto.
//
// GET /api/og/ligas-competicion?comp=LaLiga&country=España

import { ImageResponse } from "next/og";

export const runtime = "edge";

const GOLD = "#C9A84C";

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const comp = (p.get("comp") || "Zona de Ligas").slice(0, 40);
  const country = (p.get("country") || "").slice(0, 40);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.20), transparent 65%), linear-gradient(180deg, #060B14, #0B1825)",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: "56px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: 5, color: GOLD }}>ZONA DE LIGAS</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#9db0c9" }}>zonamundial.app</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 84, fontWeight: 900, lineHeight: 1.05 }}>{comp}</span>
          {country ? <span style={{ fontSize: 30, fontWeight: 600, color: "#9db0c9", marginTop: 8 }}>{country}</span> : null}
          <span style={{ fontSize: 30, fontWeight: 600, color: "#dbe4f0", marginTop: 18 }}>Calendario, resultados y clasificación en vivo</span>
        </div>

        <span style={{ fontSize: 30, fontWeight: 700, color: GOLD }}>No leas el partido. Juégalo.</span>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

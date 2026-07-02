// src/app/api/og/tu-mundial/route.tsx
//
// OG image dinámica del recuerdo "Tu Mundial 2026" para que cada usuario comparta
// su tarjeta. GET /api/og/tu-mundial?name=..&pts=..&ok=..&acc=..&rank=..&coins=..
// Devuelve PNG 1200×630 branded. Edge runtime. Las cifras llegan por query y se
// sanean en statsFromParams: es una tarjeta para presumir, no un dato verificado
// (mismo criterio que /api/og/founder).

import { ImageResponse } from "next/og";
import { statsFromParams } from "@/lib/tu-mundial/share";

export const runtime = "edge";

const GOLD = "#C9A84C";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(201,168,76,0.28)",
        borderRadius: 20,
        padding: "22px 10px",
        width: 250,
      }}
    >
      <span style={{ fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 20, color: "#9db0c9", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const s = statsFromParams(url.searchParams);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.18), transparent 65%), linear-gradient(180deg, #060B14, #0B1825)",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: "56px 72px",
          position: "relative",
        }}
      >
        {/* Header: eyebrow + marca */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: 6, color: GOLD }}>
            TU MUNDIAL 2026
          </span>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#cbd5e1" }}>zonamundial.app</span>
        </div>

        {/* Nombre */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
          <span style={{ fontSize: 34, color: "#9db0c9", fontWeight: 600 }}>El Mundial de</span>
          <span style={{ fontSize: 76, fontWeight: 900, color: "#fff", lineHeight: 1.05 }}>{s.name}</span>
        </div>

        {/* Grid de stats principales */}
        <div style={{ display: "flex", gap: 18, marginTop: 40 }}>
          <Stat label="Puntos" value={s.points.toLocaleString("es")} />
          <Stat label="Aciertos" value={String(s.correct)} />
          <Stat label="Acierto" value={`${s.accuracy}%`} />
          <Stat label="Puesto" value={s.rank == null ? "—" : `#${s.rank}`} />
        </div>

        {/* Fila inferior: nivel + coins + álbum */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            marginTop: "auto",
            fontSize: 26,
            color: "#cbd5e1",
            fontWeight: 700,
          }}
        >
          <span style={{ display: "flex", color: GOLD }}>Nivel {s.level}</span>
          <span style={{ display: "flex" }}>{s.coins.toLocaleString("es")} Fútcoins</span>
          {s.albumPct > 0 && <span style={{ display: "flex" }}>Álbum {s.albumPct}%</span>}
          {s.perfect > 0 && <span style={{ display: "flex" }}>{s.perfect} pleno(s)</span>}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

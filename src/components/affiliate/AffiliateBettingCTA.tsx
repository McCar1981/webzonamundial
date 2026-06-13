"use client";

// Banner de apuestas (afiliado 1xBet, creatividad oficial 300x250 de 1xPartners).
// Pregunta a /api/affiliate/geo si el visitante puede verlo (solo paises LATAM;
// NUNCA Espana — ilegal). FAIL-CLOSED: empieza OCULTO y solo se muestra si la API
// confirma allowed:true. Client component → sirve en paginas de cliente y servidor.

import { useEffect, useState } from "react";

interface GeoResp {
  allowed: boolean;
  bannerUrl: string | null;
}

export default function AffiliateBettingCTA() {
  const [data, setData] = useState<GeoResp | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/affiliate/geo")
      .then((r) =>
        r.ok ? (r.json() as Promise<GeoResp>) : { allowed: false, bannerUrl: null }
      )
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        /* fail-closed: ante cualquier error, queda oculto */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!data?.allowed || !data.bannerUrl) return null;

  return (
    <div style={{ margin: "18px auto", padding: "0 16px", textAlign: "center" }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#7E94AD",
          marginBottom: 6,
        }}
      >
        Publicidad
      </div>
      <iframe
        src={data.bannerUrl}
        width={300}
        height={250}
        scrolling="no"
        title="1xBet"
        style={{
          border: 0,
          display: "inline-block",
          maxWidth: "100%",
          borderRadius: 12,
        }}
      />
      <div style={{ fontSize: 11, color: "#6b7c90", marginTop: 6 }}>
        +18 · Juega con responsabilidad
      </div>
    </div>
  );
}

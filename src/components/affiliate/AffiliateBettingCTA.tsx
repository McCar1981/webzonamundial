"use client";

// CTA de apuestas (afiliado 1xBet). Pregunta a /api/affiliate/geo si el
// visitante puede verlo (solo paises LATAM; NUNCA Espana — ilegal). FAIL-CLOSED:
// empieza OCULTO y solo se muestra si la API confirma allowed:true. Es un client
// component, asi que sirve igual en paginas de cliente y de servidor.

import { useEffect, useState } from "react";

const GOLD = "#C9A84C";

interface GeoResp {
  allowed: boolean;
  url: string | null;
}

export default function AffiliateBettingCTA({ matchLabel }: { matchLabel?: string }) {
  const [data, setData] = useState<GeoResp | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/affiliate/geo")
      .then((r) => (r.ok ? (r.json() as Promise<GeoResp>) : { allowed: false, url: null }))
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

  if (!data?.allowed || !data.url) return null;

  const title = matchLabel
    ? `¿Tan seguro de ${matchLabel}?`
    : "¿Tan seguro de tu pronóstico?";

  return (
    <div style={{ maxWidth: 520, margin: "16px auto", padding: "0 16px" }}>
      <div
        style={{
          background: "linear-gradient(135deg,#0F1D32,#0B1825)",
          border: `1px solid ${GOLD}33`,
          borderRadius: 16,
          padding: "16px 18px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#7E94AD",
          }}
        >
          Publicidad
        </span>
        <h3 style={{ margin: "6px 0 2px", fontSize: 17, fontWeight: 800, color: "#fff" }}>
          {title}
        </h3>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#B9C7D8" }}>
          Llévalo a 1xBet y apuesta este partido.
        </p>
        <a
          href={data.url}
          target="_blank"
          rel="nofollow sponsored noopener"
          style={{
            display: "inline-block",
            padding: "11px 26px",
            background: `linear-gradient(135deg, ${GOLD}, #FDE68A)`,
            color: "#1A1208",
            textDecoration: "none",
            borderRadius: 99,
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          Apostar en 1xBet →
        </a>
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#6b7c90" }}>
          +18 · Juega con responsabilidad
        </p>
      </div>
    </div>
  );
}

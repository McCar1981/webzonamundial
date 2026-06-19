"use client";

// Banner de apuestas (afiliado Betcris, creatividad oficial). Pregunta a
// /api/affiliate/geo si el visitante puede verlo (solo paises LATAM donde Betcris
// opera; NUNCA Espana). FAIL-CLOSED: empieza OCULTO y solo se muestra si la API
// confirma allowed:true. El banner es una IMAGEN con ENLACE (no iframe), por eso
// la CSP (img-src https:) ya lo permite sin cambios. Solo se monta dentro de /app
// (usuarios logueados), nunca en paginas publicas indexadas.

import { useEffect, useState } from "react";

interface GeoResp {
  allowed: boolean;
  imageUrl: string | null;
  clickUrl: string | null;
}

export default function AffiliateBettingCTA() {
  const [data, setData] = useState<GeoResp | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/affiliate/geo")
      .then((r) =>
        r.ok
          ? (r.json() as Promise<GeoResp>)
          : { allowed: false, imageUrl: null, clickUrl: null }
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

  if (!data?.allowed || !data.imageUrl || !data.clickUrl) return null;

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
      <a
        href={data.clickUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        style={{
          display: "block",
          maxWidth: 300,
          margin: "0 auto",
          lineHeight: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.imageUrl}
          alt="Promoción Betcris"
          loading="lazy"
          style={{
            // Responsive sin recortar: nunca mas ancho que el contenedor
            // (max 300px) ni mas alto que 300px. Una creatividad vertical (9:16)
            // se limita por la ALTURA (no domina la pantalla); una horizontal,
            // por el ancho. Vale para cualquier tamano de banner que pongamos.
            maxWidth: "100%",
            maxHeight: 300,
            width: "auto",
            height: "auto",
            display: "block",
            margin: "0 auto",
            border: 0,
            borderRadius: 12,
          }}
        />
      </a>
      <div style={{ fontSize: 11, color: "#6b7c90", marginTop: 6 }}>
        +18 · Juega con responsabilidad
      </div>
    </div>
  );
}

// src/app/grupos/mejores-terceros/StickyCta.tsx
// Barra de conversión fija e inferior para la landing de "mejores terceros".
// El 99% del tráfico de esta página (SEO, alta intención) lee la tabla y se va
// sin un segundo clic: el CTA del pie no se ve nunca. Esta barra mantiene la
// llamada a la acción visible siga donde siga el scroll. Descartable en sesión.
// Cliente mínimo: el contenido SEO de la página sigue siendo server-render.
"use client";

import { useState } from "react";
import Link from "next/link";

const GOLD = "#c9a84c";

export default function StickyCta() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <div
      role="region"
      aria-label="Jugar gratis en ZonaMundial"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "10px 40px 10px 14px",
        background: "rgba(6,11,20,0.94)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(201,168,76,0.28)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <span style={{ color: "#fff", fontSize: 13.5, fontWeight: 600 }}>
        Predice quién pasa · gratis
      </span>
      <Link
        href="/registro"
        style={{
          background: GOLD,
          color: "#0B0F1A",
          fontWeight: 800,
          fontSize: 14,
          padding: "9px 18px",
          borderRadius: 10,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        Jugar →
      </Link>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Cerrar"
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          color: "#6a7a9a",
          fontSize: 20,
          lineHeight: 1,
          cursor: "pointer",
          padding: 6,
        }}
      >
        ×
      </button>
    </div>
  );
}

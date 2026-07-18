"use client";

// src/components/ads/AdInArticle.tsx
// Anuncio in-article optimizado para insertar entre párrafos de artículos
// (noticias, blog). Usa formato "fluid" para adaptarse al ancho del contenedor.
//
// Uso típico:
//   <AdInArticle />
//   <AdInArticle slot="1234567890" />

import AdUnit from "./AdUnit";
import { AD_SLOTS } from "@/lib/adsense";

interface Props {
  /** Slot personalizado. Si no se pasa, usa AD_SLOTS.inArticle. */
  slot?: string;
  /** Estilos adicionales. */
  style?: React.CSSProperties;
}

export default function AdInArticle({ slot, style }: Props) {
  const adSlot = slot || AD_SLOTS.inArticle;

  if (!adSlot) return null;

  return (
    <div
      style={{
        margin: "32px 0",
        padding: "16px 0",
        borderTop: "1px solid rgba(201,168,76,0.08)",
        borderBottom: "1px solid rgba(201,168,76,0.08)",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#8b8168",
          marginBottom: 8,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        Publicidad
      </div>
      <AdUnit
        slot={adSlot}
        format="fluid"
        label="Publicidad in-article"
      />
    </div>
  );
}

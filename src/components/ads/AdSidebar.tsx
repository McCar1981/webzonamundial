"use client";

// src/components/ads/AdSidebar.tsx
// Anuncio de sidebar para columnas laterales en listados y hubs.
// Formato "auto" con min-height para minimizar CLS.
//
// Uso típico:
//   <AdSidebar />
//   <AdSidebar slot="1234567890" />

import AdUnit from "./AdUnit";
import { AD_SLOTS } from "@/lib/adsense";

interface Props {
  /** Slot personalizado. Si no se pasa, usa AD_SLOTS.sidebar. */
  slot?: string;
  /** Estilos adicionales. */
  style?: React.CSSProperties;
}

export default function AdSidebar({ slot, style }: Props) {
  const adSlot = slot || AD_SLOTS.sidebar;

  if (!adSlot) return null;

  return (
    <div
      style={{
        margin: "24px 0",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#64748B",
          marginBottom: 6,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        Publicidad
      </div>
      <AdUnit
        slot={adSlot}
        format="auto"
        responsive
        label="Publicidad sidebar"
      />
    </div>
  );
}

"use client";

// src/components/ads/AdBanner.tsx
// Banner horizontal (leaderboard) para top/bottom de páginas.
// Formato "horizontal" optimizado para 728x90 (desktop) y 320x50/100 (mobile).
//
// Uso típico:
//   <AdBanner />
//   <AdBanner slot="1234567890" />

import AdUnit from "./AdUnit";
import { AD_SLOTS } from "@/lib/adsense";

interface Props {
  /** Slot personalizado. Si no se pasa, usa AD_SLOTS.banner. */
  slot?: string;
  /** Estilos adicionales. */
  style?: React.CSSProperties;
}

export default function AdBanner({ slot, style }: Props) {
  const adSlot = slot || AD_SLOTS.banner;

  if (!adSlot) return null;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        margin: "24px 0",
        ...style,
      }}
    >
      <div style={{ width: "100%", maxWidth: 728 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#64748B",
            marginBottom: 6,
            textAlign: "center",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          Publicidad
        </div>
        <AdUnit
          slot={adSlot}
          format="horizontal"
          responsive
          label="Publicidad banner"
        />
      </div>
    </div>
  );
}

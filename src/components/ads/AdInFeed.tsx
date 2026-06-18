"use client";

// src/components/ads/AdInFeed.tsx
// Anuncio in-feed para intercalar ENTRE tarjetas de un listado de noticias
// (rejilla de la home "Últimas del Mundial" y lista del hub /noticias).
//
// Usa formato responsivo y se etiqueta como "Publicidad" (política AdSense).
// Como todos los componentes de anuncio, renderiza null si no hay slot
// configurado (AD_SLOTS.display → SHARED_SLOT), así que no rompe el layout
// mientras AdSense no esté activo.
//
// Uso:
//   <AdInFeed />                      // tarjeta para grid (default)
//   <AdInFeed variant="row" />        // fila ancha para listas verticales

import AdUnit from "./AdUnit";
import { AD_SLOTS } from "@/lib/adsense";

interface Props {
  /** Slot personalizado. Si no se pasa, usa AD_SLOTS.display. */
  slot?: string;
  /** "card" (rejilla) o "row" (lista ancha). Default: "card". */
  variant?: "card" | "row";
  /** Estilos adicionales del contenedor. */
  style?: React.CSSProperties;
}

export default function AdInFeed({ slot, variant = "card", style }: Props) {
  const adSlot = slot || AD_SLOTS.display;

  if (!adSlot) return null;

  return (
    <div
      aria-label="Publicidad"
      style={{
        borderRadius: 16,
        border: "1px solid rgba(201,168,76,0.10)",
        background: "rgba(255,255,255,0.02)",
        padding: variant === "card" ? "12px 14px" : "10px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: variant === "card" ? 240 : 0,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#64748B",
          marginBottom: 8,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        Publicidad
      </div>
      <AdUnit
        slot={adSlot}
        format={variant === "card" ? "rectangle" : "horizontal"}
        responsive
        label="Publicidad in-feed"
      />
    </div>
  );
}

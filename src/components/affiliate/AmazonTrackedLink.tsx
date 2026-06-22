"use client";

// Enlace de afiliado Amazon con medicion GA4. Drop-in para un <a> en paginas
// SERVER (como /camisetas): al clicar emite el evento `affiliate_click`
// (network=amazon, placement, item) via el helper trackEvent (sincrono y
// fail-safe; nunca rompe la navegacion). Mantiene rel="sponsored" + target nueva
// pestana, como exige el programa de afiliados. El precio lo pone Amazon en
// destino; aqui no se cachea ninguno.

import type { CSSProperties, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

interface AmazonTrackedLinkProps {
  href: string;
  /** Identificador del item para GA4 (p.ej. la seleccion o "generico"). */
  item: string;
  /** Pantalla desde la que se clica (p.ej. "camisetas", "lobby", "match"). */
  placement?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export default function AmazonTrackedLink({
  href,
  item,
  placement = "camisetas",
  style,
  children,
}: AmazonTrackedLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={() =>
        trackEvent("affiliate_click", { network: "amazon", placement, item })
      }
      style={style}
    >
      {children}
    </a>
  );
}

"use client";

// src/components/ads/AdUnit.tsx
// Componente base reutilizable para anuncios de Google AdSense.
//
// Uso básico:
//   <AdUnit slot="1234567890" format="auto" />
//
// Uso con estilo custom:
//   <AdUnit slot="1234567890" format="rectangle" style={{ marginTop: 24 }} />
//
// Si el slot está vacío o es placeholder, el componente renderiza null
// (no ocupa espacio en el DOM).

import { useEffect, useRef, useState } from "react";
import { ADSENSE_ID, AD_FORMAT_STYLES, isAdSenseEnabled, type AdFormat } from "@/lib/adsense";

interface AdUnitProps {
  /** data-ad-slot: el ID numérico de la unidad de anuncio en AdSense. */
  slot: string;
  /** Formato del anuncio. Default: "auto". */
  format?: AdFormat;
  /** Si es true, ocupa el ancho completo del contenedor. Default: true. */
  responsive?: boolean;
  /** Clases CSS adicionales. */
  className?: string;
  /** Estilos inline adicionales (merge con los del formato). */
  style?: React.CSSProperties;
  /** Etiqueta aria para accesibilidad. */
  label?: string;
}

export default function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style,
  label = "Publicidad",
}: AdUnitProps) {
  const ref = useRef<HTMLModElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  // Solo renderizamos en cliente (evita SSR mismatch y no cargamos ads
  // en el servidor donde no tienen sentido).
  useEffect(() => {
    setShouldRender(true);
  }, []);

  // Push al array adsbygoogle cuando el <ins> está montado.
  useEffect(() => {
    if (!shouldRender || !ref.current) return;

    const ins = ref.current;

    // Evita doble-push si el componente se re-renderiza.
    if (ins.hasAttribute("data-ad-loaded")) return;

    try {
      const w = window as unknown as {
        adsbygoogle: unknown[];
      };

      // Inicializa el array si no existe.
      if (!Array.isArray(w.adsbygoogle)) {
        w.adsbygoogle = [];
      }

      (w.adsbygoogle as unknown[]).push({});
      ins.setAttribute("data-ad-loaded", "true");
    } catch (err) {
      // Silencioso: si AdSense no está disponible (adblock, error de red,
      // consentimiento denegado), no rompemos la página.
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === "development") {
        console.warn("[AdSense] push failed:", err);
      }
    }
  }, [shouldRender]);

  // No renderizar si AdSense está deshabilitado, no hay slot válido,
  // o estamos en SSR. El flag isAdSenseEnabled evita que Google vea
  // anuncios durante la revisión de aprobación.
  if (!isAdSenseEnabled || !shouldRender || !slot || slot.includes("PLACEHOLDER")) {
    return null;
  }

  const formatStyles = AD_FORMAT_STYLES[format] || AD_FORMAT_STYLES.auto;

  return (
    <div
      aria-label={label}
      role="complementary"
      style={{
        overflow: "hidden",
        maxWidth: "100%",
      }}
    >
      <ins
        ref={ref}
        className={`adsbygoogle ${className}`}
        style={{
          display: "block",
          ...formatStyles,
          ...style,
        }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

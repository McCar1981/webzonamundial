// src/components/FlagImage.tsx
// Banderas servidas como PNG estáticos desde /img/flags.
//
// Antes esto usaba `react-world-flags`, que empaqueta las 256 banderas del
// mundo como data:URI DENTRO del chunk de JS: 3,58 MB que bloqueaban la carga
// de cualquier página con una bandera (crítico en Android de gama media, el
// 87% del parque). Ahora cada bandera es un PNG de ~1 KB que el navegador pide
// solo si se dibuja y cachea después; las 256 juntas pesan 727 KB y ninguna
// entra en el bundle. Los PNG se generan de los SVG del paquete (licencia MIT)
// rasterizados a 96px, de sobra para los tamaños en que se muestran (14-72px).

"use client";

import { useState, type CSSProperties, type ReactNode } from 'react';

interface FlagImageProps {
  code: string;
  alt: string;
  width?: number;
  className?: string;
  fallback?: string | ReactNode;
}

// Las naciones británicas comparten el fichero de Reino Unido.
const CODE_OVERRIDES: Record<string, string> = {
  'gb-eng': 'gb',
  'gb-sct': 'gb',
  'gb-wls': 'gb',
  'uk': 'gb',
};

export default function FlagImage({
  code,
  alt,
  width = 80,
  className = "",
  fallback,
}: FlagImageProps) {
  const lower = (code || "").toLowerCase();
  const resolvedCode = CODE_OVERRIDES[lower] || lower;
  const [fallo, setFallo] = useState(false);

  const displayFallback = fallback || (code || "").toUpperCase();
  const hasExplicitSize =
    /\b(w-\d+|h-\d+|w-px|h-px|w-full|h-full|w-auto|h-auto|w-screen|h-screen|w-fit|h-fit)\b/.test(
      className
    );

  const height = Math.round(width * 0.67);
  const wrapperStyle: CSSProperties = hasExplicitSize ? {} : { width, height };

  // Sin código válido o con el PNG ausente se pinta el respaldo (siglas).
  const mostrarBandera = !!resolvedCode && !fallo;

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden ${className}`}
      style={wrapperStyle}
      title={alt}
    >
      {mostrarBandera ? (
        <img
          src={`/img/flags/${resolvedCode}.png`}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFallo(true)}
        />
      ) : typeof displayFallback === 'string' ? (
        <span
          className="flex items-center justify-center leading-none select-none text-[#c9a84c]"
          style={{ fontSize: width * 0.5 }}
        >
          {displayFallback}
        </span>
      ) : (
        <span className="flex items-center justify-center leading-none select-none">
          {displayFallback}
        </span>
      )}
    </span>
  );
}

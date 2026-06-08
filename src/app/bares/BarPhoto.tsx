// src/app/bares/BarPhoto.tsx
//
// Imagen editorial para la landing de Porra Digital con fallback elegante:
// intenta cargar el asset (.webp) y, si todavía no existe (404 / error), muestra
// el contenido de respaldo (children) — un degradado/mockup premium. Así dejamos
// los "slots" preparados: en cuanto se suba la foto a /public/images/bars/...,
// aparece sola sin tocar código. Cliente porque necesita onError.

"use client";

import { useState } from "react";

export default function BarPhoto({
  src,
  alt,
  className = "",
  objectPosition = "center",
  priority = false,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  objectPosition?: string;
  priority?: boolean;
  children: React.ReactNode; // fallback elegante (mismo tamaño que la img)
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{children}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
      style={{ objectFit: "cover", objectPosition, width: "100%", height: "100%" }}
    />
  );
}

// src/app/app/modo-carrera/jugar/Visuals.tsx
//
// Piezas VISUALES compartidas del Modo Carrera jugable (Pilar "vende por la
// vista"): la camiseta real de cada selección (kitUrl, /img/kits/2026/home) y un
// confeti CSS puro para celebrar victorias/títulos. Sin emojis, sin assets nuevos
// (las 48 camisetas ya viven en /public). Reutilizable por el partido en vivo y
// el revelado de resultado.

"use client";

import { useMemo } from "react";
import { kitUrl } from "./fx";

/** Camiseta (kit local) de una selección por slug. Degrada a nada si falla. */
export function Kit({ slug, size = 64, faded = false }: { slug: string; size?: number; faded?: boolean }) {
  if (!slug) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={kitUrl(slug)}
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        opacity: faded ? 0.16 : 1,
        filter: faded ? "saturate(0.7)" : "drop-shadow(0 6px 14px rgba(0,0,0,0.5))",
        pointerEvents: "none",
        userSelect: "none",
      }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

const CONFETTI_COLORS = ["#c9a84c", "#e8d48b", "#22c55e", "#38bdf8", "#f472b6", "#fff"];

/**
 * Lluvia de confeti CSS (sin librerías ni imágenes). `pieces` controla la
 * densidad; cada trozo cae con retardo/derivada aleatorios. Se monta solo cuando
 * hay algo que celebrar, así que el coste es puntual.
 */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.6 + Math.random() * 1.4,
        drift: (Math.random() - 0.5) * 120,
        rot: Math.random() * 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: 6 + Math.random() * 6,
        h: 9 + Math.random() * 8,
      })),
    [pieces],
  );

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 2 }}>
      <style>{`
        @keyframes mcConfFall {
          0%   { transform: translate3d(0,-12%,0) rotate(0deg); opacity: 0; }
          12%  { opacity: 1; }
          100% { transform: translate3d(var(--drift), 120%, 0) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
      {bits.map((b) => (
        <span
          key={b.i}
          style={{
            position: "absolute",
            top: 0,
            left: `${b.left}%`,
            width: b.w,
            height: b.h,
            background: b.color,
            borderRadius: 2,
            // @ts-expect-error -- CSS custom properties
            "--drift": `${b.drift}px`,
            "--rot": `${b.rot}deg`,
            animation: `mcConfFall ${b.dur}s ${b.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

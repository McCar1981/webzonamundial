// FlagFrame — bandera con efectos dorados visibles y animados.
//
// Stack de efectos (de fuera hacia dentro):
//   1. Aura glow color del país       (ambient)
//   2. Aura glow dorada rotativa      (siempre se mueve)
//   3. Rayos de luz dorados radiales  (sweep angular)
//   4. Sparkles dorados orbitando     (~20 partículas con paths)
//   5. Marco luminoso multi-shadow    (gold inset + país soft + black drop)
//   6. Halo interior superior         (mix-blend soft-light)
//   7. Highlight diagonal sweep       (shimmer constante)
//
// Todos en CSS keyframes constantes (no fade in-out, MOVIMIENTO real).

import type { TeamColors } from "@/types/team";

interface FlagFrameProps {
  iso: string;
  colors?: Partial<TeamColors>;
  alt: string;
  aspect?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SRCSET_SIZES = [320, 640, 1280];

export default function FlagFrame({
  iso,
  colors,
  alt,
  aspect = "3 / 2",
  className = "",
  size = "lg",
}: FlagFrameProps) {
  const primary = colors?.primary ?? "#75AADB";
  const cVar = hexToRgba(primary, 0.5);
  const cSoft = hexToRgba(primary, 0.25);

  const initial = size === "sm" ? 320 : size === "md" ? 640 : 1280;
  const src = `https://flagcdn.com/w${initial}/${iso}.png`;
  const srcSet = SRCSET_SIZES.map(
    (w) => `https://flagcdn.com/w${w}/${iso}.png ${w}w`
  ).join(", ");

  return (
    <div
      className={`bb-frame-root ${className}`}
      style={
        {
          "--c": cVar,
          "--c-soft": cSoft,
        } as React.CSSProperties
      }
    >
      {/* Aura del país (capa lejana, blurred grande) */}
      <span aria-hidden className="bb-aura-country" />
      {/* Aura dorada rotativa (capa intermedia) */}
      <span aria-hidden className="bb-aura-gold" />
      {/* Rayos dorados radiales que rotan lento */}
      <span aria-hidden className="bb-rays" />
      {/* Sparkles orbitando */}
      <span aria-hidden className="bb-sparkles">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`bb-spark bb-spark-${i + 1}`} />
        ))}
      </span>

      {/* Marco principal */}
      <div
        className="relative rounded-3xl overflow-hidden bb-flag-frame"
        style={{ aspectRatio: aspect }}
      >
        <img
          src={src}
          srcSet={srcSet}
          sizes="(max-width: 768px) 100vw, 50vw"
          alt={alt}
          width={1280}
          height={853}
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover bb-flag-wave"
        />
        {/* Halo dorado interior superior */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(201,168,76,0.22), transparent)",
            mixBlendMode: "soft-light",
          }}
        />
        {/* Sheen diagonal animado */}
        <span aria-hidden className="bb-sheen" />
        {/* Esquinas doradas estilo marco luxury */}
        <Corners />
      </div>
    </div>
  );
}

/* ───────── Esquinas ───────── */

function Corners() {
  const stroke = "rgba(201,168,76,0.95)";
  const filter = "drop-shadow(0 0 8px rgba(201,168,76,0.7))";
  return (
    <span aria-hidden className="absolute inset-0 pointer-events-none">
      {/* TL */}
      <svg
        viewBox="0 0 40 40"
        width="40"
        height="40"
        style={{ position: "absolute", top: 8, left: 8, filter }}
      >
        <path d="M2 16V4h12" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      {/* TR */}
      <svg
        viewBox="0 0 40 40"
        width="40"
        height="40"
        style={{ position: "absolute", top: 8, right: 8, filter }}
      >
        <path d="M38 16V4H26" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      {/* BL */}
      <svg
        viewBox="0 0 40 40"
        width="40"
        height="40"
        style={{ position: "absolute", bottom: 8, left: 8, filter }}
      >
        <path d="M2 24v12h12" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      {/* BR */}
      <svg
        viewBox="0 0 40 40"
        width="40"
        height="40"
        style={{ position: "absolute", bottom: 8, right: 8, filter }}
      >
        <path d="M38 24v12H26" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}

/* Filter SVG global — montar UNA VEZ en TeamPageBiblia */
export function FlagWaveFilter() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
    >
      <defs>
        <filter id="bb-flag-wave-filter" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.022"
            numOctaves="2"
            seed="2"
          />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
      </defs>
    </svg>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(117,170,219,${alpha})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

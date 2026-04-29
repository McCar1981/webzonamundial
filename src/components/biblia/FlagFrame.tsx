// FlagFrame — bandera con marco luminoso, glow ambiental y wave sutil.
// Único componente para mostrar bandera "premium" en TODA la BIBLIA.
//
// Sin imágenes externas más allá de flagcdn. Los efectos son CSS + un
// SVG <filter> que aplica displacement para dar movimiento de ondulación.
//
// Uso:
//   <FlagFrame iso="ar" colors={{primary:"#75AADB"}} aspect="3/2" />

import type { TeamColors } from "@/types/team";

interface FlagFrameProps {
  iso: string;
  colors?: Partial<TeamColors>;
  alt: string;
  aspect?: string; // CSS aspect-ratio. Default 3/2.
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
  const cVar = hexToRgba(primary, 0.35);
  const cSoft = hexToRgba(primary, 0.18);

  // Tamaño base del PNG inicial. Para sm usamos 320, para md 640, para lg 1280.
  const initial =
    size === "sm" ? 320 : size === "md" ? 640 : 1280;
  const src = `https://flagcdn.com/w${initial}/${iso}.png`;
  const srcSet = SRCSET_SIZES.map(
    (w) => `https://flagcdn.com/w${w}/${iso}.png ${w}w`
  ).join(", ");

  return (
    <div
      className={`relative bb-flag-glow ${className}`}
      style={
        {
          "--c": cVar,
          "--c-soft": cSoft,
        } as React.CSSProperties
      }
    >
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
        {/* Sheen sutil (overlay diagonal) */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.08) 100%)",
          }}
        />
      </div>
    </div>
  );
}

/* Filter SVG global — montar UNA VEZ en la página (lo hace TeamPageBiblia). */
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

/* ───── helpers ───── */

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(117,170,219,${alpha})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

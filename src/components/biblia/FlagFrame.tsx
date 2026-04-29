// FlagFrame — bandera con marco luminoso, glow ambiental, wave sutil
// y EFECTOS DORADOS exteriores (sparkles, corner accents, light beams).
//
// Único componente para mostrar bandera "premium" en TODA la BIBLIA.
// Sin imágenes externas más allá de flagcdn. Todo CSS + SVG filter.
//
// Uso:
//   <FlagFrame iso="ar" colors={{primary:"#75AADB"}} aspect="3/2" />

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
  const cVar = hexToRgba(primary, 0.35);
  const cSoft = hexToRgba(primary, 0.18);

  const initial = size === "sm" ? 320 : size === "md" ? 640 : 1280;
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

      {/* Sparkles dorados — partículas alrededor */}
      <Sparkles />

      {/* Light beams dorados desde las esquinas */}
      <CornerAccents />

      {/* Marco principal de la bandera */}
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
        {/* Sheen sutil */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.08) 100%)",
          }}
        />
        {/* Halo dorado interior superior */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(201,168,76,0.18), transparent)",
            mixBlendMode: "soft-light",
          }}
        />
      </div>

      {/* Línea inferior de partículas (estilo glow trail) */}
      <div
        aria-hidden
        className="absolute left-1/2 bottom-2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "70%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(201,168,76,0.55), transparent)",
          filter: "blur(0.5px)",
        }}
      />
    </div>
  );
}

/* ────── Sparkles ────── */
// 14 partículas posicionadas absolutamente con animación stagger.
// Estilos puros CSS, sin JS, listas para SSR.

function Sparkles() {
  // [top%, left%, size, delay-s]
  const dots: Array<[number, number, number, number]> = [
    [8, 12, 4, 0],
    [16, 88, 5, 0.6],
    [4, 50, 3, 1.2],
    [22, 4, 4, 1.8],
    [40, 96, 3, 0.3],
    [62, 2, 4, 0.9],
    [76, 92, 5, 1.5],
    [88, 16, 4, 0.4],
    [94, 70, 3, 1.0],
    [50, 6, 3, 1.6],
    [10, 30, 3, 2.2],
    [82, 50, 4, 2.6],
    [30, 70, 3, 0.2],
    [70, 30, 3, 2.0],
  ];
  return (
    <>
      <style>{`
        @keyframes bb-sparkle {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50%      { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {dots.map(([top, left, size, delay], i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: "#E8D48B",
              boxShadow: "0 0 6px #C9A84C, 0 0 14px rgba(201,168,76,0.55)",
              animation: `bb-sparkle 3.4s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ────── CornerAccents ────── */
// 4 ángulos dorados estilo "marco de cuadro lujo" que enmarcan la bandera.

function CornerAccents() {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    width: "32px",
    height: "32px",
    pointerEvents: "none",
  };
  const stroke = "rgba(201,168,76,0.85)";
  const filter = "drop-shadow(0 0 6px rgba(201,168,76,0.5))";

  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {/* Top-left */}
      <span style={{ ...baseStyle, top: 4, left: 4, filter }}>
        <svg viewBox="0 0 32 32" width="32" height="32">
          <path
            d="M2 12V4h8"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      {/* Top-right */}
      <span style={{ ...baseStyle, top: 4, right: 4, filter }}>
        <svg viewBox="0 0 32 32" width="32" height="32">
          <path
            d="M30 12V4h-8"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      {/* Bottom-left */}
      <span style={{ ...baseStyle, bottom: 4, left: 4, filter }}>
        <svg viewBox="0 0 32 32" width="32" height="32">
          <path
            d="M2 20v8h8"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      {/* Bottom-right */}
      <span style={{ ...baseStyle, bottom: 4, right: 4, filter }}>
        <svg viewBox="0 0 32 32" width="32" height="32">
          <path
            d="M30 20v8h-8"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
    </div>
  );
}

/* Filter SVG global — se monta una vez en TeamPageBiblia */
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

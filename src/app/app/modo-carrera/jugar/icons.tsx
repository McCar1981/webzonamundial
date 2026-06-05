// src/app/app/modo-carrera/jugar/icons.tsx
// Iconos SVG del Modo Carrera (trazo, heredan color con currentColor). Sin
// emojis. Cubren tipos de misión, candado, check y recompensas mientras no se
// entreguen los assets SVG definitivos de ASSET_PROMPTS.md (E1-E9).

import type { MissionKind } from "@/lib/modo-carrera/types";

interface IconProps {
  size?: number;
}

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function LockIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function CheckIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function StarIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3l2.6 5.6L21 9.4l-4.5 4.3L17.7 21 12 17.8 6.3 21l1.2-7.3L3 9.4l6.4-.8L12 3z" />
    </svg>
  );
}

export function BoltIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

export function MissionIcon({ kind, size = 18 }: { kind: MissionKind; size?: number }) {
  const b = base(size);
  switch (kind) {
    case "diaria":
      return (
        <svg {...b}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "semanal":
      return (
        <svg {...b}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2" />
        </svg>
      );
    case "torneo":
      return (
        <svg {...b}>
          <path d="M6 4h12v3a6 6 0 0 1-12 0V4z" />
          <path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3M9 17h6M8 21h8M12 13v4" />
        </svg>
      );
    case "flash":
    default:
      return <BoltIcon size={size} />;
  }
}

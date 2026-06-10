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

// Solo se usa dentro de MissionIcon (misiones flash); no se exporta.
function BoltIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

/** Silbato de entrenamiento (misión de entreno diario). */
export function TrainingIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M14 8h4a3 3 0 0 1 3 3v1a6 6 0 1 1-12 0v-1l5-3z" />
      <circle cx="15" cy="12.5" r="1.4" fill="currentColor" stroke="none" />
      <path d="M9 8 7 5M12 7V4M5 10H2" />
    </svg>
  );
}

/** Cruz médica (evento de lesión en la narrativa). */
export function InjuryIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M12 10v6M9 13h6" />
    </svg>
  );
}

/** Contrato/oferta (evento de mercado en la narrativa). */
export function TransferIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5z" />
      <path d="M14 2v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

export function CoinIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0M9.5 15a2.5 2.5 0 0 0 5 0M12 7.5v9" />
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

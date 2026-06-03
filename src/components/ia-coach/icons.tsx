// src/components/ia-coach/icons.tsx
//
// Iconos SVG del IA Coach. Usan stroke="currentColor" para heredar el color del
// contenedor (útil en estados activo/inactivo de tabs y botones). NADA de emojis.

import type { CSSProperties } from "react";

interface IconProps {
  size?: number;
  style?: CSSProperties;
}

/** Cabeza de robot — marca del IA Coach (launcher + cabecera). */
export function IconRobot({ size = 24, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 5V8" />
      <circle cx="12" cy="4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9.5 16h5" />
      <path d="M2 12v3M22 12v3" />
    </svg>
  );
}

/** Silbato — Entrenador Personal. */
export function IconWhistle({ size = 24, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path d="M3 11a5 5 0 0 0 5 5h2.5l4.5 3v-3a5 5 0 0 0 5-5 4 4 0 0 0-4-4H7a4 4 0 0 0-4 4Z" />
      <circle cx="8" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <path d="M14 4l1 2M17 3l.5 2.5M20 4l-1 2" />
    </svg>
  );
}

/** Bola de cristal — Oráculo / Monte Carlo. */
export function IconCrystalBall({ size = 24, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <circle cx="12" cy="9.5" r="6.5" />
      <path d="M7 17h10l-1.2 3.2a1 1 0 0 1-.94.8H9.14a1 1 0 0 1-.94-.8Z" />
      <path d="M9.5 7.5a3.5 3.5 0 0 1 3-1.6" opacity="0.7" />
      <path d="M14.5 4.5l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Globos de diálogo enfrentados — Debate / Reto IA vs Humanos. */
export function IconDebate({ size = 24, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h7A2.5 2.5 0 0 1 15 6.5v3A2.5 2.5 0 0 1 12.5 12H8l-3 2.5V12a2.5 2.5 0 0 1-2-2.5Z" />
      <path d="M21 13.5a2.5 2.5 0 0 0-2.5-2.5H17" opacity="0.55" />
      <path d="M21 13.5v3a2.5 2.5 0 0 1-2 2.45V21l-2.5-2H13a2.4 2.4 0 0 1-1.8-.8" opacity="0.55" />
    </svg>
  );
}

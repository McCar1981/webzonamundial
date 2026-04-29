// Iconos SVG inline para BIBLIA. Estilo line-art uniforme,
// stroke="currentColor" para que hereden el color del padre.
// Tamaño base 24x24; usar className="w-X h-X" para escalar.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CapitalIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-7h6v7" />
    </svg>
  );
}

export function PeopleIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-1a6 6 0 0 1 12 0v1" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M14.5 21a4.5 4.5 0 0 1 7-3.7" />
    </svg>
  );
}

export function MapIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

export function ChatIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function GlobeIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

export function ClockIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function PersonIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  );
}

export function ShieldIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
    </svg>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function StadiumIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <ellipse cx="12" cy="12" rx="9" ry="5" />
      <path d="M3 12v3a9 5 0 0 0 18 0v-3" />
      <path d="M12 7v10M8 8.5v7M16 8.5v7" />
    </svg>
  );
}

export function ExternalIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M14 4h6v6M20 4l-9 9M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

export function BallIcon(p: IconProps) {
  // Pelota con paneles típicos
  return (
    <svg {...baseProps} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 3 3 4-1.5 5h-3L9 7l3-4Z" />
      <path d="M15 7l5 1M9 7 4 8M13.5 12l4 4M10.5 12l-4 4M12 17l2 4M12 17l-2 4" />
    </svg>
  );
}

export function TrophyIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" />
      <path d="M10 13h4v3h-4zM7 21h10M9 21l1-2M15 21l-1-2" />
    </svg>
  );
}

export function MedalIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="12" cy="15" r="6" />
      <path d="M8 1v8M16 1v8M8 1h8" />
      <path d="m12 12 1 2 2 .3-1.5 1.5.3 2L12 17l-1.8.8.3-2L9 14.3l2-.3z" />
    </svg>
  );
}

export function RankIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="m12 2 2.5 5 5.5.8-4 3.9 1 5.5L12 14.5 7 17.2l1-5.5-4-3.9 5.5-.8z" />
    </svg>
  );
}

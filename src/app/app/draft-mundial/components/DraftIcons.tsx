// src/app/app/draft-mundial/components/DraftIcons.tsx
// Iconos SVG inline para el Draft Mundial (reemplazan emojis)

import React from "react";

const GOLD = "#c9a84c";
const TXT = "#eef2fb";
const TXT_MUT = "#a69a82";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

function svg({ size = 24, color = TXT, children, className = "" }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

export function IconTrophy({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </> });
}

export function IconDice({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <rect x="2" y="2" width="20" height="20" rx="4" />
    <circle cx="8" cy="8" r="1.5" fill={color} stroke="none" />
    <circle cx="16" cy="8" r="1.5" fill={color} stroke="none" />
    <circle cx="8" cy="16" r="1.5" fill={color} stroke="none" />
    <circle cx="16" cy="16" r="1.5" fill={color} stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
  </> });
}

export function IconShield({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </> });
}

export function IconScale({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="m16 16 3-8 3 8c-.87.65-1.96 1-3.09 1-1.13 0-2.22-.35-3.09-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.96 1-3.09 1-1.13 0-2.22-.35-3.09-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
  </> });
}

export function IconSwords({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <polyline points="9.5 17.5 21 6 21 3 18 3 6.5 14.5" />
    <line x1="12" y1="22" x2="12" y2="18" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </> });
}

export function IconChart({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="m19 9-5 5-4-4-3 3" />
  </> });
}

export function IconBook({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </> });
}

export function IconTimer({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </> });
}

export function IconLink({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </> });
}

export function IconTarget({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </> });
}

export function IconCrown({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </> });
}

export function IconGlobe({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </> });
}

export function IconBrain({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04Z" />
  </> });
}

export function IconScroll({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 1 4 0v2h12V3a2 2 0 0 0-2-2H8" />
  </> });
}

export function IconSparkles({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </> });
}

export function IconShare({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </> });
}

export function IconRefresh({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </> });
}

export function IconBolt({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </> });
}

export function IconMedal({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
    <path d="M11 12 4.68 3.88" />
    <path d="m13 12 6.33-8.12" />
    <circle cx="12" cy="17" r="5" />
    <path d="m9 17 2-2 2 2" />
  </> });
}

export function IconStar({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </> });
}

export function IconBall({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <path d="m4.93 4.93 14.14 14.14" />
    <path d="m19.07 4.93-14.14 14.14" />
  </> });
}

export function IconArrowLeft({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </> });
}

export function IconSword({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </> });
}

export function IconFlame({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </> });
}

export function IconGem({ size, color, className }: IconProps) {
  return svg({ size, color, className, children: <>
    <path d="M6 3h12l4 6-10 13L2 9Z" />
    <path d="M11 3 8 9l4 13 4-13-3-6" />
    <path d="M2 9h20" />
  </> });
}

// Mapea la calificación (antes emoji 👑💎🥇🥈🥉) a su icono SVG.
export function IconCalificacion({ calificacion, size, color, className }: IconProps & { calificacion: string }) {
  const map: Record<string, (p: IconProps) => React.ReactElement> = {
    Leyenda: IconCrown,
    Platino: IconGem,
    Oro: IconMedal,
    Plata: IconMedal,
    Bronce: IconMedal,
  };
  const Icon = map[calificacion] || IconStar;
  return <Icon size={size} color={color} className={className} />;
}

// Mapea cada logro (antes emoji) a su icono SVG y un color por defecto.
const LOGRO_ICONOS: Record<string, { Icon: (p: IconProps) => React.ReactElement; color: string }> = {
  "primer-draft": { Icon: IconMedal, color: "#CD7F32" },
  "draft-experto": { Icon: IconMedal, color: "#C0C0C0" },
  "draft-maestro": { Icon: IconMedal, color: "#D4AF37" },
  "leyenda-viva": { Icon: IconCrown, color: GOLD },
  "arquitecto": { Icon: IconGlobe, color: GOLD },
  "contra-el-tiempo": { Icon: IconTimer, color: GOLD },
  "de-memoria": { Icon: IconBrain, color: GOLD },
  "equilibrista": { Icon: IconScale, color: GOLD },
  "historiador": { Icon: IconScroll, color: GOLD },
  "muralla": { Icon: IconShield, color: GOLD },
};

export function IconLogro({ id, size, color, className }: IconProps & { id: string }) {
  const entry = LOGRO_ICONOS[id] || { Icon: IconStar, color: GOLD };
  const { Icon, color: defColor } = entry;
  return <Icon size={size} color={color || defColor} className={className} />;
}

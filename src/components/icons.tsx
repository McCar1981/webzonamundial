import React from "react";

/* ═══════════════════════════════════════════════════════════════════
   ICONOS ZONAMUNDIAL — Archivo centralizado
   Importa desde "@/components/icons" en cualquier parte de la app.
   ═══════════════════════════════════════════════════════════════════ */

const GOLD = "#c9a84c";
const BG_DARK = "#060B14";

/* ─── Componente base para iconos de trazo simple ─── */
export const ZmIcon = ({
  d,
  size = 24,
}: {
  d: string | React.ReactNode;
  size?: number;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {typeof d === "string" ? (
      <path
        d={d}
        stroke={GOLD}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      d
    )}
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════
   ICON_V3 — Iconos SVG con profundidad 3D y gradientes
   Usados en la sección de módulos / features de la app
   ═══════════════════════════════════════════════════════════════════ */
export const ICON_V3 = {
  matchCenter: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="i-ball" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#e8d48a" />
          <stop offset="70%" stopColor={GOLD} />
          <stop offset="100%" stopColor="#8a6f2a" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9.5" fill="url(#i-ball)" opacity="0.2" stroke={GOLD} strokeWidth="1.2" />
      <path d="M12 2.5V6.5l3.5 2.5 1-4M12 2.5l-3.5 4-1 4M8.5 6.5L5 10.5M12 21.5v-4l-3.5-2.5-1 4M12 21.5l3.5-4 1-4M15.5 17.5l3.5-4M2.5 12h4l2.5 3.5-2 3M21.5 12h-4l-2.5 3.5 2 3M5 10.5l-2 1.5M19 10.5l2 1.5M8.5 6.5l3.5 2 3.5-2" stroke={GOLD} strokeWidth="0.9" strokeLinejoin="round" opacity="0.7" />
      <circle cx="10" cy="9" r="1.5" fill={GOLD} fillOpacity="0.15" stroke={GOLD} strokeWidth="0.6" />
    </svg>
  ),
  predicciones: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="i-tgt" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.3" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.02" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="13" r="9.5" fill="url(#i-tgt)" stroke={GOLD} strokeWidth="1" />
      <circle cx="12" cy="13" r="6.5" stroke={GOLD} strokeWidth="1.2" opacity="0.7" />
      <circle cx="12" cy="13" r="3.5" fill={GOLD} fillOpacity="0.2" stroke={GOLD} strokeWidth="1.3" />
      <circle cx="12" cy="13" r="1.2" fill={GOLD} />
      <path d="M19 2l-5.5 5.5" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19 2l-4 .5.5 3.5 3.5.5z" fill={GOLD} fillOpacity="0.5" stroke={GOLD} strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  ),
  fantasy: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d48a" />
          <stop offset="100%" stopColor="#8a6f2a" />
        </linearGradient>
      </defs>
      <path d="M6 3h12v5a6 6 0 0 1-12 0V3z" fill="url(#i-cup)" fillOpacity="0.25" stroke={GOLD} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 5H4a2.5 2.5 0 0 0 0 5h1" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M18 5h2a2.5 2.5 0 0 1 0 5h-1" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 13.5v4h-1.5a1 1 0 0 0-1 1V21h9v-2.5a1 1 0 0 0-1-1H14v-4" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 5.5l.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.8-1.6.8.3-1.8L9.4 7.4l1.8-.3z" fill={GOLD} />
    </svg>
  ),
  iaCoach: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-chip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="14" height="14" rx="3" fill="url(#i-chip)" stroke={GOLD} strokeWidth="1.3" />
      <path d="M9 1.5v3M15 1.5v3M9 19.5v3M15 19.5v3M1.5 9h3M1.5 15h3M19.5 9h3M19.5 15h3" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.5" fill={GOLD} fillOpacity="0.15" stroke={GOLD} strokeWidth="1" />
      <circle cx="12" cy="12" r="1.5" fill={GOLD} fillOpacity="0.5" />
    </svg>
  ),
  streaming: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-scr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.18" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="3.5" width="21" height="14" rx="2.5" fill="url(#i-scr)" stroke={GOLD} strokeWidth="1.3" />
      <path d="M9 19.5h6" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 17.5v2" stroke={GOLD} strokeWidth="1.3" />
      <path d="M10 8.5v6l5-3z" fill={GOLD} fillOpacity="0.6" stroke={GOLD} strokeWidth="1" strokeLinejoin="round" />
      <circle cx="18" cy="6" r="2.5" fill={BG_DARK} stroke={GOLD} strokeWidth="1" />
      <circle cx="18" cy="6" r="1" fill="#ff4444" />
    </svg>
  ),
  trivia: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-shld" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d="M12 1.5l9 4.5v5.5c0 6-4 10.5-9 12-5-1.5-9-6-9-12V6z" fill="url(#i-shld)" stroke={GOLD} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M13.5 7L10 13h3l-1 5 4.5-6.5h-3z" fill={GOLD} fillOpacity="0.7" stroke={GOLD} strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  ),
  carrera: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <path d="M7 2l-5 4.5 2.5 3L7 8v13h10V8l2.5 1.5L22 6.5 17 2h-3l-2 2.5L10 2z" fill="url(#i-shirt)" stroke={GOLD} strokeWidth="1.3" strokeLinejoin="round" />
      <text x="12" y="16.5" textAnchor="middle" fill={GOLD} fontSize="7.5" fontWeight="900" fontFamily="system-ui,sans-serif">10</text>
    </svg>
  ),
  ligas: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-shld2" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d="M12 1.5l9 4.5v5.5c0 6-4 10.5-9 12-5-1.5-9-6-9-12V6z" fill="url(#i-shld2)" stroke={GOLD} strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" fill={GOLD} fillOpacity="0.25" stroke={GOLD} strokeWidth="1.1" />
      <path d="M7.5 17.5a4.5 4.5 0 0 1 9 0" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7.5" cy="11" r="1.3" fill={GOLD} fillOpacity="0.2" stroke={GOLD} strokeWidth="0.8" />
      <circle cx="16.5" cy="11" r="1.3" fill={GOLD} fillOpacity="0.2" stroke={GOLD} strokeWidth="0.8" />
    </svg>
  ),
  rankings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-bar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="i-bar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="14" width="5.5" height="7.5" rx="1" fill="url(#i-bar2)" stroke={GOLD} strokeWidth="1.1" />
      <rect x="9.25" y="7" width="5.5" height="14.5" rx="1" fill="url(#i-bar1)" stroke={GOLD} strokeWidth="1.2" />
      <rect x="16" y="10.5" width="5.5" height="11" rx="1" fill="url(#i-bar2)" stroke={GOLD} strokeWidth="1.1" />
      <text x="5.25" y="19.5" textAnchor="middle" fill={GOLD} fontSize="5" fontWeight="800" fontFamily="system-ui">2</text>
      <text x="12" y="15" textAnchor="middle" fill={GOLD} fontSize="5" fontWeight="800" fontFamily="system-ui">1</text>
      <text x="18.75" y="18" textAnchor="middle" fill={GOLD} fontSize="5" fontWeight="800" fontFamily="system-ui">3</text>
      <path d="M12 3l1 2 2.2.3-1.6 1.5.4 2.1-2-.9-2 .9.4-2.1L8.8 5.3 11 5z" fill={GOLD} />
    </svg>
  ),
  chat: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-bbl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.18" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d="M22 15a2.5 2.5 0 0 1-2.5 2.5H7L2.5 22V5A2.5 2.5 0 0 1 5 2.5h14.5A2.5 2.5 0 0 1 22 5v10z" fill="url(#i-bbl)" stroke={GOLD} strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="8" cy="10" r="1.3" fill={GOLD} fillOpacity="0.6" />
      <circle cx="12" cy="10" r="1.3" fill={GOLD} fillOpacity="0.45" />
      <circle cx="16" cy="10" r="1.3" fill={GOLD} fillOpacity="0.3" />
    </svg>
  ),
  microPred: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="i-chr" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.2" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.03" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="13.5" r="8.5" fill="url(#i-chr)" stroke={GOLD} strokeWidth="1.3" />
      <path d="M10 2h4" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 2v3" stroke={GOLD} strokeWidth="1.3" />
      <path d="M18.5 7l1.5-1.5" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 9.5v4l2.5 1.5" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="1.2" fill={GOLD} />
    </svg>
  ),
  stories: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-scard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.15" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <rect x="7.5" y="1" width="12" height="17" rx="2.5" stroke={GOLD} strokeWidth="0.8" opacity="0.25" transform="rotate(4 13 9)" />
      <rect x="5.5" y="3" width="12" height="17" rx="2.5" stroke={GOLD} strokeWidth="0.9" opacity="0.45" transform="rotate(1 11 11)" />
      <rect x="4" y="4.5" width="12" height="17" rx="2.5" fill="url(#i-scard)" stroke={GOLD} strokeWidth="1.3" />
      <rect x="6.5" y="7.5" width="7" height="4" rx="1" fill={GOLD} fillOpacity="0.2" stroke={GOLD} strokeWidth="0.6" />
      <path d="M6.5 14.5h7" stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" />
      <path d="M6.5 17h5" stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
      <circle cx="17.5" cy="18" r="3.5" fill={BG_DARK} stroke={GOLD} strokeWidth="1.2" />
      <path d="M16 18l1.2 1.2 2.5-2.5" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════════
   ICON_DESCUBRE — 6 Tarjetas de la sección "Descubre"
   ═══════════════════════════════════════════════════════════════════ */
export const ICON_DESCUBRE = {
  grupos: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-grid12" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="9" height="9" rx="2" fill="url(#i-grid12)" stroke={GOLD} strokeWidth="1.2" />
      <rect x="13" y="2" width="9" height="9" rx="2" fill="url(#i-grid12)" stroke={GOLD} strokeWidth="1.2" />
      <rect x="2" y="13" width="9" height="9" rx="2" fill="url(#i-grid12)" stroke={GOLD} strokeWidth="1.2" />
      <rect x="13" y="13" width="9" height="9" rx="2" fill="url(#i-grid12)" stroke={GOLD} strokeWidth="1.2" />
      <text x="6.5" y="8.2" textAnchor="middle" fill={GOLD} fontSize="5" fontWeight="800" fontFamily="system-ui">A</text>
      <text x="17.5" y="8.2" textAnchor="middle" fill={GOLD} fontSize="5" fontWeight="800" fontFamily="system-ui">B</text>
      <text x="6.5" y="19.2" textAnchor="middle" fill={GOLD} fontSize="5" fontWeight="800" fontFamily="system-ui">C</text>
      <text x="17.5" y="19.2" textAnchor="middle" fill={GOLD} fontSize="5" fontWeight="800" fontFamily="system-ui">D</text>
    </svg>
  ),
  selecciones: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="i-globe" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.04" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9.5" fill="url(#i-globe)" stroke={GOLD} strokeWidth="1.3" />
      <ellipse cx="12" cy="12" rx="4.5" ry="9.5" stroke={GOLD} strokeWidth="0.8" opacity="0.5" />
      <path d="M3 9h18" stroke={GOLD} strokeWidth="0.7" opacity="0.45" />
      <path d="M3 15h18" stroke={GOLD} strokeWidth="0.7" opacity="0.45" />
      <circle cx="17" cy="18" r="4" fill={BG_DARK} stroke={GOLD} strokeWidth="1.2" />
      <text x="17" y="20" textAnchor="middle" fill={GOLD} fontSize="5" fontWeight="900" fontFamily="system-ui">48</text>
    </svg>
  ),
  creadores: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-crt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <circle cx="10" cy="7.5" r="4" fill="url(#i-crt)" stroke={GOLD} strokeWidth="1.3" />
      <path d="M3 21a7 7 0 0 1 14 0" fill={GOLD} fillOpacity="0.08" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="18.5" cy="15" r="4.5" fill={BG_DARK} stroke={GOLD} strokeWidth="1.2" />
      <path d="M17 13l4 2-4 2z" fill={GOLD} fillOpacity="0.6" stroke={GOLD} strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  ),
  historia: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-book" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d="M2 4.5C2 3.7 2.7 3 3.5 3H10c1.1 0 2 .9 2 2v15l-.5-.5C10.6 19 9.8 18.5 9 18.5H3.5c-.8 0-1.5-.7-1.5-1.5V4.5z" fill="url(#i-book)" stroke={GOLD} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M22 4.5c0-.8-.7-1.5-1.5-1.5H14c-1.1 0-2 .9-2 2v15l.5-.5c.9-.5 1.7-1 2.5-1h5.5c.8 0 1.5-.7 1.5-1.5V4.5z" fill="url(#i-book)" stroke={GOLD} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5 7h4" stroke={GOLD} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <path d="M15 7h4" stroke={GOLD} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <path d="M11 10l.6 1.2 1.3.2-1 .9.2 1.3-1.1-.6-1.1.6.2-1.3-1-.9 1.3-.2z" fill={GOLD} opacity="0.7" />
    </svg>
  ),
  formato: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-brk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="2" width="7" height="3.5" rx="1" fill="url(#i-brk)" stroke={GOLD} strokeWidth="1.1" />
      <rect x="1.5" y="9.25" width="7" height="3.5" rx="1" fill="url(#i-brk)" stroke={GOLD} strokeWidth="1.1" />
      <rect x="1.5" y="18.5" width="7" height="3.5" rx="1" fill="url(#i-brk)" stroke={GOLD} strokeWidth="1.1" />
      <path d="M8.5 3.75h3v7.5h-3" stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M11.5 7.5h3" stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="18.5" cy="12" r="4.5" fill={BG_DARK} stroke={GOLD} strokeWidth="1.3" />
      <path d="M18.5 8.5l1.2 2.3 2.6.4-1.9 1.8.4 2.5-2.3-1.2-2.3 1.2.4-2.5-1.9-1.8 2.6-.4z" fill={GOLD} fillOpacity="0.6" stroke={GOLD} strokeWidth="0.5" />
    </svg>
  ),
  unete: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-door" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="10" y="2" width="12" height="20" rx="2" fill="url(#i-door)" stroke={GOLD} strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="19" cy="12" r="1" fill={GOLD} />
      <path d="M2 12h10" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 8l4 4-4 4" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════════
   ICON_PATHS — Versiones simplificadas (trazo) para usar con ZmIcon
   ═══════════════════════════════════════════════════════════════════ */
export const ICON_PATHS = {
  matchCenter: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10M2 12h20M4.9 7h14.2M4.9 17h14.2" />
    </>
  ),
  predicciones: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" />
    </>
  ),
  fantasy: (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 22V14.6a8 8 0 0 1-5.2-4.4" />
      <path d="M14 22V14.6a8 8 0 0 0 5.2-4.4" />
      <path d="M6 2h12v4a6 6 0 0 1-12 0V2Z" />
    </>
  ),
  iaCoach: (
    <>
      <path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4Z" />
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <circle cx="9" cy="14" r="1.5" fill={GOLD} />
      <circle cx="15" cy="14" r="1.5" fill={GOLD} />
      <path d="M9 18h6" />
    </>
  ),
  streaming: (
    <>
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M2 18h20" />
      <polygon points="10,9 10,15 15,12" fill={GOLD} stroke="none" />
    </>
  ),
  trivia: (
    <>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </>
  ),
  carrera: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M7 6V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      <path d="M12 12v4" />
      <path d="M10 14h4" />
    </>
  ),
  ligas: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M7 21v-2a4 4 0 0 1 3-3.87" />
      <circle cx="12" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  rankings: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 17V11" />
      <path d="M11 17V7" />
      <path d="M15 17v-6" />
      <path d="M19 17V5" />
    </>
  ),
  chat: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
      <path d="M8 10h8" />
      <path d="M8 13h5" />
    </>
  ),
  microPred: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  stories: (
    <>
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M6 8h4" />
      <path d="M6 12h12" />
      <path d="M6 16h10" />
    </>
  ),
};

/* ═══════════════════════════════════════════════════════════════════
   ICON_STEPS — Iconos de los 3 pasos (Elige creador, Registro, Juega)
   ═══════════════════════════════════════════════════════════════════ */
export const ICON_STEPS = {
  eligeCreador: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="s-avatar" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="8" r="4.5" fill="url(#s-avatar)" stroke={GOLD} strokeWidth="1.3" />
      <path d="M4.5 21.5a7.5 7.5 0 0 1 15 0" fill={GOLD} fillOpacity="0.08" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M18.5 4.5l.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1 1.5-.2z" fill={GOLD} />
    </svg>
  ),
  registro: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="s-doc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.18" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z" fill="url(#s-doc)" stroke={GOLD} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M14 2v4.5a1.5 1.5 0 0 0 1.5 1.5H20" stroke={GOLD} strokeWidth="1.2" fill={GOLD} fillOpacity="0.1" />
      <path d="M8 13h6" stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M8 16.5h4" stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
      <circle cx="18" cy="17.5" r="4" fill={BG_DARK} stroke={GOLD} strokeWidth="1.3" />
      <path d="M16.2 17.5l1.3 1.3 2.8-2.8" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  juega: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="s-stad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <ellipse cx="12" cy="14" rx="10" ry="5" fill="url(#s-stad)" stroke={GOLD} strokeWidth="1.2" />
      <path d="M2 14v3c0 2.8 4.5 5 10 5s10-2.2 10-5v-3" stroke={GOLD} strokeWidth="1.2" />
      <path d="M12 3v5" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 3h3.5v2.5h-3.5" fill={GOLD} fillOpacity="0.5" stroke={GOLD} strokeWidth="0.9" strokeLinejoin="round" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════════
   ICON_SOCIAL — Iconos de redes sociales
   ═══════════════════════════════════════════════════════════════════ */
export const ICON_SOCIAL: Record<string, React.ReactNode> = {
  youtube: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
      <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" />
    </svg>
  ),
  twitch: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
      <path d="M11.6 11.2h2v5.3h-2v-5.3zm5.3 0h2v5.3h-2v-5.3zM6 0L1.3 4.7v14.7h5.3V24l4.7-4.7h3.8L22.7 12V0H6zm14.7 11l-3.6 3.6h-3.6l-3.1 3.1v-3.1H6.6V2h14v9z" />
    </svg>
  ),
  tiktok: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
      <path d="M19.3 5.3A4.5 4.5 0 0116.5 2h-3.4v13.5a2.7 2.7 0 11-1.8-2.5V9.5a6.2 6.2 0 105.3 6.1V10a8 8 0 004.7 1.5V8a4.5 4.5 0 01-2-2.7z" />
    </svg>
  ),
  instagram: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 2.2c2.7 0 3 0 4.1.1 1 0 1.5.2 1.9.3.5.2.8.4 1.1.7.3.3.5.7.7 1.1.1.4.3.9.3 1.9 0 1.1.1 1.4.1 4.1s0 3-.1 4.1c0 1-.2 1.5-.3 1.9-.2.5-.4.8-.7 1.1-.3.3-.7.5-1.1.7-.4.1-.9.3-1.9.3-1.1 0-1.4.1-4.1.1s-3 0-4.1-.1c-1 0-1.5-.2-1.9-.3-.5-.2-.8-.4-1.1-.7-.3-.3-.5-.7-.7-1.1-.1-.4-.3-.9-.3-1.9 0-1.1-.1-1.4-.1-4.1s0-3 .1-4.1c0-1 .2-1.5.3-1.9.2-.5.4-.8.7-1.1.3-.3.7-.5 1.1-.7.4-.1.9-.3 1.9-.3 1.1 0 1.4-.1 4.1-.1M12 0C9.3 0 8.9 0 7.8.1 6.7.1 5.9.3 5.2.6c-.7.3-1.3.6-1.9 1.2C2.7 2.4 2.4 3 2.1 3.7c-.3.7-.5 1.5-.5 2.6C1.5 7.4 1.5 7.8 1.5 12s0 4.6.1 5.7c.1 1.1.3 1.9.6 2.6.3.7.6 1.3 1.2 1.9.6.6 1.2.9 1.9 1.2.7.3 1.5.5 2.6.6 1.1 0 1.5.1 5.7.1s4.6 0 5.7-.1c1.1-.1 1.9-.3 2.6-.6.7-.3 1.3-.6 1.9-1.2.6-.6.9-1.2 1.2-1.9.3-.7.5-1.5.6-2.6 0-1.1.1-1.5.1-5.7s0-4.6-.1-5.7c-.1-1.1-.3-1.9-.6-2.6-.3-.7-.6-1.3-1.2-1.9-.6-.6-1.2-.9-1.9-1.2C18.1.3 17.3.1 16.2.1 15.1 0 14.7 0 12 0zm0 5.8a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zm0 10.2a4 4 0 110-8 4 4 0 010 8zm6.4-10.5a1.4 1.4 0 100-2.9 1.4 1.4 0 000 2.9z" />
    </svg>
  ),
  twitter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
      <path d="M18.2 2.25h3.5l-7.6 8.7 9 11.8h-7l-5.5-7.2-6.3 7.2H.8l8.1-9.3-8.6-11.3h7.2l5 6.6 5.7-6.5zm-1.2 18.5h1.9L7.1 4.2H5.1l11.9 16.5z" />
    </svg>
  ),
  threads: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
      <path d="M12.2 2C6.6 2 2.2 6.5 2.2 12c0 5.5 4.4 10 9.8 10h.2c5.5 0 9.8-4.5 9.8-10S17.6 2 12.2 2zm4.5 14.3c-.5 1.2-1.7 2-3 2.2-.8.1-1.5.1-2.3-.1-1.1-.3-2-1-2.5-2-.3-.6-.4-1.2-.3-1.9.2-1.3 1.1-2.2 2.3-2.6.8-.3 1.7-.3 2.5 0 .5.2.9.5 1.2.9l-1 .8c-.5-.5-1.2-.7-1.9-.5-.9.2-1.5 1-1.3 1.9.1.6.5 1 1 1.3.6.3 1.3.3 1.9.1.5-.2.8-.5 1-.9h-1.5v-1.2h2.8c.1.7 0 1.3-.2 1.9z" />
    </svg>
  ),
  whatsapp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.914.914l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.592-.826-6.326-2.209l-.362-.29-3.053 1.024 1.024-3.053-.29-.362A9.935 9.935 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════════
   ICON_UI — Iconos utilitarios (check, lock, star, shield, etc.)
   ═══════════════════════════════════════════════════════════════════ */
export const ICON_UI = {
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  shieldCheck: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  circleCheck: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  lock: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  ),
  star: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════════
   IMAGE_TO_ICON — Mapeo de nombres de archivo de imagen a iconos SVG
   Permite reemplazar <img src="...filename.png"> por <SvgIcon name="filename">
   ═══════════════════════════════════════════════════════════════════ */
export const IMAGE_TO_ICON: Record<string, React.ReactNode> = {
  'match center': ICON_V3.matchCenter,
  'predicciones': ICON_V3.predicciones,
  'fantasy': ICON_V3.fantasy,
  'ia coach': ICON_V3.iaCoach,
  'streaming': ICON_V3.streaming,
  'trivia': ICON_V3.trivia,
  'modo carrera': ICON_V3.carrera,
  'ligas privadas': ICON_V3.ligas,
  'ranking': ICON_V3.rankings,
  'chat en vivo': ICON_V3.chat,
  'micro-predicciones': ICON_V3.microPred,
  'stories': ICON_V3.stories,
  '48 selecciones': ICON_DESCUBRE.selecciones,
  'creadores': ICON_DESCUBRE.creadores,
  'formato 2026': ICON_DESCUBRE.formato,
  'historia': ICON_DESCUBRE.historia,
  'los 12 grupos': ICON_DESCUBRE.grupos,
  'unete ahora': ICON_DESCUBRE.unete,
};

/** Componente que renderiza un icono SVG a partir de un nombre o path de imagen */
export function SvgIcon({
  name,
  size = 24,
  className = '',
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Extraer nombre del archivo si viene un path completo
  const key = name.includes('/') ? (name.split('/').pop()?.replace('.png', '') || '') : name.replace('.png', '');
  const icon = IMAGE_TO_ICON[key];
  if (!icon) return null;
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 [&_svg]:w-full [&_svg]:h-full ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {icon}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Tipos exportados para autocompletado
   ═══════════════════════════════════════════════════════════════════ */
export type IconV3Key = keyof typeof ICON_V3;
export type IconDescubreKey = keyof typeof ICON_DESCUBRE;
export type IconPathsKey = keyof typeof ICON_PATHS;
export type IconStepsKey = keyof typeof ICON_STEPS;

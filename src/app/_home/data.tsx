import { ReactNode } from "react";

// ═══════ ICONOS v3 — SVG con profundidad 3D y gradientes ═══════
export const ICON_V3: Record<string, ReactNode> = {
  matchCenter: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="i-ball" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#e8d48a" />
          <stop offset="70%" stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#8a6f2a" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9.5" fill="url(#i-ball)" opacity="0.2" stroke="#c9a84c" strokeWidth="1.2" />
      <path
        d="M12 2.5V6.5l3.5 2.5 1-4M12 2.5l-3.5 4-1 4M8.5 6.5L5 10.5M12 21.5v-4l-3.5-2.5-1 4M12 21.5l3.5-4 1-4M15.5 17.5l3.5-4M2.5 12h4l2.5 3.5-2 3M21.5 12h-4l-2.5 3.5 2 3M5 10.5l-2 1.5M19 10.5l2 1.5M8.5 6.5l3.5 2 3.5-2"
        stroke="#c9a84c"
        strokeWidth="0.9"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle cx="10" cy="9" r="1.5" fill="#c9a84c" fillOpacity="0.15" stroke="#c9a84c" strokeWidth="0.6" />
    </svg>
  ),
  predicciones: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="i-tgt" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.02" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="13" r="9.5" fill="url(#i-tgt)" stroke="#c9a84c" strokeWidth="1" />
      <circle cx="12" cy="13" r="6.5" stroke="#c9a84c" strokeWidth="1.2" opacity="0.7" />
      <circle cx="12" cy="13" r="3.5" fill="#c9a84c" fillOpacity="0.2" stroke="#c9a84c" strokeWidth="1.3" />
      <circle cx="12" cy="13" r="1.2" fill="#c9a84c" />
      <path d="M19 2l-5.5 5.5" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M19 2l-4 .5.5 3.5 3.5.5z"
        fill="#c9a84c"
        fillOpacity="0.5"
        stroke="#c9a84c"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
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
      <path
        d="M6 3h12v5a6 6 0 0 1-12 0V3z"
        fill="url(#i-cup)"
        fillOpacity="0.25"
        stroke="#c9a84c"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M6 5H4a2.5 2.5 0 0 0 0 5h1" stroke="#c9a84c" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M18 5h2a2.5 2.5 0 0 1 0 5h-1" stroke="#c9a84c" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M10 13.5v4h-1.5a1 1 0 0 0-1 1V21h9v-2.5a1 1 0 0 0-1-1H14v-4"
        stroke="#c9a84c"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 5.5l.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.8-1.6.8.3-1.8L9.4 7.4l1.8-.3z"
        fill="#c9a84c"
      />
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
      <rect x="5" y="5" width="14" height="14" rx="3" fill="url(#i-chip)" stroke="#c9a84c" strokeWidth="1.3" />
      <path
        d="M9 1.5v3M15 1.5v3M9 19.5v3M15 19.5v3M1.5 9h3M1.5 15h3M19.5 9h3M19.5 15h3"
        stroke="#c9a84c"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.5" fill="#c9a84c" fillOpacity="0.15" stroke="#c9a84c" strokeWidth="1" />
      <circle cx="12" cy="12" r="1.5" fill="#c9a84c" fillOpacity="0.5" />
    </svg>
  ),
  streaming: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-scr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="3.5" width="21" height="14" rx="2.5" fill="url(#i-scr)" stroke="#c9a84c" strokeWidth="1.3" />
      <path d="M9 19.5h6" stroke="#c9a84c" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 17.5v2" stroke="#c9a84c" strokeWidth="1.3" />
      <path
        d="M10 8.5v6l5-3z"
        fill="#c9a84c"
        fillOpacity="0.6"
        stroke="#c9a84c"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="6" r="2.5" fill="#060B14" stroke="#c9a84c" strokeWidth="1" />
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
      <path
        d="M12 1.5l9 4.5v5.5c0 6-4 10.5-9 12-5-1.5-9-6-9-12V6z"
        fill="url(#i-shld)"
        stroke="#c9a84c"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 7L10 13h3l-1 5 4.5-6.5h-3z"
        fill="#c9a84c"
        fillOpacity="0.7"
        stroke="#c9a84c"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
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
      <path
        d="M7 2l-5 4.5 2.5 3L7 8v13h10V8l2.5 1.5L22 6.5 17 2h-3l-2 2.5L10 2z"
        fill="url(#i-shirt)"
        stroke="#c9a84c"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <text x="12" y="16.5" textAnchor="middle" fill="#c9a84c" fontSize="7.5" fontWeight="900" fontFamily="system-ui,sans-serif">
        10
      </text>
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
      <path
        d="M12 1.5l9 4.5v5.5c0 6-4 10.5-9 12-5-1.5-9-6-9-12V6z"
        fill="url(#i-shld2)"
        stroke="#c9a84c"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" fill="#c9a84c" fillOpacity="0.25" stroke="#c9a84c" strokeWidth="1.1" />
      <path d="M7.5 17.5a4.5 4.5 0 0 1 9 0" stroke="#c9a84c" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7.5" cy="11" r="1.3" fill="#c9a84c" fillOpacity="0.2" stroke="#c9a84c" strokeWidth="0.8" />
      <circle cx="16.5" cy="11" r="1.3" fill="#c9a84c" fillOpacity="0.2" stroke="#c9a84c" strokeWidth="0.8" />
    </svg>
  ),
  rankings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-bar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="i-bar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="14" width="5.5" height="7.5" rx="1" fill="url(#i-bar2)" stroke="#c9a84c" strokeWidth="1.1" />
      <rect x="9.25" y="7" width="5.5" height="14.5" rx="1" fill="url(#i-bar1)" stroke="#c9a84c" strokeWidth="1.2" />
      <rect x="16" y="10.5" width="5.5" height="11" rx="1" fill="url(#i-bar2)" stroke="#c9a84c" strokeWidth="1.1" />
      <text x="5.25" y="19.5" textAnchor="middle" fill="#c9a84c" fontSize="5" fontWeight="800" fontFamily="system-ui">
        2
      </text>
      <text x="12" y="15" textAnchor="middle" fill="#c9a84c" fontSize="5" fontWeight="800" fontFamily="system-ui">
        1
      </text>
      <text x="18.75" y="18" textAnchor="middle" fill="#c9a84c" fontSize="5" fontWeight="800" fontFamily="system-ui">
        3
      </text>
      <path d="M12 3l1 2 2.2.3-1.6 1.5.4 2.1-2-.9-2 .9.4-2.1L8.8 5.3 11 5z" fill="#c9a84c" />
    </svg>
  ),
  chat: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-bbl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path
        d="M22 15a2.5 2.5 0 0 1-2.5 2.5H7L2.5 22V5A2.5 2.5 0 0 1 5 2.5h14.5A2.5 2.5 0 0 1 22 5v10z"
        fill="url(#i-bbl)"
        stroke="#c9a84c"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="10" r="1.3" fill="#c9a84c" fillOpacity="0.6" />
      <circle cx="12" cy="10" r="1.3" fill="#c9a84c" fillOpacity="0.45" />
      <circle cx="16" cy="10" r="1.3" fill="#c9a84c" fillOpacity="0.3" />
    </svg>
  ),
  microPred: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="i-chr" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.03" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="13.5" r="8.5" fill="url(#i-chr)" stroke="#c9a84c" strokeWidth="1.3" />
      <path d="M10 2h4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 2v3" stroke="#c9a84c" strokeWidth="1.3" />
      <path d="M18.5 7l1.5-1.5" stroke="#c9a84c" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 9.5v4l2.5 1.5" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="1.2" fill="#c9a84c" />
    </svg>
  ),
  stories: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-scard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <rect x="7.5" y="1" width="12" height="17" rx="2.5" stroke="#c9a84c" strokeWidth="0.8" opacity="0.25" transform="rotate(4 13 9)" />
      <rect x="5.5" y="3" width="12" height="17" rx="2.5" stroke="#c9a84c" strokeWidth="0.9" opacity="0.45" transform="rotate(1 11 11)" />
      <rect x="4" y="4.5" width="12" height="17" rx="2.5" fill="url(#i-scard)" stroke="#c9a84c" strokeWidth="1.3" />
      <rect x="6.5" y="7.5" width="7" height="4" rx="1" fill="#c9a84c" fillOpacity="0.2" stroke="#c9a84c" strokeWidth="0.6" />
      <path d="M6.5 14.5h7" stroke="#c9a84c" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M6.5 17h5" stroke="#c9a84c" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
      <circle cx="17.5" cy="18" r="3.5" fill="#060B14" stroke="#c9a84c" strokeWidth="1.2" />
      <path d="M16 18l1.2 1.2 2.5-2.5" stroke="#c9a84c" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ═══════ ICONOS v3 — 6 Tarjetas Descubre ═══════ */
export const ICON_DESCUBRE: Record<string, ReactNode> = {
  grupos: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-grid12" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="9" height="9" rx="2" fill="url(#i-grid12)" stroke="#c9a84c" strokeWidth="1.2" />
      <rect x="13" y="2" width="9" height="9" rx="2" fill="url(#i-grid12)" stroke="#c9a84c" strokeWidth="1.2" />
      <rect x="2" y="13" width="9" height="9" rx="2" fill="url(#i-grid12)" stroke="#c9a84c" strokeWidth="1.2" />
      <rect x="13" y="13" width="9" height="9" rx="2" fill="url(#i-grid12)" stroke="#c9a84c" strokeWidth="1.2" />
      <text x="6.5" y="8.2" textAnchor="middle" fill="#c9a84c" fontSize="5" fontWeight="800" fontFamily="system-ui">A</text>
      <text x="17.5" y="8.2" textAnchor="middle" fill="#c9a84c" fontSize="5" fontWeight="800" fontFamily="system-ui">B</text>
      <text x="6.5" y="19.2" textAnchor="middle" fill="#c9a84c" fontSize="5" fontWeight="800" fontFamily="system-ui">C</text>
      <text x="17.5" y="19.2" textAnchor="middle" fill="#c9a84c" fontSize="5" fontWeight="800" fontFamily="system-ui">D</text>
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
      <circle cx="12" cy="12" r="9.5" fill="url(#i-globe)" stroke="#c9a84c" strokeWidth="1.3" />
      <ellipse cx="12" cy="12" rx="4.5" ry="9.5" stroke="#c9a84c" strokeWidth="0.8" opacity="0.5" />
      <path d="M3 9h18" stroke="#c9a84c" strokeWidth="0.7" opacity="0.45" />
      <path d="M3 15h18" stroke="#c9a84c" strokeWidth="0.7" opacity="0.45" />
      <circle cx="17" cy="18" r="4" fill="#060B14" stroke="#c9a84c" strokeWidth="1.2" />
      <text x="17" y="20" textAnchor="middle" fill="#c9a84c" fontSize="5" fontWeight="900" fontFamily="system-ui">48</text>
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
      <circle cx="10" cy="7.5" r="4" fill="url(#i-crt)" stroke="#c9a84c" strokeWidth="1.3" />
      <path d="M3 21a7 7 0 0 1 14 0" fill="#c9a84c" fillOpacity="0.08" stroke="#c9a84c" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="18.5" cy="15" r="4.5" fill="#060B14" stroke="#c9a84c" strokeWidth="1.2" />
      <path d="M17 13l4 2-4 2z" fill="#c9a84c" fillOpacity="0.6" stroke="#c9a84c" strokeWidth="0.8" strokeLinejoin="round" />
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
      <path d="M2 4.5C2 3.7 2.7 3 3.5 3H10c1.1 0 2 .9 2 2v15l-.5-.5C10.6 19 9.8 18.5 9 18.5H3.5c-.8 0-1.5-.7-1.5-1.5V4.5z" fill="url(#i-book)" stroke="#c9a84c" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M22 4.5c0-.8-.7-1.5-1.5-1.5H14c-1.1 0-2 .9-2 2v15l.5-.5c.9-.5 1.7-1 2.5-1h5.5c.8 0 1.5-.7 1.5-1.5V4.5z" fill="url(#i-book)" stroke="#c9a84c" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5 7h4" stroke="#c9a84c" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <path d="M15 7h4" stroke="#c9a84c" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <path d="M11 10l.6 1.2 1.3.2-1 .9.2 1.3-1.1-.6-1.1.6.2-1.3-1-.9 1.3-.2z" fill="#c9a84c" opacity="0.7" />
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
      <rect x="1.5" y="2" width="7" height="3.5" rx="1" fill="url(#i-brk)" stroke="#c9a84c" strokeWidth="1.1" />
      <rect x="1.5" y="9.25" width="7" height="3.5" rx="1" fill="url(#i-brk)" stroke="#c9a84c" strokeWidth="1.1" />
      <rect x="1.5" y="18.5" width="7" height="3.5" rx="1" fill="url(#i-brk)" stroke="#c9a84c" strokeWidth="1.1" />
      <path d="M8.5 3.75h3v7.5h-3" stroke="#c9a84c" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M11.5 7.5h3" stroke="#c9a84c" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="18.5" cy="12" r="4.5" fill="#060B14" stroke="#c9a84c" strokeWidth="1.3" />
      <path d="M18.5 8.5l1.2 2.3 2.6.4-1.9 1.8.4 2.5-2.3-1.2-2.3 1.2.4-2.5-1.9-1.8 2.6-.4z" fill="#c9a84c" fillOpacity="0.6" stroke="#c9a84c" strokeWidth="0.5" />
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
      <rect x="10" y="2" width="12" height="20" rx="2" fill="url(#i-door)" stroke="#c9a84c" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="19" cy="12" r="1" fill="#c9a84c" />
      <path d="M2 12h10" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 8l4 4-4 4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  album: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="i-album" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="url(#i-album)" stroke="#c9a84c" strokeWidth="1.4" />
      <rect x="6" y="6" width="7" height="9" rx="1" fill="#c9a84c" fillOpacity="0.15" stroke="#c9a84c" strokeWidth="1" />
      <circle cx="9.5" cy="14.5" r="1.5" fill="#c9a84c" fillOpacity="0.6" />
      <rect x="14" y="6" width="4" height="4" rx="0.5" fill="#c9a84c" fillOpacity="0.25" stroke="#c9a84c" strokeWidth="0.8" />
      <rect x="14" y="11.5" width="4" height="6.5" rx="0.5" fill="#c9a84c" fillOpacity="0.1" stroke="#c9a84c" strokeWidth="0.8" />
    </svg>
  ),
};

export const CREATORS = [
  { name: "José Cobo", handle: "@josecobo", followers: "4.7M", slug: "josecobo", img: "/img/zonamundial-images/creators/jose-cobo.jpg", color: "#c9a84c" },
  { name: "SVGiago", handle: "@svgiago", followers: "2.5M", slug: "svgiago", img: "/img/zonamundial-images/creators/svgiago.jpg", color: "#00d4ff" },
  { name: "Pimpeano", handle: "@pimpeano", followers: "2.3M", slug: "pimpeano", img: "/img/zonamundial-images/creators/pimpeano.jpg", color: "#ff6b35" },
  { name: "Nacho CP", handle: "@nachocp", followers: "1.6M", slug: "nachocp", img: "/img/zonamundial-images/creators/nachocp.jpg", color: "#22c55e" },
  { name: "Nereita", handle: "@nereita", followers: "500K", slug: "nereita", img: "/img/zonamundial-images/creators/nereita.jpg", color: "#e879f9" },
  { name: "Elopi23", handle: "@elopi23", followers: "300K", slug: "elopi23", img: "/img/zonamundial-images/creators/elopi23.jpg", color: "#38bdf8" },
  { name: "Salvador", handle: "@salvador", followers: "300K", slug: "salvador", img: "/img/zonamundial-images/creators/salvador.jpg", color: "#f97316" },
  { name: "Franbar", handle: "@franbar", followers: "130K", slug: "franbar", img: "/img/zonamundial-images/creators/franbar.jpg", color: "#a78bfa" },
];

export const MODULES_BASE = [
  { key: "matchCenter", icon: ICON_V3.matchCenter, color: "#c9a84c", href: "/la-app" },
  { key: "predicciones", icon: ICON_V3.predicciones, color: "#ef4444", href: "/app/predicciones" },
  { key: "fantasy", icon: ICON_V3.fantasy, color: "#3b82f6", href: "/app/fantasy" },
  { key: "iaCoach", icon: ICON_V3.iaCoach, color: "#22c55e", href: "/app/ia-coach" },
  { key: "streaming", icon: ICON_V3.streaming, color: "#f97316", href: "/app/streaming" },
  { key: "trivia", icon: ICON_V3.trivia, color: "#a855f7", href: "/app/trivia" },
  { key: "carrera", icon: ICON_V3.carrera, color: "#ec4899", href: "/app/modo-carrera" },
  { key: "ligas", icon: ICON_V3.ligas, color: "#14b8a6", href: "/app/ligas" },
  { key: "rankings", icon: ICON_V3.rankings, color: "#f59e0b", href: "/la-app" },
  { key: "chat", icon: ICON_V3.chat, color: "#6366f1", href: "/la-app" },
  { key: "microPred", icon: ICON_V3.microPred, color: "#dc2626", href: "/la-app" },
  { key: "stories", icon: ICON_V3.stories, color: "#8b5cf6", href: "/la-app" },
  { key: "album", icon: ICON_V3.album, color: "#eab308", href: "/app/album" },
] as const;

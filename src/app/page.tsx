// src/app/page.tsx
// ZonaMundial.app — Home Page con GSAP Animations

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { FeatureIcon } from "@/components/FeatureIcon";
import { useGSAPAnimations, useHoverAnimation, useMagneticButton } from "@/hooks/useGSAPAnimations";
import { GoldParticles } from "@/components/GoldParticles";
import { LuxuryBallBanner } from "@/components/LuxuryBallBanner";
import { ShimmerCard } from "@/components/ShimmerCard";
import { RippleButton } from "@/components/RippleButton";
import { FloatingElements } from "@/components/FloatingElements";
import { useLanguage } from "@/i18n/LanguageContext";

const IMGS = {
  c_elopi23: "/img/zonamundial-images/creators/elopi23.jpg",
  c_franbar: "/img/zonamundial-images/creators/franbar.jpg",
  c_jose_cobo: "/img/zonamundial-images/creators/jose-cobo.jpg",
  c_nachocp: "/img/zonamundial-images/creators/nachocp.jpg",
  c_nereita: "/img/zonamundial-images/creators/nereita.jpg",
  c_pimpeano: "/img/zonamundial-images/creators/pimpeano.jpg",
  c_salvador: "/img/zonamundial-images/creators/salvador.jpg",
  c_svgiago: "/img/zonamundial-images/creators/svgiago.jpg",
};

// ═══════ ICONOS v3 — SVG con profundidad 3D y gradientes ═══════
const ICON_V3 = {
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
const ICON_DESCUBRE = {
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
};

const CREATORS=[
  {name:"José Cobo",handle:"@josecobo",followers:"4.7M",slug:"josecobo",img:IMGS.c_jose_cobo,color:"#c9a84c"},
  {name:"SVGiago",handle:"@svgiago",followers:"2.5M",slug:"svgiago",img:IMGS.c_svgiago,color:"#00d4ff"},
  {name:"Pimpeano",handle:"@pimpeano",followers:"2.3M",slug:"pimpeano",img:IMGS.c_pimpeano,color:"#ff6b35"},
  {name:"Nacho CP",handle:"@nachocp",followers:"1.6M",slug:"nachocp",img:IMGS.c_nachocp,color:"#22c55e"},
  {name:"Nereita",handle:"@nereita",followers:"500K",slug:"nereita",img:IMGS.c_nereita,color:"#e879f9"},
  {name:"Elopi23",handle:"@elopi23",followers:"300K",slug:"elopi23",img:IMGS.c_elopi23,color:"#38bdf8"},
  {name:"Salvador",handle:"@salvador",followers:"300K",slug:"salvador",img:IMGS.c_salvador,color:"#f97316"},
  {name:"Franbar",handle:"@franbar",followers:"130K",slug:"franbar",img:IMGS.c_franbar,color:"#a78bfa"},
];

const MODULES_BASE = [
  { key: "matchCenter",  icon: ICON_V3.matchCenter,  color: "#c9a84c" },
  { key: "predicciones", icon: ICON_V3.predicciones, color: "#ef4444" },
  { key: "fantasy",      icon: ICON_V3.fantasy,      color: "#3b82f6" },
  { key: "iaCoach",      icon: ICON_V3.iaCoach,      color: "#22c55e" },
  { key: "streaming",    icon: ICON_V3.streaming,    color: "#f97316" },
  { key: "trivia",       icon: ICON_V3.trivia,       color: "#a855f7" },
  { key: "carrera",      icon: ICON_V3.carrera,      color: "#ec4899" },
  { key: "ligas",        icon: ICON_V3.ligas,        color: "#14b8a6" },
  { key: "rankings",     icon: ICON_V3.rankings,     color: "#f59e0b" },
  { key: "chat",         icon: ICON_V3.chat,         color: "#6366f1" },
  { key: "microPred",    icon: ICON_V3.microPred,    color: "#dc2626" },
  { key: "stories",      icon: ICON_V3.stories,      color: "#8b5cf6" },
] as const;

const SPONSORS = [
  { name: "Patrocinador 1", img: "/img/sponsors/sponsor-1.png" },
  { name: "Patrocinador 2", img: "/img/sponsors/sponsor-2.png" },
  { name: "Patrocinador 3", img: "/img/sponsors/sponsor-3.png" },
  { name: "Patrocinador 4", img: "/img/sponsors/sponsor-4.png" },
  { name: "Patrocinador 5", img: "/img/sponsors/sponsor-5.png" },
  { name: "Patrocinador 6", img: "/img/sponsors/sponsor-6.png" },
  { name: "Patrocinador 7", img: "/img/sponsors/sponsor-7.png" },
  { name: "Patrocinador 8", img: "/img/sponsors/sponsor-8.png" },
];

const GROUPS=[
  {l:"A",t:[{n:"México",f:"mx"},{n:"Corea del Sur",f:"kr"},{n:"Sudáfrica",f:"za"},{n:"Rep. Checa",f:"cz"}]},
  {l:"B",t:[{n:"Canadá",f:"ca"},{n:"Suiza",f:"ch"},{n:"Qatar",f:"qa"},{n:"Bosnia",f:"ba"}]},
  {l:"C",t:[{n:"Brasil",f:"br"},{n:"Marruecos",f:"ma"},{n:"Escocia",f:"gb-sct"},{n:"Haití",f:"ht"}]},
  {l:"D",t:[{n:"EE.UU.",f:"us"},{n:"Australia",f:"au"},{n:"Paraguay",f:"py"},{n:"Turquía",f:"tr"}]},
  {l:"E",t:[{n:"Alemania",f:"de"},{n:"Ecuador",f:"ec"},{n:"C. de Marfil",f:"ci"},{n:"Curazao",f:"cw"}]},
  {l:"F",t:[{n:"P. Bajos",f:"nl"},{n:"Japón",f:"jp"},{n:"Túnez",f:"tn"},{n:"Suecia",f:"se"}]},
  {l:"G",t:[{n:"Bélgica",f:"be"},{n:"Irán",f:"ir"},{n:"Egipto",f:"eg"},{n:"N. Zelanda",f:"nz"}]},
  {l:"H",t:[{n:"España",f:"es"},{n:"Uruguay",f:"uy"},{n:"A. Saudí",f:"sa"},{n:"Cabo Verde",f:"cv"}]},
  {l:"I",t:[{n:"Francia",f:"fr"},{n:"Senegal",f:"sn"},{n:"Noruega",f:"no"},{n:"Irak",f:"iq"}]},
  {l:"J",t:[{n:"Argentina",f:"ar"},{n:"Austria",f:"at"},{n:"Argelia",f:"dz"},{n:"Jordania",f:"jo"}]},
  {l:"K",t:[{n:"Portugal",f:"pt"},{n:"Colombia",f:"co"},{n:"Uzbekistán",f:"uz"},{n:"RD Congo",f:"cd"}]},
  {l:"L",t:[{n:"Inglaterra",f:"gb-eng"},{n:"Croacia",f:"hr"},{n:"Panamá",f:"pa"},{n:"Ghana",f:"gh"}]},
];

const BG="#060B14",BG2="#0F1D32",BG3="#0B1825",GOLD="#c9a84c",GOLD2="#e8d48b",MID="#8a94b0",DIM="#6a7a9a";

const Flag=({code,w=20}: {code: string | null, w?: number})=>code?<img src={`https://flagcdn.com/w${w}/${code}.png`} alt="" style={{width:w,height:Math.round(w*0.67),borderRadius:2,objectFit:"cover"}} loading="lazy"/>:<div style={{width:w,height:Math.round(w*0.67),borderRadius:2,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:6,color:DIM}}>?</span></div>;

function useCountdown(target: string){
  const[t,setT]=useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{const c=()=>{const diff=Math.max(0,+new Date(target)-+Date.now());setT({d:Math.floor(diff/864e5),h:Math.floor(diff%864e5/36e5),m:Math.floor(diff%36e5/6e4),s:Math.floor(diff%6e4/1e3)})};c();const i=setInterval(c,1000);return()=>clearInterval(i)},[target]);
  return t;
}

// Animated Counter Component
function AnimatedCounter({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center group cursor-default">
      <div className="text-3xl sm:text-4xl font-black text-[#C9A84C] mb-1 group-hover:scale-110 transition-transform duration-300">
        <span className="stat-number" data-value={value}>{value}</span>
      </div>
      <div className="text-xs sm:text-sm text-gray-400 font-medium">{label}</div>
    </div>
  );
}

// Magnetic Button Component con Ripple
function MagneticButton({ children, href, variant = "primary" }: { children: React.ReactNode; href: string; variant?: "primary" | "secondary" }) {
  const buttonRef = useMagneticButton();
  
  const baseClasses = "relative inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 overflow-hidden";
  const variantClasses = variant === "primary" 
    ? "bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] text-[#030712] hover:shadow-[0_0_40px_rgba(201,168,76,0.4)] hover:scale-105"
    : "border-2 border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/60 hover:scale-105";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement("span");
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%);
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 10;
    `;
    
    button.appendChild(ripple);

    gsap.to(ripple, {
      width: 500,
      height: 500,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      onComplete: () => ripple.remove()
    });
  };

  return (
    <Link href={href}>
      <button ref={buttonRef} className={`${baseClasses} ${variantClasses}`} onClick={handleClick}>
        {children}
      </button>
    </Link>
  );
}

type ModuleItem = { key: string; icon: React.ReactNode; color: string; title: string; desc: string };

// Feature Card with hover animation y shimmer
function FeatureCard({ module, index }: { module: ModuleItem; index: number }) {
  const cardRef = useHoverAnimation();
  const shimmerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const exploreLabel = t.home.explore;
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!shimmerRef.current || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    gsap.to(shimmerRef.current, {
      x: x - 100,
      y: y - 100,
      duration: 0.3,
      ease: "power2.out"
    });
  };
  
  const handleMouseEnter = () => {
    if (!shimmerRef.current) return;
    gsap.to(shimmerRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.3
    });
  };
  
  const handleMouseLeave = () => {
    if (!shimmerRef.current) return;
    gsap.to(shimmerRef.current, {
      opacity: 0,
      scale: 0.5,
      duration: 0.3
    });
  };
  
  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="feature-card relative p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-[#0F1D32] to-[#0B1825] hover:border-[#C9A84C]/30 transition-all duration-500 group cursor-pointer overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      {/* Efecto shimmer dorado */}
      <div
        ref={shimmerRef}
        className="absolute w-[200px] h-[200px] rounded-full pointer-events-none opacity-0"
        style={{
          background: "radial-gradient(circle, rgba(201, 168, 76, 0.5) 0%, rgba(201, 168, 76, 0.2) 40%, transparent 70%)",
          filter: "blur(30px)",
          transform: "translate(-50%, -50%) scale(0.5)"
        }}
      />
      
      <div className="mb-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/20 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
        <div className="relative float-animation w-14 h-14 flex items-center justify-center">
          {module.icon}
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#C9A84C] transition-colors">{module.title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{module.desc}</p>
      <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <span className="text-xs font-semibold" style={{ color: module.color }}>{exploreLabel}</span>
        <span style={{ color: module.color }}>→</span>
      </div>
    </div>
  );
}

export default function HomePage(){
  const { t } = useLanguage();
  const h = t.home;
  const MODULES = MODULES_BASE.map(m => ({
    ...m,
    title: h.modules[m.key].title,
    desc:  h.modules[m.key].desc,
  }));

  const cd=useCountdown("2026-06-11T00:00:00-05:00");
  const { heroRef, statsRef, featuresRef, cardsRef, creatorsRef, ctaRef } = useGSAPAnimations();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Refs y estados para el drag del carrusel
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const currentRowRef = useRef<HTMLDivElement | null>(null);

  // Handlers para el drag del carrusel
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, rowRef: React.RefObject<HTMLDivElement | null>) => {
    if (!rowRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    scrollStartX.current = rowRef.current.scrollLeft;
    currentRowRef.current = rowRef.current;
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !currentRowRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const walk = (clientX - dragStartX.current) * 1.5; // Multiplicador para mayor sensibilidad
    currentRowRef.current.scrollLeft = scrollStartX.current - walk;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    currentRowRef.current = null;
    // Retrasamos la reanudación para evitar que se mueva inmediatamente al soltar
    setTimeout(() => setIsPaused(false), 100);
  };

  useEffect(() => {
    if (titleRef.current) {
      const lines = titleRef.current.querySelectorAll('.hero-title-line');
      gsap.fromTo(lines, 
        { y: 60, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.2, 
          ease: "power3.out",
          delay: 0.5
        }
      );
    }
  }, []);

  return(
    <div style={{background:BG,color:"#fff",fontFamily:"'Outfit',sans-serif",minHeight:"100vh"}} className="relative overflow-hidden">
      <GoldParticles />
      
      {/* ═══════ HERO CON VIDEO LOGO ═══════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-12 pb-20 overflow-hidden">
        {/* Animated Background gradients */}
        <div className="absolute inset-0 parallax-slow" style={{background:`linear-gradient(170deg, ${BG2} 0%, ${BG} 50%, #0a0f1a 100%)`}}/>
        <div className="absolute inset-0" style={{background:"radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.15) 0%, transparent 50%)"}}/>
        <div className="absolute inset-0" style={{background:"radial-gradient(ellipse at 70% 80%, rgba(0,180,220,0.05) 0%, transparent 40%)"}}/>
        
        {/* Animated Field pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none parallax-slow" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <rect x="50" y="50" width="1100" height="700" fill="none" stroke="#c9a84c" strokeWidth="2"/>
          <line x1="600" y1="50" x2="600" y2="750" stroke="#c9a84c" strokeWidth="2"/>
          <circle cx="600" cy="400" r="91.5" fill="none" stroke="#c9a84c" strokeWidth="2"/>
          <circle cx="600" cy="400" r="3" fill="#c9a84c"/>
          <rect x="50" y="244" width="165" height="312" fill="none" stroke="#c9a84c" strokeWidth="2"/>
          <rect x="985" y="244" width="165" height="312" fill="none" stroke="#c9a84c" strokeWidth="2"/>
        </svg>

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#C9A84C]/10 rounded-full blur-[100px] animate-pulse"/>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{animationDelay: "1s"}}/>

        {/* Floating Elements */}
        <FloatingElements />

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="gsap-hero-item inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/5 mb-8 hover:bg-[#C9A84C]/10 transition-all cursor-default">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] animate-pulse"/>
            <span className="text-[#C9A84C] text-xs font-bold tracking-wider uppercase">
              {h.heroBadge}
            </span>
          </div>

          {/* Title con animación GSAP */}
          <h1
            ref={titleRef}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight"
          >
            <span className="hero-title-line block">{h.heroTitle1}</span>
            <span className="hero-title-line block text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] via-[#E8D48B] to-[#C9A84C] animate-gradient">
              {h.heroTitle2}
            </span>
          </h1>

          {/* VIDEO LOGO */}
          <div className="gsap-hero-item mb-8 flex justify-center">
            <div className="relative rounded-full overflow-hidden shadow-[0_0_80px_rgba(201,168,76,0.4)] hover:shadow-[0_0_120px_rgba(201,168,76,0.6)] transition-shadow duration-500">
              <div className="absolute inset-0 bg-gradient-to-t from-[#C9A84C]/20 to-transparent z-10"/>
              <video
                src="/img/zonamundial-images/video logo dando vueltas.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full max-w-[320px] h-auto block"
                style={{mixBlendMode:"screen"}}
              />
            </div>
          </div>

          <p className="gsap-hero-item text-xl text-[#8a94b0] max-w-2xl mx-auto mb-10 leading-relaxed">
            {h.heroSubtitle}
          </p>

          {/* Countdown */}
          <div className="gsap-hero-item flex justify-center gap-3 sm:gap-5 mb-10">
            {[{v:cd.d,l:h.countdown.days},{v:cd.h,l:h.countdown.hours},{v:cd.m,l:h.countdown.min},{v:cd.s,l:h.countdown.sec}].map((u, i)=>[
              <div key={u.l} className="text-center group">
                <div className="relative w-[70px] sm:w-[85px] h-[70px] sm:h-[85px] rounded-2xl bg-gradient-to-br from-[#0F1D32] to-[#0B1825] border border-[#C9A84C]/20 flex items-center justify-center shadow-lg group-hover:border-[#C9A84C]/50 group-hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] transition-all duration-300">
                  <span className="text-3xl sm:text-4xl font-black text-[#C9A84C] tabular-nums group-hover:scale-110 transition-transform">
                    {String(u.v).padStart(2,"0")}
                  </span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C9A84C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>
                <span className="text-[11px] text-gray-500 font-semibold mt-3 block tracking-widest">{u.l}</span>
              </div>
            ])}
          </div>

          {/* CTAs */}
          <div className="gsap-hero-item flex flex-wrap justify-center gap-4">
            <MagneticButton href="/registro" variant="primary">
              {h.heroCta1}
            </MagneticButton>
            <MagneticButton href="/selecciones" variant="secondary">
              {h.heroCta2}
            </MagneticButton>
          </div>
        </div>

        {/* Luxury Ball Background - Parabolic Motion */}
        <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
          <div className="relative w-full h-full">
            <LuxuryBallBanner />
          </div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section ref={statsRef} className="relative border-y border-white/5 bg-[#0B1825] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/5 via-transparent to-[#C9A84C]/5"/>
        <div className="max-w-6xl mx-auto px-4 py-10 relative">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
            <AnimatedCounter value={48}  label={h.stats.teams}     />
            <AnimatedCounter value={16}  label={h.stats.venues}    />
            <AnimatedCounter value={104} label={h.stats.matches}   />
            <AnimatedCounter value={12}  label={h.stats.groups}    />
            <AnimatedCounter value={3}   label={h.stats.countries} />
            <AnimatedCounter value={12}  label={h.stats.modules}   />
          </div>
        </div>
      </section>

      {/* ═══════ DESCUBRE LA APP ═══════ */}
      <section className="py-24 px-4 relative overflow-hidden" style={{background:BG2}}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#C9A84C]/5 blur-[180px] rounded-full pointer-events-none"/>

        <div ref={cardsRef} className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-5 py-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold tracking-wider uppercase mb-6">
              {h.platform.badge}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-5">
              {h.platform.title}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
              {h.platform.subtitle}
            </p>
          </div>

          {/* Why we are the perfect app */}
          <div className="relative mb-14 rounded-3xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#0B1825] to-[#0F1D32] overflow-hidden p-10 sm:p-14">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/5 via-transparent to-blue-900/10 pointer-events-none"/>
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <p className="text-[#C9A84C] text-sm font-bold tracking-widest uppercase mb-6">{h.platform.whyBadge}</p>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-8">
                {h.platform.whyTitle1} <span className="text-[#C9A84C]">{h.platform.whyTitleBold}</span> {h.platform.whyTitle2}
              </h3>
              <p className="text-gray-300 text-lg sm:text-xl leading-relaxed mb-10">
                {h.platform.whyDesc} <span className="text-white font-bold">{h.platform.whyDescBold}</span>{h.platform.whyDescEnd}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[#C9A84C] text-2xl font-black mb-2">48</p>
                  <p className="text-white font-semibold mb-1">{h.platform.card1Title}</p>
                  <p className="text-gray-400 text-sm">{h.platform.card1Desc}</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[#C9A84C] text-2xl font-black mb-2">100%</p>
                  <p className="text-white font-semibold mb-1">{h.platform.card2Title}</p>
                  <p className="text-gray-400 text-sm">{h.platform.card2Desc}</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[#C9A84C] text-2xl font-black mb-2">{h.platform.card3Value}</p>
                  <p className="text-white font-semibold mb-1">{h.platform.card3Title}</p>
                  <p className="text-gray-400 text-sm">{h.platform.card3Desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* More features row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              {icon: ICON_V3.streaming, title: t.nav.streaming,     desc: h.platform.streamingDesc, color: "#ef4444", href: "/app/streaming"},
              {icon: ICON_V3.iaCoach,   title: t.nav.iaCoach,       desc: h.platform.iaCoachDesc,   color: "#22c55e", href: "/app/ia-coach"},
              {icon: ICON_V3.chat,      title: "Chat",               desc: h.platform.chatDesc,      color: "#3b82f6", href: "/app/chat"},
              {icon: ICON_V3.rankings,  title: "Rankings",            desc: h.platform.rankingsDesc,  color: "#f59e0b", href: "/app/rankings"},
            ].map((feature) => (
              <Link key={feature.title} href={feature.href} className="group p-5 rounded-2xl border border-white/5 bg-[#0B1825]/50 hover:bg-[#0B1825] transition-all text-center hover:border-white/10">
                <div className="mb-3 flex justify-center">
                  <div className="p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform duration-300 w-12 h-12 flex items-center justify-center">
                    {feature.icon}
                  </div>
                </div>
                <h4 className="text-base font-bold text-white mb-1">{feature.title}</h4>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES CAROUSEL ═══════ */}
      <section ref={featuresRef} className="py-24 relative overflow-hidden" style={{background:BG}}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C9A84C]/5 blur-[150px] rounded-full pointer-events-none"/>

        {/* Header + texto */}
        <div className="max-w-5xl mx-auto px-4 text-center mb-16 relative">
          <span className="inline-block px-5 py-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold tracking-wider uppercase mb-6">
            {h.features.badge}
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            {h.features.title}
          </h2>
          <p className="text-gray-300 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto">
            {h.features.desc1} <span className="text-[#C9A84C] font-semibold">{h.features.desc2}</span>
          </p>
        </div>

        {/* Carrusel fila 1 — izquierda */}
        <div 
          ref={row1Ref}
          className={`relative mb-4 overflow-x-auto overflow-y-hidden scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={(e) => handleDragStart(e, row1Ref)}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e, row1Ref)}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex gap-4" style={{ width:"max-content", animation:"carousel-left 75s linear infinite", animationPlayState: isPaused || isDragging ? "paused" : "running" }}>
            {[...MODULES, ...MODULES].map((m, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-64 group select-none"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => !isDragging && setIsPaused(false)}
              >
                <div
                  className="relative h-full p-5 rounded-2xl overflow-hidden transition-all duration-400"
                  style={{
                    background: `linear-gradient(135deg, ${m.color}0D 0%, #0B1825 60%)`,
                    border: `1px solid ${m.color}22`,
                  }}
                >
                  {/* glow de fondo */}
                  <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none" style={{ background: m.color }}/>
                  {/* icono grande */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: `${m.color}1A`, boxShadow: `0 0 0 1px ${m.color}30` }}
                  >
                    <div className="w-10 h-10 flex items-center justify-center drop-shadow-lg">
                      {m.icon}
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-[15px] mb-2 leading-tight group-hover:text-opacity-80 transition-colors">{m.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{m.desc}</p>
                  {/* línea inferior coloreada */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl opacity-50" style={{ background: `linear-gradient(90deg, ${m.color}, transparent)` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrusel fila 2 — derecha */}
        <div 
          ref={row2Ref}
          className={`relative overflow-x-auto overflow-y-hidden scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={(e) => handleDragStart(e, row2Ref)}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e, row2Ref)}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex gap-4" style={{ width:"max-content", animation:"carousel-right 85s linear infinite", animationPlayState: isPaused || isDragging ? "paused" : "running" }}>
            {[...MODULES.slice(4), ...MODULES, ...MODULES.slice(0, 4)].map((m, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-64 group select-none"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => !isDragging && setIsPaused(false)}
              >
                <div
                  className="relative h-full p-5 rounded-2xl overflow-hidden transition-all duration-400"
                  style={{
                    background: `linear-gradient(135deg, ${m.color}0D 0%, #0B1825 60%)`,
                    border: `1px solid ${m.color}22`,
                  }}
                >
                  <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none" style={{ background: m.color }}/>
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: `${m.color}1A`, boxShadow: `0 0 0 1px ${m.color}30` }}
                  >
                    <div className="w-10 h-10 flex items-center justify-center drop-shadow-lg">
                      {m.icon}
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-[15px] mb-2 leading-tight group-hover:text-opacity-80 transition-colors">{m.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{m.desc}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl opacity-50" style={{ background: `linear-gradient(90deg, ${m.color}, transparent)` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes carousel-left {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes carousel-right {
            0%   { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </section>

      {/* ═══════ AD SPACE 1 — Espacio de Patrocinador ═══════ */}
      <div className="w-full border-y border-white/5 py-8 sm:py-12 relative" style={{background:"#07101C"}}>
        <p className="text-center text-[#C9A84C]/50 text-[11px] font-bold tracking-widest uppercase mb-6 select-none">{h.sponsors.official}</p>
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center">
          <a href="https://rotulemos.com" target="_blank" rel="noopener noreferrer" className="block">
            <img src="/img/imagenessilviu/rotulemos320x50.png" alt="Rotulemos - Patrocinador Oficial" className="rounded-xl hover:scale-105 transition-transform duration-300" style={{maxWidth:"100%",height:"auto"}} />
          </a>
        </div>
      </div>

      {/* ═══════ CREADORES ═══════ */}
      <section ref={creatorsRef} className="py-24 px-4 relative" style={{background:BG3}}>
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none"/>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-5 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold tracking-wider uppercase mb-6">
              {h.creators.badge}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              {h.creators.title}
            </h2>
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto mb-4">
              {h.creators.desc1}
            </p>
            <p className="text-gray-400 text-base max-w-2xl mx-auto mb-8">
              {h.creators.desc2Start}<span className="text-white font-semibold">{h.creators.desc2Bold}</span>{h.creators.desc2End}
            </p>
            <Link href="/creadores" className="inline-flex items-center gap-2 text-purple-300 text-sm font-semibold hover:text-purple-200 transition-colors border border-purple-500/30 hover:border-purple-400/50 px-5 py-2.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20">
              {h.creators.cta}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {CREATORS.map((c) => (
              <Link key={c.slug} href="/creadores" className="creator-card group">
                <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-[#0F1D32] to-[#0B1825] hover:border-white/15 transition-all duration-300 text-center hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#C9A84C] via-[#E8D48B] to-[#C9A84C] p-[2px] group-hover:p-[3px] transition-all">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#0F1D32]">
                        <img src={c.img} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-[#C9A84C] transition-colors">{c.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{c.handle}</p>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold" style={{background:c.color+"20",color:c.color}}>
                    {c.followers}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ AD SPACE 2 — Espacio de Patrocinador Premium ═══════ */}
      <div className="w-full border-y border-white/5 py-8 sm:py-12 relative" style={{background:"#07101C"}}>
        <p className="text-center text-[#C9A84C]/50 text-[11px] font-bold tracking-widest uppercase mb-6 select-none">{h.sponsors.premium}</p>
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center">
          <a href="#" target="_blank" rel="noopener noreferrer" className="block">
            <img src="/img/imagenessilviu/ChatGPT Image 8 abr 2026, 04_53_21 p.m..png" alt="Publicidad" className="rounded-xl hover:scale-105 transition-transform duration-300" style={{maxWidth:"100%",height:"auto"}} />
          </a>
        </div>
      </div>

      {/* ═══════ EXPLORA LA PLATAFORMA ═══════ */}
      <section className="py-24 px-4 relative" style={{background:BG}}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-5 py-2 rounded-full border border-[#C9A84C]/20 text-[#C9A84C] text-xs font-bold tracking-wider uppercase mb-6">
              {h.exploreSection.badge}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              {h.exploreSection.title}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              {h.exploreSection.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {title: h.exploreSection.grupos.title,     desc: h.exploreSection.grupos.desc,     icon: ICON_DESCUBRE.grupos,     color: "#3b82f6", href: "/grupos"},
              {title: h.exploreSection.selecciones.title,desc: h.exploreSection.selecciones.desc, icon: ICON_DESCUBRE.selecciones,color: "#22c55e", href: "/selecciones"},
              {title: h.exploreSection.creadores.title,  desc: h.exploreSection.creadores.desc,   icon: ICON_DESCUBRE.creadores,  color: "#a855f7", href: "/creadores"},
              {title: h.exploreSection.historia.title,   desc: h.exploreSection.historia.desc,    icon: ICON_DESCUBRE.historia,   color: "#f59e0b", href: "/historia"},
              {title: h.exploreSection.formato.title,    desc: h.exploreSection.formato.desc,     icon: ICON_DESCUBRE.formato,    color: "#ef4444", href: "/formato"},
              {title: h.exploreSection.unete.title,      desc: h.exploreSection.unete.desc,       icon: ICON_DESCUBRE.unete,      color: "#c9a84c", href: "/registro", featured: true},
            ].map((item) => (
              <Link key={item.title} href={item.href} className={`group p-7 rounded-3xl border transition-all duration-500 hover:-translate-y-1 ${item.featured ? 'border-[#C9A84C]/30 bg-gradient-to-br from-[#C9A84C]/10 to-[#0F1D32]' : 'border-white/5 bg-[#0F1D32] hover:border-[#C9A84C]/30'}`}>
                <div className="flex items-start justify-between mb-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110" style={{background: item.color + "15", borderColor: item.color + "30"}}>
                    <div className="w-10 h-10 flex items-center justify-center">
                      {item.icon}
                    </div>
                  </div>
                  <span className="text-[#C9A84C] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">→</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#C9A84C] transition-colors">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA FINAL ═══════ */}
      <section className="py-24 px-4 relative" style={{background:BG3}}>
        <div className="max-w-4xl mx-auto" ref={ctaRef}>
          <div className="relative p-10 sm:p-16 rounded-3xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#C9A84C]/10 via-[#0F1D32] to-[#0B1825] text-center overflow-hidden group">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/5 via-transparent to-[#C9A84C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"/>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#C9A84C]/20 blur-[100px] rounded-full"/>
            
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 float-animation w-20 h-20 flex items-center justify-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {ICON_V3.fantasy}
                  </div>
                </div>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">{h.ctaFinal.title}</h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto text-lg">
                {h.ctaFinal.desc}
              </p>
              <MagneticButton href="/registro" variant="primary">
                {h.ctaFinal.cta}
              </MagneticButton>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

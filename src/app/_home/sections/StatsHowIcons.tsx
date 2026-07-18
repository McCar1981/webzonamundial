"use client";

/* =====================================================================
   Premium glossy SVG icons v2 — gold ring + navy/glass interior.
   Each icon redesigned so the subject reads instantly at a glance.
   ===================================================================== */

type IconProps = { size?: number };

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDEFB8" />
        <stop offset="20%" stopColor="#F5D07A" />
        <stop offset="50%" stopColor="#D4A853" />
        <stop offset="80%" stopColor="#B8913F" />
        <stop offset="100%" stopColor="#8B6A2E" />
      </linearGradient>
      <radialGradient id={`${id}-inner`} cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#1b160d" />
        <stop offset="50%" stopColor="#14110a" />
        <stop offset="100%" stopColor="#000000" />
      </radialGradient>
      <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-icon`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFF1C4" />
        <stop offset="40%" stopColor="#F5D07A" />
        <stop offset="100%" stopColor="#B8913F" />
      </linearGradient>
    </defs>
  );
}

function Frame({
  id,
  size,
  children,
}: {
  id: string;
  size: number;
  children: React.ReactNode;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <Defs id={id} />
      <circle cx="50" cy="50" r="48" fill="none" stroke={`url(#${id}-ring)`} strokeWidth="0.5" opacity="0.4" />
      <circle cx="50" cy="50" r="46" fill={`url(#${id}-ring)`} />
      <circle cx="50" cy="50" r="40" fill={`url(#${id}-inner)`} />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#D4A853" strokeWidth="0.4" opacity="0.5" />
      {/* Top gloss arc */}
      <path
        d="M 12 40 A 38 38 0 0 1 88 40 L 82 42 A 32 32 0 0 0 18 42 Z"
        fill={`url(#${id}-gloss)`}
      />
      {children}
    </svg>
  );
}

/* ========== STATS ICONS (6) ========== */

/** 1. SELECCIONES — Checklist of jerseys (representing 48 teams to pick from) */
export function IconStatBall({ size = 84 }: IconProps) {
  const id = "sb";
  return (
    <Frame id={id} size={size}>
      {/* Classic soccer ball (clearly a soccer ball, not a circle) */}
      {/* Outer ball */}
      <circle cx="50" cy="50" r="22" fill={`url(#${id}-icon)`} stroke="#8B6A2E" strokeWidth="0.8" />
      {/* Center pentagon - the instantly recognisable soccer signature */}
      <path d="M 50 36.5 L 60.5 44 L 56.5 56.5 L 43.5 56.5 L 39.5 44 Z"
        fill="#0a0906" stroke="#8B6A2E" strokeWidth="0.5" />
      {/* Surrounding hexagons (dark) */}
      <path d="M 50 28 L 55 30.5 L 55 35.5 L 50 36.5 L 45 35.5 L 45 30.5 Z"
        fill="#0a0906" opacity="0.9" />
      <path d="M 68 40 L 72 43 L 70.5 48 L 65 47 L 61.5 44 L 63 40 Z"
        fill="#0a0906" opacity="0.9" />
      <path d="M 63 60 L 67 62 L 66 66 L 61 65 L 58 63 L 60 60 Z"
        fill="#0a0906" opacity="0.9" />
      <path d="M 37 60 L 40 63 L 39 65 L 33 66 L 32 62 L 37 60 Z"
        fill="#0a0906" opacity="0.9" />
      <path d="M 32 40 L 37 40 L 38.5 44 L 35 47 L 29.5 48 L 28 43 Z"
        fill="#0a0906" opacity="0.9" />
      {/* Seams connecting pentagon to hexagons */}
      <line x1="50" y1="36.5" x2="50" y2="34" stroke="#8B6A2E" strokeWidth="0.6" />
      <line x1="60.5" y1="44" x2="63" y2="43" stroke="#8B6A2E" strokeWidth="0.6" />
      <line x1="56.5" y1="56.5" x2="60" y2="60" stroke="#8B6A2E" strokeWidth="0.6" />
      <line x1="43.5" y1="56.5" x2="40" y2="60" stroke="#8B6A2E" strokeWidth="0.6" />
      <line x1="39.5" y1="44" x2="37" y2="43" stroke="#8B6A2E" strokeWidth="0.6" />
      {/* Specular highlight */}
      <ellipse cx="42" cy="41" rx="4.5" ry="2" fill="#FFF" opacity="0.4" transform="rotate(-30 42 41)" />
    </Frame>
  );
}

/** 2. SEDES — Stadium with lights and crowd */
export function IconStatStadium({ size = 84 }: IconProps) {
  const id = "st";
  return (
    <Frame id={id} size={size}>
      {/* Ground/pitch ellipse */}
      <ellipse cx="50" cy="64" rx="26" ry="4" fill="#0a0906" stroke={`url(#${id}-icon)`} strokeWidth="0.6" />
      {/* Pitch lines */}
      <ellipse cx="50" cy="64" rx="20" ry="2.5" fill="none" stroke={`url(#${id}-icon)`} strokeWidth="0.3" opacity="0.5" />
      <line x1="50" y1="62" x2="50" y2="66" stroke={`url(#${id}-icon)`} strokeWidth="0.3" opacity="0.5" />
      {/* Stands (layered arches) */}
      <path d="M 22 58 Q 50 38 78 58 L 74 62 Q 50 44 26 62 Z"
        fill={`url(#${id}-icon)`} stroke="#8B6A2E" strokeWidth="0.3" />
      <path d="M 26 54 Q 50 36 74 54 L 70 58 Q 50 42 30 58 Z"
        fill={`url(#${id}-icon)`} opacity="0.85" />
      {/* Roof with floodlights */}
      <path d="M 24 46 Q 50 30 76 46"
        fill="none" stroke={`url(#${id}-icon)`} strokeWidth="1.8" />
      {/* Floodlight rays */}
      {[28, 40, 50, 60, 72].map((x, i) => {
        const y = 46 - Math.sin(((x - 24) / 52) * Math.PI) * 8;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="1.8" fill="#FFF3B8" />
            <circle cx={x} cy={y} r="3" fill="#FDEFB8" opacity="0.3" />
          </g>
        );
      })}
      {/* Goalposts (tiny) */}
      <rect x="34" y="60" width="3" height="4" fill="none" stroke={`url(#${id}-icon)`} strokeWidth="0.35" />
      <rect x="63" y="60" width="3" height="4" fill="none" stroke={`url(#${id}-icon)`} strokeWidth="0.35" />
    </Frame>
  );
}

/** 3. PARTIDOS — Calendar with checkmark (104 matches scheduled) */
export function IconStatWhistle({ size = 84 }: IconProps) {
  const id = "ca";
  return (
    <Frame id={id} size={size}>
      {/* Calendar body */}
      <rect x="28" y="32" width="44" height="42" rx="3"
        fill={`url(#${id}-icon)`} stroke="#8B6A2E" strokeWidth="0.7" />
      {/* Header band */}
      <rect x="28" y="32" width="44" height="10" rx="3"
        fill="#14110a" />
      <rect x="28" y="38" width="44" height="4" fill="#14110a" />
      {/* Rings on top */}
      <rect x="36" y="26" width="3" height="10" rx="1.5" fill="#8B6A2E" />
      <rect x="61" y="26" width="3" height="10" rx="1.5" fill="#8B6A2E" />
      {/* Grid cells */}
      <g stroke="#14110a" strokeWidth="0.3" opacity="0.4">
        <line x1="28" y1="50" x2="72" y2="50" />
        <line x1="28" y1="58" x2="72" y2="58" />
        <line x1="28" y1="66" x2="72" y2="66" />
        <line x1="39" y1="42" x2="39" y2="74" />
        <line x1="50" y1="42" x2="50" y2="74" />
        <line x1="61" y1="42" x2="61" y2="74" />
      </g>
      {/* Little match-day dots */}
      <circle cx="34" cy="54" r="1" fill="#14110a" opacity="0.6" />
      <circle cx="45" cy="54" r="1" fill="#14110a" opacity="0.6" />
      <circle cx="56" cy="62" r="1" fill="#14110a" opacity="0.6" />
      <circle cx="67" cy="70" r="1" fill="#14110a" opacity="0.6" />
      {/* Highlight on one match with ball */}
      <circle cx="45" cy="62" r="3" fill="#14110a" stroke={`url(#${id}-icon)`} strokeWidth="0.5" />
      <circle cx="45" cy="62" r="1.5" fill="#FFF3B8" />
      {/* Sheen */}
      <path d="M 30 44 L 36 44" stroke="#FFF" strokeWidth="0.5" opacity="0.35" />
    </Frame>
  );
}

/** 4. GRUPOS — Grid of 12 squares (clearly showing groupings) */
export function IconStatGroup({ size = 84 }: IconProps) {
  const id = "gr";
  return (
    <Frame id={id} size={size}>
      {/* 4x3 grid of mini-group cards, showing 12 groups explicitly */}
      {Array.from({ length: 4 }).map((_, col) =>
        Array.from({ length: 3 }).map((_, row) => {
          const x = 28 + col * 11;
          const y = 32 + row * 12;
          const highlight = col === 1 && row === 1; // one group highlighted
          return (
            <g key={`${col}-${row}`}>
              <rect x={x} y={y} width="9" height="10" rx="1.5"
                fill={highlight ? `url(#${id}-icon)` : "#14110a"}
                stroke="#D4A853"
                strokeWidth={highlight ? "0.6" : "0.3"}
                opacity={highlight ? 1 : 0.85}
              />
              {/* 3 dots inside each group card */}
              <circle cx={x + 2.5} cy={y + 7} r="0.7" fill={highlight ? "#14110a" : "#D4A853"} />
              <circle cx={x + 4.5} cy={y + 7} r="0.7" fill={highlight ? "#14110a" : "#D4A853"} />
              <circle cx={x + 6.5} cy={y + 7} r="0.7" fill={highlight ? "#14110a" : "#D4A853"} />
              {/* Group letter at top */}
              <rect x={x + 2} y={y + 2} width="5" height="1.5" fill={highlight ? "#14110a" : "#D4A853"} opacity="0.7" />
            </g>
          );
        })
      )}
    </Frame>
  );
}

/** 5. PAÍSES — Globe with 3 country pins */
export function IconStatFlag({ size = 84 }: IconProps) {
  const id = "gl";
  return (
    <Frame id={id} size={size}>
      {/* Globe */}
      <circle cx="50" cy="52" r="20" fill={`url(#${id}-icon)`} stroke="#8B6A2E" strokeWidth="0.6" />
      {/* Meridians */}
      <ellipse cx="50" cy="52" rx="20" ry="8" fill="none" stroke="#0a0906" strokeWidth="0.5" opacity="0.7" />
      <ellipse cx="50" cy="52" rx="10" ry="20" fill="none" stroke="#0a0906" strokeWidth="0.5" opacity="0.7" />
      <line x1="30" y1="52" x2="70" y2="52" stroke="#0a0906" strokeWidth="0.4" opacity="0.6" />
      {/* 3 pins for 3 host countries */}
      {[
        { x: 42, y: 46, c: "#EF4444" },
        { x: 52, y: 50, c: "#4FA0C2" },
        { x: 58, y: 56, c: "#22C55E" },
      ].map((p, i) => (
        <g key={i}>
          <path
            d={`M ${p.x} ${p.y - 3} C ${p.x - 2.5} ${p.y - 3} ${p.x - 2.5} ${p.y + 1} ${p.x} ${p.y + 3} C ${p.x + 2.5} ${p.y + 1} ${p.x + 2.5} ${p.y - 3} ${p.x} ${p.y - 3} Z`}
            fill={p.c}
            stroke="#FFF"
            strokeWidth="0.4"
          />
          <circle cx={p.x} cy={p.y - 1} r="0.9" fill="#FFF" />
        </g>
      ))}
      {/* Highlight on top of globe */}
      <ellipse cx="42" cy="42" rx="5" ry="2" fill="#FFF" opacity="0.35" transform="rotate(-30 42 42)" />
    </Frame>
  );
}

/** 6. MÓDULOS — Stack of hexagonal chips (12 modular tiles in an engine) */
export function IconStatPuzzle({ size = 84 }: IconProps) {
  const id = "mo";
  return (
    <Frame id={id} size={size}>
      {/* Central hub hex */}
      <path
        d="M 50 32 L 62 39 L 62 53 L 50 60 L 38 53 L 38 39 Z"
        fill={`url(#${id}-icon)`}
        stroke="#8B6A2E"
        strokeWidth="0.6"
      />
      {/* Central icon inside hub (grid of dots = modules) */}
      <g fill="#0a0906">
        <circle cx="45" cy="42" r="1.2" />
        <circle cx="50" cy="42" r="1.2" />
        <circle cx="55" cy="42" r="1.2" />
        <circle cx="45" cy="46" r="1.2" />
        <circle cx="50" cy="46" r="1.2" />
        <circle cx="55" cy="46" r="1.2" />
        <circle cx="45" cy="50" r="1.2" />
        <circle cx="50" cy="50" r="1.2" />
        <circle cx="55" cy="50" r="1.2" />
      </g>
      {/* 6 satellite hexes connected to the hub */}
      {[
        { x: 28, y: 32, tx: 38, ty: 39 },
        { x: 72, y: 32, tx: 62, ty: 39 },
        { x: 28, y: 60, tx: 38, ty: 53 },
        { x: 72, y: 60, tx: 62, ty: 53 },
        { x: 50, y: 18, tx: 50, ty: 32 },
        { x: 50, y: 74, tx: 50, ty: 60 },
      ].map((s, i) => (
        <g key={i}>
          <line x1={s.tx} y1={s.ty} x2={s.x} y2={s.y}
            stroke={`url(#${id}-icon)`} strokeWidth="0.8" strokeDasharray="1 1.5" opacity="0.7" />
          <path
            d={`M ${s.x} ${s.y - 4} L ${s.x + 4} ${s.y - 2} L ${s.x + 4} ${s.y + 2} L ${s.x} ${s.y + 4} L ${s.x - 4} ${s.y + 2} L ${s.x - 4} ${s.y - 2} Z`}
            fill="#14110a"
            stroke={`url(#${id}-icon)`}
            strokeWidth="0.5"
          />
          <circle cx={s.x} cy={s.y} r="1" fill={`url(#${id}-icon)`} />
        </g>
      ))}
    </Frame>
  );
}

/* ========== STEP ICONS (3) ========== */

/** Step 1 — ELIGE TU SELECCIÓN — Shield with jersey check */
export function IconStepChoose({ size = 56 }: IconProps) {
  const id = "s1";
  return (
    <Frame id={id} size={size}>
      {/* Shield */}
      <path
        d="M 50 24 L 74 32 L 74 54 Q 74 66 50 76 Q 26 66 26 54 L 26 32 Z"
        fill={`url(#${id}-icon)`}
        stroke="#8B6A2E"
        strokeWidth="0.8"
      />
      {/* Inner dark panel */}
      <path
        d="M 50 30 L 68 36 L 68 52 Q 68 62 50 70 Q 32 62 32 52 L 32 36 Z"
        fill="#14110a"
      />
      {/* Jersey silhouette */}
      <path
        d="M 42 40 L 46 38 L 48 41 L 52 41 L 54 38 L 58 40 L 58 46 L 54 46 L 54 58 L 46 58 L 46 46 L 42 46 Z"
        fill={`url(#${id}-icon)`}
      />
      {/* Check badge on top of jersey */}
      <circle cx="58" cy="41" r="5" fill="#22C55E" stroke="#FFF" strokeWidth="0.5" />
      <path d="M 55.5 41 L 57.5 43 L 60.5 39" stroke="#FFF" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

/** Step 2 — JUEGA Y PREDICE — Target with ball hitting bullseye */
export function IconStepPlay({ size = 56 }: IconProps) {
  const id = "s2";
  return (
    <Frame id={id} size={size}>
      {/* Target rings */}
      <circle cx="50" cy="50" r="22" fill={`url(#${id}-inner)`} stroke={`url(#${id}-icon)`} strokeWidth="1" />
      <circle cx="50" cy="50" r="17" fill="none" stroke={`url(#${id}-icon)`} strokeWidth="1.2" opacity="0.8" />
      <circle cx="50" cy="50" r="12" fill="none" stroke={`url(#${id}-icon)`} strokeWidth="1.2" opacity="0.85" />
      <circle cx="50" cy="50" r="7" fill={`url(#${id}-icon)`} opacity="0.5" />
      {/* Crosshair lines */}
      <line x1="26" y1="50" x2="33" y2="50" stroke={`url(#${id}-icon)`} strokeWidth="0.8" />
      <line x1="67" y1="50" x2="74" y2="50" stroke={`url(#${id}-icon)`} strokeWidth="0.8" />
      <line x1="50" y1="26" x2="50" y2="33" stroke={`url(#${id}-icon)`} strokeWidth="0.8" />
      <line x1="50" y1="67" x2="50" y2="74" stroke={`url(#${id}-icon)`} strokeWidth="0.8" />
      {/* Soccer ball landing on the bullseye */}
      <circle cx="50" cy="50" r="5" fill="#FDEFB8" stroke="#8B6A2E" strokeWidth="0.4" />
      <path d="M 50 47 L 52.8 49 L 51.7 52.3 L 48.3 52.3 L 47.2 49 Z"
        fill="#0a0906" stroke="#8B6A2E" strokeWidth="0.25" />
    </Frame>
  );
}

/** Step 3 — VIVE Y GANA — Trophy glowing with star */
export function IconStepWin({ size = 56 }: IconProps) {
  const id = "s3";
  return (
    <Frame id={id} size={size}>
      {/* Cup */}
      <path
        d="M 36 30 L 64 30 L 62 52 Q 62 60 50 62 Q 38 60 38 52 Z"
        fill={`url(#${id}-icon)`}
        stroke="#8B6A2E"
        strokeWidth="0.7"
      />
      {/* Handles */}
      <path d="M 36 34 Q 28 34 28 42 Q 28 50 38 50"
        fill="none" stroke={`url(#${id}-icon)`} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 64 34 Q 72 34 72 42 Q 72 50 62 50"
        fill="none" stroke={`url(#${id}-icon)`} strokeWidth="1.8" strokeLinecap="round" />
      {/* Star on cup */}
      <path
        d="M 50 38 L 52.5 44 L 59 44.5 L 54 49 L 55.5 55.5 L 50 52 L 44.5 55.5 L 46 49 L 41 44.5 L 47.5 44 Z"
        fill="#14110a"
        stroke="#FFF3B8"
        strokeWidth="0.5"
      />
      {/* Stem */}
      <rect x="46" y="62" width="8" height="5" fill="#8B6A2E" />
      {/* Base tiers */}
      <rect x="40" y="67" width="20" height="3" rx="0.8" fill={`url(#${id}-icon)`} stroke="#8B6A2E" strokeWidth="0.5" />
      <rect x="36" y="70" width="28" height="4" rx="1" fill="#8B6A2E" stroke="#6B4E1A" strokeWidth="0.5" />
      {/* Sparks */}
      <circle cx="28" cy="28" r="1" fill="#FFF3B8" />
      <circle cx="72" cy="28" r="1.2" fill="#FFF3B8" />
      <circle cx="22" cy="54" r="0.8" fill="#FFF3B8" />
      <circle cx="76" cy="56" r="0.8" fill="#FFF3B8" />
    </Frame>
  );
}

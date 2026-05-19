// src/lib/bracket/team-theme.ts
//
// Sistema temático dinámico para la Victory Screen del bracket.
//
// Convierte el `color` primario de cualquier BracketTeam (los 48) en una
// paleta completa que controla:
//   - color primary
//   - color secondary (derivado por hue rotation o complementario)
//   - rgba con alpha para glows y gradients
//   - color del confeti (3 acentos)
//
// Todo procedural — NO necesita mapas manuales por país.

import type { BracketTeam } from "./teams";

export interface TeamTheme {
  /** Color principal del país (de teams.ts) */
  primary: string;
  /** Color secundario derivado (compatible visualmente) */
  secondary: string;
  /** rgba del primary con alpha 0.45 — para glows */
  glow: string;
  /** rgba del primary con alpha 0.25 — para gradients suaves */
  glowSoft: string;
  /** rgba del primary con alpha 0.08 — para fondos sutiles */
  glowFaint: string;
  /** 3 colores para el confeti procedural */
  confetti: [string, string, string];
}

/* ------------------------------------------------------------------ */
/* Color helpers                                                       */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rN:
        h = (gN - bN) / d + (gN < bN ? 6 : 0);
        break;
      case gN:
        h = (bN - rN) / d + 2;
        break;
      case bN:
        h = (rN - gN) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const hN = h / 360;
  const sN = s / 100;
  const lN = l / 100;

  if (sN === 0) {
    const v = lN * 255;
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tN = t;
    if (tN < 0) tN += 1;
    if (tN > 1) tN -= 1;
    if (tN < 1 / 6) return p + (q - p) * 6 * tN;
    if (tN < 1 / 2) return q;
    if (tN < 2 / 3) return p + (q - p) * (2 / 3 - tN) * 6;
    return p;
  };

  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
  const p = 2 * lN - q;
  return {
    r: hue2rgb(p, q, hN + 1 / 3) * 255,
    g: hue2rgb(p, q, hN) * 255,
    b: hue2rgb(p, q, hN - 1 / 3) * 255,
  };
}

function rotateHue(hex: string, deg: number, lightnessAdjust = 0): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const newH = (h + deg + 360) % 360;
  const newL = Math.max(15, Math.min(85, l + lightnessAdjust));
  const out = hslToRgb(newH, s, newL);
  return rgbToHex(out.r, out.g, out.b);
}

function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Para colores muy oscuros (lightness < 25%) — como el negro alemán
 * #1A1A1A — el "secondary" no puede ser solo una rotación de hue
 * porque seguiría siendo casi negro. En esos casos forzamos un dorado
 * cálido elegante.
 */
function isVeryDark(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const { l } = rgbToHsl(r, g, b);
  return l < 25;
}

function isVeryLight(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const { l } = rgbToHsl(r, g, b);
  return l > 85;
}

/* ------------------------------------------------------------------ */
/* Theme builder                                                       */
/* ------------------------------------------------------------------ */

const FALLBACK_GOLD = "#C9A84C";
const FALLBACK_GOLD_LIGHT = "#E8C76B";

export function buildTeamTheme(team: BracketTeam): TeamTheme {
  const primary = team.color || FALLBACK_GOLD;

  let secondary: string;
  if (isVeryDark(primary)) {
    secondary = FALLBACK_GOLD_LIGHT;
  } else if (isVeryLight(primary)) {
    secondary = rotateHue(primary, 30, -30);
  } else {
    // Hue rotation suave + lighter shade → secundario armónico
    secondary = rotateHue(primary, 35, +15);
  }

  // 3 colores de confeti: primary, secondary, oro neutro de marca.
  // Si el team ya tiene un color muy similar al oro, alternamos otro.
  const confetti: [string, string, string] = [primary, secondary, FALLBACK_GOLD];

  return {
    primary,
    secondary,
    glow: withAlpha(primary, 0.45),
    glowSoft: withAlpha(primary, 0.25),
    glowFaint: withAlpha(primary, 0.08),
    confetti,
  };
}

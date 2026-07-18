// src/app/app/modo-carrera/jugar/fx.ts
// Constantes de estilo y utilidades compartidas por el Modo Carrera jugable.

export const BG = "#000000";
export const BG2 = "#14110a";
export const BG3 = "#0a0906";
export const GOLD = "#c9a84c";
export const GOLD2 = "#e8d48b";
export const MID = "#9aa4be";
export const DIM = "#7f8cac";
export const GREEN = "#22c55e";
export const RED = "#ef4444";

export function flagUrl(code: string): string {
  return `https://flagcdn.com/w80/${code}.png`;
}

/** Camiseta (kit local) de la selección, por slug. */
export function kitUrl(slug: string): string {
  return `/img/kits/2026/home/${slug}.png`;
}

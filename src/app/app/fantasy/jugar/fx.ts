// src/app/app/fantasy/jugar/fx.ts
// Constantes de estilo y utilidades compartidas por el juego Fantasy.

import type { FantasyPos } from "@/lib/fantasy/types";

export const BG = "#060B14";
export const BG2 = "#0F1D32";
export const BG3 = "#0B1825";
export const GOLD = "#c9a84c";
export const GOLD2 = "#e8d48b";
export const MID = "#9aa4be";
export const DIM = "#7f8cac"; // aclarado para cumplir contraste AA sobre el fondo oscuro
export const GREEN = "#22c55e";
export const RED = "#ef4444";

export function flagUrl(code: string): string {
  return `https://flagcdn.com/w80/${code}.png`;
}

// Camiseta (kit local) de la selección. Hay 48 kits "home" nombrados por slug
// en public/img/kits/2026/home/. Ej: kitUrl("argentina") => /img/kits/2026/home/argentina.png
export function kitUrl(slug: string): string {
  return `/img/kits/2026/home/${slug}.png`;
}

export const POS_LABEL: Record<FantasyPos, string> = {
  GK: "POR",
  DEF: "DEF",
  MID: "MED",
  FWD: "DEL",
};

export const POS_COLOR: Record<FantasyPos, string> = {
  GK: "#f59e0b",
  DEF: "#38bdf8",
  MID: "#22c55e",
  FWD: "#ef4444",
};

export function money(n: number): string {
  return `${n.toFixed(1)}M`;
}

// Valor de mercado real (Transfermarkt), en millones €. <1M se muestra en "mil €".
export function marketValueLabel(mvMillions: number): string {
  if (mvMillions < 1) return `${Math.round(mvMillions * 1000)} mil €`;
  return `${mvMillions % 1 === 0 ? mvMillions : mvMillions.toFixed(1)} mill. €`;
}

export function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
}

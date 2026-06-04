// src/lib/predictions/cosmetics.ts
//
// Capa de LÓGICA PURA de los cosméticos de Predicciones (mejora G: sumidero de
// monedas). Sin I/O ni Supabase: solo el catálogo y funciones deterministas que
// el store y las APIs orquestan.
//
// Los cosméticos NO dan ventaja competitiva: son puramente de prestigio (marcos
// de avatar, colores de nombre y títulos que se lucen en rankings y ligas). Su
// único propósito es DAR SALIDA a las Fútcoins acumuladas (coin sink), creando
// una meta de gasto a largo plazo que sostiene el bucle de juego.

import { levelForXp } from "./gamification";

export type CosmeticKind = "frame" | "name_color" | "title";

export interface CosmeticDef {
  id: string;
  kind: CosmeticKind;
  name: string;
  description: string;
  cost: number;        // en Fútcoins (el sumidero)
  minLevel: number;    // nivel mínimo para comprarlo (0 = sin requisito)
  /** Valor visual: hex para color/marco, o el texto del título. */
  value: string;
  /** Degradado CSS opcional (nombres/marcos premium). */
  gradient?: string;
  /** Halo/brillo opcional (marcos premium). */
  glow?: string;
}

// ─── Catálogo ────────────────────────────────────────────────────────────────
// Escalonado por precio para crear sumideros de corto, medio y largo plazo.
export const COSMETICS: CosmeticDef[] = [
  // Marcos de avatar (ring alrededor del puesto/avatar en rankings y ligas).
  { id: "frame_bronze", kind: "frame", name: "Marco Bronce", description: "Un aro de bronce alrededor de tu nombre en los rankings.", cost: 150, minLevel: 0, value: "#cd7f32" },
  { id: "frame_silver", kind: "frame", name: "Marco Plata", description: "Aro plateado para destacar entre la multitud.", cost: 400, minLevel: 0, value: "#c0c0c0" },
  { id: "frame_gold", kind: "frame", name: "Marco Oro", description: "Aro dorado con brillo. Solo para los que mandan.", cost: 900, minLevel: 5, value: "#c9a84c", glow: "rgba(201,168,76,0.5)" },
  { id: "frame_flames", kind: "frame", name: "Marco Llamas", description: "Aro ardiente para rachas imparables.", cost: 1500, minLevel: 10, value: "#e5604d", glow: "rgba(229,96,77,0.55)" },
  { id: "frame_cosmic", kind: "frame", name: "Marco Cósmico", description: "Aro de nebulosa con halo púrpura. El más exclusivo.", cost: 3000, minLevel: 20, value: "#a78bfa", gradient: "linear-gradient(135deg,#a78bfa,#38bdf8)", glow: "rgba(167,139,250,0.6)" },

  // Colores de nombre (cómo se pinta tu nombre en los rankings y ligas).
  { id: "color_emerald", kind: "name_color", name: "Verde Esmeralda", description: "Pinta tu nombre de verde esmeralda.", cost: 120, minLevel: 0, value: "#22c55e" },
  { id: "color_sky", kind: "name_color", name: "Azul Cielo", description: "Pinta tu nombre de azul cielo.", cost: 120, minLevel: 0, value: "#38bdf8" },
  { id: "color_rose", kind: "name_color", name: "Rosa Neón", description: "Pinta tu nombre de rosa neón.", cost: 120, minLevel: 0, value: "#fb7185" },
  { id: "color_gold", kind: "name_color", name: "Nombre Dorado", description: "Degradado dorado animado para tu nombre.", cost: 600, minLevel: 5, value: "#e8d48b", gradient: "linear-gradient(90deg,#c9a84c,#e8d48b)" },
  { id: "color_rainbow", kind: "name_color", name: "Arcoíris", description: "Degradado arcoíris. Imposible no mirarlo.", cost: 2000, minLevel: 15, value: "#fb7185", gradient: "linear-gradient(90deg,#fb7185,#facc15,#22c55e,#38bdf8,#a78bfa)" },

  // Títulos (etiqueta de prestigio que acompaña a tu nombre).
  { id: "title_aficionado", kind: "title", name: "Aficionado", description: "Luce el título \"Aficionado\" junto a tu nombre.", cost: 100, minLevel: 0, value: "Aficionado" },
  { id: "title_quiniela", kind: "title", name: "Rey de la Quiniela", description: "Luce el título \"Rey de la Quiniela\".", cost: 500, minLevel: 5, value: "Rey de la Quiniela" },
  { id: "title_profeta", kind: "title", name: "Profeta del Fútbol", description: "Luce el título \"Profeta del Fútbol\".", cost: 1800, minLevel: 12, value: "Profeta del Fútbol" },
  { id: "title_oraculo", kind: "title", name: "El Oráculo", description: "Luce el título \"El Oráculo\".", cost: 1200, minLevel: 12, value: "El Oráculo" },
  { id: "title_leyenda", kind: "title", name: "Leyenda Mundialista", description: "Luce el título \"Leyenda Mundialista\". La cima del prestigio.", cost: 2500, minLevel: 22, value: "Leyenda Mundialista" },
];

export const COSMETIC_MAP: Record<string, CosmeticDef> = Object.fromEntries(COSMETICS.map((c) => [c.id, c]));

export function cosmeticDef(id: string | null | undefined): CosmeticDef | null {
  if (!id) return null;
  return COSMETIC_MAP[id] ?? null;
}

/** Columna de profiles donde se guarda el cosmético equipado de cada tipo. */
export const EQUIP_COLUMN: Record<CosmeticKind, "cosmetic_frame" | "cosmetic_name_color" | "cosmetic_title"> = {
  frame: "cosmetic_frame",
  name_color: "cosmetic_name_color",
  title: "cosmetic_title",
};

export const COSMETIC_KINDS: CosmeticKind[] = ["frame", "name_color", "title"];

// ─── Display resuelto (lo que viaja a los rankings/ligas) ────────────────────
export interface CosmeticDisplay {
  frame: { color: string; gradient?: string; glow?: string } | null;
  name_color: { color: string; gradient?: string } | null;
  title: string | null;
}

/** Ids equipados (de profiles) → valores visuales para pintar en la UI. */
export function resolveCosmetics(equipped: {
  cosmetic_frame?: string | null;
  cosmetic_name_color?: string | null;
  cosmetic_title?: string | null;
}): CosmeticDisplay {
  const frameDef = cosmeticDef(equipped.cosmetic_frame);
  const colorDef = cosmeticDef(equipped.cosmetic_name_color);
  const titleDef = cosmeticDef(equipped.cosmetic_title);
  return {
    frame: frameDef ? { color: frameDef.value, gradient: frameDef.gradient, glow: frameDef.glow } : null,
    name_color: colorDef ? { color: colorDef.value, gradient: colorDef.gradient } : null,
    title: titleDef ? titleDef.value : null,
  };
}

/** ¿Puede el usuario COMPRAR este cosmético? (nivel suficiente y no comprado). */
export function canBuyCosmetic(def: CosmeticDef, xp: number, owned: Set<string>): boolean {
  return !owned.has(def.id) && levelForXp(xp) >= def.minLevel;
}

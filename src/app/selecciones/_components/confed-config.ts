// Sistema central de colores por confederación.
// Source of truth para WorldMap, FavCard, BrowseTable, ConfedRail, etc.

export type ConfedKey = "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";

export interface ConfedConfig {
  key: ConfedKey;
  name: string;          // display name
  full: string;          // long region label (Europa, Sudamérica, etc.)
  fullEn: string;
  color: string;         // hex
  colorSoft: string;     // hex con alpha (sufijo "22")
  accent: string;        // tono más claro
  plazas: number | string; // 16 | "6+1"
  plazasMain: number;    // número entero base (sin +1)
  plazasPlus: boolean;   // si añade +1 repechaje
}

export const CONFEDS: Record<ConfedKey, ConfedConfig> = {
  UEFA: {
    key: "UEFA",
    name: "UEFA",
    full: "Europa",
    fullEn: "Europe",
    color: "#2E86AB",
    colorSoft: "#2E86AB22",
    accent: "#4FA0C2",
    plazas: 16,
    plazasMain: 16,
    plazasPlus: false,
  },
  CONMEBOL: {
    key: "CONMEBOL",
    name: "CONMEBOL",
    full: "Sudamérica",
    fullEn: "South America",
    color: "#D4A853",
    colorSoft: "#D4A85322",
    accent: "#E0BD73",
    plazas: "6+1",
    plazasMain: 6,
    plazasPlus: true,
  },
  CONCACAF: {
    key: "CONCACAF",
    name: "CONCACAF",
    full: "Norte y Centroamérica",
    fullEn: "North & Central America",
    color: "#EF4444",
    colorSoft: "#EF444422",
    accent: "#F87171",
    plazas: 6,
    plazasMain: 6,
    plazasPlus: false,
  },
  CAF: {
    key: "CAF",
    name: "CAF",
    full: "África",
    fullEn: "Africa",
    color: "#10B981",
    colorSoft: "#10B98122",
    accent: "#34D399",
    plazas: 9,
    plazasMain: 9,
    plazasPlus: false,
  },
  AFC: {
    key: "AFC",
    name: "AFC",
    full: "Asia",
    fullEn: "Asia",
    color: "#9b51e0",
    colorSoft: "#9b51e022",
    accent: "#B57EE8",
    plazas: 8,
    plazasMain: 8,
    plazasPlus: false,
  },
  OFC: {
    key: "OFC",
    name: "OFC",
    full: "Oceanía",
    fullEn: "Oceania",
    color: "#14b8a6",
    colorSoft: "#14b8a622",
    accent: "#5EEAD4",
    plazas: 1,
    plazasMain: 1,
    plazasPlus: false,
  },
};

export const CONFED_KEYS: ConfedKey[] = ["UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"];

// Normaliza el string de confederación de los datos (puede venir como "UEFA" exacta).
export function getConfedConfig(conf: string | undefined): ConfedConfig {
  const key = (conf || "").toUpperCase() as ConfedKey;
  return CONFEDS[key] ?? CONFEDS.UEFA;
}

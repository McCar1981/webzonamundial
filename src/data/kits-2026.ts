// src/data/kits-2026.ts
//
// Colores REALES de la camiseta titular (home) de cada selección del Mundial
// 2026, precomputados desde la BIBLIA (data/teams/*.json → kit.wc_2026.home).
// Mapa iso(flagcdn) → {primary, secondary}. GENERADO automáticamente; editar la
// BIBLIA y regenerar, no a mano. Lo consume el campo de alineaciones para pintar
// la camiseta con el color real en vez del color genérico del bracket.

export interface KitColors {
  /** Color principal de la camiseta titular (hex). */
  primary: string;
  /** Color secundario/detalle (cuello, mangas). */
  secondary: string;
}

export const KIT_BY_ISO: Record<string, KitColors> = {
  "de": { primary: "#FFFFFF", secondary: "#000000" },
  "sa": { primary: "#006C35", secondary: "#FFFFFF" },
  "dz": { primary: "#006233", secondary: "#FFFFFF" },
  "ar": { primary: "#75AADB", secondary: "#FFFFFF" },
  "au": { primary: "#FFCD00", secondary: "#00843D" },
  "at": { primary: "#ED2939", secondary: "#FFFFFF" },
  "be": { primary: "#ED2939", secondary: "#000000" },
  "ba": { primary: "#002D62", secondary: "#FFCD00" },
  "br": { primary: "#FFDF00", secondary: "#009C3B" },
  "cv": { primary: "#003893", secondary: "#FFFFFF" },
  "ca": { primary: "#FF0000", secondary: "#FFFFFF" },
  "co": { primary: "#FCD116", secondary: "#003893" },
  "kr": { primary: "#C60C30", secondary: "#FFFFFF" },
  "ci": { primary: "#FF8200", secondary: "#FFFFFF" },
  "hr": { primary: "#FF0000", secondary: "#FFFFFF" },
  "cw": { primary: "#002B7F", secondary: "#F9E814" },
  "ec": { primary: "#FFDF00", secondary: "#0033A0" },
  "eg": { primary: "#CE1126", secondary: "#FFFFFF" },
  "gb-sct": { primary: "#0065BD", secondary: "#FFFFFF" },
  "es": { primary: "#AA151B", secondary: "#F1BF00" },
  "us": { primary: "#FFFFFF", secondary: "#3C3B6E" },
  "fr": { primary: "#0055A4", secondary: "#FFFFFF" },
  "gh": { primary: "#FCD116", secondary: "#CE1126" },
  "ht": { primary: "#00209F", secondary: "#D21034" },
  "gb-eng": { primary: "#FFFFFF", secondary: "#CE1124" },
  "iq": { primary: "#FFFFFF", secondary: "#CE1126" },
  "ir": { primary: "#FFFFFF", secondary: "#239F40" },
  "jp": { primary: "#000033", secondary: "#FFFFFF" },
  "jo": { primary: "#FFFFFF", secondary: "#CE1126" },
  "ma": { primary: "#C1272D", secondary: "#006233" },
  "mx": { primary: "#006847", secondary: "#FFFFFF" },
  "no": { primary: "#EF2B2D", secondary: "#FFFFFF" },
  "nz": { primary: "#FFFFFF", secondary: "#000000" },
  "nl": { primary: "#FF6E00", secondary: "#FFFFFF" },
  "pa": { primary: "#DA121A", secondary: "#FFFFFF" },
  "py": { primary: "#D52B1E", secondary: "#0038A8" },
  "pt": { primary: "#006A4E", secondary: "#DA291C" },
  "qa": { primary: "#8A1538", secondary: "#FFFFFF" },
  "cd": { primary: "#007FFF", secondary: "#F7D618" },
  "cz": { primary: "#D7141A", secondary: "#FFFFFF" },
  "sn": { primary: "#00853F", secondary: "#FDEF42" },
  "za": { primary: "#FFB81C", secondary: "#007749" },
  "se": { primary: "#FECC00", secondary: "#006AA7" },
  "ch": { primary: "#FF0000", secondary: "#FFFFFF" },
  "tn": { primary: "#E70013", secondary: "#FFFFFF" },
  "tr": { primary: "#E30A17", secondary: "#FFFFFF" },
  "uy": { primary: "#7B9CD9", secondary: "#FFFFFF" },
  "uz": { primary: "#FFFFFF", secondary: "#0099B5" },
};

/** Colores de camiseta por código de bandera (flagcdn). null si no hay kit. */
export function kitColors(flag: string | undefined): KitColors | null {
  if (!flag) return null;
  return KIT_BY_ISO[flag.toLowerCase()] ?? null;
}

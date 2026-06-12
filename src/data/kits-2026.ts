// src/data/kits-2026.ts
//
// Camiseta titular (home) REAL de cada selección del Mundial 2026,
// precomputada desde la BIBLIA (data/teams/*.json → kit.wc_2026.home).
// Mapa iso(flagcdn) → {primary, secondary, image}. GENERADO automáticamente;
// editar la BIBLIA y regenerar, no a mano. `image` es la ruta del PNG de la
// camiseta diseñada (en /public); primary/secondary son el respaldo de color.

export interface KitColors {
  /** Color principal de la camiseta titular (hex). */
  primary: string;
  /** Color secundario/detalle (cuello, mangas). */
  secondary: string;
  /** Ruta del PNG de la camiseta diseñada (/public). null si no hay. */
  image: string | null;
}

export const KIT_BY_ISO: Record<string, KitColors> = {
  "de": { primary: "#FFFFFF", secondary: "#000000", image: "/img/kits/2026/home/alemania.png" },
  "sa": { primary: "#006C35", secondary: "#FFFFFF", image: "/img/kits/2026/home/arabia-saudi.png" },
  "dz": { primary: "#006233", secondary: "#FFFFFF", image: "/img/kits/2026/home/argelia.png" },
  "ar": { primary: "#75AADB", secondary: "#FFFFFF", image: "/img/kits/2026/home/argentina.png" },
  "au": { primary: "#FFCD00", secondary: "#00843D", image: "/img/kits/2026/home/australia.png" },
  "at": { primary: "#ED2939", secondary: "#FFFFFF", image: "/img/kits/2026/home/austria.png" },
  "be": { primary: "#ED2939", secondary: "#000000", image: "/img/kits/2026/home/belgica.png" },
  "ba": { primary: "#002D62", secondary: "#FFCD00", image: "/img/kits/2026/home/bosnia.png" },
  "br": { primary: "#FFDF00", secondary: "#009C3B", image: "/img/kits/2026/home/brasil.png" },
  "cv": { primary: "#003893", secondary: "#FFFFFF", image: "/img/kits/2026/home/cabo-verde.png" },
  "ca": { primary: "#FF0000", secondary: "#FFFFFF", image: "/img/kits/2026/home/canada.png" },
  "co": { primary: "#FCD116", secondary: "#003893", image: "/img/kits/2026/home/colombia.png" },
  "kr": { primary: "#C60C30", secondary: "#FFFFFF", image: "/img/kits/2026/home/corea-del-sur.png" },
  "ci": { primary: "#FF8200", secondary: "#FFFFFF", image: "/img/kits/2026/home/costa-de-marfil.png" },
  "hr": { primary: "#FF0000", secondary: "#FFFFFF", image: "/img/kits/2026/home/croacia.png" },
  "cw": { primary: "#002B7F", secondary: "#F9E814", image: "/img/kits/2026/home/curazao.png" },
  "ec": { primary: "#FFDF00", secondary: "#0033A0", image: "/img/kits/2026/home/ecuador.png" },
  "eg": { primary: "#CE1126", secondary: "#FFFFFF", image: "/img/kits/2026/home/egipto.png" },
  "gb-sct": { primary: "#0065BD", secondary: "#FFFFFF", image: "/img/kits/2026/home/escocia.png" },
  "es": { primary: "#AA151B", secondary: "#F1BF00", image: "/img/kits/2026/home/espana.png" },
  "us": { primary: "#FFFFFF", secondary: "#3C3B6E", image: "/img/kits/2026/home/estados-unidos.png" },
  "fr": { primary: "#0055A4", secondary: "#FFFFFF", image: "/img/kits/2026/home/francia.png" },
  "gh": { primary: "#FCD116", secondary: "#CE1126", image: "/img/kits/2026/home/ghana.png" },
  "ht": { primary: "#00209F", secondary: "#D21034", image: "/img/kits/2026/home/haiti.png" },
  "gb-eng": { primary: "#FFFFFF", secondary: "#CE1124", image: "/img/kits/2026/home/inglaterra.png" },
  "iq": { primary: "#FFFFFF", secondary: "#CE1126", image: "/img/kits/2026/home/irak.png" },
  "ir": { primary: "#FFFFFF", secondary: "#239F40", image: "/img/kits/2026/home/iran.png" },
  "jp": { primary: "#000033", secondary: "#FFFFFF", image: "/img/kits/2026/home/japon.png" },
  "jo": { primary: "#FFFFFF", secondary: "#CE1126", image: "/img/kits/2026/home/jordania.png" },
  "ma": { primary: "#C1272D", secondary: "#006233", image: "/img/kits/2026/home/marruecos.png" },
  "mx": { primary: "#006847", secondary: "#FFFFFF", image: "/img/kits/2026/home/mexico.png" },
  "no": { primary: "#EF2B2D", secondary: "#FFFFFF", image: "/img/kits/2026/home/noruega.png" },
  "nz": { primary: "#FFFFFF", secondary: "#000000", image: "/img/kits/2026/home/nueva-zelanda.png" },
  "nl": { primary: "#FF6E00", secondary: "#FFFFFF", image: "/img/kits/2026/home/paises-bajos.png" },
  "pa": { primary: "#DA121A", secondary: "#FFFFFF", image: "/img/kits/2026/home/panama.png" },
  "py": { primary: "#D52B1E", secondary: "#0038A8", image: "/img/kits/2026/home/paraguay.png" },
  "pt": { primary: "#006A4E", secondary: "#DA291C", image: "/img/kits/2026/home/portugal.png" },
  "qa": { primary: "#8A1538", secondary: "#FFFFFF", image: "/img/kits/2026/home/qatar.png" },
  "cd": { primary: "#007FFF", secondary: "#F7D618", image: "/img/kits/2026/home/rd-congo.png" },
  "cz": { primary: "#D7141A", secondary: "#FFFFFF", image: "/img/kits/2026/home/republica-checa.png" },
  "sn": { primary: "#00853F", secondary: "#FDEF42", image: "/img/kits/2026/home/senegal.png" },
  "za": { primary: "#FFB81C", secondary: "#007749", image: "/img/kits/2026/home/sudafrica.png" },
  "se": { primary: "#FECC00", secondary: "#006AA7", image: "/img/kits/2026/home/suecia.png" },
  "ch": { primary: "#FF0000", secondary: "#FFFFFF", image: "/img/kits/2026/home/suiza.png" },
  "tn": { primary: "#E70013", secondary: "#FFFFFF", image: "/img/kits/2026/home/tunez.png" },
  "tr": { primary: "#E30A17", secondary: "#FFFFFF", image: "/img/kits/2026/home/turquia.png" },
  "uy": { primary: "#7B9CD9", secondary: "#FFFFFF", image: "/img/kits/2026/home/uruguay.png" },
  "uz": { primary: "#FFFFFF", secondary: "#0099B5", image: "/img/kits/2026/home/uzbekistan.png" },
};

/** Kit (color + imagen) por código de bandera (flagcdn). null si no hay. */
export function kitColors(flag: string | undefined): KitColors | null {
  if (!flag) return null;
  return KIT_BY_ISO[flag.toLowerCase()] ?? null;
}

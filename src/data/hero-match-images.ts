// src/data/hero-match-images.ts
//
// Pieza visual DEDICADA por partido para el HERO del lobby (/app). La clave es
// el SLUG del partido — el mismo que devuelve /api/match-center/featured y que
// genera matchSlug() (p.ej. "mexico-sudafrica"). Cada pieza lleva el texto
// "quemado" (equipos, VS, fase, fecha); el hero solo superpone hora + cuenta
// atrás + CTA en una franja inferior.
//
// ── Añadir un partido ───────────────────────────────────────────────────────
//   1. Diseña y exporta 2 webp y déjalos en /public/images/hero/:
//        - wide   ~1920×820   (escritorio; ratio ~2.34:1)
//        - mobile ~1080×1080  (móvil; cuadrado)
//   2. Añade UNA línea a HERO_MATCH_IMAGES con el slug del partido como clave.
//
// Si un partido NO está en este mapa, el hero cae con elegancia al diseño de
// texto (arte de card + degradado): nunca rompe el layout.

export interface HeroMatchImage {
  /** Imagen ancha para escritorio (~1920×820). */
  wide: string;
  /** Imagen cuadrada para móvil (~1080×1080). */
  mobile: string;
}

export const HERO_MATCH_IMAGES: Record<string, HeroMatchImage> = {
  // Juego inaugural — México vs Sudáfrica (11 jun). Pieza ya diseñada.
  "mexico-sudafrica": {
    wide: "/images/hero/juego-inaugural-wide.webp",
    mobile: "/images/hero/juego-inaugural-mobile.webp",
  },
  // Corea del Sur vs Rep. Checa (11 jun, 2º del calendario).
  "corea-del-sur-rep-checa": {
    wide: "/images/hero/corea-del-sur-rep-checa-wide.webp",
    mobile: "/images/hero/corea-del-sur-rep-checa-mobile.webp",
  },
  // Canadá vs Bosnia (12 jun).
  "canada-bosnia": {
    wide: "/images/hero/canada-bosnia-wide.webp",
    mobile: "/images/hero/canada-bosnia-mobile.webp",
  },
  // EE.UU. vs Paraguay (12 jun, 4º del calendario).
  "ee-uu-paraguay": {
    wide: "/images/hero/ee-uu-paraguay-wide.webp",
    mobile: "/images/hero/ee-uu-paraguay-mobile.webp",
  },
  // Qatar vs Suiza (13 jun, 5º del calendario).
  "qatar-suiza": {
    wide: "/images/hero/qatar-suiza-wide.webp",
    mobile: "/images/hero/qatar-suiza-mobile.webp",
  },
  // Siguientes partidos: añade aquí su pieza cuando esté lista. Ej.:
  // "argentina-...": { wide: "/images/hero/argentina-...-wide.webp", mobile: "/images/hero/argentina-...-mobile.webp" },
};

/** Devuelve la pieza dedicada de un partido por su slug, o null si no la tiene. */
export function heroImageForSlug(slug: string | null | undefined): HeroMatchImage | null {
  if (!slug) return null;
  return HERO_MATCH_IMAGES[slug] ?? null;
}

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
  // Brasil vs Marruecos (13 jun, Grupo C).
  "brasil-marruecos": {
    wide: "/images/hero/brasil-marruecos-wide.webp",
    mobile: "/images/hero/brasil-marruecos-mobile.webp",
  },
  // Haití vs Escocia (13 jun, Grupo C).
  "haiti-escocia": {
    wide: "/images/hero/haiti-escocia-wide.webp",
    mobile: "/images/hero/haiti-escocia-mobile.webp",
  },
  // Australia vs Turquía (13 jun, Grupo D).
  "australia-turquia": {
    wide: "/images/hero/australia-turquia-wide.webp",
    mobile: "/images/hero/australia-turquia-mobile.webp",
  },
  // Alemania vs Curazao (14 jun, Grupo E).
  "alemania-curazao": {
    wide: "/images/hero/alemania-curazao-wide.webp",
    mobile: "/images/hero/alemania-curazao-mobile.webp",
  },
  // P. Bajos vs Japón (14 jun, Grupo F).
  "p-bajos-japon": {
    wide: "/images/hero/p-bajos-japon-wide.webp",
    mobile: "/images/hero/p-bajos-japon-mobile.webp",
  },
  // C. de Marfil vs Ecuador (14 jun, Grupo E).
  "c-de-marfil-ecuador": {
    wide: "/images/hero/c-de-marfil-ecuador-wide.webp",
    mobile: "/images/hero/c-de-marfil-ecuador-mobile.webp",
  },
  // Suecia vs Túnez (14 jun, Grupo F).
  "suecia-tunez": {
    wide: "/images/hero/suecia-tunez-wide.webp",
    mobile: "/images/hero/suecia-tunez-mobile.webp",
  },
  // España vs Cabo Verde (15 jun, Grupo H).
  "espana-cabo-verde": {
    wide: "/images/hero/espana-cabo-verde-wide.webp",
    mobile: "/images/hero/espana-cabo-verde-mobile.webp",
  },
  // Bélgica vs Egipto (15 jun, Grupo G).
  "belgica-egipto": {
    wide: "/images/hero/belgica-egipto-wide.webp",
    mobile: "/images/hero/belgica-egipto-mobile.webp",
  },
  // Irán vs N. Zelanda (15 jun, Grupo G).
  "iran-n-zelanda": {
    wide: "/images/hero/iran-n-zelanda-wide.webp",
    mobile: "/images/hero/iran-n-zelanda-mobile.webp",
  },
  // A. Saudí vs Uruguay (15 jun, Grupo H).
  "a-saudi-uruguay": {
    wide: "/images/hero/a-saudi-uruguay-wide.webp",
    mobile: "/images/hero/a-saudi-uruguay-mobile.webp",
  },
  // Francia vs Senegal (16 jun, Grupo I).
  "francia-senegal": {
    wide: "/images/hero/francia-senegal-wide.webp",
    mobile: "/images/hero/francia-senegal-mobile.webp",
  },
  // Siguientes partidos: añade aquí su pieza cuando esté lista. Ej.:
  // "argentina-...": { wide: "/images/hero/argentina-...-wide.webp", mobile: "/images/hero/argentina-...-mobile.webp" },
};

/** Devuelve la pieza dedicada de un partido por su slug, o null si no la tiene. */
export function heroImageForSlug(slug: string | null | undefined): HeroMatchImage | null {
  if (!slug) return null;
  return HERO_MATCH_IMAGES[slug] ?? null;
}

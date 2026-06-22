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
  // Irak vs Noruega (16 jun, Grupo I).
  "irak-noruega": {
    wide: "/images/hero/irak-noruega-wide.webp",
    mobile: "/images/hero/irak-noruega-mobile.webp",
  },
  // Argentina vs Argelia (16 jun, Grupo J).
  "argentina-argelia": {
    wide: "/images/hero/argentina-argelia-wide.webp",
    mobile: "/images/hero/argentina-argelia-mobile.webp",
  },
  // Austria vs Jordania (16 jun, Grupo J).
  "austria-jordania": {
    wide: "/images/hero/austria-jordania-wide.webp",
    mobile: "/images/hero/austria-jordania-mobile.webp",
  },
  // Portugal vs RD Congo (17 jun, Grupo K).
  "portugal-rd-congo": {
    wide: "/images/hero/portugal-rd-congo-wide.webp",
    mobile: "/images/hero/portugal-rd-congo-mobile.webp",
  },
  // Inglaterra vs Croacia (17 jun, Grupo L).
  "inglaterra-croacia": {
    wide: "/images/hero/inglaterra-croacia-wide.webp",
    mobile: "/images/hero/inglaterra-croacia-mobile.webp",
  },
  // Ghana vs Panamá (17 jun, Grupo L). (slug = home-away del calendario)
  "ghana-panama": {
    wide: "/images/hero/ghana-panama-wide.webp",
    mobile: "/images/hero/ghana-panama-mobile.webp",
  },
  // Uzbekistán vs Colombia (17 jun, Grupo K). (slug = home-away del calendario)
  "uzbekistan-colombia": {
    wide: "/images/hero/uzbekistan-colombia-wide.webp",
    mobile: "/images/hero/uzbekistan-colombia-mobile.webp",
  },
  // Rep. Checa vs Sudáfrica (18 jun, Grupo A · J2).
  "rep-checa-sudafrica": {
    wide: "/images/hero/rep-checa-sudafrica-wide.webp",
    mobile: "/images/hero/rep-checa-sudafrica-mobile.webp",
  },
  // Suiza vs Bosnia (18 jun, Grupo B · J2).
  "suiza-bosnia": {
    wide: "/images/hero/suiza-bosnia-wide.webp",
    mobile: "/images/hero/suiza-bosnia-mobile.webp",
  },
  // México vs Corea del Sur (18 jun, Grupo A · J2).
  "mexico-corea-del-sur": {
    wide: "/images/hero/mexico-corea-del-sur-wide.webp",
    mobile: "/images/hero/mexico-corea-del-sur-mobile.webp",
  },
  // Canadá vs Qatar (18 jun, Grupo B · J2). OJO: el arte rotula "GRUPO A"
  // por error — publicado así por decisión de Carlos; reexportar a "GRUPO B".
  "canada-qatar": {
    wide: "/images/hero/canada-qatar-wide.webp",
    mobile: "/images/hero/canada-qatar-mobile.webp",
  },
  // EE.UU. vs Australia (19 jun, Grupo D · J2).
  "ee-uu-australia": {
    wide: "/images/hero/ee-uu-australia-wide.webp",
    mobile: "/images/hero/ee-uu-australia-mobile.webp",
  },
  // Escocia vs Marruecos (19 jun, Grupo C · J2).
  "escocia-marruecos": {
    wide: "/images/hero/escocia-marruecos-wide.webp",
    mobile: "/images/hero/escocia-marruecos-mobile.webp",
  },
  // Brasil vs Haití (19 jun, Grupo C · J2).
  "brasil-haiti": {
    wide: "/images/hero/brasil-haiti-wide.webp",
    mobile: "/images/hero/brasil-haiti-mobile.webp",
  },
  // Turquía vs Paraguay (19 jun, Grupo D · J2).
  "turquia-paraguay": {
    wide: "/images/hero/turquia-paraguay-wide.webp",
    mobile: "/images/hero/turquia-paraguay-mobile.webp",
  },
  // P. Bajos vs Suecia (20 jun, Grupo F · J2). (slug = home-away del calendario)
  "p-bajos-suecia": {
    wide: "/images/hero/p-bajos-suecia-wide.webp",
    mobile: "/images/hero/p-bajos-suecia-mobile.webp",
  },
  // Túnez vs Japón (20 jun, Grupo F · J2). (slug = home-away del calendario)
  "tunez-japon": {
    wide: "/images/hero/tunez-japon-wide.webp",
    mobile: "/images/hero/tunez-japon-mobile.webp",
  },
  // España vs A. Saudí (21 jun, Grupo H · J2).
  "espana-a-saudi": {
    wide: "/images/hero/espana-a-saudi-wide.webp",
    mobile: "/images/hero/espana-a-saudi-mobile.webp",
  },
  // Ecuador vs Curazao (20 jun, Grupo E · J2). OJO: el MOBILE rotula "GRUPO F"
  // por error (la wide está bien en E) — publicado así por decisión de Carlos.
  "ecuador-curazao": {
    wide: "/images/hero/ecuador-curazao-wide.webp",
    mobile: "/images/hero/ecuador-curazao-mobile.webp",
  },
  // Uruguay vs Cabo Verde (21 jun, Grupo H · J2).
  "uruguay-cabo-verde": {
    wide: "/images/hero/uruguay-cabo-verde-wide.webp",
    mobile: "/images/hero/uruguay-cabo-verde-mobile.webp",
  },
  // Bélgica vs Irán (21 jun, Grupo G · J2).
  "belgica-iran": {
    wide: "/images/hero/belgica-iran-wide.webp",
    mobile: "/images/hero/belgica-iran-mobile.webp",
  },
  // N. Zelanda vs Egipto (21 jun, Grupo G · J2). (slug = home-away del calendario)
  "n-zelanda-egipto": {
    wide: "/images/hero/n-zelanda-egipto-wide.webp",
    mobile: "/images/hero/n-zelanda-egipto-mobile.webp",
  },
  // Argentina vs Austria (22 jun, Grupo J · J2).
  "argentina-austria": {
    wide: "/images/hero/argentina-austria-wide.webp",
    mobile: "/images/hero/argentina-austria-mobile.webp",
  },
  // Siguientes partidos: añade aquí su pieza cuando esté lista. Ej.:
  // "argentina-...": { wide: "/images/hero/argentina-...-wide.webp", mobile: "/images/hero/argentina-...-mobile.webp" },
};

/** Devuelve la pieza dedicada de un partido por su slug, o null si no la tiene. */
export function heroImageForSlug(slug: string | null | undefined): HeroMatchImage | null {
  if (!slug) return null;
  return HERO_MATCH_IMAGES[slug] ?? null;
}

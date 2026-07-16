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
  // Portugal vs Uzbekistán (23 jun, Grupo K · J3).
  "portugal-uzbekistan": {
    wide: "/images/hero/portugal-uzbekistan-wide.webp",
    mobile: "/images/hero/portugal-uzbekistan-mobile.webp",
  },
  // Inglaterra vs Ghana (23 jun, Grupo L · J3).
  "inglaterra-ghana": {
    wide: "/images/hero/inglaterra-ghana-wide.webp",
    mobile: "/images/hero/inglaterra-ghana-mobile.webp",
  },
  // Colombia vs RD Congo (23 jun, Grupo K · J3). (slug = home-away del calendario)
  "colombia-rd-congo": {
    wide: "/images/hero/colombia-rd-congo-wide.webp",
    mobile: "/images/hero/colombia-rd-congo-mobile.webp",
  },
  // Suiza vs Canadá (24 jun, Grupo B · J3).
  "suiza-canada": {
    wide: "/images/hero/suiza-canada-wide.webp",
    mobile: "/images/hero/suiza-canada-mobile.webp",
  },
  // Bosnia vs Qatar (24 jun, Grupo B · J3).
  "bosnia-qatar": {
    wide: "/images/hero/bosnia-qatar-wide.webp",
    mobile: "/images/hero/bosnia-qatar-mobile.webp",
  },
  // ── J3 (27 jun) · piezas SOLO-MÓVIL ─────────────────────────────────────────
  //   Carlos las subió solo para responsive; aún no hay arte de escritorio, así
  //   que `wide` reutiliza la cuadrada de móvil como respaldo (en escritorio se
  //   recorta). Al recibir la pieza apaisada, basta cambiar `wide`.
  // Jordania vs Argentina (Grupo J).
  "jordania-argentina": {
    wide: "/images/hero/jordania-argentina-mobile.webp",
    mobile: "/images/hero/jordania-argentina-mobile.webp",
  },
  // Argelia vs Austria (Grupo J).
  "argelia-austria": {
    wide: "/images/hero/argelia-austria-mobile.webp",
    mobile: "/images/hero/argelia-austria-mobile.webp",
  },
  // Colombia vs Portugal (Grupo K).
  "colombia-portugal": {
    wide: "/images/hero/colombia-portugal-mobile.webp",
    mobile: "/images/hero/colombia-portugal-mobile.webp",
  },
  // RD Congo vs Uzbekistán (Grupo K).
  "rd-congo-uzbekistan": {
    wide: "/images/hero/rd-congo-uzbekistan-mobile.webp",
    mobile: "/images/hero/rd-congo-uzbekistan-mobile.webp",
  },
  // Croacia vs Ghana (Grupo L).
  "croacia-ghana": {
    wide: "/images/hero/croacia-ghana-mobile.webp",
    mobile: "/images/hero/croacia-ghana-mobile.webp",
  },
  // Panamá vs Inglaterra (Grupo L).
  "panama-inglaterra": {
    wide: "/images/hero/panama-inglaterra-mobile.webp",
    mobile: "/images/hero/panama-inglaterra-mobile.webp",
  },
  // ── Eliminatorias ──────────────────────────────────────────────────────────
  // Sudáfrica vs Canadá (16avos de final, 28 jun).
  "sudafrica-canada": {
    wide: "/images/hero/sudafrica-canada-wide.webp",
    mobile: "/images/hero/sudafrica-canada-mobile.webp",
  },
  // Brasil vs Japón (16avos de final, 29 jun).
  "brasil-japon": {
    wide: "/images/hero/brasil-japon-wide.webp",
    mobile: "/images/hero/brasil-japon-mobile.webp",
  },
  // Francia vs Suecia (16avos, 30 jun).
  "francia-suecia": {
    wide: "/images/hero/francia-suecia-wide.webp",
    mobile: "/images/hero/francia-suecia-mobile.webp",
  },
  // C. de Marfil vs Noruega (16avos, 30 jun).
  "c-de-marfil-noruega": {
    wide: "/images/hero/c-de-marfil-noruega-wide.webp",
    mobile: "/images/hero/c-de-marfil-noruega-mobile.webp",
  },
  // México vs Ecuador (16avos, 30 jun).
  "mexico-ecuador": {
    wide: "/images/hero/mexico-ecuador-wide.webp",
    mobile: "/images/hero/mexico-ecuador-mobile.webp",
  },
  // España vs Austria (16avos, 2 jul).
  "espana-austria": {
    wide: "/images/hero/espana-austria-wide.webp",
    mobile: "/images/hero/espana-austria-mobile.webp",
  },
  // Australia vs Egipto (16avos, 3 jul).
  "australia-egipto": {
    wide: "/images/hero/australia-egipto-wide.webp",
    mobile: "/images/hero/australia-egipto-mobile.webp",
  },
  // ── Octavos de final ───────────────────────────────────────────────────────
  // Canadá vs Marruecos (octavos, 4 jul).
  "canada-marruecos": {
    wide: "/images/hero/canada-marruecos-wide.webp",
    mobile: "/images/hero/canada-marruecos-mobile.webp",
  },
  // Paraguay vs Francia (octavos, 4 jul).
  "paraguay-francia": {
    wide: "/images/hero/paraguay-francia-wide.webp",
    mobile: "/images/hero/paraguay-francia-mobile.webp",
  },
  // Brasil vs Noruega (octavos).
  "brasil-noruega": {
    wide: "/images/hero/brasil-noruega-wide.webp",
    mobile: "/images/hero/brasil-noruega-mobile.webp",
  },
  // México vs Inglaterra (octavos).
  "mexico-inglaterra": {
    wide: "/images/hero/mexico-inglaterra-wide.webp",
    mobile: "/images/hero/mexico-inglaterra-mobile.webp",
  },
  // Portugal vs España (octavos). Clave = slug del partido (home-away).
  "portugal-espana": {
    wide: "/images/hero/portugal-espana-wide.webp",
    mobile: "/images/hero/portugal-espana-mobile.webp",
  },
  // EE.UU. vs Bélgica (octavos).
  "ee-uu-belgica": {
    wide: "/images/hero/ee-uu-belgica-wide.webp",
    mobile: "/images/hero/ee-uu-belgica-mobile.webp",
  },
  // Argentina vs Egipto (octavos).
  "argentina-egipto": {
    wide: "/images/hero/argentina-egipto-wide.webp",
    mobile: "/images/hero/argentina-egipto-mobile.webp",
  },
  // Suiza vs Colombia (octavos).
  "suiza-colombia": {
    wide: "/images/hero/suiza-colombia-wide.webp",
    mobile: "/images/hero/suiza-colombia-mobile.webp",
  },
  // Francia vs Marruecos (cuartos). Clave = slug del partido (home=Francia).
  "francia-marruecos": {
    wide: "/images/hero/francia-marruecos-wide.webp",
    mobile: "/images/hero/francia-marruecos-mobile.webp",
  },
  // España vs Bélgica (cuartos).
  "espana-belgica": {
    wide: "/images/hero/espana-belgica-wide.webp",
    mobile: "/images/hero/espana-belgica-mobile.webp",
  },
  // Noruega vs Inglaterra (cuartos).
  "noruega-inglaterra": {
    wide: "/images/hero/noruega-inglaterra-wide.webp",
    mobile: "/images/hero/noruega-inglaterra-mobile.webp",
  },
  // Argentina vs Suiza (cuartos).
  "argentina-suiza": {
    wide: "/images/hero/argentina-suiza-wide.webp",
    mobile: "/images/hero/argentina-suiza-mobile.webp",
  },
  // ── Semifinales ──────────────────────────────────────────────────────────
  // Francia vs España (semifinal 101).
  "francia-espana": {
    wide: "/images/hero/francia-espana-wide.webp",
    mobile: "/images/hero/francia-espana-mobile.webp",
  },
  // Inglaterra vs Argentina (semifinal 102). Clave = slug del partido (home-away):
  // home = Inglaterra, aunque el arte diga "Argentina vs Inglaterra".
  "inglaterra-argentina": {
    wide: "/images/hero/inglaterra-argentina-wide.webp",
    mobile: "/images/hero/inglaterra-argentina-mobile.webp",
  },
  // Francia vs Inglaterra (tercer puesto, 18 jul).
  "francia-inglaterra": {
    wide: "/images/hero/francia-inglaterra-wide.webp",
    mobile: "/images/hero/francia-inglaterra-mobile.webp",
  },
  // Siguientes partidos: añade aquí su pieza cuando esté lista. Ej.:
  // "argentina-...": { wide: "/images/hero/argentina-...-wide.webp", mobile: "/images/hero/argentina-...-mobile.webp" },
};

/** Devuelve la pieza dedicada de un partido por su slug, o null si no la tiene. */
export function heroImageForSlug(slug: string | null | undefined): HeroMatchImage | null {
  if (!slug) return null;
  return HERO_MATCH_IMAGES[slug] ?? null;
}

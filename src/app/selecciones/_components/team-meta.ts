// Mapeo de slugs de producción → metadatos del rediseño.
// Coords lat/lon, FAVORITES, POWER_INDEX, QUOTES, dark horses, helpers.

import type { Seleccion } from "@/data/selecciones";

// ============================================================
// LISTAS DE SLUGS (producción)
// ============================================================

export const FAVORITES = [
  "argentina", "francia", "brasil", "espana",
  "inglaterra", "portugal", "belgica",
] as const;

export const HOSTS = ["estados-unidos", "mexico", "canada"] as const;

// 4 debutantes absolutos del Mundial 2026 (primer Mundial en su historia).
// Haití participó en 1974, no es debutante absoluto pero algunos materiales
// promocionales lo agrupan — aquí seguimos el criterio estricto.
export const DEBUTANTES = ["curazao", "cabo-verde", "jordania", "uzbekistan"] as const;

// Dark horses según el chat con el usuario.
export const DARK_HORSES = [
  "mexico", "canada", "marruecos", "estados-unidos", "noruega",
] as const;

// ============================================================
// COORDENADAS lat/lon — para el world map
// ============================================================

export const TEAM_COORDS: Record<string, { lat: number; lon: number }> = {
  // CONMEBOL
  argentina: { lat: -38, lon: -63 },
  brasil: { lat: -14, lon: -51 },
  uruguay: { lat: -33, lon: -56 },
  colombia: { lat: 4, lon: -74 },
  ecuador: { lat: -1, lon: -78 },
  paraguay: { lat: -23, lon: -58 },
  // UEFA
  francia: { lat: 46, lon: 2 },
  alemania: { lat: 51, lon: 10 },
  espana: { lat: 40, lon: -3 },
  inglaterra: { lat: 52, lon: -1 },
  portugal: { lat: 39, lon: -8 },
  belgica: { lat: 50, lon: 4 },
  "paises-bajos": { lat: 52, lon: 5 },
  croacia: { lat: 45, lon: 15 },
  suiza: { lat: 46, lon: 8 },
  austria: { lat: 47, lon: 14 },
  noruega: { lat: 60, lon: 8 },
  escocia: { lat: 56, lon: -4 },
  bosnia: { lat: 44, lon: 18 },
  suecia: { lat: 60, lon: 18 },
  turquia: { lat: 39, lon: 35 },
  "republica-checa": { lat: 49, lon: 15 },
  // CAF
  senegal: { lat: 14, lon: -14 },
  egipto: { lat: 26, lon: 30 },
  argelia: { lat: 28, lon: 1 },
  tunez: { lat: 33, lon: 9 },
  "costa-de-marfil": { lat: 7, lon: -5 },
  "cabo-verde": { lat: 16, lon: -24 },
  ghana: { lat: 8, lon: -1 },
  sudafrica: { lat: -30, lon: 25 },
  marruecos: { lat: 32, lon: -7 },
  "rd-congo": { lat: -4, lon: 21 },
  // AFC
  japon: { lat: 36, lon: 138 },
  "corea-del-sur": { lat: 36, lon: 128 },
  iran: { lat: 32, lon: 53 },
  australia: { lat: -25, lon: 133 },
  "arabia-saudi": { lat: 24, lon: 45 },
  qatar: { lat: 25, lon: 51 },
  uzbekistan: { lat: 41, lon: 64 },
  jordania: { lat: 31, lon: 36 },
  irak: { lat: 33, lon: 44 },
  // CONCACAF
  mexico: { lat: 23, lon: -102 },
  "estados-unidos": { lat: 39, lon: -98 },
  canada: { lat: 56, lon: -106 },
  panama: { lat: 8, lon: -80 },
  curazao: { lat: 12, lon: -69 },
  haiti: { lat: 19, lon: -72 },
  // OFC
  "nueva-zelanda": { lat: -42, lon: 174 },
};

// ============================================================
// POWER INDEX — % probabilidad de campeón (favoritos)
// ============================================================

export const POWER_INDEX: Record<string, number> = {
  argentina: 17.8,
  francia: 14.6,
  brasil: 13.4,
  espana: 10.5,
  inglaterra: 9.2,
  portugal: 7.1,
  belgica: 5.8,
};

// ============================================================
// PULL-QUOTES — citas editoriales para el hero rotator
// ============================================================

export interface TeamQuote {
  text: string;
  source: string;
}

export const QUOTES: Record<string, TeamQuote> = {
  argentina: {
    text: "Llega como vigente con la generación más madura. Messi todavía dicta, Mac Allister manda.",
    source: "Olé · sept 2025",
  },
  brasil: {
    text: "Cinco veces campeona busca exorcizar el 7-1. Vinicius como bandera, Endrick como amenaza.",
    source: "Globo Esporte · oct 2025",
  },
  francia: {
    text: "Mbappé en su pico físico, Bellingham al frente del proyecto. Bicampeona o nada.",
    source: "L'Équipe · oct 2025",
  },
  inglaterra: {
    text: "Tras la final de Wembley 2024, sin excusas. La generación dorada debe entregar de una vez.",
    source: "The Athletic · sept 2025",
  },
  belgica: {
    text: "Última bala para los nombres viejos. Doku y Lukaku tienen que aparecer cuando importa.",
    source: "DH Les Sports · ago 2025",
  },
  portugal: {
    text: "Cristiano a sus 41 jugando su sexto Mundial. Última oportunidad antes del relevo definitivo.",
    source: "A Bola · oct 2025",
  },
  espana: {
    text: "Vigente Eurocopa con la generación de Yamal y Pedri. Llega como nadie esperaba.",
    source: "Marca · oct 2025",
  },
};

// ============================================================
// DARK HORSES — blurb editorial
// ============================================================

export const DARK_HORSE_WHY: Record<string, { es: string; en: string }> = {
  mexico: {
    es: "Anfitriona en su tercera Copa. Hat-trick histórico, plantilla con experiencia europea y energía local que puede arrastrarla a cuartos.",
    en: "Three-time host. Historic hat-trick, European-experienced squad and home crowd energy that could push them to the quarters.",
  },
  canada: {
    es: "Debutó en Qatar, ahora juega en casa. Generación Davies–David rota en sus mejores años — la oleada canadiense no es accidente.",
    en: "Debuted in Qatar, now plays at home. The Davies–David generation peaks at the right time — Canada's surge is no accident.",
  },
  marruecos: {
    es: "El semifinalista de Qatar 2022 vuelve más maduro. Hakimi, En-Nesyri, Ounahi: la mejor camada africana del siglo.",
    en: "The Qatar 2022 semifinalist returns more mature. Hakimi, En-Nesyri, Ounahi: the best African generation of the century.",
  },
  "estados-unidos": {
    es: "Anfitriona con presupuesto y respaldo. McKennie, Pulisic, Reyna: la generación más europeizada de la historia USMNT.",
    en: "Host with budget and backing. McKennie, Pulisic, Reyna: the most Europeanized generation in USMNT history.",
  },
  noruega: {
    es: "Haaland + Ødegaard, por fin, en una Copa del Mundo. 25 años después del último Mundial: vienen a hacer ruido.",
    en: "Haaland + Ødegaard, finally, at a World Cup. 25 years after their last appearance: they come to make noise.",
  },
};

// ============================================================
// SPARKLINE — trayectoria FIFA sintética 12 meses
// ============================================================

// Hash determinista de string → entero
function hashSlug(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Genera 12 valores estables seeded por slug.
// El último valor es el ranking actual; los 11 anteriores oscilan
// alrededor con un drift que termina en el ranking actual.
export function getFifaTrend(slug: string, currentRank: number): number[] {
  const seed = hashSlug(slug);
  const rng = (i: number) => {
    const x = Math.sin(seed + i * 1337) * 10000;
    return x - Math.floor(x);
  };
  const trend: number[] = [];
  // start ~ 1-6 puestos peor o mejor que actual
  const startOffset = Math.round((rng(0) - 0.5) * 8);
  let v = Math.max(1, currentRank + startOffset);
  for (let i = 0; i < 11; i++) {
    trend.push(Math.max(1, Math.round(v)));
    // Drift hacia currentRank con jitter
    const target = currentRank;
    const step = (target - v) * 0.18 + (rng(i + 1) - 0.5) * 2;
    v += step;
  }
  trend.push(currentRank);
  return trend;
}

// ============================================================
// HELPERS
// ============================================================

export function isFavorite(slug: string): boolean {
  return (FAVORITES as readonly string[]).includes(slug);
}

export function isHost(slug: string): boolean {
  return (HOSTS as readonly string[]).includes(slug);
}

export function isDebutante(slug: string): boolean {
  return (DEBUTANTES as readonly string[]).includes(slug);
}

export function isDarkHorse(slug: string): boolean {
  return (DARK_HORSES as readonly string[]).includes(slug);
}

export function getCoords(slug: string): { lat: number; lon: number } | null {
  return TEAM_COORDS[slug] ?? null;
}

// Devuelve los favoritos ordenados por FIFA (con Brasil destacado primero).
export function getFavoritosOrdered(seleccionesAll: Seleccion[]): Seleccion[] {
  const favs = seleccionesAll.filter((s) => isFavorite(s.slug));
  const brasil = favs.find((s) => s.slug === "brasil");
  const rest = favs
    .filter((s) => s.slug !== "brasil")
    .sort((a, b) => (a.rankingFIFA ?? 999) - (b.rankingFIFA ?? 999));
  return brasil ? [brasil, ...rest] : rest;
}

// Extrae el número de títulos del string `mejorResultado` (p.ej. "Campeón (5)" → 5).
export function getTitlesFromMejor(mejor: string | undefined): number {
  if (!mejor) return 0;
  const m = mejor.match(/\((\d+)\)/);
  return m ? parseInt(m[1], 10) : 0;
}

// src/lib/blog/image-picker.ts
//
// Selector de imagen RELACIONADA con el contenido del post, desde Wikimedia
// Commons (misma fuente, modelo de licencia y crédito que usan los 13 posts
// editoriales estáticos). Sustituye al placeholder genérico gris: cada entrada
// del blog lleva una foto pertinente a su tema, con atribución visible.
//
// Principios:
//  - SOLO licencias libres (CC BY / CC BY-SA / CC0 / Dominio público). Si no se
//    encuentra ninguna válida, se devuelve null y el llamador deja el placeholder.
//  - ACOTADO EN LATENCIA: timeout por petición (AbortController). Nunca lanza.
//  - SIN DEPENDENCIAS: usa la API pública de Commons y limpia el HTML del autor
//    con regex (no añadimos cheerio/jsdom; infra lean).
//  - ANTI-BASURA: descarta SVG, logos, escudos, mapas, banderas y diagramas, y
//    exige una imagen apaisada de tamaño razonable (buena para el hero).
//  - FALLBACK: si la query específica no da una foto usable, reintenta con la
//    pista de categoría sola (p.ej. "FIFA World Cup"), que casi siempre tiene
//    fotos reales de eventos.

import type { BlogCategory, ImageCredit } from "./types";

const TIMEOUT_MS = parseInt(process.env.BLOG_IMG_TIMEOUT_MS || "6000", 10);
const MIN_WIDTH = 800;
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

export interface PickedImage {
  src: string;
  credit: ImageCredit;
}

/** Diagnóstico de un intento (para depurar por qué no se elige imagen). */
export interface PickDiagnostics {
  query: string;
  status: number | "error";
  pages: number;
  candidates: number;
  rejected: {
    mime: number;
    width: number;
    license: number;
    title: number;
    nosrc: number;
  };
  picked?: PickedImage;
  error?: string;
}

/** Ancla en inglés por categoría: las descripciones de Commons están en inglés,
 * así que sesgamos hacia imagen REAL de Mundial/fútbol, no fotos amateur. */
const CATEGORY_HINT: Record<BlogCategory, string> = {
  analisis: "FIFA World Cup match",
  selecciones: "national football team",
  sedes: "stadium",
  datos: "FIFA World Cup",
  historia: "FIFA World Cup",
  guia: "FIFA World Cup",
};

/** Traducción ES→EN de entidades futbolísticas frecuentes (selecciones del
 * Mundial 2026 + términos clave). Las descripciones de Commons están en inglés;
 * sin esto, "Países Bajos" no encuentra nada y "Netherlands" sí. Nombres de
 * jugadores/estadios suelen ser iguales en ambos idiomas y se extraen aparte. */
const ES_TO_EN: Record<string, string> = {
  "países bajos": "Netherlands",
  "estados unidos": "United States",
  "corea del sur": "South Korea",
  "arabia saudí": "Saudi Arabia",
  "costa rica": "Costa Rica",
  alemania: "Germany",
  españa: "Spain",
  francia: "France",
  inglaterra: "England",
  brasil: "Brazil",
  méxico: "Mexico",
  canadá: "Canada",
  italia: "Italy",
  bélgica: "Belgium",
  croacia: "Croatia",
  uruguay: "Uruguay",
  colombia: "Colombia",
  marruecos: "Morocco",
  senegal: "Senegal",
  ghana: "Ghana",
  camerún: "Cameroon",
  nigeria: "Nigeria",
  australia: "Australia",
  suiza: "Switzerland",
  dinamarca: "Denmark",
  polonia: "Poland",
  serbia: "Serbia",
  ecuador: "Ecuador",
  perú: "Peru",
  chile: "Chile",
  catar: "Qatar",
  irán: "Iran",
  egipto: "Egypt",
  argelia: "Algeria",
  gales: "Wales",
  escocia: "Scotland",
  noruega: "Norway",
  austria: "Austria",
  turquía: "Turkey",
  grecia: "Greece",
  japón: "Japan",
  suecia: "Sweden",
  túnez: "Tunisia",
  portugal: "Portugal",
  argentina: "Argentina",
};

const STOPWORDS = new Set([
  "Mundial",
  "Grupo",
  "Análisis",
  "Datos",
  "Historia",
  "Guía",
  "Selecciones",
  "Curiosidades",
  "Estadísticas",
  "Táctico",
  "Jugadores",
  "Favoritos",
  "Predicciones",
  "Planificación",
  "Transmisión",
  "Calendario",
  // Interrogativos / artículos / conectores capitalizados al inicio de título.
  "Cómo",
  "Qué",
  "Dónde",
  "Cuándo",
  "Cuál",
  "Quién",
  "Por",
  "Para",
  "Las",
  "Los",
  "Una",
  "Esto",
  "Este",
  "Esta",
]);

/** Títulos de archivo que casi nunca son una buena foto editorial. */
const TITLE_BLOCKLIST =
  /logo|coat[_ ]of[_ ]arms|escudo|locator|location[_ ]map|\bmap\b|mapa|flag|bandera|\bicon\b|seal|emblem|diagram|chart|graph|svg|\.svg|wordmark|crest/i;

interface CommonsImageInfo {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  mime?: string;
  width?: number;
  height?: number;
  extmetadata?: Record<string, { value?: string }>;
}

interface CommonsPage {
  title?: string;
  imageinfo?: CommonsImageInfo[];
}

/** Quita tags HTML y normaliza espacios (el autor viene a veces como <a>…</a>). */
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** ¿La licencia es libre y reutilizable (con atribución)? */
function isFreeLicense(short: string, usage: string): boolean {
  const blob = `${short} ${usage}`.toLowerCase();
  if (/non-?free|fair use|all rights reserved/.test(blob)) return false;
  return /cc[ -]?by|cc0|public domain|pdm|dominio público/.test(blob);
}

/**
 * Extrae entidades en inglés del post: traduce selecciones conocidas (ES→EN) y
 * recoge nombres propios (jugadores, estadios, ciudades) que suelen ser iguales
 * en ambos idiomas. Devuelve hasta 2 entidades para anclar la búsqueda al TEMA.
 */
function extractEntities(opts: {
  title: string;
  keywords: string[];
  tags: string[];
}): string[] {
  const text = [opts.title, ...opts.keywords, ...opts.tags].join(" ");
  const lower = text.toLowerCase();
  const found: string[] = [];

  // 1) Selecciones / términos del diccionario ES→EN.
  for (const [es, en] of Object.entries(ES_TO_EN)) {
    if (lower.includes(es) && !found.includes(en)) found.push(en);
  }

  // 2) Nombres propios (palabras Capitalizadas ≥4 letras) no genéricos: cubre
  //    jugadores y estadios ("Messi", "Mbappé", "Azteca", "SoFi", "Neymar").
  const proper = text.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,}\b/g) ?? [];
  for (const w of proper) {
    if (STOPWORDS.has(w)) continue;
    if (/^\d/.test(w)) continue;
    if (!found.includes(w)) found.push(w);
  }

  return found.slice(0, 2);
}

/** Construye la query temática: ancla de categoría + entidades del post. */
function buildQuery(opts: {
  title: string;
  keywords: string[];
  tags: string[];
  category: BlogCategory;
}): string {
  const hint = CATEGORY_HINT[opts.category] ?? "FIFA World Cup";
  const entities = extractEntities(opts);
  return [hint, ...entities].join(" ");
}

function em(info: CommonsImageInfo, key: string): string {
  return info.extmetadata?.[key]?.value ?? "";
}

/** Ejecuta UNA búsqueda en Commons y devuelve diagnóstico + imagen elegida.
 * `exclude` evita reutilizar la misma foto en varios posts. */
async function searchOnce(
  query: string,
  exclude: Set<string> = new Set(),
): Promise<PickDiagnostics> {
  const diag: PickDiagnostics = {
    query,
    status: "error",
    pages: 0,
    candidates: 0,
    rejected: { mime: 0, width: 0, license: 0, title: 0, nosrc: 0 },
  };

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: "1280",
    origin: "*",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let pages: Record<string, CommonsPage>;
  try {
    const res = await fetch(`${COMMONS_API}?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        // Commons exige un UA descriptivo con contacto; sin esto puede dar 403.
        "User-Agent":
          "ZonaMundialBot/1.0 (https://zonamundial.app; contacto@zonamundial.app)",
        Accept: "application/json",
        "Api-User-Agent":
          "ZonaMundialBot/1.0 (https://zonamundial.app; contacto@zonamundial.app)",
      },
      cache: "no-store",
    });
    diag.status = res.status;
    if (!res.ok) return diag;
    const json = (await res.json()) as {
      query?: { pages?: Record<string, CommonsPage> };
      error?: { info?: string };
    };
    if (json.error?.info) {
      diag.error = json.error.info;
      return diag;
    }
    pages = json.query?.pages ?? {};
  } catch (err) {
    diag.error = (err as Error).message;
    return diag;
  } finally {
    clearTimeout(timer);
  }

  diag.pages = Object.keys(pages).length;

  const candidates: Array<{
    src: string;
    width: number;
    landscape: boolean;
    isJpeg: boolean;
    credit: ImageCredit;
  }> = [];

  for (const page of Object.values(pages)) {
    const title = page.title ?? "";
    if (TITLE_BLOCKLIST.test(title)) {
      diag.rejected.title += 1;
      continue;
    }
    const info = page.imageinfo?.[0];
    if (!info) {
      diag.rejected.nosrc += 1;
      continue;
    }
    if (!/image\/(jpeg|png)/.test(info.mime ?? "")) {
      diag.rejected.mime += 1;
      continue;
    }
    const width = info.width ?? 0;
    const height = info.height ?? 0;
    if (width < MIN_WIDTH) {
      diag.rejected.width += 1;
      continue;
    }
    const licenseShort = stripHtml(em(info, "LicenseShortName"));
    const usageTerms = stripHtml(em(info, "UsageTerms"));
    if (!isFreeLicense(licenseShort, usageTerms)) {
      diag.rejected.license += 1;
      continue;
    }
    const src = info.thumburl || info.url;
    if (!src || exclude.has(src)) {
      diag.rejected.nosrc += 1;
      continue;
    }
    const author = stripHtml(em(info, "Artist")) || "Autor desconocido";
    candidates.push({
      src,
      width,
      landscape: width >= height,
      isJpeg: /image\/jpeg/.test(info.mime ?? ""),
      credit: {
        author: author.slice(0, 120),
        license: licenseShort || "CC BY-SA",
        source: "Wikimedia Commons",
        sourceUrl: info.descriptionurl,
      },
    });
  }

  diag.candidates = candidates.length;
  if (candidates.length === 0) return diag;

  candidates.sort((a, b) => {
    // JPEG primero (las fotos reales suelen ser jpeg; PNG suele ser mapa/diagrama).
    if (a.isJpeg !== b.isJpeg) return a.isJpeg ? -1 : 1;
    if (a.landscape !== b.landscape) return a.landscape ? -1 : 1;
    return b.width - a.width;
  });
  const best = candidates[0];
  diag.picked = { src: best.src, credit: best.credit };
  return diag;
}

/**
 * Diagnóstico completo: intenta la query temática y, si no da imagen, reintenta
 * con la pista de categoría sola. Devuelve el último diagnóstico relevante.
 */
export async function findRelatedImage(opts: {
  title: string;
  keywords: string[];
  tags: string[];
  category: BlogCategory;
  exclude?: Set<string>;
}): Promise<PickDiagnostics> {
  const exclude = opts.exclude ?? new Set<string>();
  const primary = await searchOnce(buildQuery(opts), exclude);
  if (primary.picked) return primary;
  // Fallback: solo la pista de categoría (casi siempre tiene fotos reales).
  const hint = CATEGORY_HINT[opts.category] ?? "FIFA World Cup";
  const fallback = await searchOnce(hint, exclude);
  // Devuelve el diagnóstico que tenga imagen; si ninguno, el primario (más
  // informativo sobre el motivo).
  return fallback.picked ? fallback : primary;
}

/**
 * Devuelve una imagen relacionada con el post (src + crédito) o null si no se
 * encuentra ninguna con licencia libre. Nunca lanza.
 */
export async function pickRelatedImage(opts: {
  title: string;
  keywords: string[];
  tags: string[];
  category: BlogCategory;
  exclude?: Set<string>;
}): Promise<PickedImage | null> {
  const diag = await findRelatedImage(opts);
  return diag.picked ?? null;
}

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

/** Pista de búsqueda en inglés por categoría (las descripciones de Commons
 * suelen estar en inglés; un término ancla mejora mucho la pertinencia). */
const CATEGORY_HINT: Record<BlogCategory, string> = {
  analisis: "football match",
  selecciones: "national football team",
  sedes: "football stadium",
  datos: "football",
  historia: "FIFA World Cup",
  guia: "football",
};

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

/** Construye la query temática a partir del post. */
function buildQuery(opts: {
  keywords: string[];
  tags: string[];
  category: BlogCategory;
}): string {
  const terms = [...opts.keywords, ...opts.tags]
    .map((t) => t.trim())
    .filter((t) => t.length >= 4)
    .slice(0, 3);
  const hint = CATEGORY_HINT[opts.category] ?? "football";
  return [hint, ...terms].join(" ");
}

function em(info: CommonsImageInfo, key: string): string {
  return info.extmetadata?.[key]?.value ?? "";
}

/** Ejecuta UNA búsqueda en Commons y devuelve diagnóstico + imagen elegida. */
async function searchOnce(query: string): Promise<PickDiagnostics> {
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
    if (!src) {
      diag.rejected.nosrc += 1;
      continue;
    }
    const author = stripHtml(em(info, "Artist")) || "Autor desconocido";
    candidates.push({
      src,
      width,
      landscape: width >= height,
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
  keywords: string[];
  tags: string[];
  category: BlogCategory;
}): Promise<PickDiagnostics> {
  const primary = await searchOnce(buildQuery(opts));
  if (primary.picked) return primary;
  // Fallback: solo la pista de categoría (casi siempre tiene fotos reales).
  const hint = CATEGORY_HINT[opts.category] ?? "football";
  const fallback = await searchOnce(hint);
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
}): Promise<PickedImage | null> {
  const diag = await findRelatedImage(opts);
  return diag.picked ?? null;
}

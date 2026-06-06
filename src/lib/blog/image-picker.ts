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

import type { BlogCategory, ImageCredit } from "./types";

const TIMEOUT_MS = parseInt(process.env.BLOG_IMG_TIMEOUT_MS || "5000", 10);
const MIN_WIDTH = 800;
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

export interface PickedImage {
  src: string;
  credit: ImageCredit;
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
  if (/non-?free|fair use|all rights reserved|copyright(?!ed free)/.test(blob)) {
    return false;
  }
  return /cc[ -]?by|cc0|public domain|pdm|dominio público/.test(blob);
}

/** Construye la query a Commons a partir del tema del post. */
function buildQuery(opts: {
  title: string;
  keywords: string[];
  tags: string[];
  category: BlogCategory;
}): string {
  // Toma términos con sustancia (descarta palabras muy cortas / vacías).
  const terms = [...opts.keywords, ...opts.tags]
    .map((t) => t.trim())
    .filter((t) => t.length >= 4)
    .slice(0, 3);
  const hint = CATEGORY_HINT[opts.category] ?? "football";
  // El hint va primero como ancla temática; luego los términos del post.
  return [hint, ...terms].join(" ");
}

function em(info: CommonsImageInfo, key: string): string {
  return info.extmetadata?.[key]?.value ?? "";
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
  const query = buildQuery(opts);
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    // filetype:bitmap excluye SVG ya en el buscador.
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6", // namespace File:
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: "1280",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let pages: Record<string, CommonsPage>;
  try {
    const res = await fetch(`${COMMONS_API}?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        // Commons pide un UA identificable para su API.
        "User-Agent":
          "ZonaMundialBot/1.0 (https://zonamundial.app; blog image picker)",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      query?: { pages?: Record<string, CommonsPage> };
    };
    pages = json.query?.pages ?? {};
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }

  const candidates: Array<{
    src: string;
    width: number;
    landscape: boolean;
    credit: ImageCredit;
  }> = [];

  for (const page of Object.values(pages)) {
    const title = page.title ?? "";
    if (TITLE_BLOCKLIST.test(title)) continue;
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const mime = info.mime ?? "";
    if (!/image\/(jpeg|png)/.test(mime)) continue;
    const width = info.width ?? 0;
    const height = info.height ?? 0;
    if (width < MIN_WIDTH) continue;

    const licenseShort = stripHtml(em(info, "LicenseShortName"));
    const usageTerms = stripHtml(em(info, "UsageTerms"));
    if (!isFreeLicense(licenseShort, usageTerms)) continue;

    const author = stripHtml(em(info, "Artist")) || "Autor desconocido";
    const src = info.thumburl || info.url;
    if (!src) continue;

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

  if (candidates.length === 0) return null;

  // Preferencia: apaisadas primero (mejor hero), luego mayor resolución.
  candidates.sort((a, b) => {
    if (a.landscape !== b.landscape) return a.landscape ? -1 : 1;
    return b.width - a.width;
  });

  const best = candidates[0];
  return { src: best.src, credit: best.credit };
}

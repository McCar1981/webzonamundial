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
    token: number;
  };
  picked?: PickedImage;
  error?: string;
}

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

/** Nombres en inglés de las selecciones (para detectar también el país cuando
 * el texto ya viene en inglés, p.ej. tags). El orden no importa: la prioridad
 * la da la posición en el TÍTULO del post (ver detectCountries). */
const WC_NATIONS_EN: string[] = Array.from(new Set(Object.values(ES_TO_EN)));

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

/** Normaliza para comparar tokens contra títulos/descripciones de Commons
 * (que usan guiones bajos y mayúsculas arbitrarias). */
function norm(s: string): string {
  return s.replace(/_/g, " ").toLowerCase();
}

/**
 * Detecta el/los PAÍS(es) del post, en inglés. Da prioridad a los que aparecen
 * en el TÍTULO (el tema central) sobre los de keywords/tags. Reconoce tanto los
 * nombres en español (diccionario ES→EN) como en inglés. El primero devuelto es
 * el país principal sobre el que se ancla la búsqueda de imagen.
 */
function detectCountries(opts: {
  title: string;
  keywords: string[];
  tags: string[];
}): string[] {
  // Tokeniza por PALABRAS (delimitadas por espacios). Esencial: hacerlo por
  // subcadena daba falsos positivos — "decidirán"/"seguirán" contienen "irán" y
  // colaban Irán en posts que no van de Irán. Comparamos palabra completa.
  const titleN = tokenized(opts.title);
  const restN = tokenized([...opts.keywords, ...opts.tags].join(" "));
  const inTitle: string[] = [];
  const inRest: string[] = [];

  const consider = (name: string, en: string) => {
    if (inTitle.includes(en) || inRest.includes(en)) return;
    const phrase = ` ${name} `;
    if (titleN.includes(phrase)) inTitle.push(en);
    else if (restN.includes(phrase)) inRest.push(en);
  };

  // Nombres en español (más probables en nuestros títulos).
  for (const [es, en] of Object.entries(ES_TO_EN)) consider(es, en);
  // Nombres en inglés (por si vienen en tags/keywords).
  for (const en of WC_NATIONS_EN) consider(en.toLowerCase(), en);

  return [...inTitle, ...inRest];
}

/** Normaliza a una cadena de palabras separadas por un único espacio y rodeada
 * de espacios, para poder buscar PALABRAS completas con `.includes(" x ")`. */
function tokenized(s: string): string {
  const words = norm(s)
    .split(/[^a-z0-9áéíóúñü]+/)
    .filter(Boolean);
  return ` ${words.join(" ")} `;
}

/** Nombres propios no-país (jugadores, estadios, ciudades) que suelen ser
 * iguales en ES/EN. Sirven como anclas secundarias cuando NO hay país. */
function extractProperNouns(opts: {
  title: string;
  keywords: string[];
  tags: string[];
}): string[] {
  const text = [opts.title, ...opts.keywords, ...opts.tags].join(" ");
  const proper = text.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,}\b/g) ?? [];
  const out: string[] = [];
  for (const w of proper) {
    if (STOPWORDS.has(w)) continue;
    if (/^\d/.test(w)) continue;
    if (!out.includes(w)) out.push(w);
  }
  return out.slice(0, 2);
}

/** Un intento de búsqueda. `requireToken`, si está, OBLIGA a que la imagen
 * elegida mencione ese término en su título/descripción/categorías: así una
 * entrada sobre Canadá NUNCA recibe una foto de Irán. */
interface Attempt {
  query: string;
  requireToken?: string;
}

/**
 * Construye la lista ORDENADA de intentos. La estrategia clave para la
 * RELEVANCIA por país:
 *  1) Si hay país: el país va PRIMERO en la query y es REQUISITO (requireToken).
 *     Si Commons no devuelve una foto que mencione ese país, NO se acepta una
 *     foto de otro país: se cae a una imagen NEUTRA del Mundial (trofeo/estadio)
 *     que es temática pero imposible de "equivocar de país".
 *  2) Si no hay país pero sí un nombre propio (jugador/estadio), se ancla a él.
 *  3) Fallbacks NEUTROS y agnósticos de país (trofeo/estadio/partido): jamás
 *     pueden ser un desajuste de país.
 */
function buildAttempts(opts: {
  title: string;
  keywords: string[];
  tags: string[];
  category: BlogCategory;
}): Attempt[] {
  const attempts: Attempt[] = [];
  const primary = detectCountries(opts)[0];

  if (primary) {
    attempts.push({ query: `${primary} national football team`, requireToken: primary });
    attempts.push({ query: `${primary} football team`, requireToken: primary });
    attempts.push({ query: `${primary} national team World Cup`, requireToken: primary });
  } else {
    for (const n of extractProperNouns(opts)) {
      attempts.push({ query: `${n} football`, requireToken: n });
    }
  }

  // Fallbacks neutros: temáticos del Mundial pero SIN selección concreta, así
  // que no pueden chocar con el país del post.
  if (opts.category === "sedes") {
    attempts.push({ query: "FIFA World Cup stadium" });
  }
  attempts.push({ query: "FIFA World Cup trophy" });
  attempts.push({ query: "FIFA World Cup match" });

  return attempts;
}

function em(info: CommonsImageInfo, key: string): string {
  return info.extmetadata?.[key]?.value ?? "";
}

/** Ejecuta UNA búsqueda en Commons y devuelve diagnóstico + imagen elegida.
 * `exclude` evita reutilizar la misma foto en varios posts. */
async function searchOnce(
  query: string,
  exclude: Set<string> = new Set(),
  requireToken?: string,
): Promise<PickDiagnostics> {
  const diag: PickDiagnostics = {
    query,
    status: "error",
    pages: 0,
    candidates: 0,
    rejected: { mime: 0, width: 0, license: 0, title: 0, nosrc: 0, token: 0 },
  };
  const needle = requireToken ? norm(requireToken) : null;

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
    soccer: boolean;
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
    // Anclaje por país/entidad: la imagen DEBE mencionar el término requerido
    // en su título, descripción o categorías. Evita poner Irán en una entrada
    // sobre Canadá: si el resultado no es del país, se descarta.
    if (needle) {
      const haystack = norm(
        [
          title,
          stripHtml(em(info, "ImageDescription")),
          stripHtml(em(info, "Categories")),
          stripHtml(em(info, "ObjectName")),
        ].join(" "),
      );
      if (!haystack.includes(needle)) {
        diag.rejected.token += 1;
        continue;
      }
    }
    const src = info.thumburl || info.url;
    if (!src || exclude.has(src)) {
      diag.rejected.nosrc += 1;
      continue;
    }
    const author = stripHtml(em(info, "Artist")) || "Autor desconocido";
    // Relevancia FUTBOLÍSTICA: prioriza fotos de selección/Mundial sobre otras
    // que solo mencionan el país (una iglesia en Colombia, un equipo de fútbol
    // americano en EE.UU.). Exige términos de fútbol-asociación, no el genérico
    // "football" (que el fútbol americano también usa).
    const relText = norm(
      [
        title,
        stripHtml(em(info, "ImageDescription")),
        stripHtml(em(info, "Categories")),
      ].join(" "),
    );
    const soccer =
      /national (football |soccer )?team|world cup|f[uú]tbol|selecci[oó]n|\bsoccer\b|\bfifa\b|\buefa\b|conmebol|\bcopa\b/.test(
        relText,
      );
    candidates.push({
      src,
      width,
      landscape: width >= height,
      isJpeg: /image\/jpeg/.test(info.mime ?? ""),
      soccer,
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
    // Relevancia futbolística primero (selección/Mundial sobre cualquier otra
    // foto que solo comparta el país).
    if (a.soccer !== b.soccer) return a.soccer ? -1 : 1;
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
  const attempts = buildAttempts(opts);
  let last: PickDiagnostics | null = null;

  // Intentos en orden: primero el país (como REQUISITO), luego neutros. En
  // cuanto uno da imagen válida, se devuelve. Si ninguno acierta, se devuelve
  // el último diagnóstico (informativo sobre el motivo del rechazo).
  for (const attempt of attempts) {
    const diag = await searchOnce(attempt.query, exclude, attempt.requireToken);
    if (diag.picked) return diag;
    last = diag;
  }

  return last as PickDiagnostics;
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

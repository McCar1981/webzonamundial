/**
 * Source enrichment (Opción 1).
 *
 * El tier GRATIS de GNews trunca el `content` a ~3-4 frases con un sufijo
 * "[+1234 chars]". El reescritor tiene PROHIBIDO inventar, así que con tan poco
 * material la pieza sale corta y el crítico la rechaza por baja originalidad /
 * profundidad. Aquí descargamos el artículo original (draft.sourceUrl) y
 * extraemos el cuerpo en texto plano para darle al reescritor material REAL del
 * que tirar.
 *
 * Principios de diseño (pedidos por Carlos):
 *  - AUTO-SKIP: si la fuente ya es rica (>= NEWS_ENRICH_MIN_CHARS), NO se
 *    descarga nada. El día que se pague GNews y devuelva contenido completo,
 *    esto se desactiva solo sin tocar código.
 *  - ACOTADO EN LATENCIA: timeout por artículo (NEWS_ENRICH_TIMEOUT_MS) con
 *    AbortController, para no romper el presupuesto de ~50s del cron.
 *  - FALLBACK SEGURO: ante cualquier fallo (timeout, 4xx/5xx, HTML raro) se
 *    devuelve el draft ORIGINAL intacto. Enriquecer nunca puede empeorar.
 *  - TOGGLE: NEWS_ENRICH=0 lo apaga del todo (modo "lanzar rápido").
 *
 * Extracción sin dependencias: regex sobre el HTML. No añadimos cheerio/jsdom
 * para mantener el bundle ligero (infra lean Fase 1).
 */

import type { DraftNoticia } from "@/lib/noticias-ingest";
import type { NoticiaBlock } from "@/data/noticias";

/** Umbral de "fuente ya rica": si el texto fuente actual supera esto, NO se descarga. */
const MIN_CHARS = parseInt(process.env.NEWS_ENRICH_MIN_CHARS || "900", 10);
/** Timeout por artículo (ms). */
const TIMEOUT_MS = parseInt(process.env.NEWS_ENRICH_TIMEOUT_MS || "4000", 10);
/** Tope de caracteres extraídos (evita meter al LLM un artículo gigantesco). */
const MAX_EXTRACT_CHARS = parseInt(process.env.NEWS_ENRICH_MAX_CHARS || "4000", 10);
/** Longitud mínima de un <p> para considerarlo cuerpo (descarta nav/boilerplate). */
const MIN_PARAGRAPH_CHARS = 60;

/** ¿Está activado el enriquecimiento? NEWS_ENRICH=0 lo apaga. */
export function enrichEnabled(): boolean {
  return process.env.NEWS_ENRICH !== "0";
}

/** Texto fuente actual del draft (concatena los <p> del body). */
function sourceTextLen(draft: DraftNoticia): number {
  return draft.body
    .filter((b) => b.type === "p")
    .reduce((n, b) => n + ((b as { text: string }).text || "").length, 0);
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#039;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
  "&laquo;": "«",
  "&raquo;": "»",
  "&aacute;": "á",
  "&eacute;": "é",
  "&iacute;": "í",
  "&oacute;": "ó",
  "&uacute;": "ú",
  "&ntilde;": "ñ",
  "&Aacute;": "Á",
  "&Eacute;": "É",
  "&Iacute;": "Í",
  "&Oacute;": "Ó",
  "&Uacute;": "Ú",
  "&Ntilde;": "Ñ",
  "&uuml;": "ü",
};

function decodeEntities(s: string): string {
  let out = s.replace(/&[a-zA-Z#0-9]+;/g, (m) => HTML_ENTITIES[m] ?? m);
  // Numéricas genéricas que no estén en la tabla.
  out = out.replace(/&#(\d+);/g, (_, d) => {
    const code = parseInt(d, 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : _;
  });
  return out;
}

/**
 * Extrae el cuerpo en texto plano de un HTML de artículo usando regex.
 * Devuelve un array de párrafos limpios (puede ser []).
 */
export function extractParagraphs(html: string): string[] {
  // Quitar bloques que no son cuerpo.
  const stripped = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");

  const paras: string[] = [];
  const seen = new Set<string>();
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    // Quitar tags internos (<a>, <strong>, <em>, etc.) y normalizar espacios.
    const text = decodeEntities(m[1].replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    if (text.length < MIN_PARAGRAPH_CHARS) continue;
    // Descartar boilerplate típico (cookies, suscripción, legal, footers de
    // medios). Ej. real detectado: muchos medios incluyen un párrafo de
    // "subvenciones del Gobierno de Canarias" en el footer que se colaba como
    // material fuente y ensuciaba la reescritura.
    if (
      /cookie|suscríb|subscribe|newsletter|política de privacidad|subvencion|gobierno de canarias|derechos reservados|all rights reserved|©|aviso legal|condiciones de uso|términos y condiciones|publicidad|comparte en|síguenos/i.test(
        text,
      )
    )
      continue;
    if (seen.has(text)) continue;
    seen.add(text);
    paras.push(text);
  }
  return paras;
}

/**
 * Descarga draft.sourceUrl y devuelve un draft con el body enriquecido con los
 * párrafos extraídos del artículo original. Si no procede (toggle off, fuente
 * ya rica, URL inválida, timeout o extracción vacía) devuelve el draft original.
 *
 * Nunca lanza: cualquier error => draft original.
 */
export async function enrichDraft(draft: DraftNoticia): Promise<DraftNoticia> {
  if (!enrichEnabled()) return draft;
  // Auto-skip si la fuente ya es suficientemente rica (p.ej. GNews de pago).
  if (sourceTextLen(draft) >= MIN_CHARS) return draft;

  const urlStr = draft.sourceUrl;
  if (!urlStr || !/^https?:\/\//i.test(urlStr)) return draft;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let html: string;
  try {
    const res = await fetch(urlStr, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // UA de navegador: muchos medios sirven 403 a clientes sin UA.
        "User-Agent":
          "Mozilla/5.0 (compatible; ZonaMundialBot/1.0; +https://zonamundial.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      // No cache: queremos el artículo tal cual está ahora.
      cache: "no-store",
    });
    if (!res.ok) return draft;
    const ctype = res.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml/i.test(ctype)) return draft;
    html = await res.text();
  } catch {
    // Timeout, red, abort, etc. → fallback al snippet.
    return draft;
  } finally {
    clearTimeout(timer);
  }

  const paragraphs = extractParagraphs(html);
  if (paragraphs.length === 0) return draft;

  // Acumular hasta MAX_EXTRACT_CHARS.
  const extracted: string[] = [];
  let total = 0;
  for (const p of paragraphs) {
    if (total >= MAX_EXTRACT_CHARS) break;
    extracted.push(p);
    total += p.length;
  }
  // Si lo extraído no aporta más que lo que ya teníamos, no tocar nada.
  if (total <= sourceTextLen(draft)) return draft;

  // Insertar los párrafos extraídos como bloques <p> ANTES del callout "Fuente".
  // El reescritor y el crítico leen los <p> del body como material fuente, así
  // que con esto ambos reciben el texto completo del artículo original.
  const calloutIdx = draft.body.findIndex((b) => b.type === "callout");
  const newBlocks: NoticiaBlock[] = extracted.map((text) => ({ type: "p", text }));
  const body =
    calloutIdx >= 0
      ? [
          ...draft.body.slice(0, calloutIdx),
          ...newBlocks,
          ...draft.body.slice(calloutIdx),
        ]
      : [...draft.body, ...newBlocks];

  return { ...draft, body };
}

/**
 * Enriquece varios drafts EN PARALELO con concurrencia acotada.
 *
 * El cuello de botella del enrich es la latencia de red: un fetch por artículo,
 * hasta TIMEOUT_MS cada uno. Hacerlo en serie dentro del loop de reescritura
 * sumaba esas esperas y quemaba el presupuesto del cron (abortedByTimeout),
 * dejando solo 1-2 piezas enriquecidas por tick → reescrituras pobres que el
 * crítico tumbaba. Lanzando `concurrency` fetches a la vez, las esperas se
 * solapan y enriquecemos muchos más en la misma ventana de tiempo.
 *
 * Preserva el orden de entrada. Nunca lanza: cada draft que falle vuelve
 * intacto (enrichDraft ya hace fallback al snippet ante cualquier error).
 */
export async function enrichMany(
  drafts: DraftNoticia[],
  concurrency = 4,
): Promise<DraftNoticia[]> {
  const out = new Array<DraftNoticia>(drafts.length);
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= drafts.length) return;
      out[i] = await enrichDraft(drafts[i]);
    }
  }
  const lanes = Math.max(1, Math.min(concurrency, drafts.length));
  await Promise.all(Array.from({ length: lanes }, () => worker()));
  return out;
}

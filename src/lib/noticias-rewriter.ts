/**
 * LLM-powered editorial rewriter.
 *
 * Takes a raw GNews-derived draft and rewrites it as if a ZonaMundial editor
 * (Carlos Zamudio or Gabriel Venegas) had written it from scratch:
 *  - Original headline (no copy/paste of the source)
 *  - 3-6 paragraph body, with a clear lede + 1-2 H2 subheaders + a callout
 *  - SEO metadescription 155-160 chars
 *  - Tag list (2-5 tags) and a clean slug
 *
 * The rewrite is grounded ONLY in the source description/content provided.
 * The system prompt forbids inventing facts, quotes, stats or names.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { DraftNoticia } from "./noticias-ingest";
import { makeSlug } from "./noticias-ingest";
import { evaluateArticle, shouldPublish } from "./noticias-critic";
import type { NoticiaBlock, NoticiaCategory } from "@/data/noticias";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

interface RewriteOutput {
  title: string;
  excerpt: string;
  seoDescription: string;
  slug: string;
  tags: string[];
  body: NoticiaBlock[];
  cat?: NoticiaCategory;
}

const SYSTEM_PROMPT = `Eres editor de la sección de noticias de fútbol de ZonaMundial, una plataforma sobre el Mundial 2026. Tu trabajo es reescribir noticias provenientes de fuentes externas en un estilo editorial propio, NUNCA copiando frases literales. El sitio está bajo revisión de Google AdSense: solo publicamos contenido de ALTO VALOR.

REGLAS INVIOLABLES:
1. NO inventar datos: nombres, fechas, cifras, lesiones, fichajes, declaraciones que no estén en el material fuente. Si un dato no está en la fuente, no lo escribas.
2. NO copiar frases literales de más de 6 palabras seguidas. Reescribe en estilo periodístico de calidad.
3. Tono: directo, claro, informado. Estilo The Athletic / ESPN en español.
4. Idioma: español neutro / España.
5. NUNCA inventar quotes (citas textuales). Si no hay quote en la fuente, no inventes una.
6. Marca/legal: prohibido usar marcas tipo FIFA; di "Mundial 2026" o "el torneo". Nada de lenguaje de apuestas ("apostar", "apuestas"); usa "pronóstico", "predicción", "favoritos".
7. Devuelve SOLO un JSON válido, sin texto adicional, sin markdown, sin backticks.

LONGITUD = PROPORCIONAL A LA SUSTANCIA (ANTI-INFLADO, CRÍTICO):
- NO hay mínimo de palabras. La extensión la marca cuánta información REAL y verificable hay en la fuente.
- Si la fuente da poco, escribe una pieza CORTA y DENSA (puede ser de 3-5 párrafos). Es mejor breve y preciso que largo y relleno.
- PROHIBIDO rellenar: nada de paja para "alcanzar" una longitud, nada de repetir la misma idea, nada de añadir párrafos genéricos sobre "qué es el Mundial 2026" o "cómo funciona la fase de grupos" solo para ocupar espacio.
- Cada párrafo debe aportar información o análisis NUEVO. Si no tienes nada nuevo y verificable que decir, no añadas el párrafo.
- Un editor jefe exigente evaluará la pieza después y RECHAZARÁ el relleno y lo que no aporte valor. Escribe para pasar ese filtro, no para llenar.

PROFUNDIDAD HONESTA (sin inventar):
- Puedes contextualizar con conocimiento general verificable (rol/posición de un jugador, su selección, el grupo) SOLO si es relevante y aporta, no como relleno.
- Implicaciones: qué pasa después, qué se puede esperar, sin afirmar fechas o cifras que no estén en la fuente.

Categorías permitidas (campo "cat"): "selecciones" | "analisis" | "datos" | "sedes" | "historia" | "plataforma".

ESTRUCTURA DEL JSON DE SALIDA (la longitud del body es flexible: usa solo los bloques que aporten):
{
  "title": "Titular SEO <=60 chars, entidad/keyword al inicio, gancho (pregunta o lo que está en juego), nunca clickbait barato ni titular plano",
  "excerpt": "Resumen 160-280 chars que enganche y resuma la noticia",
  "seoDescription": "Meta description 120-155 chars, voz activa, con la entidad y 'Mundial 2026', un motivo para hacer clic. Sin 'hoy/ayer'.",
  "slug": "slug-en-minusculas-con-guiones-sin-acentos-max-70-chars",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "cat": "selecciones",
  "body": [
    { "type": "p", "text": "LEDE: responde qué pasa, quién, cuándo, dónde." },
    { "type": "p", "text": "Desarrollo con el contexto inmediato relevante." },
    { "type": "h2", "text": "Subtítulo solo si el artículo tiene secciones que lo justifiquen" },
    { "type": "p", "text": "Análisis o implicación, con información nueva." },
    { "type": "callout", "title": "Lo que viene", "text": "Cierre con la consecuencia o el próximo paso." }
  ]
}

Usa h2/list/callout solo cuando aporten estructura real. Body mínimo: lede + al menos 2 párrafos de desarrollo. Sin techo de bloques, pero cada bloque debe ganarse su sitio.`;

function buildUserMessage(draft: DraftNoticia): string {
  const sourceText = draft.body
    .filter((b) => b.type === "p")
    .map((b) => (b as { text: string }).text)
    .join("\n\n");
  return `Material fuente (proviene de "${draft.sourceName || "fuente externa"}"):

TÍTULO ORIGINAL: ${draft.title}

CONTENIDO:
${sourceText}

CATEGORÍA SUGERIDA POR HEURÍSTICA: ${draft.cat}
PAÍSES DETECTADOS: ${draft.flags.join(", ") || "ninguno"}

Reescribe esta noticia en estilo editorial ZonaMundial. Devuelve SOLO el JSON.`;
}

export async function rewriteDraft(draft: DraftNoticia): Promise<RewriteOutput | null> {
  const client = getClient();
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  let resp;
  try {
    resp = await client.messages.create({
      model,
      max_tokens: 6000, // articles 800-1100 words = ~1800-2200 tokens; 6k gives margin
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(draft) }],
    });
  } catch (err) {
    console.error("[rewriter] API error", (err as Error).message);
    return null;
  }

  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  const raw = textBlock.text.trim();
  // Strip optional ```json fences
  const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");

  let parsed: RewriteOutput;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("[rewriter] JSON parse failed", (err as Error).message, raw.slice(0, 200));
    return null;
  }

  // Sanity floor (anti-inflado: ya NO exigimos un mínimo de palabras; el
  // crítico de calidad es el gate). Solo descartamos salidas vacías o stubs
  // degenerados (sin título o con menos de 3 bloques = ni lede + 2 párrafos).
  if (!parsed.title || !parsed.body || !Array.isArray(parsed.body) || parsed.body.length < 3) {
    console.error("[rewriter] output degenerate", parsed.body?.length, "blocks");
    return null;
  }
  return parsed;
}

export interface ApplyRewriteOpts {
  /** Texto fuente original (para el crítico: juzgar precisión/anclaje). */
  sourceText?: string;
  /** Títulos ya publicados (para que el crítico detecte duplicados). */
  recentTitles?: string[];
}

/**
 * Apply LLM rewrite on top of a draft, then run the quality critic.
 * Solo se marca como "published" si el crítico aprueba (shouldPublish).
 * En caso contrario queda en "review" (no aparece en el sitio ni el sitemap).
 */
export async function applyRewrite(
  draft: DraftNoticia,
  opts: ApplyRewriteOpts = {},
): Promise<DraftNoticia> {
  const out = await rewriteDraft(draft);
  if (!out) {
    // Fallback: rewrite failed → keep stub but flag for review (NOT published)
    return { ...draft, status: "review" };
  }

  const rewritten: DraftNoticia = {
    ...draft,
    title: out.title,
    excerpt: out.excerpt,
    seoDescription: out.seoDescription,
    // Re-normalizamos SIEMPRE el slug devuelto por la IA: hubo casos en
    // que Claude devolvía slugs con "ñ" o tildes literales (ej: "españa-…")
    // y como Next.js rutea por el string exacto, esos urls daban 404
    // cuando alguien los compartía con la URL normalizada. makeSlug se
    // ocupa de NFD + strip diacritics + ñ → n + lowercase + guiones.
    slug: makeSlug(out.slug || draft.slug || out.title || draft.title),
    tags: out.tags || [],
    body: out.body,
    cat: (out.cat as NoticiaCategory) || draft.cat,
    // Estimate reading time from word count (180 wpm average)
    readTime: Math.max(
      2,
      Math.ceil(
        out.body
          .filter((b) => b.type === "p" || b.type === "h2" || b.type === "h3")
          .reduce((sum, b) => sum + ((b as { text: string }).text || "").split(/\s+/).length, 0) / 180,
      ),
    ),
    status: "review", // por defecto NO publicado; el crítico decide
  };

  // GATE de calidad: segunda llamada al modelo como editor jefe exigente.
  const verdict = await evaluateArticle({
    title: rewritten.title,
    body: rewritten.body,
    sourceText: opts.sourceText ?? sourceTextFromDraft(draft),
    recentTitles: opts.recentTitles,
  });
  rewritten.critic = verdict ?? undefined;

  if (shouldPublish(verdict)) {
    rewritten.status = "published";
  } else {
    console.warn(
      "[rewriter] critic rejected:",
      rewritten.title,
      verdict ? `(${verdict.motivos})` : "(sin veredicto)",
    );
  }
  return rewritten;
}

/** Reconstruye el texto fuente a partir de los párrafos del draft original. */
function sourceTextFromDraft(draft: DraftNoticia): string {
  return draft.body
    .filter((b) => b.type === "p")
    .map((b) => (b as { text: string }).text)
    .join("\n\n");
}

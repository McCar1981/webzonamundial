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

const SYSTEM_PROMPT = `Eres editor de la sección de noticias de fútbol de ZonaMundial, una plataforma sobre el Mundial 2026. Tu trabajo es reescribir noticias provenientes de fuentes externas en un estilo editorial propio, NUNCA copiando frases literales.

REGLAS INVIOLABLES:
1. NO inventar datos: nombres, fechas, cifras, lesiones, fichajes, declaraciones que no estén en el material fuente. Si un dato no está en la fuente, no lo escribas.
2. NO copiar frases literales de más de 6 palabras seguidas. Reescribe en estilo periodístico de calidad.
3. Tono: directo, claro, informado. Estilo The Athletic / ESPN en español.
4. Idioma: español neutro / España.
5. NUNCA inventar quotes (citas textuales). Si no hay quote en la fuente, no inventes una.
6. Devuelve SOLO un JSON válido, sin texto adicional, sin markdown, sin backticks.

EXTENSIÓN OBLIGATORIA DEL ARTÍCULO (NO NEGOCIABLE):
- Mínimo 700 palabras en total el body. Ideal: 800-1100.
- Mínimo 8 párrafos sustanciosos (cada uno 80-140 palabras).
- Mínimo 3 subtítulos H2 que organicen la lectura.
- Mínimo 1 lista con 4-6 puntos.
- Mínimo 1 callout de cierre.
- Cada párrafo debe aportar contexto adicional, análisis, comparación o consecuencia, no resumir lo mismo varias veces.
- Si el material fuente es escaso, profundiza con contexto histórico, formato del torneo, palmarés del jugador, comparación con otros mundiales, panorama de las federaciones implicadas. Pero SIN inventar datos concretos (cifras, fechas, declaraciones).

CÓMO AÑADIR PROFUNDIDAD SIN INVENTAR DATOS:
- Contextualiza con conocimiento general verificable: explica qué es el Mundial 2026, cómo funciona la fase de grupos, quiénes son los rivales del grupo, qué es el formato 48 selecciones.
- Compara con ediciones anteriores del Mundial cuando sea relevante (1986, 1994, 2002, 2010, 2014, 2018, 2022).
- Análisis táctico: si la fuente menciona un jugador, contextualiza su posición, su rol en el equipo, palmarés general.
- Implicaciones: qué pasa después, cuándo es el siguiente partido/decisión/anuncio, qué se puede esperar.
- Reacciones del entorno: aunque no haya quote textual, puedes describir el ambiente o expectativas (sin atribuir frases inventadas a personas).

Categorías permitidas (campo "cat"): "selecciones" | "analisis" | "datos" | "sedes" | "historia" | "plataforma".

ESTRUCTURA DEL JSON DE SALIDA:
{
  "title": "Titular SEO 50-90 chars, sin clickbait barato pero potente",
  "excerpt": "Resumen 200-280 chars que enganche y resuma la noticia",
  "seoDescription": "Meta description 155-160 chars optimizada para Google",
  "slug": "slug-en-minusculas-con-guiones-sin-acentos-max-70-chars",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "cat": "selecciones",
  "body": [
    { "type": "p", "text": "LEDE: 2-3 frases que respondan qué pasa, quién, cuándo, dónde. ~70 palabras." },
    { "type": "p", "text": "Segundo párrafo: amplía el contexto inmediato. ~90 palabras." },
    { "type": "h2", "text": "Subtítulo de la primera sección de desarrollo" },
    { "type": "p", "text": "Párrafo de análisis o desarrollo. ~100 palabras." },
    { "type": "p", "text": "Otro párrafo con datos o comparación histórica. ~90 palabras." },
    { "type": "list", "items": ["Punto 1 con contexto concreto", "Punto 2 con dato", "Punto 3 con consecuencia", "Punto 4"] },
    { "type": "h2", "text": "Subtítulo de la segunda sección" },
    { "type": "p", "text": "Párrafo sobre implicaciones o reacciones. ~100 palabras." },
    { "type": "p", "text": "Cierre del análisis con perspectiva a futuro. ~80 palabras." },
    { "type": "callout", "title": "Lo que viene", "text": "Cierre con próximo paso o consecuencia. 2-3 frases." }
  ]
}

REQUISITO MÍNIMO DEL BODY: 10 bloques (no menos). Idealmente 11-14 bloques. La estructura mínima es: lede(p) + p contexto + h2 + 2p + h2 + 2p + list + h2 + 2p + callout. Cuenta los bloques antes de devolver el JSON.`;

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

  // Defensive: must have at least the required fields and a substantive body.
  // Reject any rewrite shorter than 10 blocks or 600 words — those are stubs.
  if (!parsed.title || !parsed.body || !Array.isArray(parsed.body) || parsed.body.length < 10) {
    console.error("[rewriter] output too short", parsed.body?.length, "blocks");
    return null;
  }
  const wordCount = parsed.body
    .filter((b) => b.type === "p" || b.type === "h2" || b.type === "h3")
    .reduce((sum, b) => sum + ((b as { text: string }).text || "").split(/\s+/).length, 0);
  if (wordCount < 600) {
    console.error("[rewriter] body too short:", wordCount, "words");
    return null;
  }
  return parsed;
}

/** Apply LLM rewrite on top of a draft, mutating the draft fields. */
export async function applyRewrite(draft: DraftNoticia): Promise<DraftNoticia> {
  const out = await rewriteDraft(draft);
  if (!out) {
    // Fallback: rewrite failed → keep stub but flag for review (NOT published)
    return { ...draft, status: "review" };
  }
  return {
    ...draft,
    title: out.title,
    excerpt: out.excerpt,
    seoDescription: out.seoDescription,
    slug: out.slug || draft.slug,
    tags: out.tags || [],
    body: out.body,
    cat: (out.cat as NoticiaCategory) || draft.cat,
    // Auto-publish: a successful rewrite is editorial-ready and goes live
    // immediately. Failed rewrites stay at "review" and never appear in the
    // public site (filtered out in the data layer).
    status: "published",
    // Estimate reading time from word count (180 wpm average)
    readTime: Math.max(
      3,
      Math.ceil(
        out.body
          .filter((b) => b.type === "p" || b.type === "h2" || b.type === "h3")
          .reduce((sum, b) => sum + ((b as { text: string }).text || "").split(/\s+/).length, 0) / 180,
      ),
    ),
  };
}

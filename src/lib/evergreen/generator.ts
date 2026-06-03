// src/lib/evergreen/generator.ts
//
// Track B — Redactor de contenido perenne. Recibe un DOSSIER de datos
// verificados (dossier.ts) y produce un BlogPost. NO inventa: solo puede usar
// hechos del dossier + conocimiento general no controvertido (historia del
// fútbol). La pieza se gatea con el MISMO crítico (Fase 1) en el endpoint.
//
// Filosofía idéntica al rewriter de noticias: densidad, no relleno; sin
// mínimo de palabras; marca/legal (sin marcas FIFA, sin apuestas).

import Anthropic from "@anthropic-ai/sdk";
import type { BlogPost, BlogBlock, BlogCategory } from "@/lib/blog/types";
import type { DossierResult } from "./dossier";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

const SYSTEM_PROMPT = `Eres redactor analítico del blog de ZonaMundial (plataforma sobre el Mundial 2026). Escribes piezas PERENNES (previas de grupo, guías de selección) fundamentadas en datos. Recibes un DOSSIER de datos verificados y solo puedes usar ESOS datos.

REGLAS INVIOLABLES:
1. NO inventes NADA: ni cifras, ni fechas, ni nombres, ni resultados que no estén en el dossier. El conocimiento general de historia del fútbol (campeones pasados, formato) sí es válido si es incontrovertible.
2. Si el dossier no trae un dato, NO lo afirmes. Mejor omitir que inventar.
2b. SEDES Y ESTADIOS: usa EXCLUSIVAMENTE la sede/estadio/ciudad que aparece en el CALENDARIO del dossier para cada partido. NUNCA asignes un estadio de memoria (p. ej. NO escribas "MetLife", "Azteca", etc. salvo que el dossier lo diga literalmente para ESE partido). Si el calendario no da sede, NO menciones estadio.
2c. PARTICIPACIONES / Nº DE MUNDIALES / PALMARÉS: usa el número exacto del dossier. No deduzcas "primera/segunda participación", "regreso tras X años" ni rachas históricas que no estén escritas en el dossier.
3. Reescribe con tu estilo; NO copies literal el "análisis editorial de referencia" del dossier (evita contenido duplicado con otras páginas del sitio).
4. Tono: directo, informado, serio (estilo The Athletic / Marca / ESPN en español de España).
5. MARCA Y LEGAL: no uses marcas registradas de FIFA ("FIFA World Cup", "Copa Mundial de la FIFA"); di "Mundial 2026". Nada de lenguaje de apuestas (cuotas, casas) — usa "pronóstico", "predicción" o "favoritos".
6. NUNCA inventes quotes.
7. Devuelve SOLO un JSON válido, sin markdown ni backticks.

LONGITUD = PROPORCIONAL A LA SUSTANCIA (ANTI-INFLADO):
- NO hay mínimo de palabras. La longitud la marca cuántos datos reales tienes.
- PROHIBIDO rellenar con generalidades o frases vacías para alargar. Cada bloque aporta algo nuevo.
- Aprovecha tablas/stats para presentar rankings, calendario y forma reciente de forma densa.

CATEGORÍAS PERMITIDAS (campo "category"): "analisis" | "selecciones" | "sedes" | "datos" | "historia" | "guia"

ESTRUCTURA JSON DE SALIDA (mapea a BlogPost):
{
  "slug": "kebab-case-sin-acentos",
  "title": "55-90 chars, gancho sin clickbait",
  "description": "meta description 120-160 chars",
  "dek": "subtítulo 120-200 chars",
  "category": "analisis",
  "keywords": ["...", "..."],
  "tags": ["...", "..."],
  "readingTime": 5,
  "body": [ { "type": "p", "text": "..." }, { "type": "h2", "text": "..." }, { "type": "table", "headers": ["...","..."], "rows": [["...","..."]] } ],
  "faq": [ { "q": "...", "a": "..." } ]
}

TIPOS DE BLOQUE: p, h2, h3, ul {items}, ol {items}, callout {variant gold|blue|warning, title, text}, stat {items:[{value,label,sub}]}, table {caption?, headers, rows}, quote {text, cite?}, divider.`;

function clean(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function slugify(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/**
 * Genera un BlogPost perenne a partir de un dossier. Devuelve el post SIN
 * gatear (el endpoint corre el crítico). null si falla la generación/parseo.
 */
export async function buildEvergreenPost(args: {
  dossier: DossierResult;
  category: BlogCategory;
  ogImage?: string;
}): Promise<BlogPost | null> {
  const angle =
    args.category === "selecciones"
      ? `ÁNGULO — GUÍA MONOGRÁFICA DE UNA SELECCIÓN (NO es una previa de grupo):
- El foco es el RETRATO PROFUNDO de ESTA única selección, no su grupo. PROHIBIDO estructurarla como previa de grupo: NADA de "los favoritos del grupo", "el partido estrella del grupo", ni comparar/repasar a los otros 3 rivales del grupo. Si mencionas el grupo, que sea de pasada para situar.
- Construye la pieza con la SUSTANCIA ÚNICA del dossier que una previa de grupo NO tiene: su recorrido Mundial a Mundial (historia), sus récords históricos, sus partidos icónicos, su palmarés, el camino a la clasificación 2026, el plantel y XI probables, el estilo de juego y fortalezas/debilidades, el jugador clave (factor X), y la cultura de afición (estadio, rival histórico, cánticos, curiosidades).
- Estructura sugerida (adáptala): historia y palmarés → momentos que marcaron a la selección → cómo llega a 2026 (clasificación, estado de forma) → plantel, entrenador y XI probable → estilo, fortalezas y debilidades → qué esperar / factor X → identidad y afición. El calendario va al final y breve.
- Aprovecha tablas para el recorrido Mundial a Mundial y la convocatoria probable.`
      : `ÁNGULO — PREVIA DE GRUPO:
- Repasa las 4 selecciones del grupo, el calendario completo, los favoritos, el debutante/sorpresa, el partido estrella y un pronóstico razonado.
- Las sedes/estadios deben copiarse LITERALMENTE del calendario del dossier (no los pongas de memoria).`;

  const userPrompt = `DOSSIER (única fuente de datos permitida):

${args.dossier.dossier}

---
${angle}

---
Título orientativo: "${args.dossier.title}"
Slug sugerido: "${args.dossier.slug}"
Categoría: "${args.category}"

Escribe la pieza siguiendo el esquema JSON del system prompt, usando SOLO los datos del dossier. Recuerda: las sedes/estadios deben copiarse LITERALMENTE del calendario del dossier (no los pongas de memoria) y las participaciones/cifras deben coincidir EXACTAMENTE con el dossier. Devuelve solo el JSON.`;

  let raw = "";
  try {
    const client = getClient();
    const resp = await client.messages.create({
      model: process.env.BLOG_GENERATOR_MODEL || DEFAULT_MODEL,
      max_tokens: 6000,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = resp.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return null;
    raw = block.text.trim();
  } catch (err) {
    console.error("[evergreen/generator] anthropic call failed:", (err as Error).message);
    return null;
  }

  let parsed: Partial<BlogPost> & { body?: BlogBlock[] };
  try {
    parsed = JSON.parse(clean(raw));
  } catch (err) {
    console.error("[evergreen/generator] JSON parse failed:", (err as Error).message);
    return null;
  }

  if (
    !parsed.title ||
    !parsed.description ||
    !parsed.dek ||
    !Array.isArray(parsed.body) ||
    parsed.body.length < 3
  ) {
    console.error("[evergreen/generator] missing required fields or empty body");
    return null;
  }

  const slug = slugify(parsed.slug || args.dossier.slug) || args.dossier.slug;

  const wordCount = parsed.body.reduce((acc, b) => {
    if (b.type === "p" || b.type === "h2" || b.type === "h3" || b.type === "quote") {
      return acc + ((b as { text?: string }).text || "").split(/\s+/).length;
    }
    if (b.type === "ul" || b.type === "ol") {
      return acc + (b.items || []).join(" ").split(/\s+/).length;
    }
    return acc;
  }, 0);

  const post: BlogPost = {
    slug,
    title: String(parsed.title).slice(0, 120),
    description: String(parsed.description).slice(0, 200),
    dek: String(parsed.dek).slice(0, 280),
    ogImage:
      parsed.ogImage && parsed.ogImage.startsWith("/")
        ? parsed.ogImage
        : args.ogImage || "/img/blog/placeholder-zm.jpg",
    category: args.category,
    keywords: Array.isArray(parsed.keywords)
      ? (parsed.keywords as string[]).slice(0, 12).map(String)
      : [],
    tags: Array.isArray(parsed.tags)
      ? (parsed.tags as string[]).slice(0, 6).map(String)
      : [],
    publishedAt: new Date().toISOString(),
    readingTime: Math.max(3, Math.round(wordCount / 220)),
    body: parsed.body as BlogBlock[],
    faq: Array.isArray(parsed.faq)
      ? (parsed.faq as Array<{ q: string; a: string }>).slice(0, 8)
      : undefined,
    evergreen: true,
  };

  return post;
}

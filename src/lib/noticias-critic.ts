/**
 * Editorial quality critic (Fase 1).
 *
 * Second LLM pass that acts as a demanding editor-in-chief. It scores a
 * rewritten article against a strict rubric and returns a verdict. An article
 * is published ONLY if it clears the bar; otherwise it is held (status
 * "review") and never reaches the public site or the sitemap.
 *
 * The critic is the GATE: length is no longer a proxy for value. A short,
 * dense, accurate piece passes; a long, padded, or off-topic one fails.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { NoticiaBlock } from "@/data/noticias";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export interface CriticVerdict {
  relevancia: number; // 0-5
  originalidad_valor: number; // 0-5
  profundidad: number; // 0-5
  precision_factual: number; // 0-5
  utilidad_lector: number; // 0-5
  es_duplicado: boolean;
  publicar: boolean; // veredicto del modelo (asesor)
  motivos: string;
}

/**
 * Umbral de publicación. Configurable vía env para poder subir el listón
 * durante la revisión de AdSense y relajarlo tras la aprobación.
 *  - Ninguna dimensión CRÍTICA (relevancia, originalidad, precisión) < MIN_CRITICA.
 *  - Media global >= MIN_MEDIA.
 *  - No duplicado.
 */
export const CRITIC_MIN_CRITICA = Number(process.env.NEWS_CRITIC_MIN_CRITICA ?? 3);
// Bajado 3.5 → 3.0: el Free de GNews trunca el texto fuente, lo que penaliza la
// "profundidad" aunque la noticia sea legítima. Con 3.0 pasan noticias reales
// que caían por una décima (p.ej. "Brasil sin Neymar") sin abrir la puerta a la
// paja: el gate de dimensiones críticas (>=3 en relevancia/originalidad/precisión)
// sigue tumbando off-topic y refritos con errores factuales.
export const CRITIC_MIN_MEDIA = Number(process.env.NEWS_CRITIC_MIN_MEDIA ?? 3.0);

const SYSTEM_PROMPT = `Eres el editor jefe de la sección de noticias de fútbol de ZonaMundial (plataforma sobre el Mundial 2026). Eres EXIGENTE: tu trabajo es proteger la calidad del sitio, que está bajo revisión de Google AdSense y no puede publicar contenido de poco valor. Ante la duda, RECHAZA.

Recibes un artículo ya redactado + el material fuente del que salió. Puntúa cada dimensión de 0 a 5 y decide si se publica.

DIMENSIONES:
1. relevancia — ¿es un tema de fútbol / Mundial 2026 genuinamente noticiable? Off-topic, tangencial, sensacionalista o clickbait => 0-2.
2. originalidad_valor — ¿aporta análisis, contexto o perspectiva propia, o solo reformula un titular? Refrito => 0-2.
3. profundidad — ¿tiene sustancia (datos, contexto, implicaciones)? OJO: longitud NO es valor. Un texto largo y relleno (paja para alcanzar un mínimo de palabras) es PEOR que uno corto y denso => penaliza el relleno.
4. precision_factual — ¿los hechos, cifras y fechas provienen de la fuente y son verificables, o hay datos que parecen inventados/no respaldados? Si detectas datos sin respaldo en la fuente => 0-2. Esta dimensión es un GATE.
5. utilidad_lector — ¿un aficionado sale sabiendo algo nuevo y útil?

es_duplicado — true si el artículo cuenta esencialmente la MISMA noticia/ángulo que alguno de los títulos recientes que te paso.

Devuelve SOLO un JSON válido, sin markdown ni backticks:
{
  "relevancia": 0-5,
  "originalidad_valor": 0-5,
  "profundidad": 0-5,
  "precision_factual": 0-5,
  "utilidad_lector": 0-5,
  "es_duplicado": true|false,
  "publicar": true|false,
  "motivos": "1-2 frases concretas"
}`;

function blocksToText(body: NoticiaBlock[]): string {
  return body
    .map((b) => {
      if (b.type === "p" || b.type === "h2" || b.type === "h3") return (b as { text: string }).text;
      if (b.type === "quote") return `"${(b as { text: string }).text}"`;
      if (b.type === "list") return (b as { items: string[] }).items.map((i) => `- ${i}`).join("\n");
      if (b.type === "callout") {
        const c = b as { title?: string; text: string };
        return `${c.title ? c.title + ": " : ""}${c.text}`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

export interface EvaluateArgs {
  title: string;
  body: NoticiaBlock[];
  /** Texto fuente original (para juzgar precisión/anclaje). */
  sourceText?: string;
  /** Títulos ya publicados recientemente (para detectar duplicado). */
  recentTitles?: string[];
}

/** Llama al crítico y devuelve el veredicto, o null si falla la llamada/parseo. */
export async function evaluateArticle(args: EvaluateArgs): Promise<CriticVerdict | null> {
  const client = getClient();
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const userMsg = `ARTÍCULO A EVALUAR
Título: ${args.title}

Cuerpo:
${blocksToText(args.body)}

---
MATERIAL FUENTE (para verificar precisión; el artículo NO debe afirmar datos que no estén aquí o que no sean conocimiento general verificable):
${args.sourceText?.trim() || "(no disponible)"}

---
TÍTULOS RECIENTES YA PUBLICADOS (para detectar duplicado):
${(args.recentTitles ?? []).slice(0, 30).map((t) => `- ${t}`).join("\n") || "(ninguno)"}

Evalúa y devuelve SOLO el JSON.`;

  let resp;
  try {
    resp = await client.messages.create({
      model,
      max_tokens: 600,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    });
  } catch (err) {
    console.error("[critic] API error", (err as Error).message);
    return null;
  }

  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;
  const cleaned = textBlock.text.trim().replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  try {
    const v = JSON.parse(cleaned) as CriticVerdict;
    return v;
  } catch (err) {
    console.error("[critic] JSON parse failed", (err as Error).message, cleaned.slice(0, 160));
    return null;
  }
}

/**
 * Regla de publicación (fuente de verdad, no el `publicar` del modelo):
 *  - relevancia, originalidad_valor y precision_factual >= CRITIC_MIN_CRITICA
 *  - media de las 5 dimensiones >= CRITIC_MIN_MEDIA
 *  - no es duplicado
 * Si el crítico no devolvió veredicto (null), NO se publica.
 */
export function shouldPublish(v: CriticVerdict | null): boolean {
  if (!v) return false;
  if (v.es_duplicado) return false;
  const critical = [v.relevancia, v.originalidad_valor, v.precision_factual];
  if (critical.some((s) => typeof s !== "number" || s < CRITIC_MIN_CRITICA)) return false;
  const dims = [v.relevancia, v.originalidad_valor, v.profundidad, v.precision_factual, v.utilidad_lector];
  if (dims.some((s) => typeof s !== "number")) return false;
  const avg = dims.reduce((a, b) => a + b, 0) / dims.length;
  return avg >= CRITIC_MIN_MEDIA;
}

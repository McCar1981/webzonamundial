// src/lib/modo-carrera/narrative-generator.ts
//
// Generador de narrativa con Claude (SOLO SERVIDOR). Sigue el patrón de los
// clientes de IA Coach (lib/ia-coach/*-client.ts): cliente perezoso, modelo por
// env, parseo de JSON. Ante CUALQUIER fallo (sin API key, error de red, JSON
// inválido) recurre a templateEntry() — la narrativa nunca se rompe.

import Anthropic from "@anthropic-ai/sdk";
import type { NarrativeEntry, NarrativeKind } from "./types";
import { templateEntry, narrativeId, type NarrativeContext } from "./narrative";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 700;

// Ids canónicos de las opciones de rueda de prensa, en orden. Deben coincidir con
// las claves de DECISION_EFFECTS (engine.ts) para que la decisión tenga efecto.
const DECISION_IDS = ["calma", "ambicion", "cantera"] as const;

let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null; // best-effort: sin key, se usan plantillas
  _client = new Anthropic({ apiKey });
  return _client;
}

const SYSTEM_PROMPT = `Eres el NARRADOR del Modo Carrera de ZonaMundial, un juego tipo FIFA donde el usuario es el director técnico (DT) de una selección nacional.

Tu trabajo: generar un momento de narrativa breve, cinematográfico y en ESPAÑOL para la carrera del DT.

Reglas estrictas:
- Texto en español, tono de relator deportivo premium.
- NO inventes resultados concretos (marcadores, goles, fechas). Habla de ambiente, presión, ilusión, progreso.
- Menciona de forma natural el nombre del DT y/o su selección.
- "titular": una sola frase impactante estilo portada de periódico (máx 120 caracteres), entre comillas.
- "briefing": 1-2 frases (máx 320 caracteres) sobre el trabajo de la semana.
- "rueda_prensa": una pregunta de un periodista (máx 240 caracteres) y SIEMPRE 3 opciones de respuesta breves para que el DT elija, cada una con un "effect" descriptivo corto (sin números).
- Devuelve ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin markdown.

Formato JSON:
{"body": "texto", "choices": null}
Para rueda_prensa:
{"body": "pregunta", "choices": [{"id":"a","label":"respuesta","effect":"consecuencia"}, ...]}`;

/**
 * Neutraliza intentos de prompt injection en campos controlados por el usuario
 * (sobre todo el nombre del DT): elimina saltos de línea y caracteres de
 * estructura/control que permitirían "escapar" del mensaje y dictar
 * instrucciones al modelo, y acota la longitud.
 */
function sanitize(v: unknown, max = 60): string {
  return String(v ?? "")
    .replace(/[\r\n\t`{}<>]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, max);
}

/** Entero acotado para los campos numéricos del contexto (defensa en profundidad). */
function safeInt(v: unknown, lo: number, hi: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function buildUserMessage(kind: NarrativeKind, c: NarrativeContext): string {
  return `Genera una entrada de tipo "${kind}".
DT: ${sanitize(c.dtName, 40)}
Selección: ${sanitize(c.nationName, 40)}
Filosofía: ${sanitize(c.philosophyName, 40)}
Overall: ${safeInt(c.overall, 0, 99)}/99 · Temporada: ${safeInt(c.season, 1, 999)}
Moral del vestuario: ${safeInt(c.morale, 0, 100)}/100 · Reputación total: ${safeInt(c.reputationTotal, 0, 600)}

Devuelve SOLO el JSON.`;
}

function extractJSON(raw: string): string | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  return raw.slice(start, end + 1);
}

interface ParsedNarrative {
  body?: unknown;
  choices?: unknown;
}

function coerceChoices(raw: unknown): NarrativeEntry["choices"] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = raw
    .map((ch, i) => {
      if (!ch || typeof ch !== "object") return null;
      const o = ch as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (!label) return null;
      const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : `op${i + 1}`;
      const effect = typeof o.effect === "string" ? o.effect.trim() : "";
      return { id, label: label.slice(0, 160), effect: effect.slice(0, 160) };
    })
    .filter((x): x is { id: string; label: string; effect: string } => x !== null);
  return out.length > 0 ? out : undefined;
}

/**
 * Genera una entrada de narrativa con Claude. Si no hay API key, o la llamada o
 * el parseo fallan, devuelve la versión por PLANTILLA (mismo tipo y contexto).
 */
export async function generateNarrative(kind: NarrativeKind, c: NarrativeContext): Promise<NarrativeEntry> {
  const client = getClient();
  if (!client) return templateEntry(kind, c);

  const model = process.env.ANTHROPIC_MODEL_NARRATIVE || DEFAULT_MODEL;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0.9,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(kind, c) }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return templateEntry(kind, c);

    const json = extractJSON(block.text.trim());
    if (!json) return templateEntry(kind, c);

    const parsed = JSON.parse(json) as ParsedNarrative;
    const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
    if (!body) return templateEntry(kind, c);

    let choices = kind === "rueda_prensa" ? coerceChoices(parsed.choices) : undefined;
    // Una rueda de prensa sin opciones válidas no sirve: cae a plantilla.
    if (kind === "rueda_prensa" && !choices) return templateEntry(kind, c);
    // La IA inventa ids arbitrarios ("a"/"op1"...) que NO casan con DECISION_EFFECTS
    // (calma/ambicion/cantera). Reasignamos los ids canónicos por posición para que
    // la decisión del jugador aplique sus efectos reales sobre moral/reputación.
    if (kind === "rueda_prensa" && choices) {
      if (choices.length < DECISION_IDS.length) return templateEntry(kind, c);
      choices = choices
        .slice(0, DECISION_IDS.length)
        .map((ch, i) => ({ ...ch, id: DECISION_IDS[i] }));
    }

    return {
      id: narrativeId(kind),
      kind,
      body: body.slice(0, 500),
      createdAt: new Date().toISOString(),
      chosen: null,
      ...(choices ? { choices } : {}),
    };
  } catch (err) {
    console.error("[modo-carrera/narrative] generación IA falló:", (err as Error).message);
    return templateEntry(kind, c);
  }
}

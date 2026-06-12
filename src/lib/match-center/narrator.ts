// src/lib/match-center/narrator.ts
//
// Locución del partido. Dos niveles:
//   1. templateNarration(): narración inmediata por plantillas (cero latencia,
//      cero coste). Siempre disponible, también como fallback.
//   2. aiNarrateBatch(): mejora la locución con Claude (estilo relator), en una
//      sola llamada por lote de eventos. Best-effort: si falla, se usan
//      plantillas.
//
// La capa de VOZ (TTS) vive en el cliente; aquí solo producimos TEXTO.

import Anthropic from "@anthropic-ai/sdk";
import { kv } from "@/lib/kv";
import {
  teamName,
  templateNarration,
  playersOnPitchByEvent,
  numericalSituation,
} from "./templates";
import type { MatchEvent, MatchMeta } from "./types";

// Las plantillas viven en ./templates (módulo sin deps de servidor, importable
// desde el cliente). Se reexportan para no romper a los consumidores actuales.
export { templateNarration } from "./templates";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

// Caché de locución IA por partido (hash eventId -> frase). Permite narrar cada
// evento UNA sola vez (la genera el cron) y servirla a todos los visitantes.
const LIVENARR_PREFIX = "mc:livenarr:v1:";
const LIVENARR_TTL = 6 * 60 * 60; // un partido entero con margen

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _client = new Anthropic({ apiKey: key });
  return _client;
}

const SYSTEM_PROMPT = `Eres el relator de fútbol de ZonaMundial para el Mundial 2026. Narras en español neutro, con la energía de un relator profesional (estilo Martín Souto), pero SIN exagerar ni inventar datos.

Recibes una lista de eventos de un partido (con minuto, tipo, equipo y jugador) y devuelves UNA frase de locución por evento, vibrante y natural para leer en voz alta.

REGLAS:
- Una frase por evento, máximo ~140 caracteres. Pensada para TTS (sin emojis, sin abreviaturas raras, sin paréntesis).
- En los goles, sube la emoción ("¡GOOOL!"). En faltas/tarjetas, tono informativo.
- No inventes nombres ni estadísticas que no estén en el evento.
- Usa los nombres de equipo y jugador EXACTAMENTE como vienen.
- EXPULSIONES (type "red" o "second_yellow"): si el evento trae el campo "situacion", DEBES reflejar ESA situación numérica exacta (p. ej. "se quedan diez contra diez, igualdad" si ambos van con uno menos). NUNCA digas que un equipo juega "con un hombre más" salvo que la "situacion" lo indique: el rival puede llevar ya sus propias expulsiones.
- Devuelve SOLO un JSON: { "lines": { "<eventId>": "<frase>", ... } }`;

interface RawNarration {
  lines?: Record<string, unknown>;
}

/**
 * Mejora la locución de un lote de eventos con Claude. Devuelve un mapa
 * eventId -> texto. Para los eventos que el modelo no cubra (o si falla la
 * llamada), el llamador debe completar con templateNarration().
 */
export async function aiNarrateBatch(
  events: MatchEvent[],
  meta: MatchMeta,
  context?: Record<string, string>,
): Promise<Record<string, string>> {
  const client = getClient();
  if (!client || events.length === 0) return {};

  const model = process.env.ANTHROPIC_MODEL_NARRATOR || DEFAULT_MODEL;
  const compact = events.map((e) => ({
    id: e.id,
    min: e.minute,
    type: e.type,
    team: teamName(meta, e.side) ? teamName(meta, e.side) : "neutral",
    player: e.player || null,
    assist: e.assist || null,
    in: e.playerIn || null,
    detail: e.detail || null,
    // Situación numérica REAL tras una expulsión (cuando aplica), para que la
    // IA no asuma superioridad del rival si este ya iba con expulsados.
    situacion: context?.[e.id] || null,
  }));

  const userMessage = `Partido: ${meta.home.name} vs ${meta.away.name} (${meta.phase}, ${meta.venue}).
Eventos a narrar (JSON):
${JSON.stringify(compact)}

Devuelve SOLO el JSON con "lines".`;

  let resp;
  try {
    resp = await client.messages.create({
      model,
      max_tokens: 2200,
      temperature: 0.9,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    console.error("[mc-narrator] API error", (err as Error).message);
    return {};
  }

  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return {};
  const raw = block.text.trim().replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  let parsed: RawNarration;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed.lines || typeof parsed.lines !== "object") return {};

  const out: Record<string, string> = {};
  for (const [id, val] of Object.entries(parsed.lines)) {
    if (typeof val === "string" && val.trim()) {
      out[id] = val.trim().slice(0, 200);
    }
  }
  return out;
}

/** Contexto de situación numérica por evento (solo expulsiones). DEBE computarse
 *  desde la lista COMPLETA de eventos del partido para que la cuenta de
 *  jugadores sea real, aunque luego solo se narre un subconjunto: contar sobre
 *  un lote parcial haría que una expulsión previa "invisible" volviera a leerse
 *  como superioridad del rival. */
export function numericalContext(
  events: MatchEvent[],
  meta: MatchMeta,
): Record<string, string> {
  const counts = playersOnPitchByEvent(events);
  const ctx: Record<string, string> = {};
  for (const e of events) {
    const c = counts[e.id];
    if (c) ctx[e.id] = numericalSituation(meta, c.home, c.away);
  }
  return ctx;
}

/**
 * Construye narración completa: IA donde se pueda, plantilla en el resto.
 * `contextEvents` (opcional) es el HISTORIAL COMPLETO del partido para el
 * conteo numérico de expulsiones; si no se pasa, se usa `events` (válido solo
 * cuando `events` ya es el partido entero).
 */
export async function narrateAll(
  events: MatchEvent[],
  meta: MatchMeta,
  useAI: boolean,
  contextEvents?: MatchEvent[],
): Promise<Record<string, string>> {
  const base: Record<string, string> = {};
  for (const e of events) base[e.id] = templateNarration(e, meta);
  if (!useAI) return base;
  const ai = await aiNarrateBatch(
    events,
    meta,
    numericalContext(contextEvents ?? events, meta),
  );
  return { ...base, ...ai };
}

/**
 * Narración para snapshots EN VIVO, sin coste repetido y sin bloquear al
 * visitante:
 *   - Base: plantilla para TODOS los eventos (cero latencia, nunca mudo).
 *   - Overlay: frases IA ya cacheadas en KV (las escribió una pasada anterior).
 *   - Con ai=true (solo el CRON), narra ÚNICAMENTE los eventos sin frase
 *     cacheada y persiste el resultado — cada evento se paga una sola vez.
 * El endpoint /live debe llamar con ai=false: nunca espera a la IA.
 */
export async function liveNarration(
  events: MatchEvent[],
  meta: MatchMeta,
  matchId: number,
  opts: { ai: boolean },
): Promise<Record<string, string>> {
  const lines: Record<string, string> = {};
  for (const e of events) lines[e.id] = templateNarration(e, meta);
  if (events.length === 0) return lines;

  const cacheKey = `${LIVENARR_PREFIX}${matchId}`;
  let cached: Record<string, string> = {};
  if (kvEnabled()) {
    try {
      cached = (await kv.get<Record<string, string>>(cacheKey)) ?? {};
    } catch {
      cached = {};
    }
  }
  for (const [id, text] of Object.entries(cached)) {
    if (lines[id]) lines[id] = text;
  }
  if (!opts.ai) return lines;

  const pending = events.filter((e) => !cached[e.id]);
  if (pending.length === 0) return lines;
  try {
    // Contexto numérico desde TODOS los eventos (no solo los pendientes), para
    // que la cuenta de expulsados/jugadores sea correcta.
    const ai = await aiNarrateBatch(pending, meta, numericalContext(events, meta));
    if (Object.keys(ai).length > 0) {
      Object.assign(lines, ai);
      if (kvEnabled()) {
        await kv.set(cacheKey, { ...cached, ...ai }, { ex: LIVENARR_TTL });
      }
    }
  } catch {
    /* plantillas ya puestas */
  }
  return lines;
}

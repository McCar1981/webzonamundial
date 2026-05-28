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
import type { MatchEvent, MatchMeta } from "./types";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

function teamName(meta: MatchMeta, side: MatchEvent["side"]): string {
  if (side === "home") return meta.home.name;
  if (side === "away") return meta.away.name;
  return "";
}

function who(e: MatchEvent): string {
  return e.player ? e.player : "el equipo";
}

/** Narración por plantilla. Siempre devuelve algo. */
export function templateNarration(e: MatchEvent, meta: MatchMeta): string {
  const team = teamName(meta, e.side);
  const min = `'${e.minute}`;
  switch (e.type) {
    case "kickoff":
      return `¡Rueda el balón! Arranca ${meta.home.name} contra ${meta.away.name}.`;
    case "goal":
      return `¡GOOOOL de ${team}! ${who(e)} la manda al fondo${e.assist ? `, tras asistencia de ${e.assist}` : ""}. ${min}.`;
    case "penalty_goal":
      return `¡GOL de penalti! ${who(e)} no perdona desde los once metros para ${team}. ${min}.`;
    case "own_goal":
      return `¡Gol en propia puerta! Desafortunado ${who(e)}, sube al marcador para ${team}. ${min}.`;
    case "penalty_miss":
      return `¡La falló! ${who(e)} desperdicia el penalti. Sigue todo igual. ${min}.`;
    case "yellow":
      return `Tarjeta amarilla para ${who(e)} de ${team}. ${e.detail || "Falta táctica"}. ${min}.`;
    case "second_yellow":
      return `¡Segunda amarilla! ${who(e)} se va a la ducha, ${team} con uno menos. ${min}.`;
    case "red":
      return `¡Roja directa! ${who(e)} deja a ${team} en inferioridad. ${min}.`;
    case "sub":
      return `Cambio en ${team}: entra ${e.playerIn || "un refresco"} por ${who(e)}. ${min}.`;
    case "var":
      return `El árbitro va al VAR... revisión en marcha. ${min}.`;
    case "corner":
      return `Saque de esquina para ${team}. Oportunidad de peligro. ${min}.`;
    case "shot_on":
      return `¡Remate de ${who(e)}! ${team} avisa, atento el portero. ${min}.`;
    case "shot":
      return `Disparo de ${team}, se va desviado por poco. ${min}.`;
    case "save":
      return `¡Paradón! El meta salva a su equipo ante ${team}. ${min}.`;
    case "offside":
      return `Fuera de juego de ${team}. Se anula la jugada. ${min}.`;
    case "injury":
      return `Atención médica sobre el césped para ${who(e)}. ${min}.`;
    case "chance":
      return `¡Qué ocasión de ${team}! Estuvo cerquísima. ${min}.`;
    case "half_time":
      return `Final del primer tiempo. ${meta.home.name} ${meta.away.name} se van al descanso.`;
    case "full_time":
      return `¡Final del partido! Se acabó en ${meta.venue}.`;
    default:
      return `${team} ${min}.`;
  }
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

/** Construye narración completa: IA donde se pueda, plantilla en el resto. */
export async function narrateAll(
  events: MatchEvent[],
  meta: MatchMeta,
  useAI: boolean,
): Promise<Record<string, string>> {
  const base: Record<string, string> = {};
  for (const e of events) base[e.id] = templateNarration(e, meta);
  if (!useAI) return base;
  const ai = await aiNarrateBatch(events, meta);
  return { ...base, ...ai };
}

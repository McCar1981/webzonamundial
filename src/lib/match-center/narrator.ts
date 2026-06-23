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
  beneficiarySide,
} from "./templates";
import type { MatchEvent, MatchMeta } from "./types";

// Las plantillas viven en ./templates (módulo sin deps de servidor, importable
// desde el cliente). Se reexportan para no romper a los consumidores actuales.
export { templateNarration } from "./templates";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

// Caché de locución IA por partido (hash eventId -> frase). Permite narrar cada
// evento UNA sola vez (la genera el cron) y servirla a todos los visitantes.
// v2: invalida la narración cacheada (la v1 podía decir "abre el marcador" en
// goles posteriores o dar ventaja al equipo de un autogol) → re-narra corregido.
const LIVENARR_PREFIX = "mc:livenarr:v2:";
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
- AUTOGOL (type "own_goal"): el gol cuenta SIEMPRE para el RIVAL del jugador. Quien se adelanta o suma es el equipo del campo "subeMarcadorPara"; NUNCA digas que el equipo del jugador ("team") se pone en ventaja, aunque sea quien la manda a su propia puerta.
- GOLES (type "goal", "penalty_goal", "own_goal"): te doy el campo "marcador" con el RESULTADO TRAS el gol, a quién beneficia y si abre o no el marcador. DEBES respetarlo:
  · Di "abre el marcador" o "inaugura el marcador" SOLO si el "marcador" indica que ESTE abre el marcador (1-0 o 0-1). Si NO es el primer gol del partido, está PROHIBIDO decir que abre o inaugura el marcador.
  · NO digas que un equipo "se pone en ventaja" o "se adelanta" si NO queda por delante tras el gol: usa lo que diga el "marcador" (amplía, empata, recorta, sentencia).
  · Puedes citar el resultado real ("pone el 3 a 0", "amplía a cuatro").
- Devuelve SOLO un JSON: { "lines": { "<eventId>": "<frase>", ... } }`;

interface RawNarration {
  lines?: Record<string, unknown>;
}

const GOAL_TYPES = new Set<MatchEvent["type"]>(["goal", "penalty_goal", "own_goal"]);

/** Contexto por evento para el narrador IA. */
export interface EventContext {
  /** Situación numérica tras una expulsión (solo rojas). */
  situacion?: string;
  /** Resultado y encuadre TRAS un gol (solo goles). */
  marcador?: string;
  /** ¿Este gol ABRE el marcador (es el primero del partido)? — guard. */
  first?: boolean;
  /** ¿El equipo beneficiado queda POR DELANTE tras el gol? — guard. */
  benAhead?: boolean;
}

/**
 * Mejora la locución de un lote de eventos con Claude. Devuelve un mapa
 * eventId -> texto. Para los eventos que el modelo no cubra (o si falla la
 * llamada), el llamador debe completar con templateNarration().
 */
export async function aiNarrateBatch(
  events: MatchEvent[],
  meta: MatchMeta,
  context?: Record<string, EventContext>,
): Promise<Record<string, string>> {
  const client = getClient();
  if (!client || events.length === 0) return {};

  const model = process.env.ANTHROPIC_MODEL_NARRATOR || DEFAULT_MODEL;
  const compact = events.map((e) => {
    const row: Record<string, unknown> = {
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
      situacion: context?.[e.id]?.situacion || null,
    };
    // GOL: marcador TRAS el gol + encuadre (abre/amplía/empata/recorta), para
    // que la IA NO diga "abre el marcador" en el 3er gol ni "se pone en ventaja"
    // a quien va perdiendo.
    if (GOAL_TYPES.has(e.type)) row.marcador = context?.[e.id]?.marcador || null;
    // AUTOGOL: el gol sube al marcador del RIVAL. Se lo decimos explícito a la
    // IA para que NUNCA atribuya la ventaja al equipo del jugador.
    if (e.type === "own_goal") {
      row.subeMarcadorPara = teamName(meta, beneficiarySide(e)) || "el rival";
    }
    return row;
  });

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
    if (typeof val !== "string" || !val.trim()) continue;
    const line = val.trim().slice(0, 200);
    // Guarda determinista para GOLES: si la IA ignora el "marcador" y dice "abre
    // el marcador" cuando NO es el primer gol, o "se pone en ventaja" a quien NO
    // queda por delante (o atribuye un autogol al equipo del jugador), se
    // descarta la frase → el llamador cae a la plantilla (neutra y correcta).
    const ev = events.find((e) => e.id === id);
    const gc = context?.[id];
    if (ev && gc && GOAL_TYPES.has(ev.type)) {
      const low = line.toLowerCase();
      const saysOpener = /(abre|inaugura|estrena)\s+(el|la)\s+(marcador|lata|cuenta)|primer (gol|tanto)|adelanta el marcador/.test(low);
      const saysLead = /se pone (en ventaja|por delante|por encima)|toma la delantera|pone por delante|se adelanta/.test(low);
      const playerTeam = (teamName(meta, ev.side) || "").toLowerCase();
      const ogWrongTeam = ev.type === "own_goal" && !!playerTeam && low.includes(playerTeam)
        && /(ventaja|adelanta|por delante|delantera)/.test(low);
      if ((saysOpener && gc.first === false) || (saysLead && gc.benAhead === false) || ogWrongTeam) {
        continue;
      }
    }
    out[id] = line;
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

/** Marcador acumulado + encuadre por cada GOL. DEBE computarse desde la lista
 *  COMPLETA de eventos (en orden) para que el resultado sea real: los autogoles
 *  cuentan para el RIVAL (beneficiarySide). Evita que la IA diga "abre el
 *  marcador" en goles posteriores o "se pone en ventaja" a quien va perdiendo. */
export function goalContext(
  events: MatchEvent[],
  meta: MatchMeta,
): Record<string, { marcador: string; first: boolean; benAhead: boolean }> {
  const ordered = [...events].sort(
    (a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0) || a.t - b.t,
  );
  let h = 0, a = 0, n = 0;
  const out: Record<string, { marcador: string; first: boolean; benAhead: boolean }> = {};
  for (const e of ordered) {
    if (!GOAL_TYPES.has(e.type)) continue;
    const ben = beneficiarySide(e);
    if (ben === "home") h += 1;
    else if (ben === "away") a += 1;
    else continue;
    n += 1;
    const benName = teamName(meta, ben) || (ben === "home" ? meta.home.name : meta.away.name);
    const benScore = ben === "home" ? h : a;
    const oppScore = ben === "home" ? a : h;
    const first = n === 1;
    const benAhead = benScore > oppScore;
    const rel = benAhead
      ? (first ? `${benName} se adelanta` : `${benName} amplia su ventaja`)
      : benScore === oppScore
        ? `${benName} empata el partido`
        : `${benName} recorta pero sigue por detras`;
    const marcador = `Resultado TRAS este gol: ${meta.home.name} ${h}-${a} ${meta.away.name}.`
      + ` Beneficia a ${benName}. Es el gol numero ${n} del partido`
      + (first ? " (este SI abre el marcador)" : " (NO abre el marcador: ya habia goles)")
      + `. ${rel}.`;
    out[e.id] = { marcador, first, benAhead };
  }
  return out;
}

/** Contexto combinado por evento (expulsiones + goles) para el narrador IA. */
export function narrationContext(
  events: MatchEvent[],
  meta: MatchMeta,
): Record<string, EventContext> {
  const out: Record<string, EventContext> = {};
  for (const [id, situacion] of Object.entries(numericalContext(events, meta))) {
    (out[id] ??= {}).situacion = situacion;
  }
  for (const [id, g] of Object.entries(goalContext(events, meta))) {
    const c = (out[id] ??= {});
    c.marcador = g.marcador; c.first = g.first; c.benAhead = g.benAhead;
  }
  return out;
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
    narrationContext(contextEvents ?? events, meta),
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
    // Contexto desde TODOS los eventos (no solo los pendientes): la cuenta de
    // expulsados Y el marcador acumulado por gol deben ser reales.
    const ai = await aiNarrateBatch(pending, meta, narrationContext(events, meta));
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

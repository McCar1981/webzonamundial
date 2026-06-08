// src/lib/micro/ai-generator.ts
//
// Categoría C (Fase 2): generación de micro-predicciones con Claude. Server-only.
//
// FILOSOFÍA DE DISEÑO. Una micro debe poder resolverse SOLA con los eventos
// autoritativos del partido (igual que las reactivas/temporales). Por eso la IA
// NO inventa preguntas de resolución libre: elige UNO de tres predicados
// deterministas que el motor ya sabe resolver…
//   - ai_goal_yesno  → ¿habrá gol en la ventana? (sí/no)
//   - ai_goal_side   → ¿quién marca el próximo en la ventana? (local/visit./ninguno)
//   - ai_card_yesno  → ¿habrá tarjeta en la ventana? (sí/no)
// …y solo aporta lo "inteligente": una pregunta contextual y enganchadora a
// partir del estado real del partido (marcador, minuto, dominio, últimos eventos).
//
// Apagada por defecto. Se activa con MICRO_AI=1 y requiere ANTHROPIC_API_KEY.
// Modelo: Haiku por coste/latencia (no necesita conocimiento factual, solo
// redactar). Override con ANTHROPIC_MODEL_MICRO.

import Anthropic from "@anthropic-ai/sdk";
import type { LiveSnapshot } from "@/lib/match-center/types";
import { MICRO_CATALOG, AI_MICRO_KINDS, type MicroKind, type ResolveContext } from "./micro";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

/** ¿Está habilitada la generación por IA? (gate explícito + clave presente). */
export function aiMicroEnabled(): boolean {
  return process.env.MICRO_AI === "1" && !!process.env.ANTHROPIC_API_KEY;
}

/** Resultado listo para createMicro (mismo shape que un Candidate del engine). */
export interface AiMicroCandidate {
  kind: MicroKind;
  question: string;
  options: { key: string; label: string }[];
  context: ResolveContext;
  windowSeconds: number;
  basePoints: number;
  triggerEventId: string;
}

const SYSTEM_PROMPT = `Eres el generador de MICRO-PREDICCIONES EN VIVO de ZonaMundial, una plataforma del Mundial 2026. Durante un partido, creas UNA pregunta corta, contextual y enganchadora que el usuario responde en segundos.

Recibes el estado real del partido (equipos, minuto, marcador, últimos eventos). Debes elegir UN predicado resoluble y redactar la pregunta.

PREDICADOS DISPONIBLES (campo "kind"):
- "ai_goal_yesno": ¿caerá un gol en la ventana? Opciones implícitas: Sí / No.
- "ai_goal_side": ¿qué equipo marcará el próximo gol en la ventana? Opciones: Local / Visitante / Ninguno.
- "ai_card_yesno": ¿habrá tarjeta en la ventana? Opciones: Sí / No.

REGLAS:
1. Elige el predicado más interesante según el contexto (p.ej. con un equipo volcado al ataque, "ai_goal_yesno"; partido caliente con faltas, "ai_card_yesno").
2. La pregunta va en español, máx 90 caracteres, sin emojis, concreta y emocionante. Usa los nombres reales de los equipos cuando aporte.
3. "windowSeconds": entre 120 y 300 (cuánto dura abierta la predicción, en segundos de juego).
4. "basePoints": entre 12 y 30 según dificultad estimada (gol = más difícil = más puntos).
5. NO repitas literalmente la pregunta por defecto; aporta contexto del partido.
6. Devuelve SOLO un JSON válido, sin markdown ni texto extra.

FORMATO DE SALIDA:
{
  "kind": "ai_goal_yesno",
  "question": "Brasil empuja con todo. ¿Cae gol en los próximos minutos?",
  "windowSeconds": 180,
  "basePoints": 20
}`;

interface RawAi {
  kind?: unknown;
  question?: unknown;
  windowSeconds?: unknown;
  basePoints?: unknown;
}

function clampInt(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Genera UNA micro de IA a partir del snapshot, o null si está deshabilitada,
 * falla la llamada o la salida no es válida. Degrada en silencio (no rompe el
 * poller). El `triggerEventId` sintético dedupe por minuto (anti-duplicado).
 */
export async function generateAiMicro(snap: LiveSnapshot): Promise<AiMicroCandidate | null> {
  if (!aiMicroEnabled()) return null;

  const model = process.env.ANTHROPIC_MODEL_MICRO || DEFAULT_MODEL;
  const home = snap.meta.home.name;
  const away = snap.meta.away.name;
  const recent = snap.events
    .slice(-6)
    .map((e) => `${e.minute}' ${e.type}${e.side !== "neutral" ? ` (${e.side === "home" ? home : away})` : ""}${e.player ? ` ${e.player}` : ""}`)
    .join("; ");

  const userMessage = `Estado del partido:
- Local: ${home}
- Visitante: ${away}
- Minuto: ${snap.elapsed}'
- Marcador: ${home} ${snap.score[0] ?? 0} - ${snap.score[1] ?? 0} ${away}
- Estado: ${snap.status}
- Posesión (L/V): ${snap.stats?.possession?.[0] ?? "?"}% / ${snap.stats?.possession?.[1] ?? "?"}%
- Tiros (L/V): ${snap.stats?.shots?.[0] ?? "?"} / ${snap.stats?.shots?.[1] ?? "?"}
- Últimos eventos: ${recent || "ninguno"}

Genera la micro-predicción ahora. Devuelve SOLO el JSON.`;

  let resp;
  try {
    const client = getClient();
    resp = await client.messages.create({
      model,
      max_tokens: 300,
      temperature: 0.9,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    console.error("[micro-ai] API error", (err as Error).message);
    return null;
  }

  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  const raw = block.text.trim().replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  let parsed: RawAi;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("[micro-ai] JSON parse failed", (err as Error).message);
    return null;
  }

  const kind = String(parsed.kind) as MicroKind;
  if (!AI_MICRO_KINDS.includes(kind)) return null;
  const def = MICRO_CATALOG[kind];

  const question = typeof parsed.question === "string" ? parsed.question.trim().slice(0, 110) : "";
  if (question.length < 8) return null;

  return {
    kind,
    question,
    options: def.options ?? [],
    context: {},
    windowSeconds: clampInt(parsed.windowSeconds, 120, 300, def.windowSeconds),
    basePoints: clampInt(parsed.basePoints, 12, 30, def.basePoints),
    // Un solo intento de IA por minuto y partido (idempotencia en createMicro).
    triggerEventId: `ai-${snap.matchId}-${snap.elapsed}`,
  };
}

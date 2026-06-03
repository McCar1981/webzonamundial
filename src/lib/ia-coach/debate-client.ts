// src/lib/ia-coach/debate-client.ts
//
// Wrapper Anthropic para el Retador (Modo 5). Server-only.
//
// MULTI-TURN: reenvía el historial completo de la conversación al modelo. Sin
// extended thinking (queremos latencia baja en un chat). El campeón elegido por
// el usuario, si existe, se ancla en el system prompt para que el Retador sepa
// qué postura atacar.

import Anthropic from "@anthropic-ai/sdk";
import { DEBATE_SYSTEM_PROMPT } from "./debate-system-prompt";
import { TEAM_BY_ID } from "@/lib/bracket/teams";
import type { Confidence } from "./types";
import type { DebateMessage, DebateTurn } from "./debate-types";
import type { DebateMemory } from "./debate-memory";

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 700;

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  _client = new Anthropic({ apiKey });
  return _client;
}

export interface DebateContext {
  championId: string | null;
  /** Nombre de registro del usuario (server-side, no falseable). null si no hay. */
  userName?: string | null;
  /** Turnos de usuario consumidos en esta sesión (1-based, incluye el actual). */
  turnsUsed?: number;
  /** Máximo de turnos de usuario por sesión. */
  maxTurns?: number;
  /** Memoria de sesiones anteriores (cross-session), si existe. */
  priorMemory?: DebateMemory | null;
}

/** Construye el bloque "Contexto de esta sesión" que se anexa al system prompt. */
function systemFor(ctx: DebateContext): string {
  const lines: string[] = [];

  const team = ctx.championId ? TEAM_BY_ID[ctx.championId] : undefined;
  if (team) {
    lines.push(
      `El usuario ha elegido a **${team.name}** como su campeón del Mundial 2026. Ese es el pronóstico central que debes poner a prueba a lo largo del debate.`,
    );
  }

  if (ctx.userName) {
    lines.push(`Nombre del usuario: **${ctx.userName}**.`);
  }

  if (typeof ctx.turnsUsed === "number" && typeof ctx.maxTurns === "number") {
    lines.push(`Vas por el turno ${ctx.turnsUsed} de ${ctx.maxTurns} del usuario en esta sesión.`);
  }

  // Memoria cross-session: solo tiene sentido al ARRANCAR una sesión nueva
  // (turno 1); en mitad del debate el historial ya da el contexto.
  const mem = ctx.priorMemory;
  if (mem && ctx.turnsUsed === 1 && mem.sessions > 0) {
    const memTeam = mem.lastChampionId ? TEAM_BY_ID[mem.lastChampionId] : undefined;
    const parts: string[] = [];
    if (memTeam) {
      const switched =
        ctx.championId && ctx.championId !== mem.lastChampionId
          ? ` Ahora viene con ${team?.name ?? "otro campeón"}: si ha cambiado de favorito, sácaselo.`
          : "";
      parts.push(`En una sesión anterior defendía a ${memTeam.name}.${switched}`);
    }
    if (mem.lastStance) {
      parts.push(`Tu última tesis con él fue: "${mem.lastStance}".`);
    }
    if (parts.length) {
      lines.push(
        `Ya habéis debatido antes (${mem.sessions} ${mem.sessions === 1 ? "sesión" : "sesiones"}). ${parts.join(" ")} Puedes hacer un guiño a ese pasado al saludar, sin obsesionarte con él.`,
      );
    }
  }

  if (lines.length === 0) return DEBATE_SYSTEM_PROMPT;
  return `${DEBATE_SYSTEM_PROMPT}\n\n## Contexto de esta sesión\n\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

export async function generateDebateReply(
  messages: DebateMessage[],
  ctx: DebateContext,
): Promise<DebateTurn> {
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    throw new Error("Last message must be from the user");
  }

  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0.8,
    system: systemFor(ctx),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text block in Anthropic response");
  }
  const jsonText = extractJSON(block.text.trim());
  if (!jsonText) throw new Error("Response did not contain JSON");

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`JSON parse failed: ${(e as Error).message}`);
  }
  return validate(parsed);
}

function extractJSON(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return raw.slice(first, last + 1);
}

function validate(raw: unknown): DebateTurn {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Debate turn is not an object");
  }
  const obj = raw as Record<string, unknown>;

  const reply =
    typeof obj.reply === "string" && obj.reply.trim().length > 0
      ? obj.reply.replace(/\s*\n+\s*/g, " ").trim().slice(0, 680)
      : "";
  if (!reply) throw new Error("Missing or invalid 'reply'");

  const stance =
    typeof obj.stance === "string" ? obj.stance.trim().slice(0, 70) : "";

  const concede = obj.concede === true;

  const challenge =
    typeof obj.challenge === "string" && obj.challenge.trim().length > 0
      ? obj.challenge.replace(/\s*\n+\s*/g, " ").trim().slice(0, 130)
      : null;

  const confRaw = String(obj.confidence || "media").toLowerCase();
  const confidence: Confidence =
    confRaw === "baja" || confRaw === "media" || confRaw === "alta" ? confRaw : "media";

  return { reply, stance, concede, challenge, confidence };
}

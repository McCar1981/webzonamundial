// src/lib/ia-coach/live-client.ts
//
// Wrapper Anthropic para el IA Coach EN VIVO (Modo 2). Server-only.
//
// A diferencia del Modo 1 (pre-partido con extended thinking), aquí priorizamos
// LATENCIA: durante un partido el usuario espera una lectura rápida. Usamos
// Sonnet 4.5 SIN extended thinking, max_tokens ajustado, para responder en
// pocos segundos. Fuerza JSON parseando y validando manualmente.

import Anthropic from "@anthropic-ai/sdk";
import { LIVE_SYSTEM_PROMPT } from "./live-system-prompt";
import type { Confidence } from "./types";
import type { IACoachLiveAnalysis } from "./live-types";

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 1400;

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  _client = new Anthropic({ apiKey });
  return _client;
}

export async function generateLiveAnalysis(
  contextMarkdown: string,
): Promise<IACoachLiveAnalysis> {
  if (!contextMarkdown || contextMarkdown.trim().length < 50) {
    throw new Error("Context too short for live analysis");
  }
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0.4,
    system: LIVE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: contextMarkdown }],
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

function validate(raw: unknown): IACoachLiveAnalysis {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Live analysis is not an object");
  }
  const obj = raw as Record<string, unknown>;

  const str = (key: string, max?: number): string => {
    const v = obj[key];
    if (typeof v !== "string" || v.length === 0) {
      throw new Error(`Missing or invalid '${key}'`);
    }
    return max && v.length > max ? v.slice(0, max) : v;
  };

  const headline = str("headline", 90);
  const situation = str("situation", 260).replace(/\s*\n+\s*/g, " ").trim();
  const projectedScore = str("projectedScore", 8);
  const watchNext = str("watchNext", 200);

  const momentumRaw = String(obj.momentumTeam || "none").toLowerCase();
  const momentumTeam: IACoachLiveAnalysis["momentumTeam"] =
    momentumRaw === "home" || momentumRaw === "away" ? momentumRaw : "none";

  // winProbabilities (renormaliza si no suma 1)
  const wp = (obj.winProbabilities || {}) as Record<string, unknown>;
  const home = typeof wp.home === "number" ? wp.home : 0;
  const draw = typeof wp.draw === "number" ? wp.draw : 0;
  const away = typeof wp.away === "number" ? wp.away : 0;
  const sum = home + draw + away;
  let h = home, d = draw, a = away;
  if (Math.abs(sum - 1) > 0.02 && sum > 0) {
    h = home / sum;
    d = draw / sum;
    a = away / sum;
  } else if (sum === 0) {
    h = 0.34;
    d = 0.33;
    a = 0.33;
  }

  const obsRaw = obj.keyObservations;
  const keyObservations: string[] = Array.isArray(obsRaw)
    ? obsRaw.filter((x): x is string => typeof x === "string").map((s) => s.slice(0, 90)).slice(0, 5)
    : [];

  let adjustments: IACoachLiveAnalysis["adjustments"] | undefined;
  if (obj.adjustments && typeof obj.adjustments === "object") {
    const adj = obj.adjustments as Record<string, unknown>;
    const ho = typeof adj.home === "string" ? adj.home.slice(0, 140) : undefined;
    const aw = typeof adj.away === "string" ? adj.away.slice(0, 140) : undefined;
    if (ho || aw) adjustments = { home: ho, away: aw };
  }

  const confRaw = String(obj.confidence || "media").toLowerCase();
  const confidence: Confidence =
    confRaw === "baja" || confRaw === "media" || confRaw === "alta" ? confRaw : "media";

  return {
    headline,
    situation,
    momentumTeam,
    winProbabilities: {
      home: Math.round(h * 100) / 100,
      draw: Math.round(d * 100) / 100,
      away: Math.round(a * 100) / 100,
    },
    projectedScore,
    keyObservations,
    adjustments,
    watchNext,
    confidence,
  };
}

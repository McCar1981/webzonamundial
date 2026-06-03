// src/lib/ia-coach/coach-client.ts
//
// Wrapper Anthropic para el Entrenador Personal (Modo 3). Server-only.
//
// Es on-demand (el usuario pulsa "Analiza mi quiniela"), no está en la ruta
// crítica de un partido en vivo, así que SÍ usamos extended thinking (como el
// Modo 1) para una lectura más calibrada del bracket completo. Fuerza JSON
// parseando y validando manualmente.

import Anthropic from "@anthropic-ai/sdk";
import { COACH_SYSTEM_PROMPT } from "./coach-system-prompt";
import type { Confidence } from "./types";
import type {
  IACoachBracketAnalysis,
  PredictionStyle,
  Realism,
} from "./coach-types";

const MODEL = "claude-sonnet-4-5-20250929";
const THINKING_BUDGET = 2500;
const MAX_TOKENS = THINKING_BUDGET + 2000;

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  _client = new Anthropic({ apiKey });
  return _client;
}

export async function generateBracketCoaching(
  contextMarkdown: string,
): Promise<IACoachBracketAnalysis> {
  if (!contextMarkdown || contextMarkdown.trim().length < 50) {
    throw new Error("Context too short for bracket coaching");
  }
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 1, // requerido con thinking activado
    thinking: { type: "enabled", budget_tokens: THINKING_BUDGET },
    system: COACH_SYSTEM_PROMPT,
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

function validate(raw: unknown): IACoachBracketAnalysis {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Bracket analysis is not an object");
  }
  const obj = raw as Record<string, unknown>;

  const str = (key: string, max?: number): string => {
    const v = obj[key];
    if (typeof v !== "string" || v.length === 0) {
      throw new Error(`Missing or invalid '${key}'`);
    }
    return max && v.length > max ? v.slice(0, max) : v;
  };

  const strArray = (key: string, max: number, cap: number): string[] => {
    const v = obj[key];
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string").map((s) => s.slice(0, max)).slice(0, cap)
      : [];
  };

  const coachTitle = str("coachTitle", 70);
  const profile = str("profile", 320).replace(/\s*\n+\s*/g, " ").trim();

  const styleRaw = String(obj.predictionStyle || "equilibrado").toLowerCase();
  const predictionStyle: PredictionStyle =
    styleRaw === "conservador" || styleRaw === "atrevido" ? styleRaw : "equilibrado";

  let riskScore = typeof obj.riskScore === "number" ? Math.round(obj.riskScore) : 50;
  riskScore = Math.max(0, Math.min(100, riskScore));

  // championVerdict
  const cv = (obj.championVerdict || {}) as Record<string, unknown>;
  const cvTeam = typeof cv.team === "string" ? cv.team.toUpperCase().slice(0, 4) : "";
  const cvTake = typeof cv.take === "string" ? cv.take.slice(0, 220) : "";
  const cvRealismRaw = String(cv.realism || "defendible").toLowerCase();
  const cvRealism: Realism =
    cvRealismRaw === "solido" || cvRealismRaw === "arriesgado" ? cvRealismRaw : "defendible";
  if (!cvTeam || !cvTake) throw new Error("Missing or invalid 'championVerdict'");

  const strengths = strArray("strengths", 90, 4);
  const biases = strArray("biases", 90, 4);
  const suggestions = strArray("suggestions", 110, 3);

  const risksRaw = obj.risks;
  const risks: IACoachBracketAnalysis["risks"] = Array.isArray(risksRaw)
    ? risksRaw
        .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
        .map((r) => {
          const label = typeof r.label === "string" ? r.label.slice(0, 90) : "";
          const why = typeof r.why === "string" ? r.why.slice(0, 120) : "";
          const matchId = typeof r.matchId === "string" ? r.matchId : undefined;
          return { matchId, label, why };
        })
        .filter((r) => r.label.length > 0)
        .slice(0, 4)
    : [];

  const grade = str("grade", 12);

  const confRaw = String(obj.confidence || "media").toLowerCase();
  const confidence: Confidence =
    confRaw === "baja" || confRaw === "media" || confRaw === "alta" ? confRaw : "media";

  return {
    coachTitle,
    profile,
    predictionStyle,
    riskScore,
    championVerdict: { team: cvTeam, take: cvTake, realism: cvRealism },
    strengths,
    risks,
    biases,
    suggestions,
    grade,
    confidence,
  };
}

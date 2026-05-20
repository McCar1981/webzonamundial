// src/lib/ia-coach/anthropic-client.ts
//
// Wrapper sobre el SDK de Anthropic para el IA Coach. Server-only.
//
// Usa Claude Sonnet 4.6 para análisis detallados (mejor razonamiento
// que Haiku para este caso). Si en futuro queremos modo Haiku para
// usuarios free, basta cambiar MODEL.
//
// El cliente FUERZA respuesta JSON parseando manualmente y validando.

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./system-prompt";
import type { IACoachAnalysis } from "./types";

const MODEL = "claude-sonnet-4-5-20250929";
// Extended thinking: el modelo razona internamente antes de devolver el JSON.
// Budget moderado (2500 tokens) para mantener latencia <30s y caber dentro
// del maxDuration de 60s de Vercel Hobby. La calidad del análisis no cambia
// notablemente entre 2500 y 4000 tokens de thinking para este caso de uso.
const THINKING_BUDGET = 2500;
const MAX_TOKENS = THINKING_BUDGET + 2200;

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY missing");
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

/** Llama al modelo y devuelve el análisis parseado. Lanza error si la
 *  respuesta no es JSON válido o no cumple el shape mínimo. */
export async function generateAnalysis(
  contextMarkdown: string,
): Promise<IACoachAnalysis> {
  const client = getClient();

  // FASE 1: filtro de mensajes vacíos antes del fetch (anti-billing-waste)
  if (!contextMarkdown || contextMarkdown.trim().length < 50) {
    throw new Error("Context too short for analysis");
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // temperature 1.0 — requerido por Anthropic cuando thinking está activado.
    // La variabilidad aleatoria entre análisis viene del thinking interno +
    // del cache slot (rotación cada 2h), no de la temperature.
    temperature: 1,
    // Extended thinking activado: el modelo razona internamente antes de
    // producir el JSON final. Resultado: mejor calibración de probabilidades,
    // keyFactors más punzantes y verdict más agudo.
    thinking: {
      type: "enabled",
      budget_tokens: THINKING_BUDGET,
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: contextMarkdown }],
  });

  // Extrae el texto de la respuesta (ignora los bloques "thinking" — son
  // internos del modelo, no parte de la respuesta).
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text block in Anthropic response");
  }

  const raw = block.text.trim();
  const jsonText = extractJSON(raw);
  if (!jsonText) {
    throw new Error("Response did not contain JSON");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(
      `JSON parse failed: ${(e as Error).message}. Raw: ${raw.slice(0, 200)}`,
    );
  }

  const analysis = validateAnalysis(parsed);
  return analysis;
}

/** Extrae el primer objeto JSON encontrado en el texto.
 *  Maneja: JSON crudo, JSON envuelto en \`\`\`json, JSON con texto antes/después. */
function extractJSON(raw: string): string | null {
  // Si está envuelto en code fence
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();

  // Busca el primer { y el último }
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  return raw.slice(firstBrace, lastBrace + 1);
}

/** Valida que el JSON parseado cumple el shape de IACoachAnalysis.
 *  Lanza error con mensaje claro si falta algo crítico. */
function validateAnalysis(raw: unknown): IACoachAnalysis {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Analysis is not an object");
  }
  const obj = raw as Record<string, unknown>;

  const requireString = (key: string, max?: number): string => {
    const v = obj[key];
    if (typeof v !== "string" || v.length === 0) {
      throw new Error(`Missing or invalid '${key}'`);
    }
    if (max && v.length > max) {
      // Truncamos en vez de fallar — más resiliente
      return v.slice(0, max);
    }
    return v;
  };

  const verdict = requireString("verdict", 80);
  const winnerPrediction = requireString("winnerPrediction").toUpperCase();
  const scoreSuggestion = requireString("scoreSuggestion");
  const confidenceRaw = requireString("confidence").toLowerCase();
  // Hard cap a 150 caracteres + colapsa saltos de línea por si el modelo aún devuelve párrafos
  const analysis = requireString("analysis", 150).replace(/\s*\n+\s*/g, " ").trim();

  // Probabilities
  const probs = obj.probabilities;
  if (typeof probs !== "object" || probs === null) {
    throw new Error("Missing 'probabilities'");
  }
  const p = probs as Record<string, unknown>;
  const home = typeof p.home === "number" ? p.home : 0;
  const draw = typeof p.draw === "number" ? p.draw : 0;
  const away = typeof p.away === "number" ? p.away : 0;
  const sum = home + draw + away;
  // Renormaliza si no suma 1 ±0.02
  let h = home, d = draw, a = away;
  if (Math.abs(sum - 1) > 0.02 && sum > 0) {
    h = home / sum;
    d = draw / sum;
    a = away / sum;
  }

  // confidence
  const confidence: "baja" | "media" | "alta" =
    confidenceRaw === "baja" || confidenceRaw === "media" || confidenceRaw === "alta"
      ? confidenceRaw
      : "media";

  // keyFactors
  const keyFactorsRaw = obj.keyFactors;
  const keyFactors: string[] = Array.isArray(keyFactorsRaw)
    ? keyFactorsRaw.filter((x): x is string => typeof x === "string").slice(0, 6)
    : [];

  // watchPlayer (puede ser null)
  let watchPlayer: IACoachAnalysis["watchPlayer"] = null;
  if (obj.watchPlayer && typeof obj.watchPlayer === "object") {
    const wp = obj.watchPlayer as Record<string, unknown>;
    if (
      typeof wp.name === "string" &&
      typeof wp.team === "string" &&
      typeof wp.reason === "string"
    ) {
      watchPlayer = {
        name: wp.name,
        team: wp.team.toUpperCase(),
        reason: wp.reason,
      };
    }
  }

  return {
    verdict,
    winnerPrediction,
    probabilities: {
      home: Math.round(h * 100) / 100,
      draw: Math.round(d * 100) / 100,
      away: Math.round(a * 100) / 100,
    },
    scoreSuggestion,
    confidence,
    analysis,
    keyFactors,
    watchPlayer,
  };
}

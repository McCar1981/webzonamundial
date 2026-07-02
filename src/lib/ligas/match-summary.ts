// src/lib/ligas/match-summary.ts
//
// "Ponme al día": resumen del estado de un partido de Zona de Ligas generado por
// IA (Anthropic Haiku, barato y rápido) SOLO a partir de los datos reales del
// fixture (nunca inventa). Es la feature de "tecnología punta" del Centro de
// Partido: un narrador en español que te pone al día en 2-3 frases.
//
// Coste: se llama SOLO desde el endpoint cacheado (1 llamada por fixture por
// ventana de caché, no por visita). Comparte la ANTHROPIC_API_KEY del IA Coach.
// Fail-soft: sin clave o ante error, cae a un resumen determinista de los datos.

import Anthropic from "@anthropic-ai/sdk";
import type { FixtureDetail } from "@/lib/competitions/api";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

// Resumen determinista (sin IA): honesto, solo con los datos. Es el fallback y el
// contenido base sobre el que la IA "borda".
export function deterministicSummary(d: FixtureDetail): string {
  const h = d.fixture.home.name;
  const a = d.fixture.away.name;
  const sh = d.fixture.score.home ?? 0;
  const sa = d.fixture.score.away ?? 0;
  if (FINISHED.has(d.fixture.status)) return `Final: ${h} ${sh}-${sa} ${a}.`;
  if (LIVE.has(d.fixture.status)) {
    const min = d.fixture.elapsed != null ? `, minuto ${d.fixture.elapsed}` : "";
    return `En juego${min}: ${h} ${sh}-${sa} ${a}.`;
  }
  return `${h} recibe a ${a}. El partido está por comenzar.`;
}

function buildContext(d: FixtureDetail): string {
  const homeId = d.fixture.home.id;
  const goals = d.events
    .filter((e) => e.type.toLowerCase() === "goal")
    .map((e) => `${e.minute ?? "?"}' gol de ${e.player ?? "?"} (${e.teamId === homeId ? d.fixture.home.name : d.fixture.away.name})`);
  const reds = d.events
    .filter((e) => e.type.toLowerCase() === "card" && e.detail.toLowerCase().includes("red"))
    .map((e) => `${e.minute ?? "?"}' roja a ${e.player ?? "?"}`);
  const statLine = (type: string): string | null => {
    const hb = d.stats.find((s) => s.teamId === homeId)?.items.find((x) => x.type === type)?.value;
    const ab = d.stats.find((s) => s.teamId !== homeId)?.items.find((x) => x.type === type)?.value;
    return hb != null && ab != null ? `${type}: ${hb} - ${ab}` : null;
  };
  const stats = ["Ball Possession", "Total Shots", "Shots on Goal"].map(statLine).filter(Boolean);
  return [
    `Partido: ${d.fixture.home.name} vs ${d.fixture.away.name}`,
    `Estado: ${d.fixture.status}${d.fixture.elapsed != null ? ` (min ${d.fixture.elapsed})` : ""}`,
    `Marcador: ${d.fixture.score.home ?? 0}-${d.fixture.score.away ?? 0}`,
    goals.length ? `Goles: ${goals.join("; ")}` : "Goles: ninguno",
    reds.length ? `Expulsiones: ${reds.join("; ")}` : "",
    stats.length ? `Estadísticas (local-visitante): ${stats.join(", ")}` : "",
  ].filter(Boolean).join("\n");
}

export async function generateMatchSummary(d: FixtureDetail): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const finished = FINISHED.has(d.fixture.status);
  const live = LIVE.has(d.fixture.status);
  const task = finished
    ? "Resume cómo quedó y qué fue lo decisivo, en 2-3 frases."
    : live
      ? "Pon al día de lo que está pasando ahora mismo, en 2-3 frases."
      : "Escribe una previa breve (1-2 frases) de lo que se espera.";

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL_NARRATIVE || DEFAULT_MODEL,
      max_tokens: 300,
      system:
        "Eres el narrador de ZonaMundial. Escribe en español neutro (LATAM), claro y cercano. " +
        "Usa SOLO los datos que te doy; NUNCA inventes goles, jugadores ni cifras. Nada de emojis. " +
        "Máximo 3 frases, sin encabezados ni listas.",
      messages: [{ role: "user", content: `${buildContext(d)}\n\nTarea: ${task}` }],
    });
    const block = res.content.find((b) => b.type === "text");
    const text = block && block.type === "text" ? block.text.trim() : "";
    return text.length > 0 ? text : null;
  } catch (err) {
    console.error("[liga-match-summary] IA failed:", (err as Error).message);
    return null;
  }
}

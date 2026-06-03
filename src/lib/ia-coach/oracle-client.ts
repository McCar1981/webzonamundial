// src/lib/ia-coach/oracle-client.ts
//
// Wrapper Anthropic para el Oráculo (Modo 4). Server-only.
//
// La simulación Monte Carlo ya produjo los números (oracle-sim.ts). Aquí Claude
// solo los NARRA. Es una llamada corta y barata: sin extended thinking,
// max_tokens ajustado. Construye el contexto a partir de la tabla de odds.

import Anthropic from "@anthropic-ai/sdk";
import {
  ORACLE_SYSTEM_PROMPT,
  ORACLE_FOLLOWUP_SYSTEM_PROMPT,
} from "./oracle-system-prompt";
import { TEAM_BY_ID } from "@/lib/bracket/teams";
import type { Confidence } from "./types";
import type { TeamOdds } from "./oracle-sim";
import type { OracleNarration, OracleFollowupMessage } from "./oracle-types";

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 900;

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  _client = new Anthropic({ apiKey });
  return _client;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/** Construye el markdown que lee el Oráculo a partir de la simulación. */
export function buildOracleContext(
  teams: TeamOdds[],
  iterations: number,
  userChampionId: string | null,
): string {
  const top = teams.slice(0, 16);
  const lines: string[] = [];
  lines.push("# SIMULACIÓN MONTE CARLO — MUNDIAL 2026");
  lines.push("");
  lines.push(`Torneos simulados: ${iterations.toLocaleString("es")}.`);
  lines.push("");
  lines.push("## PROBABILIDADES POR SELECCIÓN (ordenadas por probabilidad de campeón)");
  lines.push("Formato: Selección (ranking FIFA) — Campeón | Final | Semis | Cuartos");
  for (const t of top) {
    lines.push(
      `- ${t.name} (#${t.rank}) — ${pct(t.champion)} | ${pct(t.finalist)} | ${pct(t.semifinalist)} | ${pct(t.quarterfinalist)}`,
    );
  }
  lines.push("");

  if (userChampionId) {
    const u = teams.find((t) => t.id === userChampionId);
    if (u) {
      lines.push("## CAMPEÓN ELEGIDO POR EL USUARIO");
      lines.push(
        `- ${u.name} (#${u.rank}) — campeón en ${pct(u.champion)} de las simulaciones; ` +
          `llega a la final ${pct(u.finalist)}.`,
      );
      const rankPos = teams.findIndex((t) => t.id === userChampionId) + 1;
      lines.push(`- Posición de su campeón en el ranking del Oráculo: #${rankPos} de 48.`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push(
    "**Tarea:** Como Oráculo, narra esta simulación. Devuelve el JSON con proclamation, " +
      "reading, favorite (el de mayor probabilidad), darkHorse (ranking medio/bajo con " +
      "probabilidad de campeón desproporcionada al alza), userVerdict (null si no hay campeón " +
      "del usuario arriba) y confidence. Cita SIEMPRE las probabilidades reales de la tabla.",
  );
  return lines.join("\n");
}

/** Construye SOLO la tabla de odds (sin "Tarea" de JSON) para anclar el chat de
 *  seguimiento del Oráculo. El usuario ya vio la narración; aquí solo necesitamos
 *  las probabilidades como fuente de verdad. */
export function buildOracleOddsTable(
  teams: TeamOdds[],
  iterations: number,
  userChampionId: string | null,
): string {
  const top = teams.slice(0, 16);
  const lines: string[] = [];
  lines.push("# TABLA DE PROBABILIDADES — SIMULACIÓN MONTE CARLO MUNDIAL 2026");
  lines.push(`Torneos simulados: ${iterations.toLocaleString("es")}.`);
  lines.push("Formato: Selección (ranking FIFA) — Campeón | Final | Semis | Cuartos");
  for (const t of top) {
    lines.push(
      `- ${t.name} (#${t.rank}) — ${pct(t.champion)} | ${pct(t.finalist)} | ${pct(t.semifinalist)} | ${pct(t.quarterfinalist)}`,
    );
  }
  if (userChampionId) {
    const u = teams.find((t) => t.id === userChampionId);
    if (u) {
      const rankPos = teams.findIndex((t) => t.id === userChampionId) + 1;
      lines.push("");
      lines.push(
        `Campeón elegido por el usuario: ${u.name} (#${u.rank}) — campeón en ${pct(u.champion)} ` +
          `de las simulaciones (posición #${rankPos} de 48 en el ranking del Oráculo).`,
      );
    }
  }
  return lines.join("\n");
}

/** Responde una pregunta de seguimiento del usuario, anclada en la tabla de odds.
 *  El último mensaje de `messages` debe ser del usuario. Devuelve texto plano. */
export async function generateOracleFollowup(
  oddsTable: string,
  messages: OracleFollowupMessage[],
): Promise<string> {
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    throw new Error("Last message must be from the user");
  }
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    temperature: 0.7,
    system: `${ORACLE_FOLLOWUP_SYSTEM_PROMPT}\n\n## Tabla de probabilidades (tu única fuente)\n\n${oddsTable}`,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text block in Anthropic response");
  }
  const reply = block.text.replace(/\s*\n+\s*/g, " ").trim().slice(0, 600);
  if (!reply) throw new Error("Empty oracle follow-up reply");
  return reply;
}

export async function generateOracleNarration(
  contextMarkdown: string,
): Promise<OracleNarration> {
  if (!contextMarkdown || contextMarkdown.trim().length < 50) {
    throw new Error("Context too short for oracle narration");
  }
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0.7,
    system: ORACLE_SYSTEM_PROMPT,
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

function isKnownTeam(id: string): boolean {
  return !!TEAM_BY_ID[id];
}

function validate(raw: unknown): OracleNarration {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Oracle narration is not an object");
  }
  const obj = raw as Record<string, unknown>;

  const str = (key: string, max: number): string => {
    const v = obj[key];
    if (typeof v !== "string" || v.length === 0) {
      throw new Error(`Missing or invalid '${key}'`);
    }
    return v.length > max ? v.slice(0, max) : v;
  };

  const pickTeam = (
    key: string,
    required: boolean,
  ): { team: string; take: string } | null => {
    const v = obj[key];
    if (typeof v !== "object" || v === null) {
      if (required) throw new Error(`Missing '${key}'`);
      return null;
    }
    const o = v as Record<string, unknown>;
    const team = typeof o.team === "string" ? o.team.toUpperCase().slice(0, 4) : "";
    const take = typeof o.take === "string" ? o.take.slice(0, 180) : "";
    if (!team || !take || !isKnownTeam(team)) {
      if (required) throw new Error(`Invalid '${key}'`);
      return null;
    }
    return { team, take };
  };

  const proclamation = str("proclamation", 90).replace(/\s*\n+\s*/g, " ").trim();
  const reading = str("reading", 360).replace(/\s*\n+\s*/g, " ").trim();
  const favorite = pickTeam("favorite", true)!;
  const darkHorse = pickTeam("darkHorse", true)!;
  const userVerdict = pickTeam("userVerdict", false);

  const confRaw = String(obj.confidence || "media").toLowerCase();
  const confidence: Confidence =
    confRaw === "baja" || confRaw === "media" || confRaw === "alta" ? confRaw : "media";

  return { proclamation, reading, favorite, darkHorse, userVerdict, confidence };
}

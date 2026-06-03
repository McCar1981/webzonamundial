// src/lib/ia-coach/coach-context.ts
//
// Construye el contexto markdown para el Entrenador Personal (Modo 3) a partir
// de la quiniela del usuario:
//   - matches con equipos resueltos + picks (lo que reenvía el cliente)
//   - perfiles profundos (data/teams/*.json) de los equipos clave (campeón,
//     subcampeón, semifinalistas) para que el modelo juzgue realismo sin inventar
//
// PURE: no toca red ni Anthropic. Devuelve el markdown y un bracketVersion para
// la clave de caché (huella de campeón + ganadores de eliminatorias + goles).

import fs from "node:fs/promises";
import path from "node:path";
import { TEAM_BY_ID, type ConfedId } from "@/lib/bracket/teams";
import { PHASE_BY_ID, type PhaseId } from "@/lib/bracket/types";
import type {
  BracketMatchInput,
  BracketPickInput,
  BracketStateInput,
} from "./coach-types";

const TEAM_DATA_DIR = path.join(process.cwd(), "data", "teams");

interface TeamDeepLite {
  fifa_ranking?: { current?: number };
  wc_2026?: {
    coach?: { name?: string };
    star_player?: { name?: string };
    analysis?: { strengths?: string[]; weaknesses?: string[]; tactical_style?: string };
  };
}

const deepCache = new Map<string, TeamDeepLite | null>();

async function loadDeep(teamId: string | null | undefined): Promise<TeamDeepLite | null> {
  if (!teamId) return null;
  const slug = TEAM_BY_ID[teamId]?.slug;
  if (!slug) return null;
  if (deepCache.has(slug)) return deepCache.get(slug) ?? null;
  try {
    const txt = await fs.readFile(path.join(TEAM_DATA_DIR, `${slug}.json`), "utf8");
    const data = JSON.parse(txt) as TeamDeepLite;
    deepCache.set(slug, data);
    return data;
  } catch {
    deepCache.set(slug, null);
    return null;
  }
}

function teamName(id: string | null | undefined): string {
  if (!id) return "?";
  return TEAM_BY_ID[id]?.name ?? id;
}

function confedOf(id: string | null | undefined): ConfedId | null {
  if (!id) return null;
  return TEAM_BY_ID[id]?.confed ?? null;
}

const KNOCKOUT_ORDER: PhaseId[] = ["R32", "R16", "QF", "SF", "THIRD", "FINAL"];

interface PickedMatch {
  match: BracketMatchInput;
  pick: BracketPickInput;
  winner: string;
  loser: string | null;
}

/** Empareja matches resueltos con su pick (con ganador no nulo). */
function pickedKnockoutByPhase(
  matchesByPhase: Map<PhaseId, BracketMatchInput[]>,
  picks: Record<string, BracketPickInput>,
  phase: PhaseId,
): PickedMatch[] {
  const out: PickedMatch[] = [];
  for (const m of matchesByPhase.get(phase) ?? []) {
    const pick = picks[m.id];
    if (!pick || !pick.winner || !m.a || !m.b) continue;
    const loser = pick.winner === m.a ? m.b : pick.winner === m.b ? m.a : null;
    out.push({ match: m, pick, winner: pick.winner, loser });
  }
  return out;
}

function confedTally(ids: Array<string | null | undefined>): string {
  const tally = new Map<ConfedId, number>();
  for (const id of ids) {
    const c = confedOf(id);
    if (!c) continue;
    tally.set(c, (tally.get(c) ?? 0) + 1);
  }
  if (tally.size === 0) return "—";
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c} ${n}`)
    .join(", ");
}

export interface BuiltCoachContext {
  contextMarkdown: string;
  bracketVersion: string;
}

export async function buildCoachContext(
  state: BracketStateInput,
): Promise<BuiltCoachContext> {
  const { picks, matches } = state;

  // Index matches por fase.
  const byPhase = new Map<PhaseId, BracketMatchInput[]>();
  for (const m of matches) {
    const arr = byPhase.get(m.phase) ?? [];
    arr.push(m);
    byPhase.set(m.phase, arr);
  }

  // ── Fase de grupos: solo resumen estadístico (no listamos 72 partidos) ──
  const groupMatches = byPhase.get("GROUP") ?? [];
  let groupPicks = 0;
  let groupGoals = 0;
  let biggest: { label: string; diff: number } | null = null;
  for (const m of groupMatches) {
    const pick = picks[m.id];
    if (!pick) continue;
    groupPicks++;
    groupGoals += pick.scoreA + pick.scoreB;
    const diff = Math.abs(pick.scoreA - pick.scoreB);
    if (m.a && m.b && (!biggest || diff > biggest.diff) && diff >= 3) {
      const hi = pick.scoreA >= pick.scoreB ? m.a : m.b;
      const lo = pick.scoreA >= pick.scoreB ? m.b : m.a;
      biggest = {
        label: `${teamName(hi)} ${Math.max(pick.scoreA, pick.scoreB)}-${Math.min(pick.scoreA, pick.scoreB)} ${teamName(lo)}`,
        diff,
      };
    }
  }

  // ── Eliminatorias por fase ──
  const knockoutByPhase = new Map<PhaseId, PickedMatch[]>();
  let knockoutGoals = 0;
  let knockoutPicks = 0;
  for (const phase of KNOCKOUT_ORDER) {
    const picked = pickedKnockoutByPhase(byPhase, picks, phase);
    knockoutByPhase.set(phase, picked);
    for (const pm of picked) {
      knockoutGoals += pm.pick.scoreA + pm.pick.scoreB;
      knockoutPicks++;
    }
  }

  // Participantes clave (de los matches resueltos, no del pick).
  const qfMatches = byPhase.get("QF") ?? [];
  const sfMatches = byPhase.get("SF") ?? [];
  const finalMatches = byPhase.get("FINAL") ?? [];
  const thirdMatches = byPhase.get("THIRD") ?? [];

  const elite8: string[] = qfMatches.flatMap((m) => [m.a, m.b].filter(Boolean) as string[]);
  const semifinalists: string[] = sfMatches.flatMap((m) => [m.a, m.b].filter(Boolean) as string[]);
  const finalists: string[] = finalMatches.flatMap((m) => [m.a, m.b].filter(Boolean) as string[]);

  const finalPicked = (knockoutByPhase.get("FINAL") ?? [])[0];
  const champion = state.champion ?? finalPicked?.winner ?? null;
  const runnerUp = finalPicked
    ? finalPicked.winner === finalPicked.match.a
      ? finalPicked.match.b
      : finalPicked.match.a
    : null;
  const thirdPicked = (knockoutByPhase.get("THIRD") ?? [])[0];
  const thirdPlace = thirdPicked?.winner ?? null;

  // Camino del campeón: cruces de eliminatoria donde el campeón fue el ganador.
  const championPath: string[] = [];
  if (champion) {
    for (const phase of KNOCKOUT_ORDER) {
      if (phase === "THIRD") continue;
      for (const pm of knockoutByPhase.get(phase) ?? []) {
        if (pm.winner === champion && pm.loser) {
          championPath.push(`${PHASE_BY_ID[phase].short}: vence a ${teamName(pm.loser)} (${pm.pick.scoreA}-${pm.pick.scoreB})`);
        }
      }
    }
  }

  // Perfiles profundos solo de equipos clave (campeón, subcampeón, semifinalistas).
  const keyIds = Array.from(new Set([champion, runnerUp, ...semifinalists].filter(Boolean) as string[]));
  const deepEntries = await Promise.all(keyIds.map(async (id) => [id, await loadDeep(id)] as const));

  /* ─────────── Montaje del markdown ─────────── */
  const parts: string[] = [];
  parts.push("# QUINIELA DEL USUARIO (BRACKET MUNDIAL 2026)");
  parts.push("");
  parts.push("## RESULTADO CUMBRE");
  parts.push(`- Campeón: ${teamName(champion)}${champion ? ` (${champion})` : ""}`);
  if (runnerUp) parts.push(`- Subcampeón: ${teamName(runnerUp)}`);
  if (thirdPlace) parts.push(`- Tercer puesto: ${teamName(thirdPlace)}`);
  if (finalists.length === 2) parts.push(`- Final: ${teamName(finalists[0])} vs ${teamName(finalists[1])}`);
  parts.push("");

  if (championPath.length > 0) {
    parts.push("## CAMINO DEL CAMPEÓN");
    for (const step of championPath) parts.push(`- ${step}`);
    parts.push("");
  }

  if (semifinalists.length > 0) {
    parts.push("## SEMIFINALISTAS");
    parts.push(`- ${semifinalists.map(teamName).join(", ")}`);
    parts.push(`- Confederaciones: ${confedTally(semifinalists)}`);
    parts.push("");
  }

  if (elite8.length > 0) {
    parts.push("## CUARTOFINALISTAS (8 mejores)");
    parts.push(`- ${elite8.map(teamName).join(", ")}`);
    parts.push(`- Confederaciones: ${confedTally(elite8)}`);
    parts.push("");
  }

  // Lista de cruces de eliminatorias (R32 → FINAL) para que el modelo juzgue riesgo.
  parts.push("## CRUCES DE ELIMINATORIAS (ganador elegido)");
  let anyKnockout = false;
  for (const phase of KNOCKOUT_ORDER) {
    const picked = knockoutByPhase.get(phase) ?? [];
    if (picked.length === 0) continue;
    anyKnockout = true;
    parts.push(`### ${PHASE_BY_ID[phase].name}`);
    for (const pm of picked) {
      parts.push(`- ${teamName(pm.winner)} elimina a ${teamName(pm.loser)} (${pm.pick.scoreA}-${pm.pick.scoreB})`);
    }
  }
  if (!anyKnockout) parts.push("- (El usuario aún no ha pronosticado eliminatorias)");
  parts.push("");

  parts.push("## ESTILO DE GOLES");
  parts.push(`- Partidos de grupos pronosticados: ${groupPicks} de ${groupMatches.length}`);
  if (groupPicks > 0) {
    parts.push(`- Promedio de goles por partido (grupos): ${(groupGoals / groupPicks).toFixed(2)}`);
  }
  if (knockoutPicks > 0) {
    parts.push(`- Promedio de goles por partido (eliminatorias): ${(knockoutGoals / knockoutPicks).toFixed(2)}`);
  }
  if (biggest) parts.push(`- Mayor goleada pronosticada en grupos: ${biggest.label}`);
  parts.push("");

  // Perfiles de los equipos clave.
  parts.push("## PERFILES DE EQUIPOS CLAVE");
  let anyProfile = false;
  for (const [id, deep] of deepEntries) {
    if (!deep) continue;
    anyProfile = true;
    const lines: string[] = [`### ${teamName(id)}`];
    if (deep.fifa_ranking?.current) lines.push(`- Ranking FIFA: #${deep.fifa_ranking.current}`);
    if (deep.wc_2026?.coach?.name) lines.push(`- DT: ${deep.wc_2026.coach.name}`);
    if (deep.wc_2026?.star_player?.name) lines.push(`- Estrella: ${deep.wc_2026.star_player.name}`);
    if (deep.wc_2026?.analysis?.tactical_style) lines.push(`- Estilo: ${deep.wc_2026.analysis.tactical_style}`);
    if (deep.wc_2026?.analysis?.strengths?.length) {
      lines.push(`- Fortalezas: ${deep.wc_2026.analysis.strengths.slice(0, 3).join("; ")}`);
    }
    if (deep.wc_2026?.analysis?.weaknesses?.length) {
      lines.push(`- Debilidades: ${deep.wc_2026.analysis.weaknesses.slice(0, 3).join("; ")}`);
    }
    parts.push(lines.join("\n"));
    parts.push("");
  }
  if (!anyProfile) parts.push("- (Sin perfiles profundos disponibles para los equipos clave)");
  parts.push("");

  parts.push("---");
  parts.push("");
  parts.push(
    "**Tarea:** Coachea al usuario sobre SU quiniela. Evalúa su campeón, la coherencia " +
      "del cuadro, los cruces más arriesgados, sus sesgos (confederación, goleadas, " +
      "anfitriones) y su estilo. Devuelve el JSON con coachTitle, profile, predictionStyle, " +
      "riskScore, championVerdict, strengths, risks, biases, suggestions, grade y confidence. " +
      "NO inventes cruces ni datos que no estén arriba.",
  );

  // bracketVersion: huella de campeón + ganadores de eliminatorias + nº picks grupos + goles.
  const koSignature = KNOCKOUT_ORDER.flatMap((phase) =>
    (knockoutByPhase.get(phase) ?? []).map((pm) => `${pm.match.id}=${pm.winner}:${pm.pick.scoreA}-${pm.pick.scoreB}`),
  ).join("|");
  const bracketVersion = simpleHash(
    [champion ?? "none", groupPicks, groupGoals, koSignature].join("#"),
  );

  return { contextMarkdown: parts.join("\n"), bracketVersion };
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36).slice(0, 10);
}

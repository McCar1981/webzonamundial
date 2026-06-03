// src/lib/ia-coach/live-context.ts
//
// Construye el contexto markdown para el IA Coach EN VIVO a partir de:
//   - MatchMeta del Match Center (equipos, sede, fase)
//   - LiveStateInput (marcador, minuto, stats, eventos, momentum)
//   - Perfiles profundos de cada selección (data/teams/*.json) vía ISO3 -> slug
//
// PURE: no toca red ni Anthropic. Devuelve el markdown y un stateVersion para
// la clave de caché (cambia cuando cambia el marcador, el minuto o los eventos).

import fs from "node:fs/promises";
import path from "node:path";
import { TEAM_BY_ID } from "@/lib/bracket/teams";
import type { LiveStats, MatchMeta } from "@/lib/match-center/types";
import type { LiveEventInput, LiveStateInput } from "./live-types";

const TEAM_DATA_DIR = path.join(process.cwd(), "data", "teams");

interface SquadPlayerLite {
  id?: string;
  display_name?: string;
  full_name?: string;
  position?: string;
  club?: { name?: string };
}

interface TeamDeepLite {
  fifa_ranking?: { current?: number };
  wc_2026?: {
    coach?: { name?: string; nationality?: string };
    captain?: { name?: string };
    star_player?: { name?: string; club?: string };
    likely_squad?: SquadPlayerLite[];
    starting_xi?: {
      formation?: string;
      players?: Array<{ player_id?: string }>;
    };
    analysis?: {
      strengths?: string[];
      weaknesses?: string[];
      tactical_style?: string;
    };
  };
}

/** Orden táctico aproximado para listar el banquillo (porteros y defensas al final). */
const POS_ORDER: Record<string, number> = { FW: 0, MF: 1, DF: 2, GK: 3 };

/** Deriva el banquillo (likely_squad menos el XI) y devuelve hasta `max` opciones
 *  de recambio, priorizando ataque/medio (lo más útil para sugerir cambios). */
function benchOptions(wc: TeamDeepLite["wc_2026"], max = 7): string[] {
  const squad = wc?.likely_squad;
  if (!Array.isArray(squad) || squad.length === 0) return [];
  const xiIds = new Set(
    (wc?.starting_xi?.players ?? [])
      .map((p) => p?.player_id)
      .filter((id): id is string => typeof id === "string"),
  );
  return squad
    .filter((p) => p?.id && !xiIds.has(p.id))
    .map((p) => ({
      name: p.display_name || p.full_name || "",
      pos: (p.position || "").toUpperCase(),
      club: p.club?.name || "",
    }))
    .filter((p) => p.name.length > 0)
    .sort((a, b) => (POS_ORDER[a.pos] ?? 9) - (POS_ORDER[b.pos] ?? 9))
    .slice(0, max)
    .map((p) => `${p.name}${p.pos ? ` (${p.pos}` : ""}${p.club ? `${p.pos ? ", " : " ("}${p.club})` : p.pos ? ")" : ""}`);
}

const deepCache = new Map<string, TeamDeepLite | null>();

async function loadDeep(slug: string | undefined): Promise<TeamDeepLite | null> {
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

const EVENT_LABEL: Record<string, string> = {
  goal: "Gol",
  penalty_goal: "Gol de penalti",
  own_goal: "Gol en propia",
  penalty_miss: "Penalti fallado",
  yellow: "Tarjeta amarilla",
  second_yellow: "Segunda amarilla",
  red: "Tarjeta roja",
  sub: "Cambio",
  var: "Revisión VAR",
  chance: "Ocasión clara",
  save: "Parada",
  offside: "Fuera de juego",
  injury: "Lesión",
  kickoff: "Saque inicial",
  half_time: "Descanso",
  full_time: "Final",
};

function minuteLabel(e: LiveEventInput): string {
  return `${e.minute}${e.extra ? `+${e.extra}` : ""}'`;
}

function teamProfileBlock(
  label: string,
  name: string,
  deep: TeamDeepLite | null,
): string {
  const lines: string[] = [`### ${label}: ${name}`];
  if (!deep) {
    lines.push(`- (Sin perfil profundo disponible)`);
    return lines.join("\n");
  }
  if (deep.fifa_ranking?.current) lines.push(`- Ranking FIFA: #${deep.fifa_ranking.current}`);
  const wc = deep.wc_2026;
  if (wc?.coach?.name) {
    lines.push(`- DT: ${wc.coach.name}${wc.coach.nationality ? ` (${wc.coach.nationality})` : ""}`);
  }
  if (wc?.captain?.name) lines.push(`- Capitán: ${wc.captain.name}`);
  if (wc?.star_player?.name) {
    lines.push(`- Estrella: ${wc.star_player.name}${wc.star_player.club ? ` (${wc.star_player.club})` : ""}`);
  }
  if (wc?.starting_xi?.formation) lines.push(`- Formación prevista: ${wc.starting_xi.formation}`);
  if (wc?.analysis?.tactical_style) lines.push(`- Estilo: ${wc.analysis.tactical_style}`);
  if (wc?.analysis?.strengths?.length) {
    lines.push(`- Fortalezas: ${wc.analysis.strengths.slice(0, 3).join("; ")}`);
  }
  if (wc?.analysis?.weaknesses?.length) {
    lines.push(`- Debilidades: ${wc.analysis.weaknesses.slice(0, 3).join("; ")}`);
  }
  const bench = benchOptions(wc);
  if (bench.length) {
    lines.push(`- Recambios disponibles (banquillo): ${bench.join("; ")}`);
  }
  return lines.join("\n");
}

function statsBlock(stats: LiveStats, homeName: string, awayName: string): string {
  // Solo incluimos filas con algún dato (>0) para no inducir invención cuando
  // la API no trae estadísticas (partido recién empezado o sin feed de stats).
  const rows: Array<[string, number, number, boolean]> = [
    ["Posesión (%)", stats.possession[0], stats.possession[1], true],
    ["Tiros", stats.shots[0], stats.shots[1], false],
    ["Tiros a puerta", stats.shotsOn[0], stats.shotsOn[1], false],
    ["xG", stats.xg[0], stats.xg[1], false],
    ["Córners", stats.corners[0], stats.corners[1], false],
    ["Faltas", stats.fouls[0], stats.fouls[1], false],
    ["Paradas", stats.saves[0], stats.saves[1], false],
    ["Amarillas", stats.yellow[0], stats.yellow[1], false],
    ["Rojas", stats.red[0], stats.red[1], false],
  ];
  const meaningful = rows.filter(([, h, a, isPct]) => isPct ? (h !== 50 || a !== 50) : (h > 0 || a > 0));
  if (meaningful.length === 0) {
    return "Estadísticas: aún no disponibles para este minuto.";
  }
  const lines = [`Estadísticas (${homeName} | ${awayName}):`];
  for (const [label, h, a] of meaningful) {
    lines.push(`- ${label}: ${h} | ${a}`);
  }
  return lines.join("\n");
}

export interface BuiltLiveContext {
  contextMarkdown: string;
  stateVersion: string;
}

/** Construye el contexto en vivo. Devuelve null si faltan equipos. */
export async function buildLiveContext(
  meta: MatchMeta,
  state: LiveStateInput,
): Promise<BuiltLiveContext> {
  const homeName = meta.home.name;
  const awayName = meta.away.name;

  // ISO3 -> slug (TEAM_BY_ID está indexado por id ISO3, igual que meta.*.id).
  const homeSlug = meta.home.id ? TEAM_BY_ID[meta.home.id]?.slug : undefined;
  const awaySlug = meta.away.id ? TEAM_BY_ID[meta.away.id]?.slug : undefined;
  const [homeDeep, awayDeep] = await Promise.all([loadDeep(homeSlug), loadDeep(awaySlug)]);

  // Nos quedamos con los últimos eventos relevantes (máx 12) en orden cronológico.
  const events = [...state.events]
    .filter((e) => e.type !== "shot") // ruido: dejamos goles/tarjetas/cambios/ocasiones
    .slice(-12);

  const momentumWord =
    state.momentum > 0.12
      ? `${homeName} empuja`
      : state.momentum < -0.12
        ? `${awayName} empuja`
        : "equilibrado";

  const parts: string[] = [];
  parts.push("# ESTADO DEL PARTIDO EN VIVO");
  parts.push("");
  parts.push(`**${homeName} (local) vs ${awayName} (visitante)**`);
  parts.push(`- Fase del torneo: ${meta.phase}${meta.group ? ` (${meta.group})` : ""}`);
  parts.push(`- Sede: ${meta.venue}, ${meta.city}`);
  parts.push("");
  parts.push("## MARCADOR Y RELOJ");
  parts.push(`- Marcador: ${homeName} ${state.score[0]} - ${state.score[1]} ${awayName}`);
  parts.push(`- Minuto: ${state.minute}'${state.finished ? " (PARTIDO FINALIZADO)" : ""}`);
  parts.push(`- Tramo: ${state.phase}`);
  parts.push(`- Momentum: ${momentumWord} (índice ${state.momentum.toFixed(2)}; -1 visitante .. +1 local)`);
  parts.push("");
  parts.push("## ESTADÍSTICAS");
  parts.push(statsBlock(state.stats, homeName, awayName));
  parts.push("");
  parts.push("## EVENTOS OCURRIDOS");
  if (events.length === 0) {
    parts.push("Sin eventos destacados todavía.");
  } else {
    for (const e of events) {
      const who =
        e.side === "home" ? homeName : e.side === "away" ? awayName : "neutral";
      const label = EVENT_LABEL[e.type] || e.type;
      const player = e.player ? ` — ${e.player}` : "";
      const detail = e.detail ? ` (${e.detail})` : "";
      parts.push(`- ${minuteLabel(e)} ${label} [${who}]${player}${detail}`);
    }
  }
  parts.push("");
  parts.push("## PERFILES DE LAS SELECCIONES");
  parts.push(teamProfileBlock("Local", homeName, homeDeep));
  parts.push("");
  parts.push(teamProfileBlock("Visitante", awayName, awayDeep));
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push(
    `**Tarea:** Analiza el partido EN ESTE MOMENTO (minuto ${state.minute}', ` +
      `${state.score[0]}-${state.score[1]}). Devuelve el JSON con headline, situation, ` +
      `momentumTeam ("home"=${homeName}, "away"=${awayName} o "none"), winProbabilities ` +
      `(resultado FINAL), projectedScore (nunca por debajo del marcador actual), ` +
      `keyObservations (3-4 bullets basados SOLO en las stats/eventos de arriba), ` +
      `adjustments para cada equipo (cuando propongas un cambio, nombra a un recambio CONCRETO ` +
      `de la lista de banquillo de ese equipo si encaja; nunca inventes jugadores que no estén arriba) ` +
      `y watchNext. NO inventes datos que no estén arriba.`,
  );

  // stateVersion: cambia con marcador, minuto (bucket de 5'), nº de eventos y rojas.
  const minuteBucket = Math.floor(state.minute / 5);
  const reds = state.stats.red[0] + state.stats.red[1];
  const stateVersion = simpleHash(
    [
      meta.id,
      state.score[0],
      state.score[1],
      minuteBucket,
      events.length,
      reds,
      state.finished ? "F" : "L",
    ].join("|"),
  );

  return { contextMarkdown: parts.join("\n"), stateVersion };
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36).slice(0, 8);
}

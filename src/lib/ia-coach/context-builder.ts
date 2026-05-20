// src/lib/ia-coach/context-builder.ts
//
// RAG (Retrieval-Augmented Generation): a partir de un BracketMatch
// construye el bloque de contexto que se le pasa a Claude.
//
// Lee de:
//   - src/lib/bracket/teams.ts (info bracket)
//   - data/teams/*.json (datos profundos: coach, plantilla, historia,
//     palmarés, jugador estrella, ranking FIFA)
//   - src/data/matches.ts (sede, fecha, hora del partido específico)
//
// En FASE 2 añadiremos:
//   - KV con lesiones extraídas de noticias
//   - KV con forma reciente desde football-data.org
//
// El context builder es PURE: no depende de Anthropic ni network.

import fs from "node:fs/promises";
import path from "node:path";
import { TEAM_BY_ID, type BracketTeam } from "@/lib/bracket/teams";
import { findMatchData } from "@/lib/bracket/match-time";
import type { BracketMatch } from "@/lib/bracket/types";

const TEAM_DATA_DIR = path.join(process.cwd(), "data", "teams");

interface TeamDeep {
  slug: string;
  name_es: string;
  iso: string;
  iso3: string;
  fifa_ranking?: { current?: number };
  confederation?: string;
  wc_2026?: {
    coach?: {
      name?: string;
      nationality?: string;
      since?: string;
    };
    captain?: { name?: string };
    star_player?: { name?: string; club?: string; reason?: string };
    likely_squad?: Array<{
      display_name?: string;
      full_name?: string;
      position?: string;
      detailed_position?: string;
      club?: { name?: string };
      status?: string;
    }>;
    qualifying_summary?: string;
    analysis?: {
      strengths?: string[];
      weaknesses?: string[];
      tactical_style?: string;
    };
    squad_announced?: boolean;
  };
  history?: {
    appearances_count_before_2026?: number;
    titles?: number;
  };
  records?: {
    best_world_cup_finish?: string;
    last_appearance?: number;
  };
  iconic_matches?: Array<{
    rival?: string;
    result?: string;
    year?: number;
    stage?: string;
    context?: string;
  }>;
  curiosities?: Array<string | { text?: string }>;
}

const teamDataCache = new Map<string, TeamDeep | null>();

async function loadTeamDeep(slug: string): Promise<TeamDeep | null> {
  if (teamDataCache.has(slug)) return teamDataCache.get(slug) ?? null;
  try {
    const filepath = path.join(TEAM_DATA_DIR, `${slug}.json`);
    const txt = await fs.readFile(filepath, "utf8");
    const data = JSON.parse(txt) as TeamDeep;
    teamDataCache.set(slug, data);
    return data;
  } catch {
    teamDataCache.set(slug, null);
    return null;
  }
}

function formatTeamBlock(
  bracketTeam: BracketTeam,
  deep: TeamDeep | null,
): string {
  const lines: string[] = [];
  lines.push(`### ${bracketTeam.name} (código: ${bracketTeam.id})`);
  lines.push(`- ISO: ${bracketTeam.iso}`);
  lines.push(`- Confederación: ${bracketTeam.confed}`);
  lines.push(`- Grupo Mundial 2026: ${bracketTeam.group}`);

  if (!deep) {
    lines.push(`- (Sin datos profundos disponibles para ${bracketTeam.name})`);
    return lines.join("\n");
  }

  if (deep.fifa_ranking?.current) {
    lines.push(`- Ranking FIFA: #${deep.fifa_ranking.current}`);
  }

  const wc = deep.wc_2026;
  if (wc?.coach?.name) {
    const coachLine = `- DT actual: ${wc.coach.name}${wc.coach.nationality ? ` (${wc.coach.nationality})` : ""}${wc.coach.since ? `, desde ${wc.coach.since}` : ""}`;
    lines.push(coachLine);
  }
  if (wc?.captain?.name) {
    lines.push(`- Capitán: ${wc.captain.name}`);
  }
  if (wc?.star_player?.name) {
    lines.push(
      `- Jugador estrella: ${wc.star_player.name}${wc.star_player.club ? ` (${wc.star_player.club})` : ""}${wc.star_player.reason ? ` — ${wc.star_player.reason}` : ""}`,
    );
  }

  if (wc?.analysis?.tactical_style) {
    lines.push(`- Estilo táctico: ${wc.analysis.tactical_style}`);
  }
  if (wc?.analysis?.strengths?.length) {
    lines.push(`- Fortalezas: ${wc.analysis.strengths.slice(0, 3).join("; ")}`);
  }
  if (wc?.analysis?.weaknesses?.length) {
    lines.push(`- Debilidades: ${wc.analysis.weaknesses.slice(0, 3).join("; ")}`);
  }

  // Plantilla resumida — solo los más relevantes (status fixed o star)
  if (wc?.likely_squad && wc.likely_squad.length > 0) {
    const announced = wc.squad_announced === true;
    const headlinePlayers = wc.likely_squad
      .filter((p) => p.status === "fixed")
      .slice(0, 8)
      .map((p) => {
        const name = p.display_name || p.full_name || "?";
        const pos = p.detailed_position || p.position || "";
        const club = p.club?.name || "";
        return `${name} (${pos}${club ? `, ${club}` : ""})`;
      });
    if (headlinePlayers.length > 0) {
      lines.push(
        `- Convocatoria ${announced ? "oficial" : "probable"} (selección de jugadores fijos): ${headlinePlayers.join("; ")}`,
      );
    }
  }

  if (deep.history?.appearances_count_before_2026 !== undefined) {
    lines.push(
      `- Mundiales disputados (antes de 2026): ${deep.history.appearances_count_before_2026}`,
    );
  }
  if (deep.history?.titles !== undefined) {
    lines.push(`- Mundiales ganados: ${deep.history.titles}`);
  }
  if (deep.records?.best_world_cup_finish) {
    lines.push(`- Mejor actuación histórica: ${deep.records.best_world_cup_finish}`);
  }
  if (deep.records?.last_appearance) {
    lines.push(`- Última participación Mundial: ${deep.records.last_appearance}`);
  }

  // Partidos icónicos (solo 2-3 más recientes)
  if (deep.iconic_matches && deep.iconic_matches.length > 0) {
    const recent = deep.iconic_matches
      .filter((m) => m.year && m.year > 2000)
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .slice(0, 2)
      .map(
        (m) =>
          `${m.year} vs ${m.rival} (${m.stage || "?"}): ${m.result || "?"}${m.context ? ` — ${m.context.slice(0, 80)}` : ""}`,
      );
    if (recent.length > 0) {
      lines.push(`- Partidos icónicos recientes: ${recent.join(" | ")}`);
    }
  }

  if (wc?.qualifying_summary) {
    lines.push(`- Clasificatoria 2026: ${wc.qualifying_summary.slice(0, 250)}`);
  }

  return lines.join("\n");
}

export interface BuiltContext {
  contextMarkdown: string;
  dataVersion: string;
  matchInfo: {
    homeId: string;
    homeName: string;
    awayId: string;
    awayName: string;
    phase: string;
    venue: string;
    dateTime: string;
  };
}

/**
 * Construye el contexto que se pasa al prompt user. Devuelve también
 * un dataVersion para usar en cache key (cambia si se añaden lesiones,
 * cambios de DT, etc.).
 */
export async function buildContext(
  match: BracketMatch,
): Promise<BuiltContext | null> {
  if (!match.a || !match.b) return null;

  const home = TEAM_BY_ID[match.a];
  const away = TEAM_BY_ID[match.b];
  if (!home || !away) return null;

  const [homeDeep, awayDeep] = await Promise.all([
    loadTeamDeep(home.slug),
    loadTeamDeep(away.slug),
  ]);

  // Info del partido (sede, hora, fase)
  const matchData = findMatchData(match);
  const phaseLabels: Record<string, string> = {
    GROUP: "Fase de Grupos",
    R32: "Dieciseisavos de Final",
    R16: "Octavos de Final",
    QF: "Cuartos de Final",
    SF: "Semifinal",
    THIRD: "Partido por el 3er Puesto",
    FINAL: "Final del Mundial",
  };
  const phaseLabel = phaseLabels[match.phase] || match.phase;

  const venue = matchData
    ? `${matchData.vn}, ${matchData.vc} (${matchData.vf?.toUpperCase()})`
    : "Sede por confirmar";
  const dateTime = matchData
    ? `${matchData.d} a las ${matchData.t} ET`
    : "Fecha por confirmar";

  // Construye el contexto markdown
  const parts: string[] = [];
  parts.push("# CONTEXTO DEL PARTIDO");
  parts.push("");
  parts.push(`**${home.name} vs ${away.name}**`);
  parts.push(`- Fase: ${phaseLabel}`);
  parts.push(`- Sede: ${venue}`);
  parts.push(`- Fecha/hora: ${dateTime}`);
  parts.push("");
  parts.push("## SELECCIÓN LOCAL");
  parts.push("");
  parts.push(formatTeamBlock(home, homeDeep));
  parts.push("");
  parts.push("## SELECCIÓN VISITANTE");
  parts.push("");
  parts.push(formatTeamBlock(away, awayDeep));
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push(
    `**Tarea:** Analiza este enfrentamiento siguiendo TU metodología. ` +
      `Devuelve el JSON con verdict, winnerPrediction (usa los códigos "${home.id}", "${away.id}" o "DRAW"), ` +
      `probabilities (home=${home.id}, away=${away.id}), scoreSuggestion, confidence, ` +
      `analysis (300-500 palabras, 4-6 párrafos), keyFactors (3-5) y watchPlayer.`,
  );

  // dataVersion = hash simple basado en (squad_announced status + nombres de DT).
  // En Fase 2 sumaremos versión de lesiones del KV.
  const versionParts: string[] = [];
  versionParts.push(home.id, away.id);
  versionParts.push(homeDeep?.wc_2026?.coach?.name || "");
  versionParts.push(awayDeep?.wc_2026?.coach?.name || "");
  versionParts.push(homeDeep?.wc_2026?.squad_announced ? "1" : "0");
  versionParts.push(awayDeep?.wc_2026?.squad_announced ? "1" : "0");
  const dataVersion = simpleHash(versionParts.join("|"));

  return {
    contextMarkdown: parts.join("\n"),
    dataVersion,
    matchInfo: {
      homeId: home.id,
      homeName: home.name,
      awayId: away.id,
      awayName: away.name,
      phase: phaseLabel,
      venue,
      dateTime,
    },
  };
}

/** Hash determinista corto para invalidar cache. */
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36).slice(0, 8);
}

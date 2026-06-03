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
import { readTeamForm, formatTeamFormForPrompt, type TeamForm } from "./team-form";
import {
  readTeamInjuries,
  formatInjuriesForPrompt,
  type TeamInjuries,
} from "./team-injuries";
import { getH2H, formatH2HForPrompt } from "./team-h2h";
import { getOddsForMatch, formatOddsForPrompt } from "./team-odds";
import { API_FOOTBALL_TEAM_IDS } from "./team-form";

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
      profile_summary?: string;
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
  form: TeamForm | null,
  injuries: TeamInjuries | null,
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

  // FASE 2: forma reciente del KV (poblado por el cron update-team-form)
  if (form) {
    lines.push(formatTeamFormForPrompt(form));
  }

  // FASE 2.B v2: lesiones AUTOMÁTICAS derivadas de las /injuries de las 5
  // ligas top, matcheadas por nombre con likely_squad del JSON del equipo.
  // Poblado por el cron update-team-injuries (04:00 UTC diario).
  lines.push(formatInjuriesForPrompt(injuries));

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

  // Info del partido (necesaria antes del Promise.all para construir dateISO).
  const matchData = findMatchData(match);

  // FASE 3.A: cuotas — solo intentamos si tenemos fecha + IDs api-football
  const apiHomeId = API_FOOTBALL_TEAM_IDS[home.id];
  const apiAwayId = API_FOOTBALL_TEAM_IDS[away.id];
  const dateISO = matchData?.d
    ? `${matchData.d}T${matchData.t || "12:00"}:00Z`
    : undefined;

  const [homeDeep, awayDeep, homeForm, awayForm, homeInj, awayInj, h2h, odds] =
    await Promise.all([
      loadTeamDeep(home.slug),
      loadTeamDeep(away.slug),
      readTeamForm(home.id),
      readTeamForm(away.id),
      readTeamInjuries(home.id),
      readTeamInjuries(away.id),
      // FASE 2.C: H2H histórico (on-demand, cacheado 30 días en KV)
      getH2H(home.id, away.id),
      // FASE 3.A: cuotas pre-match promedio de varias casas (cache 12h)
      apiHomeId && apiAwayId && dateISO
        ? getOddsForMatch(match.id, {
            apiHomeId,
            apiAwayId,
            dateISO,
          })
        : Promise.resolve(null),
    ]);

  // Info del partido (matchData ya cargado arriba para Promise.all)
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
  parts.push(formatTeamBlock(home, homeDeep, homeForm, homeInj));
  parts.push("");
  parts.push("## SELECCIÓN VISITANTE");
  parts.push("");
  parts.push(formatTeamBlock(away, awayDeep, awayForm, awayInj));
  parts.push("");
  // FASE 2.C: bloque H2H histórico
  parts.push(formatH2HForPrompt(h2h, home.name, away.name));
  parts.push("");
  // FASE 3.A: cuotas pre-match (benchmark del análisis IA)
  parts.push(formatOddsForPrompt(odds, home.name, away.name));
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push(
    `**Tarea:** Analiza este enfrentamiento siguiendo TU metodología. ` +
      `Devuelve el JSON con verdict, winnerPrediction (usa los códigos "${home.id}", "${away.id}" o "DRAW"), ` +
      `probabilities (home=${home.id}, away=${away.id}), scoreSuggestion, confidence, ` +
      `analysis (UNA FRASE, máximo 150 caracteres, sin saltos de línea), keyFactors (3-4 bullets cortos) y watchPlayer. ` +
      `Añade además tu MODELO PREDICTIVO: overUnder, xgEstimate, firstGoalWindow, topScorers ` +
      `(solo jugadores nombrados arriba; team = "${home.id}" o "${away.id}") y tacticalDuel. ` +
      `Omite cualquiera de esos campos si el contexto no te da base suficiente — NO inventes.`,
  );
  parts.push("");
  parts.push(
    "**Reglas de fidelidad al contexto (CRÍTICO):**\n" +
      "- NO afirmes lesiones, sanciones o ausencias de jugadores si NO aparecen explícitamente arriba.\n" +
      "- Si el campo 'DT actual' dice 'POR CONFIRMAR' o similar, di literalmente 'DT por confirmar' — NO inventes un nombre.\n" +
      "- NO digas frases como 'Lamine Yamal en duda por lesión' o 'sin Ferran' si esa info no está en el bloque del equipo.\n" +
      "- Si necesitas referirte a un jugador y no estás seguro de su estado actual, usa lenguaje neutro ('si está al 100%', 'puede ser clave') en vez de afirmaciones.",
  );

  // dataVersion = hash simple basado en (squad_announced + DT + forma reciente).
  // FASE 2: incluye fetchedAt y resumen de forma para invalidar caché cuando
  // el cron diario actualice la forma de los equipos.
  const versionParts: string[] = [];
  versionParts.push(home.id, away.id);
  versionParts.push(homeDeep?.wc_2026?.coach?.name || "");
  versionParts.push(awayDeep?.wc_2026?.coach?.name || "");
  versionParts.push(homeDeep?.wc_2026?.squad_announced ? "1" : "0");
  versionParts.push(awayDeep?.wc_2026?.squad_announced ? "1" : "0");
  // Forma reciente: usamos el día del fetchedAt (no el ISO completo) para que
  // el dataVersion sea estable durante 24h y se invalide cuando llega data nueva.
  versionParts.push(homeForm?.fetchedAt?.slice(0, 10) || "no-form");
  versionParts.push(awayForm?.fetchedAt?.slice(0, 10) || "no-form");
  versionParts.push(homeForm?.summary || "");
  versionParts.push(awayForm?.summary || "");
  // FASE 2.B: incluye lesiones. El summary cambia cuando entra/sale un jugador
  // de la lista, así la caché se invalida y se regenera el análisis.
  versionParts.push(homeInj?.fetchedAt?.slice(0, 10) || "no-inj");
  versionParts.push(awayInj?.fetchedAt?.slice(0, 10) || "no-inj");
  versionParts.push(homeInj?.summary || "");
  versionParts.push(awayInj?.summary || "");
  // FASE 2.C: H2H stable hash — solo cambia si llega nueva data del API.
  versionParts.push(h2h?.recordText || "no-h2h");
  versionParts.push(String(h2h?.matches.length ?? 0));
  // FASE 3.A: odds — cambian cada 12h aprox. Día del fetchedAt + impH para
  // invalidar caché cuando las cuotas se mueven significativamente.
  versionParts.push(odds?.fetchedAt?.slice(0, 10) || "no-odds");
  versionParts.push(String(odds?.impliedHome ?? ""));
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

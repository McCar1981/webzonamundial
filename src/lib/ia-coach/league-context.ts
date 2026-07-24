// src/lib/ia-coach/league-context.ts
//
// Contexto (RAG) del IA Coach para partidos de LIGAS DE CLUBES. A diferencia del
// del Mundial (datos curados de selecciones en data/teams/*.json), este se
// construye SOLO con datos de club de api-football vía la capa cacheada
// competitions/api.ts (getTeamFixtures + getCompetitionStandings) → sin cuota
// extra ni dependencia de JSON curado. Fail-soft: con poco dato, el prompt lo
// dice y el modelo baja la confianza.

import {
  getTeamFixtures,
  getCompetitionStandings,
  type TeamFixture,
  type StandingsGroup,
} from "@/lib/competitions/api";
import { LEAGUE_PROMPT_VERSION } from "./league-system-prompt";

export interface LeagueMatchInput {
  fixtureId: number;
  apiFootballId: number;
  competitionName: string;
  home: { id: number; name: string };
  away: { id: number; name: string };
  kickoff?: string | null;
  venue?: string | null;
}

const FINISHED = new Set(["FT", "AET", "PEN"]);

/** Resumen de forma: "GEPGG · 12 GF / 6 GC en 5" desde los últimos partidos. */
function formSummary(teamId: number, fixtures: TeamFixture[]): { line: string; count: number } {
  const played = fixtures.filter((f) => FINISHED.has(f.status)).slice(-6);
  if (played.length === 0) return { line: "sin partidos recientes disponibles", count: 0 };
  let gf = 0, gc = 0;
  const seq: string[] = [];
  for (const f of played) {
    const isHome = f.home.id === teamId;
    const ownG = (isHome ? f.score.home : f.score.away) ?? 0;
    const oppG = (isHome ? f.score.away : f.score.home) ?? 0;
    gf += ownG; gc += oppG;
    const opp = isHome ? f.away.name : f.home.name;
    const res = ownG > oppG ? "G" : ownG === oppG ? "E" : "P";
    seq.push(`${res} ${ownG}-${oppG} vs ${opp} (${isHome ? "L" : "V"})`);
  }
  const letters = played.map((f) => {
    const isHome = f.home.id === teamId;
    const ownG = (isHome ? f.score.home : f.score.away) ?? 0;
    const oppG = (isHome ? f.score.away : f.score.home) ?? 0;
    return ownG > oppG ? "G" : ownG === oppG ? "E" : "P";
  }).join("");
  return {
    line: `${letters} · ${gf} GF / ${gc} GC en ${played.length}\n   Detalle: ${seq.join(" | ")}`,
    count: played.length,
  };
}

/** Línea de tabla del equipo: "3º · 45 pts · +18 DG · forma WWDLW". */
function standingLine(groups: StandingsGroup[], teamId: number): string | null {
  for (const g of groups) {
    const row = g.rows.find((r) => r.team.id === teamId);
    if (row) {
      const dg = row.goalsFor - row.goalsAgainst;
      const grp = g.group && groups.length > 1 ? ` (${g.group})` : "";
      return `${row.rank}º${grp} · ${row.points} pts · ${row.win}G ${row.draw}E ${row.lose}P · ${dg >= 0 ? "+" : ""}${dg} DG${row.form ? ` · forma ${row.form}` : ""}`;
    }
  }
  return null;
}

export async function buildLeagueContext(
  m: LeagueMatchInput,
): Promise<{ prompt: string; dataVersion: string } | null> {
  const [homeFx, awayFx, standings] = await Promise.all([
    getTeamFixtures(m.home.id, { last: 6 }),
    getTeamFixtures(m.away.id, { last: 6 }),
    getCompetitionStandings(m.apiFootballId).catch(() => [] as StandingsGroup[]),
  ]);

  const homeForm = formSummary(m.home.id, homeFx);
  const awayForm = formSummary(m.away.id, awayFx);
  const homeTable = standingLine(standings, m.home.id);
  const awayTable = standingLine(standings, m.away.id);

  const when = m.kickoff ? new Date(m.kickoff).toISOString().slice(0, 16).replace("T", " ") + " UTC" : "por confirmar";

  const prompt = `PARTIDO A ANALIZAR — ${m.competitionName}

LOCAL: ${m.home.name}
VISITANTE: ${m.away.name}
Fecha/hora: ${when}${m.venue ? `\nEstadio: ${m.venue}` : ""}

--- FORMA RECIENTE ---
${m.home.name} (local):
   ${homeForm.line}
${m.away.name} (visitante):
   ${awayForm.line}

--- TABLA DE ${m.competitionName.toUpperCase()} ---
${m.home.name}: ${homeTable ?? "sin datos de tabla (¿fase de grupos/copa o pretemporada?)"}
${m.away.name}: ${awayTable ?? "sin datos de tabla (¿fase de grupos/copa o pretemporada?)"}

Analiza este partido de club siguiendo tu metodología y devuelve SOLO el JSON.
winnerPrediction = "HOME" (${m.home.name}), "AWAY" (${m.away.name}) o "DRAW".`;

  // Versión de datos para la caché: cambia cuando entran nuevos resultados.
  const dataVersion = `${LEAGUE_PROMPT_VERSION}:${m.fixtureId}:${homeForm.count}:${awayForm.count}:${homeTable ? 1 : 0}${awayTable ? 1 : 0}`;

  return { prompt, dataVersion };
}

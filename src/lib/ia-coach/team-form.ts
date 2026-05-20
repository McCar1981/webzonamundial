// src/lib/ia-coach/team-form.ts
//
// FASE 2.A: Forma reciente de selecciones desde api-football.com (RapidAPI).
//
// Estrategia:
//   - Pull diario via cron de los últimos 10 partidos de cada selección del Mundial.
//   - Persistido en Vercel KV con TTL de 36 h (margen vs cron diario).
//   - El context-builder lo lee de KV y lo añade al prompt user.
//   - Si no hay datos (KV vacío, fallo de red), el system-prompt ya cubre el caso
//     con "Análisis con datos limitados".
//
// API: https://www.api-football.com/documentation-v3
// Endpoint: GET /fixtures?team={id}&last={n}
// Free tier: 100 req/día. Con 48 selecciones, una pasada diaria gasta 48/100.
//
// Mapeo team ID api-football ↔ selección Mundial 2026: en API_FOOTBALL_TEAM_IDS.

import { kv } from "@vercel/kv";

const KV_PREFIX = "ia-coach:form:v1:";
const KV_TTL_SECONDS = 36 * 60 * 60; // 36 h (margen sobre el cron diario)

const RAPIDAPI_HOST = "api-football-v1.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}/v3`;

// IDs de api-football.com para las 48 selecciones del Mundial 2026.
// Mapeo manual: keys son los `id` de BRACKET_TEAMS (ISO3 upper).
// Fuente: api-football /teams?search={name} — verificados Mayo 2026.
export const API_FOOTBALL_TEAM_IDS: Record<string, number> = {
  // Grupo A
  MEX: 16, ZAF: 32, KOR: 25, CZE: 24,
  // Grupo B
  CAN: 22, QAT: 23, BIH: 17, SUI: 15,
  // Grupo C
  BRA: 6, HAI: 33, MAR: 31, SCO: 1108,
  // Grupo D
  USA: 2384, PAR: 8, AUS: 20, TUR: 21,
  // Grupo E
  GER: 25, CIV: 27, CUW: 1535, ECU: 7,
  // Grupo F
  NED: 1118, JPN: 12, SWE: 9, TUN: 28,
  // Grupo G
  BEL: 1, NZL: 18, EGY: 19, IRN: 29,
  // Grupo H
  ESP: 9, CPV: 1531, KSA: 26, URU: 11,
  // Grupo I
  FRA: 2, SEN: 30, NOR: 12, // playoff TBD
  // Grupo J
  ARG: 26, ALG: 14, AUT: 16, JOR: 1106,
  // Grupo K
  POR: 27, UZB: 1107, COL: 8,
  // Grupo L
  ENG: 10, CRO: 3, GHA: 13, PAN: 1111,
};

export interface TeamRecentMatch {
  date: string; // ISO date
  opponent: string;
  isHome: boolean;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: "W" | "D" | "L" | "?";
  competition: string;
}

export interface TeamForm {
  teamId: string; // BRACKET_TEAMS.id (ISO3)
  apiTeamId: number;
  fetchedAt: string;
  matches: TeamRecentMatch[]; // últimos 10, más reciente primero
  /** Resumen tipo "W-W-D-L-W (12 GF / 6 GC últimos 5)". */
  summary: string;
}

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

function kvKey(teamId: string): string {
  return `${KV_PREFIX}${teamId}`;
}

/** Lee la forma reciente de un equipo del KV. Devuelve null si no hay. */
export async function readTeamForm(teamId: string): Promise<TeamForm | null> {
  if (!isKvEnabled()) return null;
  try {
    return (await kv.get<TeamForm>(kvKey(teamId))) || null;
  } catch (err) {
    console.error("[team-form] readTeamForm failed:", (err as Error).message);
    return null;
  }
}

/** Escribe la forma reciente en KV. */
export async function writeTeamForm(form: TeamForm): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    await kv.set(kvKey(form.teamId), form, { ex: KV_TTL_SECONDS });
  } catch (err) {
    console.error("[team-form] writeTeamForm failed:", (err as Error).message);
  }
}

interface ApiFootballFixture {
  fixture: { date: string };
  league: { name: string };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

interface ApiFootballResponse {
  response: ApiFootballFixture[];
  errors?: unknown;
}

/** Llama a api-football y devuelve los últimos N partidos de un equipo. */
export async function fetchTeamRecentMatches(
  teamId: string,
  last: number = 10,
): Promise<TeamRecentMatch[] | null> {
  const apiId = API_FOOTBALL_TEAM_IDS[teamId];
  if (!apiId) {
    console.warn(`[team-form] No api-football ID for ${teamId}`);
    return null;
  }
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    console.warn("[team-form] RAPIDAPI_KEY missing");
    return null;
  }

  const url = `${RAPIDAPI_BASE}/fixtures?team=${apiId}&last=${last}`;
  try {
    const r = await fetch(url, {
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": key,
      },
      // Sin cache: lo cacheamos NOSOTROS en KV vía el cron.
      cache: "no-store",
    });
    if (!r.ok) {
      console.error(`[team-form] api-football ${teamId} HTTP ${r.status}`);
      return null;
    }
    const data = (await r.json()) as ApiFootballResponse;
    if (!Array.isArray(data.response)) return null;

    return data.response.map((f): TeamRecentMatch => {
      const isHome = f.teams.home.id === apiId;
      const me = isHome ? f.teams.home : f.teams.away;
      const opp = isHome ? f.teams.away : f.teams.home;
      const goalsFor = isHome ? f.goals.home : f.goals.away;
      const goalsAgainst = isHome ? f.goals.away : f.goals.home;
      let result: TeamRecentMatch["result"] = "?";
      if (me.winner === true) result = "W";
      else if (me.winner === false) result = "L";
      else if (goalsFor !== null && goalsAgainst !== null) result = "D";
      return {
        date: f.fixture.date,
        opponent: opp.name,
        isHome,
        goalsFor,
        goalsAgainst,
        result,
        competition: f.league.name,
      };
    });
  } catch (err) {
    console.error(`[team-form] fetch failed ${teamId}:`, (err as Error).message);
    return null;
  }
}

/** Construye string resumen W-W-D-L-W de los últimos 5. */
export function buildFormSummary(matches: TeamRecentMatch[]): string {
  const last5 = matches.slice(0, 5);
  if (last5.length === 0) return "Sin datos recientes";
  const seq = last5.map((m) => m.result).join("-");
  let gf = 0, gc = 0;
  for (const m of last5) {
    if (typeof m.goalsFor === "number") gf += m.goalsFor;
    if (typeof m.goalsAgainst === "number") gc += m.goalsAgainst;
  }
  return `${seq} (${gf} GF / ${gc} GC en últimos ${last5.length})`;
}

/** Formatea TeamForm a líneas markdown para el prompt user. */
export function formatTeamFormForPrompt(form: TeamForm | null): string {
  if (!form || form.matches.length === 0) {
    return "- Forma reciente: sin datos disponibles";
  }
  const lines: string[] = [];
  lines.push(`- Forma reciente (resumen): ${form.summary}`);
  const recent = form.matches.slice(0, 5).map((m) => {
    const score =
      m.goalsFor !== null && m.goalsAgainst !== null
        ? `${m.goalsFor}-${m.goalsAgainst}`
        : "?-?";
    const venue = m.isHome ? "L" : "V";
    return `  ${m.date.slice(0, 10)} ${venue} ${score} vs ${m.opponent} [${m.competition}]`;
  });
  lines.push("- Últimos partidos:");
  lines.push(...recent);
  return lines.join("\n");
}

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
// API: https://www.api-football.com/documentation-v3 (api-sports directo)
// Endpoint: GET /fixtures?team={id}&last={n}
// Plan basic: 7500 req/día. Más que de sobra para 48 selecciones + reintentos.
//
// IMPORTANTE: usamos api-sports DIRECTO (dashboard.api-football.com),
// NO el wrapper de RapidAPI. Header es `x-apisports-key`, host es
// `v3.football.api-sports.io`. Env var: API_SPORTS_KEY (con fallback a
// RAPIDAPI_KEY para retrocompatibilidad).
//
// Mapeo team ID api-football ↔ selección Mundial 2026: en API_FOOTBALL_TEAM_IDS.

import { kv } from "@vercel/kv";
import { BRACKET_TEAMS } from "@/lib/bracket/teams";

const KV_PREFIX = "ia-coach:form:v1:";
const KV_TTL_SECONDS = 36 * 60 * 60; // 36 h (margen sobre el cron diario)

const API_SPORTS_HOST = "v3.football.api-sports.io";
const API_SPORTS_BASE = `https://${API_SPORTS_HOST}`;

/** Lee la key de API_SPORTS_KEY, con fallback a RAPIDAPI_KEY (legacy). */
function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}

// IDs de api-football.com (v3.football.api-sports.io) para las 48 selecciones del
// Mundial 2026. Keys = `id` de BRACKET_TEAMS (ISO3 upper). VALORES = id de la
// selección ABSOLUTA MASCULINA en api-football.
//
// Verificados 2026-06-10 resolviendo cada selección vía /teams?search= (filtrando
// national===true y descartando femeninas/juveniles) y confirmando que cada id
// devuelve partidos recientes de selección en /fixtures?last=. Sin duplicados.
// NO editar a mano: si cambia el bracket, re-resolver con el mismo método.
export const API_FOOTBALL_TEAM_IDS: Record<string, number> = {
  // Grupo A
  MEX: 16, ZAF: 1531, KOR: 17, CZE: 770,
  // Grupo B
  CAN: 5529, QAT: 1569, BIH: 1113, SUI: 15,
  // Grupo C
  BRA: 6, HAI: 2386, MAR: 31, SCO: 1108,
  // Grupo D
  USA: 2384, AUS: 20, PAR: 2380, TUR: 777,
  // Grupo E
  GER: 25, CIV: 1501, CUW: 5530, ECU: 2382,
  // Grupo F
  NED: 1118, TUN: 28, JPN: 12, SWE: 5,
  // Grupo G
  BEL: 1, NZL: 4673, EGY: 32, IRN: 22,
  // Grupo H
  ESP: 9, CPV: 1533, URU: 7, KSA: 23,
  // Grupo I
  FRA: 2, SEN: 13, NOR: 1090, IRQ: 1567,
  // Grupo J
  ARG: 26, ALG: 1532, AUT: 775, JOR: 1548,
  // Grupo K
  POR: 27, UZB: 1568, COL: 8, COD: 1508,
  // Grupo L
  ENG: 10, CRO: 3, GHA: 1504, PAN: 11,
};

// Sanity check (build-time): el mapeo debe cubrir las 48 selecciones del bracket
// y NO repetir ningún id de api-football (un id duplicado haría que una selección
// reciba la forma/H2H de otra — el bug corregido el 2026-06-10).
{
  const ids = Object.values(API_FOOTBALL_TEAM_IDS);
  const dup = ids.find((v, i) => ids.indexOf(v) !== i);
  if (dup !== undefined) {
    throw new Error(`[ia-coach/team-form] API_FOOTBALL_TEAM_IDS tiene un id duplicado: ${dup}`);
  }
  const missing = BRACKET_TEAMS.filter((t) => !(t.id in API_FOOTBALL_TEAM_IDS)).map((t) => t.id);
  if (missing.length > 0) {
    throw new Error(`[ia-coach/team-form] faltan selecciones en API_FOOTBALL_TEAM_IDS: ${missing.join(", ")}`);
  }
}

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
  const key = getApiKey();
  if (!key) {
    console.warn("[team-form] API_SPORTS_KEY missing");
    return null;
  }

  const url = `${API_SPORTS_BASE}/fixtures?team=${apiId}&last=${last}`;
  try {
    const r = await fetch(url, {
      headers: {
        "x-apisports-key": key,
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

    const mapped = data.response.map((f): TeamRecentMatch => {
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
    // No confiamos en que la API devuelva orden cronológico: ordenamos nosotros
    // (más reciente primero) para que "últimos 5" y la racha W-W-D-L sean reales.
    mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return mapped;
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

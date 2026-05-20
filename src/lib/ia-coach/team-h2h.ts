// src/lib/ia-coach/team-h2h.ts
//
// FASE 2.C: Historial H2H (head-to-head) entre dos selecciones via api-football.
//
// Estrategia:
//   - Cache KV con clave `${HOME_id}-${AWAY_id}` (orden canonicalizado).
//   - TTL largo (30 días) — el H2H histórico cambia poco.
//   - Fetch on-demand desde el context-builder: solo cuando el usuario pide
//     análisis del partido, no por cron. Así no malgastamos cuota.
//   - Si KV ya tiene H2H reciente, lo devuelve directo. Si no, llama API.
//
// API: GET /fixtures/headtohead?h2h={apiId1}-{apiId2}&last=10
// Coste: 1 call por par de equipos NUEVO. Los repetidos van a KV.

import { kv } from "@vercel/kv";
import { API_FOOTBALL_TEAM_IDS } from "./team-form";

const KV_PREFIX = "ia-coach:h2h:v1:";
const KV_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 días

const API_SPORTS_HOST = "v3.football.api-sports.io";
const API_SPORTS_BASE = `https://${API_SPORTS_HOST}`;

function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}

export interface H2HMatch {
  date: string; // ISO
  homeTeam: string;
  awayTeam: string;
  goalsHome: number | null;
  goalsAway: number | null;
  competition: string;
}

export interface H2HSummary {
  /** ID del equipo "home" desde la perspectiva del partido actual. */
  homeId: string;
  awayId: string;
  fetchedAt: string;
  matches: H2HMatch[]; // hasta 10, más recientes primero
  /** Récord textual: "8 partidos: ESP 3, URU 4, 1 empate" */
  recordText: string;
}

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

/** Canonicaliza orden de IDs para que la key del KV sea estable
 *  (ESP-URU y URU-ESP comparten el mismo histórico). */
function canonicalPair(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function kvKey(a: string, b: string): string {
  return `${KV_PREFIX}${canonicalPair(a, b)}`;
}

interface ApiFootballH2HFixture {
  fixture: { date: string };
  league: { name: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
}

interface ApiFootballH2HResponse {
  response: ApiFootballH2HFixture[];
  errors?: unknown;
}

/** Lee del KV. */
async function readCachedH2H(a: string, b: string): Promise<H2HSummary | null> {
  if (!isKvEnabled()) return null;
  try {
    return (await kv.get<H2HSummary>(kvKey(a, b))) || null;
  } catch (err) {
    console.error("[team-h2h] read failed:", (err as Error).message);
    return null;
  }
}

async function writeCachedH2H(summary: H2HSummary): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    await kv.set(kvKey(summary.homeId, summary.awayId), summary, {
      ex: KV_TTL_SECONDS,
    });
  } catch (err) {
    console.error("[team-h2h] write failed:", (err as Error).message);
  }
}

/** Llama a api-football /fixtures/headtohead. */
async function fetchH2H(
  apiId1: number,
  apiId2: number,
  last: number = 10,
): Promise<ApiFootballH2HFixture[] | null> {
  const key = getApiKey();
  if (!key) return null;
  const url = `${API_SPORTS_BASE}/fixtures/headtohead?h2h=${apiId1}-${apiId2}&last=${last}`;
  try {
    const r = await fetch(url, {
      headers: { "x-apisports-key": key },
      cache: "no-store",
    });
    if (!r.ok) {
      console.error(`[team-h2h] HTTP ${r.status}`);
      return null;
    }
    const data = (await r.json()) as ApiFootballH2HResponse;
    return Array.isArray(data.response) ? data.response : null;
  } catch (err) {
    console.error(`[team-h2h] fetch failed:`, (err as Error).message);
    return null;
  }
}

/** Build summary text "8 partidos: ESP 3, URU 4, 1 empate" */
function buildRecordText(
  homeId: string,
  awayId: string,
  matches: H2HMatch[],
): string {
  if (matches.length === 0) return "Sin enfrentamientos directos en datos recientes";
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  // Necesitamos saber qué team del fixture corresponde a homeId / awayId.
  // En el H2H de api-football, el orden home/away varía por partido. Vamos a
  // contar resultados pero referenciando los names: comparamos goalsHome/Away.
  // Para esto, devolvemos el récord en términos del fixture (home gana / away
  // gana / empate). El nombre por ID se infiere por el primer match.
  // Truco simpler: contamos victorias por team1 (homeId) usando match.homeTeam
  // nombre vs match.awayTeam. Pero no tenemos el nombre del bracket team aquí.
  // Más simple: el caller hace formatH2HForPrompt que sabe el name.
  for (const m of matches) {
    if (m.goalsHome === null || m.goalsAway === null) continue;
    if (m.goalsHome > m.goalsAway) homeWins++;
    else if (m.goalsAway > m.goalsHome) awayWins++;
    else draws++;
  }
  const total = matches.length;
  return `${total} partidos recientes: ${homeWins} v. local, ${awayWins} v. visitante, ${draws} empates`;
}

/**
 * Obtiene el H2H entre dos equipos. Primero intenta KV; si no, llama API
 * y cachea para próximas consultas (TTL 30 días).
 *
 * Devuelve null si no hay api IDs o falla la API. Si la API devuelve [],
 * devuelve un H2HSummary con matches: [] (caché válido para no re-llamar).
 */
export async function getH2H(
  homeId: string,
  awayId: string,
): Promise<H2HSummary | null> {
  // 1. KV cache
  const cached = await readCachedH2H(homeId, awayId);
  if (cached) return cached;

  // 2. Pedir a API
  const apiHome = API_FOOTBALL_TEAM_IDS[homeId];
  const apiAway = API_FOOTBALL_TEAM_IDS[awayId];
  if (!apiHome || !apiAway) return null;

  const fixtures = await fetchH2H(apiHome, apiAway, 10);
  if (fixtures === null) return null;

  const matches: H2HMatch[] = fixtures.map((f) => ({
    date: f.fixture.date,
    homeTeam: f.teams?.home?.name || "",
    awayTeam: f.teams?.away?.name || "",
    goalsHome: f.goals?.home ?? null,
    goalsAway: f.goals?.away ?? null,
    competition: f.league?.name || "",
  }));

  // Ordena por fecha desc (más reciente primero)
  matches.sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const summary: H2HSummary = {
    homeId,
    awayId,
    fetchedAt: new Date().toISOString(),
    matches,
    recordText: buildRecordText(homeId, awayId, matches),
  };

  await writeCachedH2H(summary);
  return summary;
}

/** Formato markdown para inyectar en el prompt user. */
export function formatH2HForPrompt(
  h2h: H2HSummary | null,
  homeName: string,
  awayName: string,
): string {
  if (!h2h || h2h.matches.length === 0) {
    return `## HISTORIAL H2H ${homeName} vs ${awayName}\n\nSin enfrentamientos directos en datos recientes.`;
  }
  const lines: string[] = [];
  lines.push(`## HISTORIAL H2H ${homeName} vs ${awayName}`);
  lines.push("");
  lines.push(`${h2h.recordText}`);
  lines.push("");
  lines.push("Últimos enfrentamientos:");
  for (const m of h2h.matches.slice(0, 6)) {
    const score =
      m.goalsHome !== null && m.goalsAway !== null
        ? `${m.goalsHome}-${m.goalsAway}`
        : "?-?";
    lines.push(
      `- ${m.date.slice(0, 10)}: ${m.homeTeam} ${score} ${m.awayTeam} [${m.competition}]`,
    );
  }
  return lines.join("\n");
}

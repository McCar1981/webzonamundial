// src/lib/ligas/plantilla.ts
//
// Estadísticas de temporada de los jugadores de un club, BAJO DEMANDA: nada se
// precarga; la primera visita a un equipo dispara la sincronización con
// api-football y el resultado queda en KV 24 h (N visitantes = 1 sincronización
// al día por club). Es la arquitectura pedida por Carlos: "solo traer la
// información cuando hay una petición".
//
// Fuente: /players?team=&season= (paginado). Se agregan las estadísticas de
// TODAS las competiciones de la temporada (liga + copas). Si la temporada en
// curso aún no tiene datos (pretemporada), cae a la anterior.

import { kv } from "@/lib/kv";

const API_SPORTS_BASE = "https://v3.football.api-sports.io";
const CACHE_TTL_S = 60 * 60 * 24; // 24 h
const MAX_PAGES = 4; // ~80 jugadores por temporada: de sobra para una plantilla

function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}

export interface PlayerSeasonStats {
  playerId: number;
  name: string;
  photo: string | null;
  apps: number;
  minutes: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  /** Nota media ponderada por minutos (null si el feed no puntúa). */
  rating: number | null;
}

export interface TeamSeasonStats {
  season: number;
  players: PlayerSeasonStats[];
}

interface RawPlayerRow {
  player: { id: number; name: string; photo: string | null };
  statistics: {
    games: { appearences: number | null; minutes: number | null; rating: string | null };
    goals: { total: number | null; assists: number | null };
    cards: { yellow: number | null; red: number | null };
  }[];
}
interface RawPlayersPage {
  response?: RawPlayerRow[];
  paging?: { current: number; total: number };
}

async function fetchPage(teamId: number, season: number, page: number): Promise<RawPlayersPage | null> {
  const key = getApiKey();
  if (!key) return null;
  try {
    const r = await fetch(`${API_SPORTS_BASE}/players?team=${teamId}&season=${season}&page=${page}`, {
      headers: { "x-apisports-key": key },
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) as RawPlayersPage;
  } catch {
    return null;
  }
}

async function fetchSeason(teamId: number, season: number): Promise<PlayerSeasonStats[]> {
  const byId = new Map<number, PlayerSeasonStats>();
  let totalPages = 1;
  for (let page = 1; page <= Math.min(totalPages, MAX_PAGES); page++) {
    const data = await fetchPage(teamId, season, page);
    if (!data?.response) break;
    totalPages = data.paging?.total ?? 1;
    for (const row of data.response) {
      if (!row.player?.id) continue;
      const agg = byId.get(row.player.id) ?? {
        playerId: row.player.id,
        name: row.player.name,
        photo: row.player.photo ?? null,
        apps: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0,
        rating: null as number | null,
      };
      let ratingWeighted = (agg.rating ?? 0) * agg.minutes;
      for (const s of row.statistics ?? []) {
        const min = s.games?.minutes ?? 0;
        agg.apps += s.games?.appearences ?? 0;
        agg.minutes += min;
        agg.goals += s.goals?.total ?? 0;
        agg.assists += s.goals?.assists ?? 0;
        agg.yellow += s.cards?.yellow ?? 0;
        agg.red += s.cards?.red ?? 0;
        const r = s.games?.rating ? Number(s.games.rating) : null;
        if (r && min > 0) ratingWeighted += r * min;
      }
      agg.rating = agg.minutes > 0 && ratingWeighted > 0 ? Math.round((ratingWeighted / agg.minutes) * 100) / 100 : agg.rating;
      byId.set(row.player.id, agg);
    }
  }
  return [...byId.values()];
}

/**
 * Estadísticas de la plantilla del club para la temporada con datos más
 * reciente (año en curso; si está virgen —pretemporada—, la anterior).
 * Cacheado en KV 24 h. Fail-soft a null (la página oculta la sección).
 */
export async function getTeamSeasonStats(teamId: number): Promise<TeamSeasonStats | null> {
  const cacheKey = `zl:plantilla:${teamId}`;
  try {
    const cached = await kv.get<TeamSeasonStats>(cacheKey);
    if (cached) return cached;
  } catch { /* sin KV: a la API */ }

  const year = new Date().getUTCFullYear();
  let season = year;
  let players = await fetchSeason(teamId, season);
  // Pretemporada: la campaña en curso aún no tiene minutos → usa la anterior.
  if (players.filter((p) => p.minutes > 0).length < 3) {
    const prev = await fetchSeason(teamId, year - 1);
    if (prev.filter((p) => p.minutes > 0).length > players.length) {
      season = year - 1;
      players = prev;
    }
  }
  if (!players.length) return null;

  players.sort((a, b) => b.minutes - a.minutes);
  const out: TeamSeasonStats = { season, players };
  try { await kv.set(cacheKey, out, { ex: CACHE_TTL_S }); } catch { /* best-effort */ }
  return out;
}

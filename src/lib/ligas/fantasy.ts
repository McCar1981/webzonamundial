// src/lib/ligas/fantasy.ts
//
// Tubería del Fantasy de Zona de Ligas: plantillas de equipos (pool de jugadores),
// estadísticas por jugador de un partido (para puntuar) y el motor de puntuación.
// Datos reales de api-football. Patrón self-contained del repo (propio apiGet,
// fail-soft) + caché KV (las plantillas cambian poco; las stats de un partido
// terminado no cambian). El coste va por caché, no por-request.
//
// Validado en vivo: /players/squads?team= (48 jugadores con posición) y
// /fixtures/players?fixture= (minutos, goles, asistencias, rating, tarjetas).

import { kv } from "@/lib/kv";

const API_SPORTS_BASE = "https://v3.football.api-sports.io";
function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}
async function apiGet<T>(path: string): Promise<T | null> {
  const key = getApiKey();
  if (!key) return null;
  try {
    const r = await fetch(`${API_SPORTS_BASE}${path}`, { headers: { "x-apisports-key": key }, cache: "no-store" });
    if (!r.ok) {
      console.error(`[liga-fantasy] ${path} -> HTTP ${r.status}`);
      return null;
    }
    const json = (await r.json()) as { response?: T };
    return (json.response ?? null) as T | null;
  } catch (err) {
    console.error(`[liga-fantasy] ${path} failed`, (err as Error).message);
    return null;
  }
}

export type Position = "GK" | "DEF" | "MID" | "FWD";

function normPos(p: string | null | undefined): Position {
  switch ((p ?? "").toLowerCase()) {
    case "goalkeeper": return "GK";
    case "defender": return "DEF";
    case "midfielder": return "MID";
    default: return "FWD"; // "Attacker" y desconocidos
  }
}

// ─── Plantilla de un equipo (pool) ───────────────────────────────────────────

export interface FantasyPlayer {
  id: number;
  name: string;
  position: Position;
  number: number | null;
  teamId: number;
  teamName: string;
}

interface RawSquad {
  team: { id: number; name: string };
  players: { id: number; name: string; number: number | null; position: string | null }[];
}

const SQUAD_TTL_S = 60 * 60 * 24 * 7; // 7 días
const squadKey = (teamId: number) => `zl:fantasy:squad:${teamId}`;

export async function getTeamSquad(teamId: number): Promise<FantasyPlayer[]> {
  try {
    const cached = await kv.get<FantasyPlayer[]>(squadKey(teamId));
    if (cached && cached.length) return cached;
  } catch { /* sin KV: a la API */ }

  const rows = await apiGet<RawSquad[]>(`/players/squads?team=${teamId}`);
  const sq = rows?.[0];
  if (!sq) return [];
  const players: FantasyPlayer[] = sq.players.map((p) => ({
    id: p.id,
    name: p.name,
    position: normPos(p.position),
    number: p.number,
    teamId: sq.team.id,
    teamName: sq.team.name,
  }));
  if (players.length) {
    try { await kv.set(squadKey(teamId), players, { ex: SQUAD_TTL_S }); } catch { /* best-effort */ }
  }
  return players;
}

// ─── Estadísticas por jugador de un partido (para puntuar) ───────────────────

export interface PlayerMatchStats {
  playerId: number;
  teamId: number;
  minutes: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  rating: number | null;
}

interface RawFixturePlayers {
  team: { id: number };
  players: {
    player: { id: number };
    statistics: {
      games: { minutes: number | null; rating: string | null };
      goals: { total: number | null; assists: number | null };
      cards: { yellow: number | null; red: number | null };
    }[];
  }[];
}

const FXSTATS_TTL_S = 60 * 60 * 24 * 7; // 7 días (un partido terminado no cambia)
const fxStatsKey = (fixtureId: number) => `zl:fantasy:fxstats:${fixtureId}`;

export async function getFixturePlayerStats(fixtureId: number): Promise<PlayerMatchStats[]> {
  try {
    const cached = await kv.get<PlayerMatchStats[]>(fxStatsKey(fixtureId));
    if (cached && cached.length) return cached;
  } catch { /* sin KV */ }

  const rows = await apiGet<RawFixturePlayers[]>(`/fixtures/players?fixture=${fixtureId}`);
  if (!rows) return [];
  const out: PlayerMatchStats[] = [];
  for (const block of rows) {
    for (const p of block.players) {
      const s = p.statistics?.[0];
      if (!s) continue;
      out.push({
        playerId: p.player.id,
        teamId: block.team.id,
        minutes: s.games?.minutes ?? 0,
        goals: s.goals?.total ?? 0,
        assists: s.goals?.assists ?? 0,
        yellow: s.cards?.yellow ?? 0,
        red: s.cards?.red ?? 0,
        rating: s.games?.rating ? Number(s.games.rating) : null,
      });
    }
  }
  if (out.length) {
    try { await kv.set(fxStatsKey(fixtureId), out, { ex: FXSTATS_TTL_S }); } catch { /* best-effort */ }
  }
  return out;
}

// ─── Motor de puntuación (puro, testeable) ───────────────────────────────────
// Modelo tipo FPL, simple y explicable. `conceded` = goles que encajó SU equipo
// en el partido (para la portería a cero).

export function scorePlayer(s: PlayerMatchStats, position: Position, conceded: number): number {
  if (s.minutes <= 0) return 0; // no jugó
  let pts = s.minutes >= 60 ? 2 : 1; // por jugar
  const goalPts = position === "GK" || position === "DEF" ? 6 : position === "MID" ? 5 : 4;
  pts += s.goals * goalPts;
  pts += s.assists * 3;
  if (conceded === 0 && s.minutes >= 60) {
    if (position === "GK" || position === "DEF") pts += 4;
    else if (position === "MID") pts += 1;
  }
  pts -= s.yellow * 1;
  pts -= s.red * 3;
  return pts;
}

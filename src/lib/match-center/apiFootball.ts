// src/lib/match-center/apiFootball.ts
//
// Adaptador de datos REALES en vivo desde api-football.com (api-sports directo).
// Convierte la respuesta cruda de la API en un LiveSnapshot del Match Center,
// idéntico en forma al guion de simulación, de modo que la UI no distingue la
// fuente.
//
// Auth: header `x-apisports-key`, host v3.football.api-sports.io.
// Env: API_SPORTS_KEY (fallback RAPIDAPI_KEY).
//
// El mapeo matchId(1..104) -> fixtureId de api-football se resuelve fuera de
// aquí (se conocerá cuando la FIFA publique el cuadro en la API). Esta función
// recibe el fixtureId ya resuelto.

import { buildLineup } from "./formations";
import type {
  LineupPlayer,
  LiveSnapshot,
  LiveStats,
  MatchEvent,
  MatchEventType,
  MatchMeta,
  Pair,
  TeamLineup,
} from "./types";
import { EMPTY_STATS } from "./types";

const API_SPORTS_BASE = "https://v3.football.api-sports.io";

function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}

async function apiGet<T>(path: string): Promise<T | null> {
  const key = getApiKey();
  if (!key) return null;
  try {
    const r = await fetch(`${API_SPORTS_BASE}${path}`, {
      headers: { "x-apisports-key": key },
      cache: "no-store",
    });
    if (!r.ok) {
      console.error(`[mc-apifootball] ${path} -> HTTP ${r.status}`);
      return null;
    }
    const json = (await r.json()) as { response?: T };
    return (json.response ?? null) as T | null;
  } catch (err) {
    console.error(`[mc-apifootball] ${path} failed`, (err as Error).message);
    return null;
  }
}

// --- Tipos crudos parciales de api-football ---
interface RawFixture {
  fixture: {
    id: number;
    date: string;
    referee: string | null;
    status: { short: string; elapsed: number | null };
    venue: { name: string | null; city: string | null };
  };
  teams: { home: { id: number }; away: { id: number } };
  goals: { home: number | null; away: number | null };
}
interface RawEvent {
  time: { elapsed: number | null; extra: number | null };
  team: { id: number };
  player: { name: string | null };
  assist: { name: string | null };
  type: string;
  detail: string;
}
interface RawStatBlock {
  team: { id: number };
  statistics: { type: string; value: number | string | null }[];
}
interface RawLineupPlayer {
  player: { number: number | null; pos: string | null; name: string | null; grid: string | null };
}
interface RawLineup {
  team: { id: number };
  formation: string | null;
  startXI: RawLineupPlayer[];
}

function mapEventType(type: string, detail: string): MatchEventType {
  const d = detail.toLowerCase();
  if (type === "Goal") {
    if (d.includes("own")) return "own_goal";
    if (d.includes("penalty") && d.includes("missed")) return "penalty_miss";
    if (d.includes("penalty")) return "penalty_goal";
    if (d.includes("missed")) return "penalty_miss";
    return "goal";
  }
  if (type === "Card") {
    if (d.includes("red")) return "red";
    if (d.includes("second")) return "second_yellow";
    return "yellow";
  }
  if (type === "subst") return "sub";
  if (type === "Var") return "var";
  return "chance";
}

function statNum(value: number | string | null): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const n = parseFloat(String(value).replace("%", "").trim());
  return Number.isFinite(n) ? n : 0;
}

function findStat(block: RawStatBlock | undefined, type: string): number {
  if (!block) return 0;
  const s = block.statistics.find((x) => x.type === type);
  return s ? statNum(s.value) : 0;
}

function lineupFromRaw(raw: RawLineup | undefined): TeamLineup {
  // Si la API aún no publicó alineaciones (típico antes del saque), generamos
  // un 4-3-3 por defecto para que la cancha y la ficha rendericen sin romper.
  const formation = raw?.formation || "4-3-3";
  const base = buildLineup(formation);
  // Superponemos nombres y dorsales reales por orden (GK, DF, MF, FW).
  const starters: LineupPlayer[] = base.starters.map((p, i) => {
    const real = raw?.startXI[i]?.player;
    return {
      num: real?.number ?? p.num,
      pos: real?.pos ?? p.pos,
      name: real?.name ?? undefined,
      x: p.x,
      y: p.y,
    };
  });
  return { formation: base.formation, starters };
}

/** Descarga y mapea un partido en vivo a LiveSnapshot. */
export async function fetchLiveSnapshot(
  fixtureId: number,
  meta: MatchMeta,
): Promise<LiveSnapshot | null> {
  const fixtures = await apiGet<RawFixture[]>(`/fixtures?id=${fixtureId}`);
  if (!fixtures || fixtures.length === 0) return null;
  const fx = fixtures[0];
  const homeId = fx.teams.home.id;
  const awayId = fx.teams.away.id;
  const sideOf = (teamId: number): MatchEvent["side"] =>
    teamId === homeId ? "home" : teamId === awayId ? "away" : "neutral";

  const [rawEvents, rawStats, rawLineups] = await Promise.all([
    apiGet<RawEvent[]>(`/fixtures/events?fixture=${fixtureId}`),
    apiGet<RawStatBlock[]>(`/fixtures/statistics?fixture=${fixtureId}`),
    apiGet<RawLineup[]>(`/fixtures/lineups?fixture=${fixtureId}`),
  ]);

  const events: MatchEvent[] = (rawEvents || []).map((e, idx) => {
    const minute = e.time.elapsed ?? 0;
    const extra = e.time.extra ?? undefined;
    const side = sideOf(e.team.id);
    const type = mapEventType(e.type, e.detail);
    const t = (minute + (extra || 0)) * 60;
    return {
      id: `live-${fixtureId}-${idx}`,
      t,
      minute,
      extra,
      type,
      side,
      player: e.player.name || undefined,
      assist: e.assist.name || undefined,
      playerIn: type === "sub" ? e.assist.name || undefined : undefined,
      detail: e.detail || undefined,
    };
  });
  events.sort((a, b) => a.t - b.t);

  const homeStats = (rawStats || []).find((s) => s.team.id === homeId);
  const awayStats = (rawStats || []).find((s) => s.team.id === awayId);
  const pair = (type: string): Pair => [findStat(homeStats, type), findStat(awayStats, type)];

  const possH = findStat(homeStats, "Ball Possession");
  const possA = findStat(awayStats, "Ball Possession");
  const stats: LiveStats =
    rawStats && rawStats.length > 0
      ? {
          possession: [possH || 50, possA || 50],
          shots: pair("Total Shots"),
          shotsOn: pair("Shots on Goal"),
          passes: pair("Total passes"),
          fouls: pair("Fouls"),
          corners: pair("Corner Kicks"),
          saves: pair("Goalkeeper Saves"),
          yellow: pair("Yellow Cards"),
          red: pair("Red Cards"),
          xg: [findStat(homeStats, "expected_goals"), findStat(awayStats, "expected_goals")],
        }
      : EMPTY_STATS;

  const homeLineup = lineupFromRaw((rawLineups || []).find((l) => l.team.id === homeId));
  const awayLineup = lineupFromRaw((rawLineups || []).find((l) => l.team.id === awayId));

  // Enriquecemos el meta con la sede/ciudad reales del fixture (nombres, banderas,
  // colores y fase legible en ES se conservan del meta original).
  const enriched: MatchMeta = {
    ...meta,
    venue: fx.fixture.venue.name || meta.venue,
    city: fx.fixture.venue.city || meta.city,
  };

  return {
    mode: "live",
    matchId: meta.id,
    status: fx.fixture.status.short,
    elapsed: fx.fixture.status.elapsed ?? 0,
    kickoff: fx.fixture.date,
    referee: fx.fixture.referee ?? undefined,
    score: [fx.goals.home ?? 0, fx.goals.away ?? 0],
    events,
    narration: {},
    stats,
    homeLineup,
    awayLineup,
    meta: enriched,
    updatedAt: Date.now(),
  };
}

/**
 * Snapshot ESTÁTICO de "por comenzar" cuando no hay datos en vivo todavía
 * (o la API no responde). Mantiene el partido parado: estado NS, sin eventos,
 * con un XI por defecto para pintar la cancha. Nunca simula.
 */
export function scheduledSnapshot(meta: MatchMeta, kickoff?: string): LiveSnapshot {
  return {
    mode: "live",
    matchId: meta.id,
    status: "NS",
    elapsed: 0,
    kickoff,
    score: [0, 0],
    events: [],
    narration: {},
    stats: EMPTY_STATS,
    homeLineup: lineupFromRaw(undefined),
    awayLineup: lineupFromRaw(undefined),
    meta,
    updatedAt: Date.now(),
  };
}

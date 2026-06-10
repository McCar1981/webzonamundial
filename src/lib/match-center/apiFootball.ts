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
import { withBallZones } from "./zones";
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
  // `/fixtures?id=` embebe estos bloques en la propia respuesta del fixture, de
  // modo que UNA petición trae eventos+stats+alineaciones (antes eran 4). Si la
  // API no los incluye, caemos a las peticiones sueltas como respaldo.
  events?: RawEvent[];
  statistics?: RawStatBlock[];
  lineups?: RawLineup[];
}
interface RawEvent {
  time: { elapsed: number | null; extra: number | null };
  team: { id: number };
  player: { id?: number | null; name: string | null };
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

  // Preferimos los bloques EMBEBIDOS en `/fixtures?id=` (1 request). Solo si la
  // API no los trae (poco común en vivo) pedimos los endpoints sueltos. Esto
  // baja el gasto de cuota de 4 a 1 request por partido.
  if (fx.events == null && fx.statistics == null && fx.lineups == null) {
    const [rawEvents, rawStats, rawLineups] = await Promise.all([
      apiGet<RawEvent[]>(`/fixtures/events?fixture=${fixtureId}`),
      apiGet<RawStatBlock[]>(`/fixtures/statistics?fixture=${fixtureId}`),
      apiGet<RawLineup[]>(`/fixtures/lineups?fixture=${fixtureId}`),
    ]);
    fx.events = rawEvents ?? undefined;
    fx.statistics = rawStats ?? undefined;
    fx.lineups = rawLineups ?? undefined;
  }

  return snapshotFromFixture(fx, meta);
}

/**
 * Descarga en LOTE varios partidos en una sola petición `/fixtures?ids=` (hasta
 * 20 por request). Devuelve un mapa matchId -> LiveSnapshot solo para los
 * fixtures que la API resolvió. Pensado para el poller centralizado: con un
 * único request se refresca toda la jornada en vivo (gran ahorro de cuota).
 */
export async function fetchLiveSnapshots(
  pairs: { matchId: number; fixtureId: number; meta: MatchMeta }[],
): Promise<Record<number, LiveSnapshot>> {
  const out: Record<number, LiveSnapshot> = {};
  if (pairs.length === 0) return out;

  // api-football limita a 20 ids por request: troceamos en lotes de 20.
  for (let i = 0; i < pairs.length; i += 20) {
    const batch = pairs.slice(i, i + 20);
    const ids = batch.map((p) => p.fixtureId).join("-");
    const fixtures = await apiGet<RawFixture[]>(`/fixtures?ids=${ids}`);
    if (!fixtures) continue;
    const byFixture = new Map(fixtures.map((f) => [f.fixture.id, f]));
    for (const p of batch) {
      const fx = byFixture.get(p.fixtureId);
      if (!fx) continue;
      out[p.matchId] = snapshotFromFixture(fx, p.meta);
    }
  }
  return out;
}

/** Mapea un RawFixture (con bloques embebidos) a LiveSnapshot. */
function snapshotFromFixture(fx: RawFixture, meta: MatchMeta): LiveSnapshot {
  const fixtureId = fx.fixture.id;
  const homeId = fx.teams.home.id;
  const awayId = fx.teams.away.id;
  const sideOf = (teamId: number): MatchEvent["side"] =>
    teamId === homeId ? "home" : teamId === awayId ? "away" : "neutral";

  const rawEvents = fx.events ?? null;
  const rawStats = fx.statistics ?? null;
  const rawLineups = fx.lineups ?? null;

  // ID ESTABLE por contenido (no por índice): api-football inserta/reordena
  // eventos entre polls (VAR, correcciones) y un id posicional desplazaría los
  // ids de eventos ya vistos → push duplicados, micros duplicadas y
  // re-celebraciones en el cliente. Misma técnica ya probada en
  // src/lib/friendlies/api.ts (eventKey + sufijo #n para colisiones).
  const usedKeys = new Map<string, number>();
  const events: MatchEvent[] = (rawEvents || []).map((e) => {
    const minute = e.time.elapsed ?? 0;
    const extra = e.time.extra ?? undefined;
    const side = sideOf(e.team.id);
    const type = mapEventType(e.type, e.detail);
    // extra se suma como SEGUNDOS (no minutos): así el 45+2 (2702) ordena antes
    // del 46' (2760) en vez de colarse en el segundo tiempo.
    const t = minute * 60 + (extra ?? 0);
    const who =
      e.player.id != null
        ? `p${e.player.id}`
        : (e.player.name ?? "").toLowerCase().replace(/[^a-z]/g, "");
    const base = `live-${fixtureId}-${minute}-${extra ?? 0}-${e.team.id}-${type}-${who}`;
    const n = usedKeys.get(base) ?? 0;
    usedKeys.set(base, n + 1);
    return {
      id: n === 0 ? base : `${base}#${n}`,
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
  events.sort((a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0));
  // El feed real no trae posición de jugada: la máquina de zonas asigna x/y por
  // tipo+lado, de modo que un gol viaja al área correcta y el balón nunca queda
  // en el lado equivocado. Eventos como cambio/VAR no mueven el balón.
  const placedEvents = withBallZones(events);

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
    events: placedEvents,
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

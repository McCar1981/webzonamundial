// src/lib/friendlies/api.ts
//
// Cliente de api-football para AMISTOSOS de selecciones (liga 10 "Friendlies").
// Mismo auth que el Match Center: header x-apisports-key, env API_SPORTS_KEY
// (fallback RAPIDAPI_KEY). Todas las funciones degradan a [] / null si no hay
// clave o la API falla, para que la web nunca rompa.

import type {
  FriendlyEvent,
  FriendlyEventType,
  FriendlyFixture,
  FriendlyLineup,
  FriendlySnapshot,
  FriendlyStat,
  Score,
} from "./types";
import { SELECCIONES } from "@/data/selecciones";
import { isoFromName } from "./flags";

const API_SPORTS_BASE = "https://v3.football.api-sports.io";

// Ligas de amistosos de SELECCIONES nacionales. La 10 es "Friendlies"
// (internacional de selecciones). Se deja como lista por si hay que ampliar.
export const FRIENDLY_LEAGUE_IDS = [10];

function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}

export function apiFootballEnabled(): boolean {
  return !!getApiKey();
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
      console.error(`[friendlies-api] ${path} -> HTTP ${r.status}`);
      return null;
    }
    const json = (await r.json()) as { response?: T };
    return (json.response ?? null) as T | null;
  } catch (err) {
    console.error(`[friendlies-api] ${path} failed`, (err as Error).message);
    return null;
  }
}

// --- Tipos crudos parciales de api-football ---
interface RawTeam {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}
interface RawFixtureRow {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
    venue: { name: string | null; city: string | null };
    referee: string | null;
  };
  league: { id: number; name: string; season: number };
  teams: { home: RawTeam; away: RawTeam };
  goals: { home: number | null; away: number | null };
  // `/fixtures?id=` embebe estos bloques en la propia respuesta del fixture, de
  // modo que UNA petición trae eventos+alineaciones+stats (antes eran 4). Si la
  // API no los incluye, caemos a los endpoints sueltos como respaldo.
  events?: RawEvent[];
  lineups?: RawLineup[];
  statistics?: RawStatRow[];
}
interface RawEvent {
  time: { elapsed: number | null; extra: number | null };
  team: { id: number };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
}
interface RawLineupPlayer {
  player: { number: number | null; pos: string | null; name: string | null };
}
interface RawLineup {
  team: { id: number };
  formation: string | null;
  coach: { name: string | null } | null;
  startXI: RawLineupPlayer[];
  substitutes: RawLineupPlayer[];
}
interface RawStatRow {
  team: { id: number };
  statistics: Array<{ type: string; value: number | string | null }>;
}

function toFixture(row: RawFixtureRow): FriendlyFixture {
  return {
    fixtureId: row.fixture.id,
    date: row.fixture.date,
    status: row.fixture.status.short,
    elapsed: row.fixture.status.elapsed,
    league: { id: row.league.id, name: row.league.name, season: row.league.season },
    home: { id: row.teams.home.id, name: row.teams.home.name, logo: row.teams.home.logo, winner: row.teams.home.winner },
    away: { id: row.teams.away.id, name: row.teams.away.name, logo: row.teams.away.logo, winner: row.teams.away.winner },
    goals: [row.goals.home, row.goals.away] as Score,
    venue: row.fixture.venue.name ?? undefined,
    city: row.fixture.venue.city ?? undefined,
    referee: row.fixture.referee ?? undefined,
  };
}

function isFriendly(leagueId: number): boolean {
  return FRIENDLY_LEAGUE_IDS.includes(leagueId);
}

// Selecciones NO absolutas: sub-21/20/19/23/17, olímpicas, etc. Las
// detectamos por el nombre del equipo que sirve api-football (p.ej. "Spain U21",
// "Argentina U-20", "Brazil Sub 23"). Solo queremos selecciones ABSOLUTAS.
const YOUTH_RE = /\b(U[-\s]?\d{1,2}|sub[-\s]?\d{1,2}|olympic|olímpic\w*)\b/i;

function isSeniorTeam(name: string): boolean {
  return !YOUTH_RE.test(name);
}

/** ¿Es un amistoso de selecciones ABSOLUTAS (ambos equipos seniors)? */
function isSeniorFriendly(row: RawFixtureRow): boolean {
  return (
    isFriendly(row.league.id) &&
    isSeniorTeam(row.teams.home.name) &&
    isSeniorTeam(row.teams.away.name)
  );
}

// ISO (alpha-2 / gb-sct…) de las 48 selecciones clasificadas al Mundial 2026.
// Sirve para quedarnos SOLO con amistosos en los que juegue al menos una de
// ellas, y así no gastar llamadas a api-football sondeando partidos
// irrelevantes (rivales no mundialistas entre sí).
const WORLD_CUP_ISOS = new Set(
  SELECCIONES.map((s) => s.flagCode.toLowerCase()).filter(Boolean),
);

/** ¿Es una de las 48 selecciones del Mundial? (por nombre inglés de api-football). */
function isWorldCupTeam(name: string): boolean {
  const iso = isoFromName(name);
  return iso != null && WORLD_CUP_ISOS.has(iso.toLowerCase());
}

/**
 * Amistoso que nos interesa: de selecciones absolutas Y con AL MENOS una de las
 * 48 del Mundial en el campo. Filtra los amistosos sin ninguna mundialista para
 * reducir el coste de polling en api-football.
 */
function isRelevantFriendly(row: RawFixtureRow): boolean {
  return (
    isSeniorFriendly(row) &&
    (isWorldCupTeam(row.teams.home.name) || isWorldCupTeam(row.teams.away.name))
  );
}

/** Todos los amistosos de selecciones absolutas EN VIVO ahora mismo (1 llamada). */
export async function fetchLiveFriendlies(): Promise<FriendlyFixture[]> {
  const rows = await apiGet<RawFixtureRow[]>(`/fixtures?live=all`);
  if (!rows) return [];
  return rows.filter(isRelevantFriendly).map(toFixture);
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

/** Todos los amistosos de selecciones absolutas de una temporada (1 llamada). */
export async function fetchFriendliesBySeason(season: number): Promise<FriendlyFixture[]> {
  const all: FriendlyFixture[] = [];
  for (const leagueId of FRIENDLY_LEAGUE_IDS) {
    const rows = await apiGet<RawFixtureRow[]>(
      `/fixtures?league=${leagueId}&season=${season}`,
    );
    if (rows) all.push(...rows.filter(isRelevantFriendly).map(toFixture));
  }
  return all;
}

/**
 * Busca el fixtureId de un amistoso por los nombres de los dos equipos (en
 * cualquier orden, comparación normalizada). Prioriza: partido en vivo ahora >
 * próximo programado más cercano > último jugado. Escanea toda la temporada
 * (no solo una ventana de días), para "montar" el Match Center sobre un amistoso
 * real sin mapear ids a mano. Devuelve null si no existe ese cruce.
 */
export async function findFriendlyFixtureId(
  teamA: string,
  teamB: string,
): Promise<number | null> {
  const a = norm(teamA);
  const b = norm(teamB);
  const matches = (fx: FriendlyFixture) => {
    const h = norm(fx.home.name);
    const v = norm(fx.away.name);
    return (
      (h.includes(a) && v.includes(b)) || (h.includes(b) && v.includes(a))
    );
  };

  // 1. En vivo ahora mismo.
  const live = await fetchLiveFriendlies();
  const liveHit = live.find(matches);
  if (liveHit) return liveHit.fixtureId;

  // 2. Toda la temporada (año actual y el siguiente, por si cruza de año).
  const year = new Date().getUTCFullYear();
  const seasons = Array.from(new Set([year, year + 1]));
  const all: FriendlyFixture[] = [];
  for (const s of seasons) all.push(...(await fetchFriendliesBySeason(s)));
  const cands = all.filter(matches);
  if (cands.length === 0) return null;

  const now = Date.now();
  const ts = (f: FriendlyFixture) => new Date(f.date).getTime();
  const upcoming = cands
    .filter((f) => ts(f) >= now)
    .sort((x, y) => ts(x) - ts(y));
  if (upcoming.length > 0) return upcoming[0].fixtureId;

  // Sin próximos: el más reciente ya jugado.
  return cands.sort((x, y) => ts(y) - ts(x))[0].fixtureId;
}

/** Amistosos de selecciones absolutas de una fecha concreta (YYYY-MM-DD, UTC). */
export async function fetchFriendliesByDate(date: string): Promise<FriendlyFixture[]> {
  const season = Number(date.slice(0, 4));
  const all: FriendlyFixture[] = [];
  for (const leagueId of FRIENDLY_LEAGUE_IDS) {
    const rows = await apiGet<RawFixtureRow[]>(
      `/fixtures?league=${leagueId}&season=${season}&date=${date}`,
    );
    if (rows) all.push(...rows.filter(isRelevantFriendly).map(toFixture));
  }
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

function mapEventType(type: string, detail: string): FriendlyEventType {
  const d = detail.toLowerCase();
  if (type === "Goal") {
    if (d.includes("own")) return "own_goal";
    if (d.includes("penalty") && d.includes("missed")) return "penalty_miss";
    if (d.includes("missed")) return "penalty_miss";
    if (d.includes("penalty")) return "penalty_goal";
    return "goal";
  }
  if (type === "Card") {
    if (d.includes("red")) return "red";
    if (d.includes("second")) return "second_yellow";
    return "yellow";
  }
  if (type === "subst") return "sub";
  if (type === "Var") return "var";
  return "other";
}

/** ID ESTABLE por contenido. Independiente del orden de la API, así un reorden
 *  no cambia el id de un suceso ya visto (evita re-notificar). El llamador añade
 *  un sufijo `#n` si dos eventos producen exactamente la misma clave. */
function eventKey(
  fixtureId: number,
  e: RawEvent,
  type: FriendlyEventType,
): string {
  const min = e.time.elapsed ?? 0;
  const extra = e.time.extra ?? 0;
  // Preferimos el id de jugador (numérico, estable); si no, su nombre normalizado.
  const who = e.player.id != null ? `p${e.player.id}` : norm(e.player.name ?? "");
  return `${fixtureId}-${min}-${extra}-${e.team.id}-${type}-${who}`;
}

/** Mapea eventos crudos (de `/fixtures/events` o del bloque embebido) a
 *  FriendlyEvent[] con id estable, ordenados ascendente por minuto. */
function mapEvents(
  raw: RawEvent[] | null,
  fixtureId: number,
  homeId: number,
  awayId: number,
): FriendlyEvent[] {
  if (!raw) return [];
  const used = new Map<string, number>();
  const events = raw.map((e) => {
    const minute = e.time.elapsed ?? 0;
    const extra = e.time.extra ?? undefined;
    const type = mapEventType(e.type, e.detail);
    const side: FriendlyEvent["side"] =
      e.team.id === homeId ? "home" : e.team.id === awayId ? "away" : "neutral";
    // Desambiguación de colisiones: misma clave de contenido → sufijo incremental.
    const base = eventKey(fixtureId, e, type);
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    const id = n === 0 ? base : `${base}#${n}`;
    return {
      id,
      minute,
      extra,
      type,
      side,
      player: e.player.name || undefined,
      playerId: e.player.id ?? undefined,
      assist: e.assist.name || undefined,
      playerIn: type === "sub" ? e.assist.name || undefined : undefined,
      detail: e.detail || undefined,
    } as FriendlyEvent;
  });
  return events.sort((a, b) => a.minute + (a.extra || 0) - (b.minute + (b.extra || 0)));
}

async function fetchEvents(fixtureId: number, homeId: number, awayId: number): Promise<FriendlyEvent[]> {
  const raw = await apiGet<RawEvent[]>(`/fixtures/events?fixture=${fixtureId}`);
  return mapEvents(raw, fixtureId, homeId, awayId);
}

function toLineup(raw: RawLineup | undefined): FriendlyLineup | null {
  if (!raw) return null;
  const mapPlayer = (p: RawLineupPlayer) => ({
    num: p.player.number,
    pos: p.player.pos,
    name: p.player.name,
  });
  return {
    formation: raw.formation,
    coach: raw.coach?.name ?? null,
    starters: raw.startXI.map(mapPlayer),
    substitutes: (raw.substitutes ?? []).map(mapPlayer),
  };
}

// Etiquetas legibles (ES) para los tipos de estadística de api-football.
const STAT_LABELS: Record<string, string> = {
  "Ball Possession": "Posesión",
  "Total Shots": "Tiros totales",
  "Shots on Goal": "Tiros a puerta",
  "Shots off Goal": "Tiros fuera",
  "Blocked Shots": "Tiros bloqueados",
  "Shots insidebox": "Tiros dentro del área",
  "Shots outsidebox": "Tiros fuera del área",
  "Corner Kicks": "Córners",
  Offsides: "Fueras de juego",
  Fouls: "Faltas",
  "Yellow Cards": "Tarjetas amarillas",
  "Red Cards": "Tarjetas rojas",
  "Goalkeeper Saves": "Paradas",
  "Total passes": "Pases totales",
  "Passes accurate": "Pases acertados",
  "Passes %": "Precisión de pases",
  expected_goals: "Goles esperados (xG)",
};

// Orden de presentación: las más relevantes primero.
const STAT_ORDER = [
  "Ball Possession",
  "Total Shots",
  "Shots on Goal",
  "expected_goals",
  "Corner Kicks",
  "Fouls",
  "Offsides",
  "Yellow Cards",
  "Red Cards",
  "Goalkeeper Saves",
  "Total passes",
  "Passes %",
];

/** Mapea filas crudas de estadísticas (de `/fixtures/statistics` o del bloque
 *  embebido) a FriendlyStat[] comparadas y ordenadas por relevancia. */
function mapStats(
  raw: RawStatRow[] | null,
  homeId: number,
  awayId: number,
): FriendlyStat[] {
  if (!raw || raw.length === 0) return [];
  const home = raw.find((r) => r.team.id === homeId);
  const away = raw.find((r) => r.team.id === awayId);
  const valueOf = (row: RawStatRow | undefined, type: string) =>
    row?.statistics.find((s) => s.type === type)?.value ?? null;

  const types = new Set<string>();
  for (const r of raw) for (const s of r.statistics) types.add(s.type);
  const ordered = [
    ...STAT_ORDER.filter((t) => types.has(t)),
    ...[...types].filter((t) => !STAT_ORDER.includes(t)),
  ];

  return ordered
    .map((type) => ({
      label: STAT_LABELS[type] ?? type,
      home: valueOf(home, type),
      away: valueOf(away, type),
    }))
    .filter((s) => s.home != null || s.away != null);
}

async function fetchStats(
  fixtureId: number,
  homeId: number,
  awayId: number,
): Promise<FriendlyStat[]> {
  const raw = await apiGet<RawStatRow[]>(
    `/fixtures/statistics?fixture=${fixtureId}`,
  );
  return mapStats(raw, homeId, awayId);
}

/** Mapea el bloque crudo de alineaciones (suelto o embebido) a {home, away}. */
function mapLineups(
  raw: RawLineup[] | null,
  homeId: number,
  awayId: number,
): { home: FriendlyLineup | null; away: FriendlyLineup | null } {
  if (!raw || raw.length === 0) return { home: null, away: null };
  return {
    home: toLineup(raw.find((l) => l.team.id === homeId)),
    away: toLineup(raw.find((l) => l.team.id === awayId)),
  };
}

/** Solo las alineaciones de un fixture (para el push previo al partido). */
export async function fetchLineups(
  fixtureId: number,
  homeId: number,
  awayId: number,
): Promise<{ home: FriendlyLineup | null; away: FriendlyLineup | null }> {
  const raw = await apiGet<RawLineup[]>(`/fixtures/lineups?fixture=${fixtureId}`);
  return mapLineups(raw, homeId, awayId);
}

/** ¿La cronología viene PARCIAL? El agregado `goals` tiene más goles de los que
 *  aparecen como eventos de gol → al proveedor le faltan sucesos de este amistoso. */
function detectPartialEvents(goals: Score, events: FriendlyEvent[]): boolean {
  const aggregate = (goals[0] ?? 0) + (goals[1] ?? 0);
  if (aggregate === 0) return false; // sin goles agregados no hay nada que contrastar
  const goalEvents = events.filter(
    (e) => e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal",
  ).length;
  return goalEvents < aggregate;
}

/** Snapshot completo (fixture + eventos + alineaciones) para la vista detalle.
 *  Aprovecha los bloques EMBEBIDOS en `/fixtures?id=` (1 request trae fixture +
 *  eventos + alineaciones + stats). Solo si la API no los incluye caemos a los
 *  endpoints sueltos (3 requests extra). Baja el gasto de cuota de 4 a 1. */
export async function fetchFriendlySnapshot(fixtureId: number): Promise<FriendlySnapshot | null> {
  const rows = await apiGet<RawFixtureRow[]>(`/fixtures?id=${fixtureId}`);
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  const fixture = toFixture(row);
  const { id: homeId } = fixture.home;
  const { id: awayId } = fixture.away;

  let events: FriendlyEvent[];
  let lineups: { home: FriendlyLineup | null; away: FriendlyLineup | null };
  let stats: FriendlyStat[];

  if (row.events != null || row.lineups != null || row.statistics != null) {
    // Bloques embebidos presentes → 0 peticiones extra. Un bloque ausente como
    // [] (p.ej. aún sin stats) se mapea a vacío, no dispara el respaldo.
    events = mapEvents(row.events ?? null, fixtureId, homeId, awayId);
    lineups = mapLineups(row.lineups ?? null, homeId, awayId);
    stats = mapStats(row.statistics ?? null, homeId, awayId);
  } else {
    // La API no embebió nada: respaldo a los endpoints sueltos (comportamiento previo).
    [events, lineups, stats] = await Promise.all([
      fetchEvents(fixtureId, homeId, awayId),
      fetchLineups(fixtureId, homeId, awayId),
      fetchStats(fixtureId, homeId, awayId),
    ]);
  }

  return {
    ...fixture,
    eventsPartial: detectPartialEvents(fixture.goals, events),
    events,
    homeLineup: lineups.home,
    awayLineup: lineups.away,
    stats,
    updatedAt: Date.now(),
  };
}

/** Eventos sueltos de un fixture (para el cron de polling). */
export async function fetchFriendlyEvents(
  fixtureId: number,
  homeId: number,
  awayId: number,
): Promise<FriendlyEvent[]> {
  return fetchEvents(fixtureId, homeId, awayId);
}

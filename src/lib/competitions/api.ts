// src/lib/competitions/api.ts
//
// Cliente de api-football para las competiciones de "Zona de Ligas" (fútbol de
// clubes). La tubería que alimenta las pantallas de liga/partido y los juegos
// multi-liga. Lee del catálogo src/data/competitions.ts (fuente única de ids).
//
// Sigue el patrón self-contained del repo (match-center/apiFootball.ts,
// friendlies/api.ts): su propio apiGet, auth por x-apisports-key con env
// API_SPORTS_KEY (fallback RAPIDAPI_KEY), y degradación fail-soft a []/null para
// que la web nunca rompa si falta la clave o la API falla.
//
// Coste: api-football (plan Ultra 75k/día) sobra; el cuello real es Vercel/KV, así
// que la TEMPORADA se cachea en KV (cambia como mucho una vez por temporada) y el
// consumo de fixtures debe ir por cron→KV en el nivel superior (como el Match
// Center), no por-request. Aquí está la capa de acceso a datos; el poller/los
// endpoints la consumen encima.

import { kv } from "@/lib/kv";

const API_SPORTS_BASE = "https://v3.football.api-sports.io";

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
      console.error(`[competitions-api] ${path} -> HTTP ${r.status}`);
      return null;
    }
    const json = (await r.json()) as { response?: T; errors?: unknown };
    // OJO: api-football NO devuelve 4xx cuando se agota la cuota diaria, la clave
    // es inválida o el plan caduca — responde 200 con { errors: {...}, response: [] }.
    // Si no miramos `errors`, ese [] entra como "éxito" y (peor) se CACHEA,
    // envenenando la caché justo durante la caída. En éxito errors es []/ausente;
    // en fallo es un objeto con claves (o un array no vacío).
    const errs = json.errors;
    const hasErr = Array.isArray(errs)
      ? errs.length > 0
      : !!errs && typeof errs === "object" && Object.keys(errs as object).length > 0;
    if (hasErr) {
      console.error(`[competitions-api] ${path} -> api errors ${JSON.stringify(errs).slice(0, 200)}`);
      return null;
    }
    return (json.response ?? null) as T | null;
  } catch (err) {
    console.error(`[competitions-api] ${path} failed`, (err as Error).message);
    return null;
  }
}

// ─── Caché KV de lecturas de api-football (protección de cuota) ──────────────
// El diseño per-request con cache:"no-store" QUEMABA la cuota diaria: cada vista
// de liga/club hacía llamadas en vivo (el hub dispara UNA por cada tile de liga,
// el club 3-4). Con esto, N visitas comparten 1 llamada por ventana. Solo se
// cachean ÉXITOS (respuesta != null): un fallo o "100% used" NO envenena la caché
// y se reintenta al recuperar cuota. Los `[]` (sin partidos) SÍ se cachean: son
// una respuesta válida, no un fallo.
const apiCacheKey = (path: string) => `zl:apicache:${path}`;

async function apiGetCached<T>(path: string, ttlSeconds: number): Promise<T | null> {
  try {
    const cached = await kv.get<T>(apiCacheKey(path));
    if (cached != null) return cached;
  } catch {
    // sin KV: vamos directos a la API
  }
  const fresh = await apiGet<T>(path);
  if (fresh != null) {
    try {
      await kv.set(apiCacheKey(path), fresh, { ex: ttlSeconds });
    } catch {
      // caché best-effort
    }
  }
  return fresh;
}

// TTL de fixtures: en vivo cambia rápido (marcador), lo demás (próximos/recientes)
// aguanta minutos sin problema. Cachear 5 min recorta el consumo ~10-100x bajo
// tráfico sin que el usuario note desfase en calendario/resultados.
const FIXTURES_TTL_LIVE_S = 30;
const FIXTURES_TTL_S = 300;

// ─── Resolver de temporada vigente (cacheado) ────────────────────────────────
// La temporada NO se hardcodea: cada liga marca su `current` en fechas distintas
// (visto el 2-jul en el parón: Liga MX/LaLiga en 2026 pero Bundesliga/Primeira en
// 2025). Se resuelve por liga con /leagues?id= y se cachea 12 h en KV.

const SEASON_TTL_S = 60 * 60 * 12; // 12 h
const seasonKey = (apiFootballId: number) => `comp:season:${apiFootballId}`;

interface RawLeagueSeasons {
  seasons?: { year: number; current: boolean }[];
}

export async function resolveCurrentSeason(apiFootballId: number): Promise<number | null> {
  try {
    const cached = await kv.get<number>(seasonKey(apiFootballId));
    if (typeof cached === "number") return cached;
  } catch {
    // sin KV: seguimos a la API
  }

  const rows = await apiGet<RawLeagueSeasons[]>(`/leagues?id=${apiFootballId}`);
  const seasons = rows?.[0]?.seasons ?? [];
  const current =
    seasons.find((s) => s.current)?.year ??
    (seasons.length ? Math.max(...seasons.map((s) => s.year)) : null);

  if (current != null) {
    try {
      await kv.set(seasonKey(apiFootballId), current, { ex: SEASON_TTL_S });
    } catch {
      // el cache es best-effort
    }
  }
  return current ?? null;
}

// ─── Fixtures normalizados por competición ───────────────────────────────────

export interface CompetitionTeam {
  id: number;
  name: string;
  logo: string; // escudo servido por api-football (uso nominativo; ver nota de marcas en el doc de diseño)
}

export interface CompetitionFixture {
  fixtureId: number;
  competitionId: number;
  season: number;
  kickoff: string; // ISO con zona horaria de api-sports (formatear en cliente, NUNCA offset fijo)
  status: string; // código corto: NS, 1H, HT, 2H, FT, AET, PEN, PST, CANC…
  elapsed: number | null;
  round: string; // "Apertura - 5", "Regular Season - 12", "Group Stage - 1"…
  venue: string | null;
  city: string | null;
  home: CompetitionTeam;
  away: CompetitionTeam;
  score: { home: number | null; away: number | null };
}

interface RawFixtureRow {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
    venue: { name: string | null; city: string | null };
  };
  league: { id: number; season: number; round: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

function mapFixture(r: RawFixtureRow): CompetitionFixture {
  return {
    fixtureId: r.fixture.id,
    competitionId: r.league.id,
    season: r.league.season,
    kickoff: r.fixture.date,
    status: r.fixture.status.short,
    elapsed: r.fixture.status.elapsed,
    round: r.league.round,
    venue: r.fixture.venue?.name ?? null,
    city: r.fixture.venue?.city ?? null,
    home: r.teams.home,
    away: r.teams.away,
    score: { home: r.goals.home, away: r.goals.away },
  };
}

export interface FixturesQuery {
  /** Temporada explícita; si se omite se resuelve la vigente (cacheada). */
  season?: number;
  /** Próximos N partidos. */
  next?: number;
  /** Últimos N partidos. */
  last?: number;
  /** Rango de fechas YYYY-MM-DD. */
  from?: string;
  to?: string;
  /** Ronda/jornada concreta, p.ej. "Regular Season - 5". */
  round?: string;
  /** Solo partidos en vivo de la competición. */
  live?: boolean;
}

export async function getCompetitionFixtures(
  apiFootballId: number,
  q: FixturesQuery = {},
): Promise<CompetitionFixture[]> {
  const params = new URLSearchParams({ league: String(apiFootballId) });

  // next / last / live devuelven los partidos CRONOLÓGICOS (próximos, recientes o
  // en vivo) y NO necesitan `season`. Es más: forzar season aquí rompe en el hueco
  // de PRETEMPORADA — api-football marca "current" la campaña ya terminada, cuyo
  // `next` es 0, mientras el calendario nuevo vive en la temporada siguiente. Por
  // eso, salvo que se pida una temporada explícita, estas consultas van sin season.
  const chronological = q.next != null || q.last != null || !!q.live;
  if (!(chronological && q.season == null)) {
    const season = q.season ?? (await resolveCurrentSeason(apiFootballId));
    if (season == null) return [];
    params.set("season", String(season));
  }
  if (q.next) params.set("next", String(q.next));
  if (q.last) params.set("last", String(q.last));
  if (q.from) params.set("from", q.from);
  if (q.to) params.set("to", q.to);
  if (q.round) params.set("round", q.round);
  if (q.live) params.set("live", "all");

  const ttl = q.live ? FIXTURES_TTL_LIVE_S : FIXTURES_TTL_S;
  const rows = await apiGetCached<RawFixtureRow[]>(`/fixtures?${params.toString()}`, ttl);
  return (rows ?? []).map(mapFixture);
}

// ─── Partidos del catálogo en vivo / de una fecha (portada) ───────────────────
// Una SOLA llamada a api-football (todas las ligas) filtrada a nuestro catálogo,
// para la franja "En vivo y de hoy" del hub. Cada fixture lleva el slug de su
// competición para poder enlazar a su Centro de Partido.

export interface CatalogFixture extends CompetitionFixture {
  competitionSlug: string;
  competitionShort: string;
}

async function catalogFixturesFrom(query: string): Promise<CatalogFixture[]> {
  const { COMPETITIONS } = await import("@/data/competitions");
  const byId = new Map(COMPETITIONS.map((c) => [c.apiFootballId, c]));
  const ttl = query.includes("live=all") ? FIXTURES_TTL_LIVE_S : FIXTURES_TTL_S;
  const rows = await apiGetCached<RawFixtureRow[]>(`/fixtures?${query}`, ttl);
  const out: CatalogFixture[] = [];
  for (const r of rows ?? []) {
    const comp = byId.get(r.league.id);
    if (!comp) continue;
    out.push({ ...mapFixture(r), competitionSlug: comp.slug, competitionShort: comp.short });
  }
  return out;
}

/** Partidos del catálogo EN VIVO ahora mismo. */
export async function getCatalogLiveFixtures(): Promise<CatalogFixture[]> {
  return catalogFixturesFrom("live=all");
}

/** Partidos del catálogo de una fecha (YYYY-MM-DD, UTC). */
export async function getCatalogFixturesOnDate(dateIso: string): Promise<CatalogFixture[]> {
  return catalogFixturesFrom(`date=${dateIso}`);
}

// ─── Clasificación por competición ───────────────────────────────────────────
// api-football devuelve `standings` como array de GRUPOS (cada uno un array de
// filas): las ligas de tabla única traen 1 grupo ("Serie A"), MLS 2 conferencias,
// las copas varios grupos ("Group A"…). El mapper es agnóstico al nº de grupos.
// Puede venir vacío (offseason —Liga MX entre Clausura y Apertura— o fase KO sin
// tabla): en ese caso [] y la UI oculta la sección.

export interface StandingRow {
  rank: number;
  team: CompetitionTeam;
  points: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  form: string | null; // "WWDLW" (últimos resultados), null si la API no lo trae
  group: string; // "Serie A" / "Western Conference" / "Group A"
}

export interface StandingsGroup {
  group: string;
  rows: StandingRow[];
}

interface RawStandingRow {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}
interface RawStandingsLeague {
  league: { standings: RawStandingRow[][] };
}

function mapStandingRow(r: RawStandingRow): StandingRow {
  return {
    rank: r.rank,
    team: r.team,
    points: r.points,
    played: r.all.played,
    win: r.all.win,
    draw: r.all.draw,
    lose: r.all.lose,
    goalsFor: r.all.goals.for,
    goalsAgainst: r.all.goals.against,
    goalsDiff: r.goalsDiff,
    form: r.form,
    group: r.group,
  };
}

export async function getCompetitionStandings(
  apiFootballId: number,
  season?: number,
): Promise<StandingsGroup[]> {
  const s = season ?? (await resolveCurrentSeason(apiFootballId));
  if (s == null) return [];
  const rows = await apiGet<RawStandingsLeague[]>(`/standings?league=${apiFootballId}&season=${s}`);
  const groups = rows?.[0]?.league?.standings ?? [];
  return groups
    .filter((g) => g.length > 0)
    .map((g) => ({ group: g[0].group, rows: g.map(mapStandingRow) }));
}

// ─── Detalle de un partido (Centro de Partido) ───────────────────────────────
// api-football embebe eventos + alineaciones + estadísticas en /fixtures?id= (1
// request en vez de 4). Sirve para previa (sin eventos), en vivo y post-partido.

export interface FixtureEvent {
  minute: number | null;
  type: string; // Goal, Card, subst, Var
  detail: string; // "Normal Goal", "Yellow Card", "Substitution 1"…
  teamId: number;
  playerId: number | null;
  player: string | null;
  assist: string | null;
}

export interface FixtureLineup {
  teamId: number;
  teamName: string;
  formation: string | null;
  startXI: { name: string; id: number | null }[]; // once (nombre + id para foto/ficha)
}

export interface FixtureStat {
  teamId: number;
  items: { type: string; value: string | number | null }[];
}

export interface FixtureDetail {
  fixture: CompetitionFixture;
  events: FixtureEvent[];
  lineups: FixtureLineup[];
  stats: FixtureStat[];
}

interface RawEvent {
  time: { elapsed: number | null };
  team: { id: number };
  player: { id: number | null; name: string | null };
  assist: { name: string | null };
  type: string;
  detail: string;
}
interface RawLineup {
  team: { id: number; name: string };
  formation: string | null;
  startXI: { player: { id: number | null; name: string | null } }[];
}
interface RawStatBlock {
  team: { id: number };
  statistics: { type: string; value: string | number | null }[];
}
interface RawFixtureDetailRow extends RawFixtureRow {
  events?: RawEvent[];
  lineups?: RawLineup[];
  statistics?: RawStatBlock[];
}

export async function getFixtureDetail(fixtureId: number): Promise<FixtureDetail | null> {
  const rows = await apiGet<RawFixtureDetailRow[]>(`/fixtures?id=${fixtureId}`);
  const r = rows?.[0];
  if (!r) return null;
  return {
    fixture: mapFixture(r),
    events: (r.events ?? []).map((e) => ({
      minute: e.time.elapsed,
      type: e.type,
      detail: e.detail,
      teamId: e.team.id,
      playerId: e.player?.id ?? null,
      player: e.player?.name ?? null,
      assist: e.assist?.name ?? null,
    })),
    lineups: (r.lineups ?? []).map((l) => ({
      teamId: l.team.id,
      teamName: l.team.name,
      formation: l.formation,
      startXI: (l.startXI ?? []).map((p) => ({ name: p.player?.name ?? "—", id: p.player?.id ?? null })),
    })),
    stats: (r.statistics ?? []).map((s) => ({
      teamId: s.team.id,
      items: (s.statistics ?? []).map((x) => ({ type: x.type, value: x.value })),
    })),
  };
}

// ─── Detalle de un partido (Centro de Partido read-only) ─────────────────────
// /fixtures?id= devuelve los bloques EMBEBIDOS (eventos + alineaciones + stats)
// en UNA sola request — el mismo truco de cuota que usa el Match Center del
// Mundial. Verificado en vivo (Cruzeiro-Fluminense: 16 eventos, 2 lineups,

// ─── Partidos de un equipo (Pantalla de Equipo) ──────────────────────────────
// /fixtures?team=X&last/next= — SIN season: devuelve los partidos del equipo a
// través de todas sus competiciones (verificado: Flamengo trae Brasileirão y
// Libertadores). Se incluye el nombre de la competición por partido.

export interface TeamFixture {
  fixtureId: number;
  kickoff: string;
  status: string;
  elapsed: number | null;
  leagueName: string;
  home: CompetitionTeam;
  away: CompetitionTeam;
  score: { home: number | null; away: number | null };
}

interface RawTeamFixtureRow extends RawFixtureRow {
  league: { id: number; season: number; round: string; name: string };
}

export async function getTeamFixtures(
  teamId: number,
  opts: { last?: number; next?: number } = {},
): Promise<TeamFixture[]> {
  const params = new URLSearchParams({ team: String(teamId) });
  if (opts.last) params.set("last", String(opts.last));
  if (opts.next) params.set("next", String(opts.next));
  const rows = await apiGetCached<RawTeamFixtureRow[]>(`/fixtures?${params.toString()}`, FIXTURES_TTL_S);
  return (rows ?? []).map((r) => ({
    fixtureId: r.fixture.id,
    kickoff: r.fixture.date,
    status: r.fixture.status.short,
    elapsed: r.fixture.status.elapsed,
    leagueName: r.league.name,
    home: r.teams.home,
    away: r.teams.away,
    score: { home: r.goals.home, away: r.goals.away },
  }));
}

// ─── Identidad de un equipo (fallback cuando NO hay fixtures) ────────────────
// La pantalla de club derivaba nombre/escudo SOLO de los fixtures; si /fixtures
// venía vacío (parón profundo, club recién ascendido, o api-football caída/sin
// cuota) la página hacía notFound() → 404 para un club que SÍ existe. /teams?id=
// resuelve la identidad de forma independiente. KV 7 días (la identidad de un
// club no cambia). Fail-soft: null si la API tampoco responde.

export interface TeamInfo {
  id: number;
  name: string;
  logo: string;
}

interface RawTeamInfoRow {
  team?: { id: number; name: string; logo: string };
}

const teamInfoKey = (id: number) => `zl:teaminfo:${id}`;

export async function getTeamInfo(teamId: number): Promise<TeamInfo | null> {
  try {
    const cached = await kv.get<TeamInfo>(teamInfoKey(teamId));
    if (cached && cached.name) return cached;
  } catch {
    // sin KV: seguimos a la API
  }
  const rows = await apiGet<RawTeamInfoRow[]>(`/teams?id=${teamId}`);
  const t = rows?.[0]?.team;
  if (!t || !t.name) return null;
  const info: TeamInfo = { id: t.id, name: t.name, logo: t.logo };
  try {
    await kv.set(teamInfoKey(teamId), info, { ex: 60 * 60 * 24 * 7 });
  } catch {
    // caché best-effort
  }
  return info;
}

// ─── Estado de la cuenta api-football (diagnóstico) ──────────────────────────
// /status devuelve la suscripción y el consumo del día. Lo usa /api/health para
// que una caída de api-football (clave inválida, plan caducado, cuota agotada)
// sea VISIBLE — antes era invisible: el sitio devolvía 404/vacío en todas las
// pantallas de datos mientras /api/health seguía en verde (no lo comprobaba).
export interface ApiFootballStatus {
  active: boolean;
  used: number;
  limit: number;
  plan: string | null;
}

interface RawApiFootballStatus {
  account?: { firstname?: string };
  subscription?: { plan?: string; active?: boolean };
  requests?: { current?: number; limit_day?: number };
}

export async function getApiFootballStatus(): Promise<ApiFootballStatus | null> {
  // Cacheado 60s: /api/health lo pinga a menudo (UptimeRobot ~1/min) y no debe
  // disparar una llamada externa por ping. /status NO consume cuota de fixtures.
  const raw = await apiGetCached<RawApiFootballStatus>(`/status`, 60);
  if (!raw || !raw.requests) return null;
  return {
    active: raw.subscription?.active ?? false,
    used: raw.requests.current ?? 0,
    limit: raw.requests.limit_day ?? 0,
    plan: raw.subscription?.plan ?? null,
  };
}

// ─── Detalle de partido cacheado ─────────────────────────────────────────────
// Wrapper KV de getFixtureDetail para superficies POR USUARIO que no pueden usar
// ISR (p.ej. "Mis predicciones"): N usuarios/vistas comparten 1 llamada por
// fixture por ventana (corta si en vivo, larga si terminó). Fail-soft.

const detailKey = (id: number) => `zl:detail:${id}`;

export async function getFixtureDetailCached(fixtureId: number): Promise<FixtureDetail | null> {
  try {
    const cached = await kv.get<FixtureDetail>(detailKey(fixtureId));
    if (cached) return cached;
  } catch {
    // sin KV: seguimos
  }
  const d = await getFixtureDetail(fixtureId);
  if (!d) return null;
  const s = d.fixture.status;
  const ttl = ["FT", "AET", "PEN"].includes(s)
    ? 60 * 60 * 24 * 3 // terminado: 3 días
    : ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(s)
      ? 60 // en vivo: 60s
      : 300; // por comenzar
  try {
    await kv.set(detailKey(fixtureId), d, { ex: ttl });
  } catch {
    // caché best-effort
  }
  return d;
}

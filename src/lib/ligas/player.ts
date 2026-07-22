// src/lib/ligas/player.ts
//
// Ficha COMPLETA de un jugador (datos personales + estadísticas por competición)
// BAJO DEMANDA desde api-football. La primera visita a la ficha sincroniza y el
// resultado queda en KV 24 h. Fuente: /players?id=&season= (perfil + un bloque de
// estadísticas por competición de la temporada). Se prueba el año en curso y, si
// no hay datos (fichaje reciente / pretemporada), los dos anteriores.
//
// api-football NO expone valor de mercado; eso vive aparte (Transfermarkt, solo
// selecciones por ahora) y no se resuelve aquí.

import { kv } from "@/lib/kv";

const API_SPORTS_BASE = "https://v3.football.api-sports.io";
const CACHE_TTL_S = 60 * 60 * 24; // 24 h

function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}

export interface PlayerCompetition {
  kind: "club" | "national"; // club vs selección
  leagueId: number;
  league: string;
  leagueLogo: string | null;
  teamId: number;
  team: string;
  teamLogo: string | null;
  season: number;
  appearances: number;
  lineups: number;
  minutes: number;
  position: string | null;
  number: number | null;
  rating: number | null;
  captain: boolean;
  goals: number;
  assists: number;
  shotsTotal: number;
  shotsOn: number;
  passesTotal: number;
  passesKey: number;
  passAccuracy: number | null;
  dribblesAttempts: number;
  dribblesSuccess: number;
  tacklesTotal: number;
  interceptions: number;
  duelsTotal: number;
  duelsWon: number;
  foulsDrawn: number;
  foulsCommitted: number;
  yellow: number;
  red: number;
  penaltyScored: number;
  penaltyMissed: number;
  penaltyWon: number;
  penaltyCommitted: number;
  penaltySaved: number; // penaltis parados (portero)
  subIn: number;
  subOut: number;
  bench: number;
  conceded: number; // goles encajados (portero)
  saves: number; // paradas (portero)
  tacklesBlocks: number;
  dribblesPast: number; // veces superado en regate
  yellowRed: number; // doble amarilla
}

export interface PlayerProfile {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  birthDate: string | null;
  birthPlace: string | null;
  birthCountry: string | null;
  nationality: string | null;
  height: string | null;
  weight: string | null;
  injured: boolean;
  photo: string | null;
  position: string | null; // la más frecuente entre sus competiciones
  number: number | null;
  season: number;
  rating: number | null; // media ponderada por minutos
  competitions: PlayerCompetition[];
  totals: { appearances: number; minutes: number; goals: number; assists: number; yellow: number; red: number };
}

interface RawStat {
  team: { id: number; name: string; logo: string | null };
  league: { id: number; name: string; logo: string | null; season: number };
  games: { appearences: number | null; lineups: number | null; minutes: number | null; number: number | null; position: string | null; rating: string | null; captain: boolean | null };
  substitutes: { in: number | null; out: number | null; bench: number | null } | null;
  shots: { total: number | null; on: number | null };
  goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
  passes: { total: number | null; key: number | null; accuracy: number | null };
  tackles: { total: number | null; blocks: number | null; interceptions: number | null };
  duels: { total: number | null; won: number | null };
  dribbles: { attempts: number | null; success: number | null; past: number | null };
  fouls: { drawn: number | null; committed: number | null };
  cards: { yellow: number | null; yellowred: number | null; red: number | null };
  penalty: { won: number | null; commited: number | null; scored: number | null; missed: number | null; saved: number | null };
}
interface RawPlayer {
  player: {
    id: number; name: string; firstname: string | null; lastname: string | null; age: number | null;
    birth: { date: string | null; place: string | null; country: string | null } | null;
    nationality: string | null; height: string | null; weight: string | null; injured: boolean | null; photo: string | null;
  };
  statistics: RawStat[];
}

const num = (v: number | null | undefined): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

async function apiGet(path: string): Promise<{ response?: RawPlayer[] } | null> {
  const key = getApiKey();
  if (!key) return null;
  try {
    const r = await fetch(`${API_SPORTS_BASE}${path}`, { headers: { "x-apisports-key": key }, cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as { response?: RawPlayer[] };
  } catch {
    return null;
  }
}

// ¿Es una competición de SELECCIÓN? api-football no rellena team.national ni
// league.type en /players, así que se clasifica por el nombre de la liga.
// "Club" descarta los falsos amigos ("Friendlies Clubs", "FIFA Club World Cup").
export function isNationalTeamLeague(leagueName: string): boolean {
  const n = (leagueName || "").toLowerCase();
  if (n.includes("club")) return false;
  return /world cup|copa am[eé]rica|nations league|\beuro\b|european championship|qualif|africa cup|afcon|asian cup|gold cup|copa oro|confederations|olympic|friendlies/.test(n);
}

function toComp(s: RawStat): PlayerCompetition {
  return {
    kind: isNationalTeamLeague(s.league.name) ? "national" : "club",
    leagueId: s.league.id,
    league: s.league.name,
    leagueLogo: s.league.logo ?? null,
    teamId: s.team.id,
    team: s.team.name,
    teamLogo: s.team.logo ?? null,
    season: s.league.season,
    appearances: num(s.games.appearences),
    lineups: num(s.games.lineups),
    minutes: num(s.games.minutes),
    position: s.games.position ?? null,
    number: s.games.number ?? null,
    rating: s.games.rating ? Math.round(Number(s.games.rating) * 100) / 100 : null,
    captain: !!s.games.captain,
    goals: num(s.goals.total),
    assists: num(s.goals.assists),
    shotsTotal: num(s.shots.total),
    shotsOn: num(s.shots.on),
    passesTotal: num(s.passes.total),
    passesKey: num(s.passes.key),
    passAccuracy: s.passes.accuracy != null ? num(s.passes.accuracy) : null,
    dribblesAttempts: num(s.dribbles.attempts),
    dribblesSuccess: num(s.dribbles.success),
    tacklesTotal: num(s.tackles.total),
    interceptions: num(s.tackles.interceptions),
    duelsTotal: num(s.duels.total),
    duelsWon: num(s.duels.won),
    foulsDrawn: num(s.fouls.drawn),
    foulsCommitted: num(s.fouls.committed),
    yellow: num(s.cards.yellow),
    red: num(s.cards.red),
    penaltyScored: num(s.penalty.scored),
    penaltyMissed: num(s.penalty.missed),
    penaltyWon: num(s.penalty.won),
    penaltyCommitted: num(s.penalty.commited), // api-football lo escribe "commited"
    penaltySaved: num(s.penalty.saved),
    subIn: num(s.substitutes?.in),
    subOut: num(s.substitutes?.out),
    bench: num(s.substitutes?.bench),
    conceded: num(s.goals.conceded),
    saves: num(s.goals.saves),
    tacklesBlocks: num(s.tackles.blocks),
    dribblesPast: num(s.dribbles.past),
    yellowRed: num(s.cards.yellowred),
  };
}

function mapProfile(raw: RawPlayer, season: number): PlayerProfile {
  const p = raw.player;
  const comps = (raw.statistics ?? []).map(toComp);
  // Ordena por minutos desc (la competición principal primero).
  comps.sort((a, b) => b.minutes - a.minutes);

  const totals = comps.reduce(
    (t, c) => ({
      appearances: t.appearances + c.appearances,
      minutes: t.minutes + c.minutes,
      goals: t.goals + c.goals,
      assists: t.assists + c.assists,
      yellow: t.yellow + c.yellow,
      red: t.red + c.red,
    }),
    { appearances: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0 },
  );

  // Rating medio ponderado por minutos.
  let rw = 0;
  for (const c of comps) if (c.rating && c.minutes > 0) rw += c.rating * c.minutes;
  const rating = totals.minutes > 0 && rw > 0 ? Math.round((rw / totals.minutes) * 100) / 100 : null;

  const primary = comps[0] ?? null;

  return {
    id: p.id,
    name: p.name,
    firstname: p.firstname ?? null,
    lastname: p.lastname ?? null,
    age: p.age ?? null,
    birthDate: p.birth?.date ?? null,
    birthPlace: p.birth?.place ?? null,
    birthCountry: p.birth?.country ?? null,
    nationality: p.nationality ?? null,
    height: p.height ?? null,
    weight: p.weight ?? null,
    injured: !!p.injured,
    photo: p.photo ?? null,
    position: primary?.position ?? null,
    number: primary?.number ?? null,
    season,
    rating,
    competitions: comps,
    totals,
  };
}

/** Ficha completa del jugador (perfil + estadísticas por competición). null si no
 *  existe / sin datos en las últimas temporadas. Cacheada 24 h en KV. */
export async function getPlayerProfile(playerId: number): Promise<PlayerProfile | null> {
  // v3: preferir la temporada con fútbol de CLUB (antes tomaba la 1ª con datos,
  // que en pretemporada es solo la SELECCIÓN → la ficha salía "de Spain").
  const cacheKey = `zl:player:v3:${playerId}`;
  try {
    const cached = await kv.get<PlayerProfile>(cacheKey);
    if (cached) return cached;
  } catch { /* sin KV: a la API */ }

  const year = new Date().getUTCFullYear();
  let fallback: PlayerProfile | null = null; // más reciente con datos (aunque sea solo selección)
  for (const season of [year, year - 1, year - 2]) {
    const raw = await apiGet(`/players?id=${playerId}&season=${season}`);
    const row = raw?.response?.[0];
    if (!row?.player?.id) continue;
    const profile = mapProfile(row, season);
    const clubMinutes = profile.competitions.reduce((s, c) => s + (c.kind === "club" ? c.minutes : 0), 0);
    if (clubMinutes > 0) {
      // Temporada con fútbol de club (la más reciente): la ideal para la ficha.
      try { await kv.set(cacheKey, profile, { ex: CACHE_TTL_S }); } catch { /* best-effort */ }
      return profile;
    }
    if (!fallback && (profile.competitions.length > 0 || profile.name)) fallback = profile;
  }
  if (fallback) {
    try { await kv.set(cacheKey, fallback, { ex: CACHE_TTL_S }); } catch { /* best-effort */ }
    return fallback;
  }
  return null;
}

// ─── Clubes por los que ha pasado (tira "ha vestido") ────────────────────────
// Fuente: /transfers (1 llamada, cacheada 24 h). Del más reciente al más antiguo.

export interface PlayerClub { id: number; name: string; logo: string | null }
interface RawTeamRef { id: number; name: string; logo: string | null }
interface RawTransfers { response?: { transfers?: { teams?: { in?: RawTeamRef | null; out?: RawTeamRef | null } }[] }[] }

export async function getPlayerClubs(playerId: number): Promise<PlayerClub[]> {
  const cacheKey = `zl:playerclubs:${playerId}`;
  try {
    const cached = await kv.get<PlayerClub[]>(cacheKey);
    if (cached) return cached;
  } catch { /* sin KV: a la API */ }

  const key = getApiKey();
  if (!key) return [];
  let data: RawTransfers | null = null;
  try {
    const r = await fetch(`${API_SPORTS_BASE}/transfers?player=${playerId}`, { headers: { "x-apisports-key": key }, cache: "no-store" });
    if (r.ok) data = (await r.json()) as RawTransfers;
  } catch { return []; }

  const trs = data?.response?.[0]?.transfers ?? [];
  const out: PlayerClub[] = [];
  const seen = new Set<number>();
  const add = (t?: RawTeamRef | null) => {
    if (t && typeof t.id === "number" && t.id > 0 && t.name && !seen.has(t.id)) {
      seen.add(t.id);
      out.push({ id: t.id, name: t.name, logo: t.logo ?? null });
    }
  };
  for (const t of trs) { add(t.teams?.in); add(t.teams?.out); } // in = club más reciente
  try { await kv.set(cacheKey, out, { ex: CAREER_TTL_S }); } catch { /* best-effort */ }
  return out;
}

// ─── Carrera completa (histórico), SEPARADA en CLUB y SELECCIÓN ──────────────
// Cara: una llamada por temporada jugada. BAJO DEMANDA (la pide el cliente al
// abrir la sección) + cache 30 días + tope 25 temporadas. Cada trayectoria trae
// filas ricas por temporada (PJ, minutos, goles, asist., tarjetas, nota media).

export interface CareerRow {
  season: number;
  teams: string[];
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  rating: number | null; // media ponderada por minutos
}
export interface CareerTotals {
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
}
export interface PlayerCareer {
  club: { seasons: CareerRow[]; totals: CareerTotals };
  national: { seasons: CareerRow[]; totals: CareerTotals; teams: string[] };
}

const CAREER_TTL_S = 60 * 60 * 24 * 30; // 30 días
const CAREER_MAX_SEASONS = 25;
const CAREER_BATCH = 5; // temporadas por lote (respeta el rate-limit)

async function apiGetSeasons(playerId: number): Promise<number[]> {
  const key = getApiKey();
  if (!key) return [];
  try {
    const r = await fetch(`${API_SPORTS_BASE}/players/seasons?player=${playerId}`, { headers: { "x-apisports-key": key }, cache: "no-store" });
    if (!r.ok) return [];
    const j = (await r.json()) as { response?: number[] };
    return Array.isArray(j.response) ? j.response.filter((y): y is number => typeof y === "number") : [];
  } catch {
    return [];
  }
}

// Acumulador por (kind, temporada): suma competiciones y pondera la nota por minutos.
interface Acc { teams: Set<string>; apps: number; min: number; goals: number; assists: number; yellow: number; red: number; ratingW: number; ratingMin: number }
function newAcc(): Acc { return { teams: new Set(), apps: 0, min: 0, goals: 0, assists: 0, yellow: 0, red: 0, ratingW: 0, ratingMin: 0 }; }
function accAdd(a: Acc, c: PlayerCompetition): void {
  a.teams.add(c.team);
  a.apps += c.appearances; a.min += c.minutes; a.goals += c.goals; a.assists += c.assists; a.yellow += c.yellow; a.red += c.red;
  if (c.rating && c.minutes > 0) { a.ratingW += c.rating * c.minutes; a.ratingMin += c.minutes; }
}
function accToRow(season: number, a: Acc): CareerRow {
  return {
    season, teams: [...a.teams], appearances: a.apps, minutes: a.min, goals: a.goals, assists: a.assists, yellow: a.yellow, red: a.red,
    rating: a.ratingMin > 0 ? Math.round((a.ratingW / a.ratingMin) * 100) / 100 : null,
  };
}
function sumTotals(rows: CareerRow[]): CareerTotals {
  return rows.reduce(
    (t, r) => ({ appearances: t.appearances + r.appearances, minutes: t.minutes + r.minutes, goals: t.goals + r.goals, assists: t.assists + r.assists, yellow: t.yellow + r.yellow, red: t.red + r.red }),
    { appearances: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0 },
  );
}

export async function getPlayerCareer(playerId: number): Promise<PlayerCareer | null> {
  // v2: nueva forma (club/national separados). La clave bumpeada ignora las
  // entradas cacheadas con la forma anterior (habrían roto la UI nueva).
  const cacheKey = `zl:career:v2:${playerId}`;
  try {
    const cached = await kv.get<PlayerCareer>(cacheKey);
    if (cached) return cached;
  } catch { /* sin KV: a la API */ }

  let years = await apiGetSeasons(playerId);
  if (!years.length) return null;
  years = [...new Set(years)].sort((a, b) => a - b).slice(-CAREER_MAX_SEASONS);

  const clubBy = new Map<number, Acc>();
  const natBy = new Map<number, Acc>();

  for (let i = 0; i < years.length; i += CAREER_BATCH) {
    const batch = years.slice(i, i + CAREER_BATCH);
    const rows = await Promise.all(
      batch.map((y) => apiGet(`/players?id=${playerId}&season=${y}`).then((r) => ({ y, row: r?.response?.[0] ?? null }))),
    );
    for (const { y, row } of rows) {
      for (const c of (row?.statistics ?? []).map(toComp)) {
        if (c.appearances === 0 && c.minutes === 0) continue; // competición sin jugar
        const map = c.kind === "national" ? natBy : clubBy;
        const acc = map.get(y) ?? newAcc();
        accAdd(acc, c);
        map.set(y, acc);
      }
    }
  }

  const clubSeasons = [...clubBy.entries()].map(([y, a]) => accToRow(y, a)).sort((a, b) => b.season - a.season);
  const natSeasons = [...natBy.entries()].map(([y, a]) => accToRow(y, a)).sort((a, b) => b.season - a.season);
  if (!clubSeasons.length && !natSeasons.length) return null;

  const career: PlayerCareer = {
    club: { seasons: clubSeasons, totals: sumTotals(clubSeasons) },
    national: { seasons: natSeasons, totals: sumTotals(natSeasons), teams: [...new Set(natSeasons.flatMap((r) => r.teams))] },
  };
  try { await kv.set(cacheKey, career, { ex: CAREER_TTL_S }); } catch { /* best-effort */ }
  return career;
}

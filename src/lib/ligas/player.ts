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
  shots: { total: number | null; on: number | null };
  goals: { total: number | null; assists: number | null };
  passes: { total: number | null; key: number | null; accuracy: number | null };
  tackles: { total: number | null; blocks: number | null; interceptions: number | null };
  duels: { total: number | null; won: number | null };
  dribbles: { attempts: number | null; success: number | null };
  fouls: { drawn: number | null; committed: number | null };
  cards: { yellow: number | null; red: number | null };
  penalty: { scored: number | null; missed: number | null };
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

function toComp(s: RawStat): PlayerCompetition {
  return {
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
  const cacheKey = `zl:player:${playerId}`;
  try {
    const cached = await kv.get<PlayerProfile>(cacheKey);
    if (cached) return cached;
  } catch { /* sin KV: a la API */ }

  const year = new Date().getUTCFullYear();
  for (const season of [year, year - 1, year - 2]) {
    const raw = await apiGet(`/players?id=${playerId}&season=${season}`);
    const row = raw?.response?.[0];
    if (row?.player?.id) {
      const profile = mapProfile(row, season);
      // Solo cachear una ficha con algo de sustancia (evita cachear vacíos).
      if (profile.competitions.length > 0 || profile.name) {
        try { await kv.set(cacheKey, profile, { ex: CACHE_TTL_S }); } catch { /* best-effort */ }
      }
      return profile;
    }
  }
  return null;
}

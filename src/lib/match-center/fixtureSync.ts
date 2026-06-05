// src/lib/match-center/fixtureSync.ts
//
// Autosincronización del mapa matchId (1..104) -> fixtureId de api-football para
// el Mundial 2026. Se ejecuta desde un cron: en cuanto api-football publique el
// calendario oficial, este módulo empareja cada partido nuestro con su fixture
// real y lo escribe en Vercel KV (vía setFixtureId), que es lo que consume el
// Match Center y el scoring EN VIVO del Fantasy.
//
// FUENTE: api-football.com (API-Sports v3), liga "World Cup" (id configurable
// con WC_LEAGUE_ID, por defecto 1) temporada WC_SEASON (por defecto 2026).
//
// EMPAREJAMIENTO SEGURO: no usa los nombres de selección (que vienen en inglés y
// además son "TBD" en eliminatorias). Empareja por SAQUE (fecha/hora) + ESTADIO
// + CIUDAD, señales independientes del idioma que también existen antes de que se
// conozcan los rivales de octavos en adelante. Solo escribe el mapeo cuando hay
// una única coincidencia con confianza alta; ante la duda lo deja sin mapear (el
// partido se mostrará "Por comenzar", nunca con datos de otro partido).

import { MATCHES } from "@/data/matches";
import { setFixtureId } from "./store";

const API_SPORTS_BASE = "https://v3.football.api-sports.io";

function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}

export function apiFootballEnabled(): boolean {
  return !!getApiKey();
}

function leagueId(): number {
  return parseInt(process.env.WC_LEAGUE_ID || "1", 10);
}
function season(): number {
  return parseInt(process.env.WC_SEASON || "2026", 10);
}

interface RawFixtureRow {
  fixture: {
    id: number;
    date: string;
    venue: { name: string | null; city: string | null };
  };
  teams: { home: { name: string }; away: { name: string } };
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
      console.error(`[fixtureSync] ${path} -> HTTP ${r.status}`);
      return null;
    }
    const json = (await r.json()) as { response?: T };
    return (json.response ?? null) as T | null;
  } catch (err) {
    console.error(`[fixtureSync] ${path} failed`, (err as Error).message);
    return null;
  }
}

// --- Normalización + tokenización ---
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Palabras genéricas de estadio: no aportan identidad, las ignoramos al comparar
// para no casar "X Stadium" con "Y Stadium" por la palabra "stadium".
const STADIUM_STOPWORDS = new Set([
  "stadium", "estadio", "field", "arena", "park", "the", "de", "del", "la", "el",
]);

function venueTokens(s: string | null | undefined): Set<string> {
  if (!s) return new Set();
  return new Set(
    norm(s)
      .split(" ")
      .filter((t) => t.length >= 3 && !STADIUM_STOPWORDS.has(t)),
  );
}

function tokenOverlap(a: Set<string>, b: Set<string>): boolean {
  for (const t of a) if (b.has(t)) return true;
  return false;
}

// Alias ES->EN (tokens) de las 16 sedes del Mundial 2026. api-football puede dar
// el nombre de la ciudad en inglés o el de la localidad real del estadio.
const CITY_ALIASES: Record<string, string[]> = {
  "ciudad de mexico": ["mexico city", "ciudad de mexico"],
  guadalajara: ["guadalajara", "zapopan"],
  toronto: ["toronto"],
  "los angeles": ["los angeles", "inglewood"],
  boston: ["boston", "foxborough"],
  vancouver: ["vancouver"],
  "nueva york nj": ["new york", "east rutherford", "new jersey"],
  "bay area": ["santa clara", "san francisco", "san jose", "bay area"],
  filadelfia: ["philadelphia"],
  houston: ["houston"],
  dallas: ["dallas", "arlington"],
  monterrey: ["monterrey", "guadalupe"],
  miami: ["miami", "miami gardens"],
  atlanta: ["atlanta"],
  "kansas city": ["kansas city"],
  seattle: ["seattle"],
};

function cityMatch(ourCity: string, apiCity: string | null, apiVenue: string | null): boolean {
  const aliases = CITY_ALIASES[norm(ourCity)] ?? [norm(ourCity)];
  const hay = `${norm(apiCity || "")} ${norm(apiVenue || "")}`;
  return aliases.some((a) => hay.includes(a));
}

// Saque de NUESTROS partidos: los horarios de MATCHES están en ET (EDT en
// junio/julio = UTC-4), igual que en match-center-poll.
function ourKickoffMs(date: string, time: string): number {
  const iso = `${date}T${time.length === 5 ? time : "00:00"}:00-04:00`;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NaN : t;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export interface SyncMatchResult {
  matchId: number;
  fixtureId: number | null;
  score: number;
  ambiguous: boolean;
}

export interface SyncReport {
  ok: boolean;
  reason?: string;
  leagueId: number;
  season: number;
  apiFixtures: number;
  mapped: number;
  ambiguous: number;
  unmatched: number;
  dryRun: boolean;
  details: SyncMatchResult[];
}

/**
 * Empareja un partido nuestro con la mejor fixture de api-football.
 * Puntuación (corroboración multi-señal, independiente del idioma):
 *   - saque a ≤90 min: +4   |  ≤6 h: +2  |  mismo día: +1
 *   - estadio (tokens significativos solapan): +3
 *   - ciudad (alias ES->EN): +2
 * Se exige score ≥ 4 y margen ≥ 2 sobre el segundo mejor (coincidencia única).
 */
function bestFixture(
  match: (typeof MATCHES)[number],
  apiRows: RawFixtureRow[],
): { fixtureId: number | null; score: number; ambiguous: boolean } {
  const ko = ourKickoffMs(match.d, match.t);
  if (Number.isNaN(ko)) return { fixtureId: null, score: 0, ambiguous: false };
  const ourVenue = venueTokens(match.vn);

  const scored = apiRows
    .map((row) => {
      const apiKo = new Date(row.fixture.date).getTime();
      if (Number.isNaN(apiKo)) return null;
      const dt = Math.abs(apiKo - ko);
      if (dt > 2 * DAY) return null; // fuera de toda ventana razonable
      let score = 0;
      if (dt <= 90 * MIN) score += 4;
      else if (dt <= 6 * HOUR) score += 2;
      else if (dt <= DAY) score += 1;
      if (tokenOverlap(ourVenue, venueTokens(row.fixture.venue.name))) score += 3;
      if (cityMatch(match.vc, row.fixture.venue.city, row.fixture.venue.name)) score += 2;
      return { fixtureId: row.fixture.id, score };
    })
    .filter((x): x is { fixtureId: number; score: number } => !!x && x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { fixtureId: null, score: 0, ambiguous: false };
  const best = scored[0];
  const second = scored[1];
  const margin = best.score - (second?.score ?? 0);
  if (best.score >= 4 && margin >= 2) {
    return { fixtureId: best.fixtureId, score: best.score, ambiguous: false };
  }
  return { fixtureId: null, score: best.score, ambiguous: margin < 2 && best.score >= 4 };
}

/**
 * Descarga el calendario del Mundial desde api-football y escribe en KV el mapeo
 * matchId -> fixtureId de todos los partidos que resuelve con confianza.
 * `dryRun` calcula sin escribir (para previsualizar el emparejamiento).
 */
export async function syncWorldCupFixtures(opts: { dryRun?: boolean } = {}): Promise<SyncReport> {
  const dryRun = !!opts.dryRun;
  const lid = leagueId();
  const ssn = season();
  const base: SyncReport = {
    ok: false, leagueId: lid, season: ssn, apiFixtures: 0,
    mapped: 0, ambiguous: 0, unmatched: 0, dryRun, details: [],
  };

  if (!apiFootballEnabled()) {
    return { ...base, reason: "api_not_configured" };
  }

  const rows = await apiGet<RawFixtureRow[]>(`/fixtures?league=${lid}&season=${ssn}`);
  if (!rows || rows.length === 0) {
    // Aún no hay calendario publicado (o liga/temporada incorrectas): no es un
    // error, simplemente no hay nada que mapear todavía.
    return { ...base, ok: true, reason: rows ? "no_fixtures_published" : "api_error", apiFixtures: 0 };
  }

  // Solo los partidos REALES del torneo (ids 1..104). El 9002 de prueba se
  // resuelve aparte en getFixtureId.
  const realMatches = MATCHES.filter((m) => m.i >= 1 && m.i <= 104);

  const details: SyncMatchResult[] = [];
  let mapped = 0, ambiguous = 0, unmatched = 0;

  for (const m of realMatches) {
    const { fixtureId, score, ambiguous: amb } = bestFixture(m, rows);
    if (fixtureId != null) {
      if (!dryRun) await setFixtureId(m.i, fixtureId);
      mapped++;
      details.push({ matchId: m.i, fixtureId, score, ambiguous: false });
    } else if (amb) {
      ambiguous++;
      details.push({ matchId: m.i, fixtureId: null, score, ambiguous: true });
    } else {
      unmatched++;
      details.push({ matchId: m.i, fixtureId: null, score, ambiguous: false });
    }
  }

  return {
    ok: true,
    leagueId: lid,
    season: ssn,
    apiFixtures: rows.length,
    mapped,
    ambiguous,
    unmatched,
    dryRun,
    details,
  };
}

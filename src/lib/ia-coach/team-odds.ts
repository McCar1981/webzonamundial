// src/lib/ia-coach/team-odds.ts
//
// FASE 3.A: Cuotas (odds) pre-match reales de casas de apuestas via api-football.
//
// El benchmark más honesto del análisis IA: si la IA dice "España 80% probable"
// pero las casas pagan España a cuota 1.40 (≈ 70% implícito), hay desviación
// editorial que el lector puede comparar.
//
// Estrategia:
//   - On-demand desde el context-builder: solo cuando el usuario pide análisis.
//   - Cache KV con clave por matchId, TTL corto (12h) — las cuotas cambian
//     pero no en intervalos cortos.
//   - Promedio de varias fuentes de mercado para reducir el sesgo de una sola.
//
// API: GET /odds?fixture={fixtureId}&bet=1 (1 = Match Winner / 1X2)
// La cuota se da en formato decimal (ej. 1.80 = 55.6% implícito).

import { kv } from "@vercel/kv";

const KV_PREFIX = "ia-coach:odds:v1:";
const KV_TTL_SECONDS = 12 * 60 * 60; // 12 h

const API_SPORTS_HOST = "v3.football.api-sports.io";
const API_SPORTS_BASE = `https://${API_SPORTS_HOST}`;

function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}

export interface BookmakerOdds {
  bookmaker: string;
  home: number;
  draw: number;
  away: number;
}

export interface MatchOdds {
  matchId: string;
  fixtureId?: number;
  fetchedAt: string;
  bookmakers: BookmakerOdds[];
  /** Cuotas promedio de las casas disponibles. */
  averageHome: number;
  averageDraw: number;
  averageAway: number;
  /** Probabilidad implícita (1/odd) normalizada para que sume 1.
   *  Comparable directamente con `probabilities` del análisis IA. */
  impliedHome: number;
  impliedDraw: number;
  impliedAway: number;
  /** Texto resumen "ESP @1.40 / Empate @4.50 / URU @7.00". */
  summary: string;
}

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

function kvKey(matchId: string): string {
  return `${KV_PREFIX}${matchId}`;
}

interface ApiFootballOddsResponse {
  response: Array<{
    fixture: { id: number };
    bookmakers: Array<{
      id: number;
      name: string;
      bets: Array<{
        id: number;
        name: string;
        values: Array<{ value: string; odd: string }>;
      }>;
    }>;
  }>;
}

async function readCachedOdds(matchId: string): Promise<MatchOdds | null> {
  if (!isKvEnabled()) return null;
  try {
    return (await kv.get<MatchOdds>(kvKey(matchId))) || null;
  } catch (err) {
    console.error("[team-odds] read failed:", (err as Error).message);
    return null;
  }
}

async function writeCachedOdds(odds: MatchOdds): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    await kv.set(kvKey(odds.matchId), odds, { ex: KV_TTL_SECONDS });
  } catch (err) {
    console.error("[team-odds] write failed:", (err as Error).message);
  }
}

/** Llama a api-football /odds. */
async function fetchOddsByFixture(
  fixtureId: number,
): Promise<ApiFootballOddsResponse["response"] | null> {
  const key = getApiKey();
  if (!key) return null;
  // bet=1 → Match Winner (1X2)
  const url = `${API_SPORTS_BASE}/odds?fixture=${fixtureId}&bet=1`;
  try {
    const r = await fetch(url, {
      headers: { "x-apisports-key": key },
      cache: "no-store",
    });
    if (!r.ok) {
      console.error(`[team-odds] HTTP ${r.status}`);
      return null;
    }
    const data = (await r.json()) as ApiFootballOddsResponse;
    return Array.isArray(data.response) ? data.response : null;
  } catch (err) {
    console.error("[team-odds] fetch failed:", (err as Error).message);
    return null;
  }
}

/**
 * Busca el fixtureId del Mundial 2026 buscando por equipos + fecha aproximada.
 * api-football usa league=1 para FIFA World Cup. Lo cacheamos en KV con TTL
 * largo (30 días, el calendario no cambia) bajo la clave matchId.
 */
async function resolveFixtureId(
  matchId: string,
  apiHomeId: number,
  apiAwayId: number,
  dateISO: string,
): Promise<number | null> {
  const key = getApiKey();
  if (!key) return null;
  const kvK = `ia-coach:fixture-id:v1:${matchId}`;
  const missK = `ia-coach:fixture-id:miss:v1:${matchId}`;
  // 1) Cache (positiva y NEGATIVA). Sin la negativa, un partido que api-football
  // aún no expone re-dispara 3 llamadas /fixtures en CADA análisis (incluido el
  // camino con caché de análisis). El marcador de miss (30 min) lo corta y se
  // autorrepara en cuanto el fixture aparece.
  if (isKvEnabled()) {
    try {
      const cached = await kv.get<number>(kvK);
      if (cached) return cached;
      if ((await kv.get(missK)) != null) return null;
    } catch { /* noop */ }
  }
  // 2) Lookup en /fixtures?league=1&season=2026&date=YYYY-MM-DD
  // El día puede no coincidir exacto por zona horaria — probamos ±1 día.
  const day = dateISO.slice(0, 10);
  for (const offset of [0, -1, 1]) {
    const d = new Date(`${day}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + offset);
    const targetDay = d.toISOString().slice(0, 10);
    const url = `${API_SPORTS_BASE}/fixtures?league=1&season=2026&date=${targetDay}`;
    try {
      const r = await fetch(url, {
        headers: { "x-apisports-key": key },
        cache: "no-store",
      });
      if (!r.ok) continue;
      const data = await r.json() as {
        response?: Array<{ fixture: { id: number }; teams: { home: { id: number }; away: { id: number } } }>;
      };
      const match = data.response?.find(
        (f) =>
          (f.teams.home.id === apiHomeId && f.teams.away.id === apiAwayId) ||
          (f.teams.home.id === apiAwayId && f.teams.away.id === apiHomeId),
      );
      if (match) {
        const fixtureId = match.fixture.id;
        if (isKvEnabled()) {
          try {
            // TTL 30 días — el ID del partido no cambia
            await kv.set(kvK, fixtureId, { ex: 30 * 24 * 3600 });
          } catch { /* noop */ }
        }
        return fixtureId;
      }
    } catch { /* try next */ }
  }
  // No resuelto: marca de miss (30 min) para no repetir las 3 llamadas /fixtures.
  if (isKvEnabled()) {
    try { await kv.set(missK, 1, { ex: 30 * 60 }); } catch { /* noop */ }
  }
  return null;
}

/**
 * Obtiene cuotas. Si no se pasa fixtureId, intenta resolverlo desde apiHomeId
 * + apiAwayId + dateISO. Devuelve null si no hay cuotas o falla la API.
 */
export async function getOddsForMatch(
  matchId: string,
  opts: {
    fixtureId?: number;
    apiHomeId?: number;
    apiAwayId?: number;
    dateISO?: string;
  } = {},
): Promise<MatchOdds | null> {
  let fixtureId = opts.fixtureId;
  if (!fixtureId && opts.apiHomeId && opts.apiAwayId && opts.dateISO) {
    fixtureId = (await resolveFixtureId(
      matchId,
      opts.apiHomeId,
      opts.apiAwayId,
      opts.dateISO,
    )) ?? undefined;
  }
  if (!fixtureId) return null;

  // 1. Cache (positiva + marca de "sin cuotas" para no re-pegar a /odds)
  const cached = await readCachedOdds(matchId);
  if (cached) return cached;
  const oddsMissK = `ia-coach:odds-miss:v1:${matchId}`;
  if (isKvEnabled()) {
    try { if ((await kv.get(oddsMissK)) != null) return null; } catch { /* noop */ }
  }

  // 2. Fetch
  const data = await fetchOddsByFixture(fixtureId);
  if (!data || data.length === 0) {
    // Sin cuotas: marca de miss (1 h) para no re-llamar /odds en cada análisis.
    if (isKvEnabled()) {
      try { await kv.set(oddsMissK, 1, { ex: 60 * 60 }); } catch { /* noop */ }
    }
    return null;
  }

  const entry = data[0]; // 1 fixture = 1 entry
  const bookmakers: BookmakerOdds[] = [];
  for (const bm of entry.bookmakers || []) {
    const winnerBet = bm.bets.find((b) => b.id === 1 || /winner/i.test(b.name));
    if (!winnerBet || !Array.isArray(winnerBet.values)) continue;
    const valueMap = new Map<string, number>();
    for (const v of winnerBet.values) {
      const odd = parseFloat(v.odd);
      if (!Number.isFinite(odd)) continue;
      // values come as "Home", "Draw", "Away"
      valueMap.set(v.value.toLowerCase(), odd);
    }
    const h = valueMap.get("home");
    const d = valueMap.get("draw");
    const a = valueMap.get("away");
    if (h && d && a) {
      bookmakers.push({ bookmaker: bm.name, home: h, draw: d, away: a });
    }
  }

  if (bookmakers.length === 0) {
    const oddsMissK = `ia-coach:odds-miss:v1:${matchId}`;
    if (isKvEnabled()) {
      try { await kv.set(oddsMissK, 1, { ex: 60 * 60 }); } catch { /* noop */ }
    }
    return null;
  }

  // Promedios
  const n = bookmakers.length;
  const sumH = bookmakers.reduce((s, b) => s + b.home, 0);
  const sumD = bookmakers.reduce((s, b) => s + b.draw, 0);
  const sumA = bookmakers.reduce((s, b) => s + b.away, 0);
  const avgH = sumH / n;
  const avgD = sumD / n;
  const avgA = sumA / n;

  // Probabilidad implícita normalizada (corrige overround de la casa)
  const rawH = 1 / avgH;
  const rawD = 1 / avgD;
  const rawA = 1 / avgA;
  const totalRaw = rawH + rawD + rawA;
  const impH = rawH / totalRaw;
  const impD = rawD / totalRaw;
  const impA = rawA / totalRaw;

  const summary = `Local @${avgH.toFixed(2)} / Empate @${avgD.toFixed(2)} / Visitante @${avgA.toFixed(2)} (promedio ${n} casas)`;

  const result: MatchOdds = {
    matchId,
    fixtureId,
    fetchedAt: new Date().toISOString(),
    bookmakers,
    averageHome: Number(avgH.toFixed(3)),
    averageDraw: Number(avgD.toFixed(3)),
    averageAway: Number(avgA.toFixed(3)),
    impliedHome: Number(impH.toFixed(3)),
    impliedDraw: Number(impD.toFixed(3)),
    impliedAway: Number(impA.toFixed(3)),
    summary,
  };

  await writeCachedOdds(result);
  return result;
}

/** Markdown para el prompt user. */
export function formatOddsForPrompt(
  odds: MatchOdds | null,
  homeName: string,
  awayName: string,
): string {
  if (!odds) return "## CUOTAS DE CASAS\n\nSin cuotas disponibles para este partido.";
  const lines: string[] = [];
  lines.push("## CUOTAS DE CASAS (promedio)");
  lines.push("");
  lines.push(
    `${homeName} @${odds.averageHome} (${(odds.impliedHome * 100).toFixed(0)}% implícito)`,
  );
  lines.push(
    `Empate @${odds.averageDraw} (${(odds.impliedDraw * 100).toFixed(0)}% implícito)`,
  );
  lines.push(
    `${awayName} @${odds.averageAway} (${(odds.impliedAway * 100).toFixed(0)}% implícito)`,
  );
  lines.push("");
  lines.push(
    `Fuente: media de ${odds.bookmakers.length} casas (${odds.bookmakers
      .slice(0, 5)
      .map((b) => b.bookmaker)
      .join(", ")}${odds.bookmakers.length > 5 ? "..." : ""}).`,
  );
  return lines.join("\n");
}

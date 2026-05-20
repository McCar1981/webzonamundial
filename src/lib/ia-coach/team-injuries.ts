// src/lib/ia-coach/team-injuries.ts
//
// FASE 2.B v2 (100% automático): Lesiones de selección DERIVADAS de lesiones
// de club.
//
// Problema con v1: api-sports /injuries?team={nt_id} devuelve 0 lesiones para
// selecciones fuera de ventana FIFA. Inútil entre torneos.
//
// Solución v2: pullear /injuries?league={X}&season={Y} para las 5 ligas top
// (La Liga, Premier, Serie A, Bundesliga, Ligue 1) — eso devuelve todas las
// lesiones de jugadores de club. Después matcheamos por NOMBRE del jugador
// con la `likely_squad` de cada selección del JSON.
//
// Resultado: si Lamine Yamal (Barcelona) tiene lesión en La Liga, y aparece
// en la `likely_squad` de España, automáticamente queda registrado como baja
// de España. 100% automático, sin intervención editorial.
//
// Plan basic api-sports: 7500 req/día. Esto gasta 5 calls (1 por liga) en
// vez de 48 (1 por selección). Ahorro masivo + datos mejores.
//
// Programado: cron /api/cron/update-team-injuries a las 04:00 UTC.

import { kv } from "@vercel/kv";
import fs from "node:fs/promises";
import path from "node:path";
import { BRACKET_TEAMS } from "@/lib/bracket/teams";

const KV_PREFIX = "ia-coach:injuries:v2:";
const KV_TTL_SECONDS = 48 * 60 * 60;
const KV_RAW_KEY = "ia-coach:injuries-raw:v2:league:";

const API_SPORTS_HOST = "v3.football.api-sports.io";
const API_SPORTS_BASE = `https://${API_SPORTS_HOST}`;

function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}

// IDs de api-football para las 5 ligas top. Constantes (no cambian por temporada).
export const TOP_LEAGUE_IDS: Record<string, number> = {
  "Premier League": 39,
  "La Liga": 140,
  "Serie A": 135,
  "Bundesliga": 78,
  "Ligue 1": 61,
};

// Mapeo team ID api-football ↔ selección Mundial 2026 (compartido con team-form).
import { API_FOOTBALL_TEAM_IDS } from "./team-form";
export { API_FOOTBALL_TEAM_IDS };

const TEAM_DATA_DIR = path.join(process.cwd(), "data", "teams");

export interface TeamInjury {
  playerName: string;
  playerPhoto?: string | null;
  type: string; // "Missing Fixture" | "Questionable" | "Injured" | ...
  reason: string;
  fixtureDate: string;
  league: string;
  clubName: string; // club donde sucedió la lesión (Barcelona, Real Madrid…)
}

export interface TeamInjuries {
  teamId: string;
  apiTeamId: number;
  fetchedAt: string;
  active: TeamInjury[];
  summary: string;
}

interface ApiFootballInjury {
  player: { id: number; name: string; photo?: string };
  team: { id: number; name: string };
  fixture: { id: number; date: string };
  league: { id: number; season: number; name: string };
  type: string;
  reason: string;
}

interface ApiFootballInjuriesResponse {
  response: ApiFootballInjury[];
  errors?: unknown;
}

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

function kvKey(teamId: string): string {
  return `${KV_PREFIX}${teamId}`;
}

export async function readTeamInjuries(
  teamId: string,
): Promise<TeamInjuries | null> {
  if (!isKvEnabled()) return null;
  try {
    return (await kv.get<TeamInjuries>(kvKey(teamId))) || null;
  } catch (err) {
    console.error("[team-injuries] read failed:", (err as Error).message);
    return null;
  }
}

export async function writeTeamInjuries(
  injuries: TeamInjuries,
): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    await kv.set(kvKey(injuries.teamId), injuries, { ex: KV_TTL_SECONDS });
  } catch (err) {
    console.error("[team-injuries] write failed:", (err as Error).message);
  }
}

/**
 * Fetch /injuries?league={id}&season={year}. Devuelve TODAS las lesiones
 * activas en esa liga durante esa temporada.
 */
export async function fetchLeagueInjuries(
  leagueId: number,
  season: number,
): Promise<ApiFootballInjury[] | null> {
  const key = getApiKey();
  if (!key) {
    console.warn("[team-injuries] API_SPORTS_KEY missing");
    return null;
  }
  const url = `${API_SPORTS_BASE}/injuries?league=${leagueId}&season=${season}`;
  try {
    const r = await fetch(url, {
      headers: { "x-apisports-key": key },
      cache: "no-store",
    });
    if (!r.ok) {
      console.error(`[team-injuries] league ${leagueId} HTTP ${r.status}`);
      return null;
    }
    const data = (await r.json()) as ApiFootballInjuriesResponse;
    return Array.isArray(data.response) ? data.response : null;
  } catch (err) {
    console.error(
      `[team-injuries] fetch failed league ${leagueId}:`,
      (err as Error).message,
    );
    return null;
  }
}

/**
 * Pulla las 5 ligas top y consolida en un solo array de lesiones.
 * Cachea cada liga en KV como respaldo (KV_RAW_KEY).
 */
export async function fetchAllTopLeaguesInjuries(
  season: number,
): Promise<ApiFootballInjury[]> {
  const all: ApiFootballInjury[] = [];
  for (const [name, id] of Object.entries(TOP_LEAGUE_IDS)) {
    const list = await fetchLeagueInjuries(id, season);
    if (list) {
      all.push(...list);
      console.log(`[team-injuries] ${name}: ${list.length} injuries`);
      // Cachea el raw por si necesitamos debug
      if (isKvEnabled()) {
        try {
          await kv.set(`${KV_RAW_KEY}${id}:${season}`, list, {
            ex: KV_TTL_SECONDS,
          });
        } catch {
          /* noop */
        }
      }
    }
    // Pausa pequeña entre ligas
    await new Promise((r) => setTimeout(r, 1500));
  }
  return all;
}

/**
 * Normaliza un nombre para matching robusto:
 *   - lowercase
 *   - strip diacritics (Á → A)
 *   - colapsa espacios
 *   - quita puntos
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Carga la likely_squad del JSON del equipo. Devuelve nombres normalizados. */
async function loadTeamSquadNames(slug: string): Promise<Map<string, string>> {
  // Map<normalized, original>
  const map = new Map<string, string>();
  try {
    const filepath = path.join(TEAM_DATA_DIR, `${slug}.json`);
    const txt = await fs.readFile(filepath, "utf8");
    const data = JSON.parse(txt);
    const squad = data?.wc_2026?.likely_squad;
    if (Array.isArray(squad)) {
      for (const p of squad) {
        const name = p.full_name || p.display_name;
        if (typeof name === "string" && name.trim()) {
          map.set(normalizeName(name), name);
          // También indexar solo apellido para fallback (Yamal, no Lamine Yamal)
          const parts = name.split(/\s+/);
          if (parts.length >= 2) {
            const lastTwo = parts.slice(-2).join(" ");
            map.set(normalizeName(lastTwo), name);
          }
        }
      }
    }
  } catch {
    /* ignore — equipo sin JSON o sin squad */
  }
  return map;
}

/** Bracket team → slug del JSON (consistencia con context-builder). */
const TEAM_SLUG_BY_ID = new Map<string, string>(
  BRACKET_TEAMS.map((t) => [t.id, t.slug]),
);

/**
 * Construye TeamInjuries para cada selección a partir del pool de lesiones
 * de las 5 ligas top.
 */
export async function buildAllTeamInjuriesFromLeaguePool(
  pool: ApiFootballInjury[],
  teamIds: string[],
): Promise<Map<string, TeamInjuries>> {
  const out = new Map<string, TeamInjuries>();
  const now = new Date();

  // Filtra a fixtures recientes/futuros (-30d, +120d) para descartar bajas
  // muy antiguas que el endpoint a veces retorna.
  const minT = now.getTime() - 30 * 24 * 3600 * 1000;
  const maxT = now.getTime() + 120 * 24 * 3600 * 1000;

  const relevant = pool.filter((inj) => {
    const t = new Date(inj.fixture.date).getTime();
    return !Number.isNaN(t) && t >= minT && t <= maxT;
  });

  // Pre-índice por nombre normalizado, dedup quedándose con la más reciente.
  const byNormalized = new Map<string, ApiFootballInjury>();
  for (const inj of relevant) {
    const norm = normalizeName(inj.player.name);
    const existing = byNormalized.get(norm);
    if (
      !existing ||
      new Date(inj.fixture.date).getTime() >
        new Date(existing.fixture.date).getTime()
    ) {
      byNormalized.set(norm, inj);
    }
  }

  for (const teamId of teamIds) {
    const slug = TEAM_SLUG_BY_ID.get(teamId);
    if (!slug) continue;
    const squad = await loadTeamSquadNames(slug);
    if (squad.size === 0) continue;

    const matched: TeamInjury[] = [];
    for (const [norm, inj] of byNormalized) {
      if (squad.has(norm)) {
        matched.push({
          playerName: squad.get(norm) || inj.player.name,
          playerPhoto: inj.player.photo || null,
          type: inj.type,
          reason: inj.reason,
          fixtureDate: inj.fixture.date,
          league: inj.league.name,
          clubName: inj.team.name,
        });
      }
    }

    out.set(teamId, {
      teamId,
      apiTeamId: API_FOOTBALL_TEAM_IDS[teamId] || 0,
      fetchedAt: now.toISOString(),
      active: matched,
      summary: buildInjuriesSummary(matched),
    });
  }

  return out;
}

export function buildInjuriesSummary(injuries: TeamInjury[]): string {
  if (injuries.length === 0) return "Sin bajas confirmadas en datos recientes";
  const top = injuries.slice(0, 5).map((i) => {
    const motive = (i.reason || i.type || "baja").toLowerCase();
    return `${i.playerName} (${motive})`;
  });
  return `${injuries.length} baja${injuries.length === 1 ? "" : "s"}: ${top.join(", ")}${injuries.length > 5 ? "…" : ""}`;
}

export function formatInjuriesForPrompt(
  injuries: TeamInjuries | null,
): string {
  if (!injuries) {
    return "- Lesiones/bajas: sin datos disponibles";
  }
  if (injuries.active.length === 0) {
    return "- Lesiones/bajas: ninguna confirmada en datos recientes";
  }
  const lines: string[] = [];
  lines.push(`- Lesiones/bajas (resumen): ${injuries.summary}`);
  lines.push("- Detalle:");
  for (const inj of injuries.active.slice(0, 8)) {
    const motive = inj.reason || inj.type;
    lines.push(
      `  ${inj.playerName} (${inj.clubName}) — ${motive} [${inj.fixtureDate.slice(0, 10)}, ${inj.league}]`,
    );
  }
  return lines.join("\n");
}

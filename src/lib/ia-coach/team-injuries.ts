// src/lib/ia-coach/team-injuries.ts
//
// FASE 2.B: Lesiones y bajas reales de selecciones desde api-football.com.
//
// Estrategia:
//   - Pull diario via cron del endpoint /injuries para cada selección.
//   - Filtramos a partidos recientes (últimos 60 días) o futuros (próximos 60 días)
//     para evitar bajas históricas irrelevantes.
//   - Persistido en Vercel KV con TTL de 48 h.
//   - El context-builder lo lee y lo añade al prompt user.
//   - Resuelve el bug donde la IA inventaba lesiones (Lamine Yamal, Ferran, etc).
//
// API: GET /injuries?team={id}&season=2026
// Plan basic api-sports: 7500 req/día. 48 form + 48 injuries = 96/día (~1.3%).
// Usamos api-sports DIRECTO, no el wrapper de RapidAPI.

import { kv } from "@vercel/kv";

const KV_PREFIX = "ia-coach:injuries:v1:";
const KV_TTL_SECONDS = 48 * 60 * 60;

const API_SPORTS_HOST = "v3.football.api-sports.io";
const API_SPORTS_BASE = `https://${API_SPORTS_HOST}`;

function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}

// Reutilizamos el mapeo de team-form.ts para mantener una sola fuente de verdad.
import { API_FOOTBALL_TEAM_IDS } from "./team-form";
export { API_FOOTBALL_TEAM_IDS };

export interface TeamInjury {
  playerName: string;
  playerPhoto?: string | null;
  type: string; // "Missing Fixture" | "Questionable" | "Injured" | ...
  reason: string; // texto libre del API
  fixtureDate: string; // ISO date del partido afectado
  league: string;
}

export interface TeamInjuries {
  teamId: string;
  apiTeamId: number;
  fetchedAt: string;
  /** Bajas/dudas en fixtures recientes o futuros cercanos. */
  active: TeamInjury[];
  /** Resumen una línea: "Sin bajas confirmadas" | "3 bajas: A (rodilla), B (suspensión)..." */
  summary: string;
}

interface ApiFootballInjury {
  player: { id: number; name: string; photo?: string };
  team: { id: number; name: string };
  fixture: { id: number; date: string; timezone: string };
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
 * Llama a api-football y devuelve las lesiones de una selección.
 * Por defecto filtra a la temporada actual.
 */
export async function fetchTeamInjuries(
  teamId: string,
  season: number = new Date().getFullYear(),
): Promise<TeamInjury[] | null> {
  const apiId = API_FOOTBALL_TEAM_IDS[teamId];
  if (!apiId) {
    console.warn(`[team-injuries] No api-football ID for ${teamId}`);
    return null;
  }
  const key = getApiKey();
  if (!key) {
    console.warn("[team-injuries] API_SPORTS_KEY missing");
    return null;
  }

  const url = `${API_SPORTS_BASE}/injuries?team=${apiId}&season=${season}`;
  try {
    const r = await fetch(url, {
      headers: {
        "x-apisports-key": key,
      },
      cache: "no-store",
    });
    if (!r.ok) {
      console.error(`[team-injuries] ${teamId} HTTP ${r.status}`);
      return null;
    }
    const data = (await r.json()) as ApiFootballInjuriesResponse;
    if (!Array.isArray(data.response)) return null;

    // Filtra a un ventana de [-60d, +90d] respecto a hoy para evitar bajas
    // muy antiguas o partidos lejanos irrelevantes.
    const now = Date.now();
    const minDate = now - 60 * 24 * 3600 * 1000;
    const maxDate = now + 90 * 24 * 3600 * 1000;

    const filtered = data.response.filter((inj) => {
      const t = new Date(inj.fixture.date).getTime();
      return !Number.isNaN(t) && t >= minDate && t <= maxDate;
    });

    // Dedup por jugador (un mismo jugador puede aparecer en varios fixtures).
    // Nos quedamos con el más reciente.
    const byPlayer = new Map<string, ApiFootballInjury>();
    for (const inj of filtered) {
      const existing = byPlayer.get(inj.player.name);
      if (
        !existing ||
        new Date(inj.fixture.date).getTime() >
          new Date(existing.fixture.date).getTime()
      ) {
        byPlayer.set(inj.player.name, inj);
      }
    }

    return Array.from(byPlayer.values()).map(
      (inj): TeamInjury => ({
        playerName: inj.player.name,
        playerPhoto: inj.player.photo || null,
        type: inj.type,
        reason: inj.reason,
        fixtureDate: inj.fixture.date,
        league: inj.league.name,
      }),
    );
  } catch (err) {
    console.error(`[team-injuries] fetch failed ${teamId}:`, (err as Error).message);
    return null;
  }
}

/** Construye resumen una línea para el prompt. */
export function buildInjuriesSummary(injuries: TeamInjury[]): string {
  if (injuries.length === 0) return "Sin bajas confirmadas en datos recientes";
  const top = injuries.slice(0, 5).map((i) => {
    const motive = (i.reason || i.type || "baja").toLowerCase();
    return `${i.playerName} (${motive})`;
  });
  return `${injuries.length} baja${injuries.length === 1 ? "" : "s"}: ${top.join(", ")}${injuries.length > 5 ? "…" : ""}`;
}

/** Formatea las lesiones para el prompt del context-builder. */
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
    lines.push(`  ${inj.playerName} — ${motive} [${inj.fixtureDate.slice(0, 10)}, ${inj.league}]`);
  }
  return lines.join("\n");
}

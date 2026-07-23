// src/lib/ligas/micro-live.ts
//
// Capa EN VIVO de micro-predicciones para Zona de Ligas. El motor de micro
// (src/lib/micro/*) ya es AGNÓSTICO de competición; esto es solo el DRIVER de
// ligas: descubre los partidos de Ola 1 en directo (1 request /fixtures?live=all,
// patrón de src/lib/friendlies/api.ts), los baja como LiveSnapshot con eventos
// embebidos (reutiliza fetchLiveSnapshots del Match Center) y deja que
// processMicroGeneration genere las micros. La resolución/pago los hace el mismo
// cron resolve-micro (ver authoritativeState + rama de liga).
//
// GATED: todo el subsistema está DORMIDO salvo que LIGAS_MICRO_ENABLED === "1".
//
// match_id de estas micros = fixtureId de api-football (numérico, 6-7 dígitos),
// que jamás colisiona con los ids del Mundial (1..104) ni con los slots de
// prueba (9000+). authoritativeState y resolve-micro reconocen ese rango para
// liquidar contra el feed REAL, nunca con simulación.

import { getCompetition, getCompetitionByApiId } from "@/data/competitions";
import { OLA1_SLUGS } from "@/lib/ligas/predict-markets";
import { fetchLiveSnapshot, fetchLiveSnapshots } from "@/lib/match-center/apiFootball";
import type { LiveSnapshot, MatchMeta } from "@/lib/match-center/types";
import { kv } from "@/lib/kv";

// api-football emite fixtureIds de 6-7 dígitos; el Mundial usa 1..104 y 9000+.
// Umbral holgado que separa ambos espacios de ids sin ambigüedad.
export const LIGA_MICRO_ID_MIN = 100000;
export function isLigaMicroMatchId(id: number): boolean {
  return Number.isFinite(id) && id >= LIGA_MICRO_ID_MIN;
}

/** Interruptor maestro: el poller y la UI en vivo están dormidos si no es "1". */
export function ligasMicroEnabled(): boolean {
  // ENCENDIDO por Carlos (jul-2026): activo por defecto. Kill-switch para apagar:
  // env LIGAS_MICRO_ENABLED="0".
  return process.env.LIGAS_MICRO_ENABLED !== "0";
}

/** League ids de api-football para las ligas de Ola 1 (derivados del catálogo). */
export function ola1LeagueIds(): number[] {
  const ids: number[] = [];
  for (const slug of OLA1_SLUGS) {
    const comp = getCompetition(slug);
    if (comp?.apiFootballId) ids.push(comp.apiFootballId);
  }
  return ids;
}

const API_BASE = "https://v3.football.api-sports.io";
function apiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}
async function apiGet<T>(path: string): Promise<T | null> {
  const key = apiKey();
  if (!key) return null;
  try {
    const r = await fetch(`${API_BASE}${path}`, { headers: { "x-apisports-key": key }, cache: "no-store" });
    if (!r.ok) {
      console.error(`[ligas-micro] ${path} -> HTTP ${r.status}`);
      return null;
    }
    const json = (await r.json()) as { response?: T };
    return (json.response ?? null) as T | null;
  } catch (err) {
    console.error(`[ligas-micro] ${path} failed`, (err as Error).message);
    return null;
  }
}

// Fila cruda de /fixtures?live=all: solo necesitamos id de fixture, id de liga y
// nombres de equipo (para el meta). Los bloques embebidos los trae aparte
// fetchLiveSnapshots vía /fixtures?ids=.
interface LiveRow {
  fixture: { id: number; date: string; venue: { name: string | null; city: string | null } };
  league: { id: number };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
}

// El match_id ES el fixtureId (meta.id). Los nombres solo alimentan la UI del
// snapshot; para la RESOLUCIÓN (eventos/minuto/status) el meta es irrelevante.
// `ligaSlug` (cuando se conoce la liga) hace que el push enlace a /ligas/…
function metaFor(fixtureId: number, homeName: string, awayName: string, slug?: string | null, venue = "", city = "", date = ""): MatchMeta {
  return {
    id: fixtureId,
    home: { name: homeName || "Local", flag: "", color: "#c9a84c", id: "" },
    away: { name: awayName || "Visitante", flag: "", color: "#c9a84c", id: "" },
    venue,
    city,
    date,
    time: "",
    phase: "",
    group: "",
    ...(slug ? { ligaSlug: slug } : {}),
  };
}

/** Partidos de Ola 1 EN VIVO ahora mismo, como LiveSnapshot con eventos. */
export async function fetchOla1LiveSnapshots(): Promise<LiveSnapshot[]> {
  const leagueIds = new Set(ola1LeagueIds());
  if (leagueIds.size === 0) return [];
  const rows = await apiGet<LiveRow[]>(`/fixtures?live=all`);
  if (!rows) return [];
  const relevant = rows.filter((r) => leagueIds.has(r.league?.id));
  if (relevant.length === 0) return [];
  // Segundo request (en lotes de 20) con eventos/stats embebidos, reutilizando el
  // batcher probado del Match Center. match_id = fixtureId.
  const pairs = relevant.map((r) => ({
    matchId: r.fixture.id,
    fixtureId: r.fixture.id,
    meta: metaFor(
      r.fixture.id,
      r.teams.home.name,
      r.teams.away.name,
      getCompetitionByApiId(r.league?.id)?.slug ?? null,
      r.fixture.venue?.name ?? "",
      r.fixture.venue?.city ?? "",
      r.fixture.date,
    ),
  }));
  const byMatch = await fetchLiveSnapshots(pairs);
  return Object.values(byMatch);
}

/** Un partido de liga por fixtureId (para authoritativeState). 1 request. */
export async function fetchLigaSnapshot(fixtureId: number): Promise<LiveSnapshot | null> {
  // Para resolver solo importan eventos/minuto/status; el meta es de relleno.
  return fetchLiveSnapshot(fixtureId, metaFor(fixtureId, "Local", "Visitante"));
}

// ── Bandera KV "hay ligas en vivo" para que resolve-micro despierte ──────────
const LIVE_FLAG_KEY = "zl:micro:live";
const LIVE_FLAG_TTL_S = 6 * 60; // cubre el hueco entre pasadas del poller
export async function markLigasLive(): Promise<void> {
  try { await kv.set(LIVE_FLAG_KEY, 1, { ex: LIVE_FLAG_TTL_S }); } catch { /* best-effort */ }
}
export async function ligasHaveLive(): Promise<boolean> {
  try { return (await kv.get(LIVE_FLAG_KEY)) != null; } catch { return false; }
}

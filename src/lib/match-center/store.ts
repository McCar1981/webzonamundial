// src/lib/match-center/store.ts
//
// Resolución de metadatos de partido (desde fixtures oficiales + colores del
// bracket) y caché de snapshots en vivo en Vercel KV. Si KV no está
// configurado, todo degrada limpiamente (se recalcula on-demand).

import { kv } from "@vercel/kv";
import { MATCHES } from "@/data/matches";
import { BRACKET_TEAMS } from "@/lib/bracket/teams";
import type { LiveSnapshot, MatchMeta, MatchTeamMeta } from "./types";

const SNAP_PREFIX = "mc:snap:v1:";
const FIXTURE_PREFIX = "mc:fixture:v1:";
const SNAP_TTL_SECONDS = 25; // ligeramente por encima del intervalo de polling

// Estados "en juego": el minuto avanza, así que un snapshot cacheado caduca.
const IN_PLAY = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
// Guardia de frescura por `updatedAt`: si un snapshot EN JUEGO es más viejo que
// esto, lo tratamos como caducado y forzamos refetch — aunque el TTL de KV
// fallara. Como cada escritura buena renueva `updatedAt`, esto se autocura y
// mantiene el throttle (a lo sumo 1 refetch por ventana).
const LIVE_FRESH_MS = 45_000;

function isSnapshotStale(snap: LiveSnapshot): boolean {
  if (!IN_PLAY.has(snap.status)) return false; // NS/FT/AET/PEN no cambian de minuto
  const age = Date.now() - (snap.updatedAt ?? 0);
  return age > LIVE_FRESH_MS;
}

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

const DEFAULT_COLOR = "#3b82f6";

// Lookup color por código de bandera (iso flagcdn), p.ej. "mx", "gb-sct".
const COLOR_BY_FLAG: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const t of BRACKET_TEAMS) m[t.iso] = t.color;
  return m;
})();
const ISO3_BY_FLAG: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const t of BRACKET_TEAMS) m[t.iso] = t.id;
  return m;
})();

function teamMeta(name: string, flag: string): MatchTeamMeta {
  return {
    name,
    flag,
    color: COLOR_BY_FLAG[flag] || DEFAULT_COLOR,
    id: ISO3_BY_FLAG[flag] || "",
  };
}

// Re-exporta los helpers de slug (definidos en módulo sin deps de servidor).
export { matchSlug, resolveMatchId } from "./slug";

/** Construye los metadatos de un partido a partir de su id (1..104). */
export function buildMeta(matchId: number): MatchMeta | null {
  const m = MATCHES.find((x) => x.i === matchId);
  if (!m) return null;
  return {
    id: m.i,
    home: teamMeta(m.h, m.hf),
    away: teamMeta(m.a, m.af),
    venue: m.vn,
    city: m.vc,
    date: m.d,
    time: m.t,
    phase: m.p,
    group: m.g,
  };
}

/**
 * Resuelve el fixtureId de api-football para un partido del Mundial. Orden:
 *   1. KV (escrito cuando se conozca el cuadro oficial en la API).
 *   2. Variable de entorno MC_FIXTURE_MAP (JSON {"1": 123456, ...}).
 * Devuelve null si aún no hay mapeo (se servirá simulación).
 */
export async function getFixtureId(matchId: number): Promise<number | null> {
  if (isKvEnabled()) {
    try {
      const v = await kv.get<number>(`${FIXTURE_PREFIX}${matchId}`);
      if (typeof v === "number") return v;
    } catch {
      /* degrada a env */
    }
  }
  const raw = process.env.MC_FIXTURE_MAP;
  if (raw) {
    try {
      const map = JSON.parse(raw) as Record<string, number>;
      const v = map[String(matchId)];
      if (typeof v === "number") return v;
    } catch {
      /* ignore */
    }
  }
  // Partido de PRUEBA (id 9002): autoresuelve el fixture real del amistoso
  // Portugal-Chile desde api-football (nombres en inglés) y lo cachea en KV.
  if (matchId === 9002) {
    const { findFriendlyFixtureId } = await import("@/lib/friendlies/api");
    const fid = await findFriendlyFixtureId("Portugal", "Chile");
    if (fid) {
      await setFixtureId(matchId, fid);
      return fid;
    }
  }
  return null;
}

export async function setFixtureId(matchId: number, fixtureId: number): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    await kv.set(`${FIXTURE_PREFIX}${matchId}`, fixtureId);
  } catch (err) {
    console.error("[mc-store] setFixtureId failed", (err as Error).message);
  }
}

/** Lee el último snapshot de KV, exista o no frescura (puede estar caducado). */
export async function getLastSnapshot(matchId: number): Promise<LiveSnapshot | null> {
  if (!isKvEnabled()) return null;
  try {
    return (await kv.get<LiveSnapshot>(`${SNAP_PREFIX}${matchId}`)) || null;
  } catch {
    return null;
  }
}

/**
 * Snapshot cacheado SOLO si sigue fresco. Para partidos en juego, descarta el
 * cacheado si `updatedAt` es demasiado viejo (defensa ante un TTL de KV que no
 * caduque), de modo que el llamador vuelva a pedir datos reales y el minuto no
 * se quede congelado.
 */
export async function getCachedSnapshot(matchId: number): Promise<LiveSnapshot | null> {
  const snap = await getLastSnapshot(matchId);
  if (!snap) return null;
  return isSnapshotStale(snap) ? null : snap;
}

export async function cacheSnapshot(snap: LiveSnapshot): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    await kv.set(`${SNAP_PREFIX}${snap.matchId}`, snap, { ex: SNAP_TTL_SECONDS });
  } catch (err) {
    console.error("[mc-store] cacheSnapshot failed", (err as Error).message);
  }
}

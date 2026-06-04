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
  // Partido de PRUEBA (id 9001): autoresuelve el fixture real del amistoso
  // España-Irak desde api-football (nombres en inglés) y lo cachea en KV.
  if (matchId === 9001) {
    const { findFriendlyFixtureId } = await import("@/lib/friendlies/api");
    const fid = await findFriendlyFixtureId("Spain", "Iraq");
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

export async function getCachedSnapshot(matchId: number): Promise<LiveSnapshot | null> {
  if (!isKvEnabled()) return null;
  try {
    return (await kv.get<LiveSnapshot>(`${SNAP_PREFIX}${matchId}`)) || null;
  } catch {
    return null;
  }
}

export async function cacheSnapshot(snap: LiveSnapshot): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    await kv.set(`${SNAP_PREFIX}${snap.matchId}`, snap, { ex: SNAP_TTL_SECONDS });
  } catch (err) {
    console.error("[mc-store] cacheSnapshot failed", (err as Error).message);
  }
}

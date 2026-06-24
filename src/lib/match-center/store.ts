// src/lib/match-center/store.ts
//
// Resolución de metadatos de partido (desde fixtures oficiales + colores del
// bracket) y caché de snapshots en vivo en Vercel KV. Si KV no está
// configurado, todo degrada limpiamente (se recalcula on-demand).

// OJO: cliente KV de @/lib/kv (lecturas no-store), NO el crudo de @vercel/kv —
// el crudo deja que el Data Cache de Next congele las lecturas (ver lib/kv.ts).
import { kv } from "@/lib/kv";
import { MATCHES } from "@/data/matches";
import { BRACKET_TEAMS } from "@/lib/bracket/teams";
import type { LiveSnapshot, MatchMeta, MatchTeamMeta } from "./types";
import { IN_PLAY } from "./status";

const SNAP_PREFIX = "mc:snap:v1:";
// Última copia DURABLE del snapshot (sin TTL): sobrevive a la caducidad de la
// clave fresca, de modo que "el último estado real conocido" exista de verdad.
// Sin esto, si api-football falla >TTL el partido se resetea a "por comenzar".
const LAST_PREFIX = "mc:last:v1:";
const FIXTURE_PREFIX = "mc:fixture:v1:";
const SNAP_TTL_SECONDS = 25; // ligeramente por encima del intervalo de polling

// Estados "en juego" (IN_PLAY de status.ts): el minuto avanza, así que un
// snapshot cacheado de uno de estos estados caduca.
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
  // Partido de PRUEBA (id 9002): rastrea un amistoso REAL que cambia de día y de
  // rival, así que SIEMPRE re-resolvemos en fresco contra api-football (liga 10,
  // nombres en inglés) y reescribimos KV — así un fixture viejo cacheado de una
  // configuración anterior (otro rival/fecha) nunca "se queda pegado".
  if (matchId === 9002) {
    const { findFriendlyFixtureId } = await import("@/lib/friendlies/api");
    const fid = await findFriendlyFixtureId("Portugal", "Nigeria");
    if (fid) {
      await setFixtureId(matchId, fid);
      return fid;
    }
    // La API aún no expone el fixture: cae al posible valor de KV/env de respaldo.
  }
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

/** Lee el último snapshot conocido: la copia fresca si existe, y si caducó,
 *  la copia durable (sin TTL). Puede estar viejo; el llamador decide. */
export async function getLastSnapshot(matchId: number): Promise<LiveSnapshot | null> {
  if (!isKvEnabled()) return null;
  try {
    const fresh = await kv.get<LiveSnapshot>(`${SNAP_PREFIX}${matchId}`);
    if (fresh) return fresh;
    return (await kv.get<LiveSnapshot>(`${LAST_PREFIX}${matchId}`)) || null;
  } catch {
    return null;
  }
}

/** Lectura en LOTE de las copias durables (mc:last:) para varios partidos:
 *  1 comando MGET por bloque en vez de 2 GET por partido. La usa la parrilla
 *  del calendario para pintar marcadores. Degrada a mapa vacío sin KV. */
export async function getLastSnapshotsBulk(
  ids: number[],
): Promise<Record<number, LiveSnapshot>> {
  const out: Record<number, LiveSnapshot> = {};
  if (!isKvEnabled() || ids.length === 0) return out;
  try {
    const CHUNK = 100;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const slice = ids.slice(i, i + CHUNK);
      const keys = slice.map((id) => `${LAST_PREFIX}${id}`);
      const vals = await kv.mget<(LiveSnapshot | null)[]>(...keys);
      vals.forEach((v, j) => {
        if (v) out[slice[j]] = v;
      });
    }
  } catch {
    /* sin datos en vivo: la parrilla muestra horarios y ya */
  }
  return out;
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
    await Promise.all([
      kv.set(`${SNAP_PREFIX}${snap.matchId}`, snap, { ex: SNAP_TTL_SECONDS }),
      // Copia durable: el "último estado real conocido" no caduca con el TTL.
      kv.set(`${LAST_PREFIX}${snap.matchId}`, snap),
    ]);
  } catch (err) {
    console.error("[mc-store] cacheSnapshot failed", (err as Error).message);
  }
}

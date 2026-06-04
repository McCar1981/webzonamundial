// src/lib/friendlies/store.ts
//
// Persistencia del estado de los AMISTOSOS de selecciones. Mismo patrón que el
// resto de stores del proyecto:
//   - Producción: Vercel KV (Redis). Persiste entre invocaciones del cron.
//   - Dev local: fichero JSON en data/friendlies-store.json.
//
// El cron de polling compara el estado guardado (FriendlyState) con lo que llega
// de api-football para detectar QUÉ ha cambiado (gol, inicio, descanso, final,
// alineaciones, roja, penalti) y mandar el push correspondiente una sola vez.

import { promises as fs } from "node:fs";
import path from "node:path";
import { kv } from "@/lib/kv";
import type { FriendlyState } from "./types";

// Hash de Redis: campo = fixtureId, valor = FriendlyState. HSET por campo es
// atómico, así que polls solapados sobre fixtures distintos no se pisan.
const STATE_KEY = `friendlies:stateh:v1`;

const FALLBACK_PATH = path.join(process.cwd(), "data", "friendlies-store.json");

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

// ───────────────────────── fs fallback ─────────────────────────

interface FsStore {
  states: Record<string, FriendlyState>;
}

async function readFs(): Promise<FsStore> {
  try {
    const raw = await fs.readFile(FALLBACK_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<FsStore>;
    return { states: parsed.states || {} };
  } catch {
    return { states: {} };
  }
}

async function writeFs(store: FsStore): Promise<void> {
  await fs.mkdir(path.dirname(FALLBACK_PATH), { recursive: true });
  await fs.writeFile(FALLBACK_PATH, JSON.stringify(store, null, 2), "utf8");
}

// ───────────────────────── estado por fixture ─────────────────────────

/** Estado guardado de un fixture (null si nunca se ha visto). */
export async function getFriendlyState(
  fixtureId: number,
): Promise<FriendlyState | null> {
  if (isKvEnabled()) {
    const map = await kv.hget<FriendlyState>(STATE_KEY, String(fixtureId));
    return map ?? null;
  }
  const store = await readFs();
  return store.states[String(fixtureId)] ?? null;
}

/** Todos los estados guardados, indexados por fixtureId. */
export async function getAllFriendlyStates(): Promise<
  Record<string, FriendlyState>
> {
  if (isKvEnabled()) {
    const map = await kv.hgetall<Record<string, FriendlyState>>(STATE_KEY);
    return map ?? {};
  }
  const store = await readFs();
  return store.states;
}

/** Guarda (o reemplaza) el estado de un fixture. */
export async function saveFriendlyState(
  fixtureId: number,
  state: FriendlyState,
): Promise<void> {
  if (isKvEnabled()) {
    await kv.hset(STATE_KEY, { [String(fixtureId)]: state });
    return;
  }
  const store = await readFs();
  store.states[String(fixtureId)] = state;
  await writeFs(store);
}

/** Borra el estado de un fixture (limpieza tras varios días terminado). */
export async function deleteFriendlyState(fixtureId: number): Promise<void> {
  if (isKvEnabled()) {
    await kv.hdel(STATE_KEY, String(fixtureId));
    return;
  }
  const store = await readFs();
  delete store.states[String(fixtureId)];
  await writeFs(store);
}

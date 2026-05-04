/**
 * Unified registros + waitlist store.
 *
 * Replaces the previous fs/sqlite stores that were silently dropping data on
 * Vercel (read-only filesystem outside /tmp, ephemeral per-invocation).
 *
 * Storage backend:
 *  - Production: Vercel KV (Upstash Redis). Persists across deployments and
 *    lambda invocations. Same env vars (KV_REST_API_URL / KV_REST_API_TOKEN)
 *    already configured for noticias-store.
 *  - Local dev: filesystem JSON at data/registros.json. No KV credentials
 *    needed.
 *
 * Auto-detected: if KV_REST_API_URL is set, KV wins; otherwise fs fallback.
 *
 * Data shape:
 *  - `registros:emails:set` — Set of normalized emails. Used for uniqueness
 *    + count. SCARD gives the real public count.
 *  - `registros:nombres:set` — Set of normalized usernames (lowercased,
 *    only populated for full registros that have a nombre).
 *  - `registros:records:list` — List of JSON records (LPUSH = latest first).
 *    Source of truth for export.
 *
 * The number shown to visitors uses BASE_COUNT (1247) + unique-emails
 * count, matching the prior /api/waitlist contract so the home banner
 * doesn't visually regress.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { kv } from "@vercel/kv";

// Public counter baseline. Anything stored as a real email will be added
// on top of this number when /api/waitlist and /api/registro return the
// public count.
export const BASE_COUNT = 8642;

export type RegistroKind = "full" | "waitlist";

export interface Registro {
  id: string;
  email: string;
  nombre: string | null;
  creador: string | null;
  kind: RegistroKind;
  fecha: string; // ISO timestamp
  ip: string | null;
}

interface FsStore {
  emails: string[];
  nombres: string[];
  records: Registro[]; // latest first
}

const KEY_EMAILS = "registros:emails:set";
const KEY_NOMBRES = "registros:nombres:set";
const KEY_RECORDS = "registros:records:list";

const FALLBACK_PATH = path.join(process.cwd(), "data", "registros.json");

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export function getStorePath(): string {
  return isKvEnabled() ? `kv:${KEY_EMAILS}` : FALLBACK_PATH;
}

function genId(): string {
  return `zm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function normalizeNombre(nombre: string): string {
  return nombre.trim();
}

function nombreKey(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/* ---------- Filesystem adapter (dev only) ---------- */

async function readFs(): Promise<FsStore> {
  try {
    const raw = await fs.readFile(FALLBACK_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<FsStore>;
    return {
      emails: Array.isArray(parsed.emails) ? parsed.emails : [],
      nombres: Array.isArray(parsed.nombres) ? parsed.nombres : [],
      records: Array.isArray(parsed.records) ? parsed.records : [],
    };
  } catch {
    return { emails: [], nombres: [], records: [] };
  }
}

async function writeFs(store: FsStore): Promise<void> {
  await fs.mkdir(path.dirname(FALLBACK_PATH), { recursive: true });
  await fs.writeFile(FALLBACK_PATH, JSON.stringify(store, null, 2), "utf-8");
}

/* ---------- Public API ---------- */

export type AddRegistroInput = {
  email: string;
  nombre?: string | null;
  creador?: string | null;
  ip?: string | null;
  kind: RegistroKind;
};

export type AddRegistroResult =
  | { ok: true; id: string; total: number; alreadyRegistered: boolean }
  | { ok: false; error: "email_taken" | "nombre_taken" | "internal" };

export async function addRegistro(input: AddRegistroInput): Promise<AddRegistroResult> {
  const email = normalizeEmail(input.email);
  const nombre = input.nombre ? normalizeNombre(input.nombre) : null;
  const nombreLower = nombre ? nombreKey(nombre) : null;

  try {
    if (isKvEnabled()) {
      // SADD returns 1 if added, 0 if already present.
      const emailAdded = await kv.sadd(KEY_EMAILS, email);

      if (emailAdded === 0) {
        // Email already on the list. For waitlist this is "ok, alreadyRegistered".
        // For full registro we still return email_taken so the UI can warn.
        if (input.kind === "waitlist") {
          const total = await getCount();
          return { ok: true, id: "", total, alreadyRegistered: true };
        }
        return { ok: false, error: "email_taken" };
      }

      if (nombreLower) {
        const nombreAdded = await kv.sadd(KEY_NOMBRES, nombreLower);
        if (nombreAdded === 0) {
          // Roll back the email we just added so total stays consistent.
          await kv.srem(KEY_EMAILS, email).catch(() => {});
          return { ok: false, error: "nombre_taken" };
        }
      }

      const record: Registro = {
        id: genId(),
        email,
        nombre,
        creador: input.creador?.trim() || null,
        kind: input.kind,
        fecha: new Date().toISOString(),
        ip: input.ip || null,
      };

      await kv.lpush(KEY_RECORDS, JSON.stringify(record));
      const total = await getCount();
      return { ok: true, id: record.id, total, alreadyRegistered: false };
    }

    // Filesystem fallback
    const store = await readFs();

    if (store.emails.includes(email)) {
      if (input.kind === "waitlist") {
        return {
          ok: true,
          id: "",
          total: BASE_COUNT + store.emails.length,
          alreadyRegistered: true,
        };
      }
      return { ok: false, error: "email_taken" };
    }
    if (nombreLower && store.nombres.includes(nombreLower)) {
      return { ok: false, error: "nombre_taken" };
    }

    const record: Registro = {
      id: genId(),
      email,
      nombre,
      creador: input.creador?.trim() || null,
      kind: input.kind,
      fecha: new Date().toISOString(),
      ip: input.ip || null,
    };

    store.emails.push(email);
    if (nombreLower) store.nombres.push(nombreLower);
    store.records.unshift(record);
    await writeFs(store);

    return {
      ok: true,
      id: record.id,
      total: BASE_COUNT + store.emails.length,
      alreadyRegistered: false,
    };
  } catch (err) {
    console.error("[registros-store] addRegistro failed", (err as Error).message);
    return { ok: false, error: "internal" };
  }
}

/** Public count = BASE_COUNT + unique emails. */
export async function getCount(): Promise<number> {
  try {
    if (isKvEnabled()) {
      const n = await kv.scard(KEY_EMAILS);
      return BASE_COUNT + (n ?? 0);
    }
    const store = await readFs();
    return BASE_COUNT + store.emails.length;
  } catch (err) {
    console.error("[registros-store] getCount failed", (err as Error).message);
    return BASE_COUNT;
  }
}

/** Real count (without BASE_COUNT inflation) — used by admin export. */
export async function getRealCount(): Promise<number> {
  if (isKvEnabled()) {
    const n = await kv.scard(KEY_EMAILS);
    return n ?? 0;
  }
  const store = await readFs();
  return store.emails.length;
}

/**
 * Returns records latest-first. Use { limit, offset } for paginated reads.
 * No limit = full dump (intended for admin export only).
 */
export async function listRegistros(opts?: {
  limit?: number;
  offset?: number;
}): Promise<Registro[]> {
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit;

  if (isKvEnabled()) {
    // LRANGE start stop, both inclusive. -1 = end.
    const stop = limit ? offset + limit - 1 : -1;
    const raw = await kv.lrange<string | Registro>(KEY_RECORDS, offset, stop);
    return raw.map((r) => (typeof r === "string" ? (JSON.parse(r) as Registro) : r));
  }

  const store = await readFs();
  const slice = limit ? store.records.slice(offset, offset + limit) : store.records.slice(offset);
  return slice;
}

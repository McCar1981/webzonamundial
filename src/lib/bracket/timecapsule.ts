// src/lib/bracket/timecapsule.ts
// Time Capsule del Bracket: el usuario sella su bracket antes del 11 de
// junio de 2026 y queda guardado en KV. Después del Mundial, le mandamos
// un email con sus aciertos.
//
// Layout en KV:
//   capsule:<hash>             — JSON con email, picks, sealedAt, champion
//   capsule:by-email:<email>   — hash (para poder consultar la cápsula del usuario)
//   capsule:opens:set          — Set de hashes ya "abiertos" (para no enviar 2 veces)

import { kv } from "@vercel/kv";
import { randomBytes, createHash } from "node:crypto";
import type { Pick } from "./types";

const KEY_CAPSULE = (hash: string) => `capsule:${hash}`;
const KEY_BY_EMAIL = (email: string) => `capsule:by-email:${email.toLowerCase()}`;
const KEY_OPENS = "capsule:opens:set";

/** Fecha de cierre: una vez pasada, no se permite sellar nuevas cápsulas. */
export const CAPSULE_DEADLINE = new Date("2026-06-11T16:00:00Z").getTime();
/** Fecha de apertura: a partir de aquí, las cápsulas pueden abrirse. */
export const CAPSULE_OPEN_DATE = new Date("2026-07-20T00:00:00Z").getTime();

export interface TimeCapsule {
  hash: string;
  email: string;
  /** Predicciones snapshot inmutables del momento en que selló. */
  picks: Record<string, Pick>;
  /** ID del campeón predicho. */
  champion: string | null;
  /** Total de goles predichos (suma de scoreA+scoreB de todos los picks). */
  totalGoals: number;
  sealedAt: string;
  /** Si ya se le envió email tras el Mundial. */
  openedAt?: string | null;
}

function genHash(): string {
  return randomBytes(8).toString("base64url");
}

function emailKey(email: string): string {
  // Hash determinista del email — útil si en futuro queremos no almacenar el
  // email plano. Por ahora lo guardamos plano pero la KEY_BY_EMAIL ya está
  // pensada para esto.
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 16);
}

export function isWithinSealWindow(): boolean {
  return Date.now() < CAPSULE_DEADLINE;
}

export function isOpenable(): boolean {
  return Date.now() >= CAPSULE_OPEN_DATE;
}

export async function sealCapsule(input: {
  email: string;
  picks: Record<string, Pick>;
  champion: string | null;
}): Promise<{ ok: true; hash: string } | { ok: false; error: string }> {
  if (!isWithinSealWindow()) {
    return { ok: false, error: "deadline_passed" };
  }
  const email = input.email.toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "invalid_email" };
  }
  // ¿Ya selló una?
  const existing = await kv.get(KEY_BY_EMAIL(email));
  if (existing) {
    return { ok: false, error: "already_sealed" };
  }

  const hash = genHash();
  const totalGoals = Object.values(input.picks).reduce(
    (sum, p) => sum + (p.scoreA || 0) + (p.scoreB || 0),
    0
  );

  const capsule: TimeCapsule = {
    hash,
    email,
    picks: input.picks,
    champion: input.champion,
    totalGoals,
    sealedAt: new Date().toISOString(),
    openedAt: null,
  };

  await kv.set(KEY_CAPSULE(hash), JSON.stringify(capsule));
  await kv.set(KEY_BY_EMAIL(email), hash);
  await kv.sadd("capsule:hashes:set", hash);
  return { ok: true, hash };
}

export async function getCapsuleByHash(hash: string): Promise<TimeCapsule | null> {
  const raw = await kv.get(KEY_CAPSULE(hash));
  if (!raw) return null;
  try {
    return typeof raw === "string" ? (JSON.parse(raw) as TimeCapsule) : (raw as TimeCapsule);
  } catch {
    return null;
  }
}

export async function getCapsuleByEmail(email: string): Promise<TimeCapsule | null> {
  const hash = await kv.get<string>(KEY_BY_EMAIL(email.toLowerCase().trim()));
  if (!hash) return null;
  return getCapsuleByHash(hash);
}

export async function markCapsuleOpened(hash: string): Promise<void> {
  const capsule = await getCapsuleByHash(hash);
  if (!capsule) return;
  capsule.openedAt = new Date().toISOString();
  await kv.set(KEY_CAPSULE(hash), JSON.stringify(capsule));
  await kv.sadd(KEY_OPENS, hash);
}

/** Para uso en el cron que envía emails post-Mundial. */
export async function listUnopenedCapsules(): Promise<TimeCapsule[]> {
  // KV no tiene SCAN nativo cómodo; en producción mantenemos un set
  // "capsule:hashes:set" que se actualiza al sellar. Como evolución
  // futura. Por ahora sealCapsule añade al set también.
  const hashes = await kv.smembers("capsule:hashes:set");
  if (!hashes || hashes.length === 0) return [];
  const records = await Promise.all(hashes.map(getCapsuleByHash));
  return records.filter((r): r is TimeCapsule => r !== null && !r.openedAt);
}

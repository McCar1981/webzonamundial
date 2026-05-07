// src/lib/module-interest/store.ts
// Almacén KV de "interés por módulo" — la lista de espera segmentada que
// alimenta el lanzamiento gradual de cada módulo de la app.
//
// Layout en KV:
//   modint:emails:<slug>    Set de emails interesados en ese módulo
//   modint:record:<email>   JSON con slugs, fechas y origen del usuario
//   modint:total:set        Set de TODOS los emails que han dejado interés
//                           (para limpiar/exportar/duplicar)
//
// Beneficios del diseño:
// - O(1) para añadir email a un módulo (SADD)
// - O(1) para count de interesados por módulo (SCARD)
// - Idempotente: añadir 2 veces el mismo email no infla el contador

import { kv } from "@vercel/kv";

const KEY_EMAILS = (slug: string) => `modint:emails:${slug}`;
const KEY_RECORD = (email: string) => `modint:record:${email.toLowerCase()}`;
const KEY_TOTAL = "modint:total:set";

/** Slugs canónicos de módulos. Cualquier otro slug se rechaza. */
export const MODULE_SLUGS = [
  "predicciones",
  "fantasy",
  "ia-coach",
  "trivia",
  "matchcenter",
  "ligas",
  "rankings",
  "streaming",
  "album",
  "chat",
  "micro",
  "modo-carrera",
  "stories",
] as const;

export type ModuleSlug = (typeof MODULE_SLUGS)[number];

export function isValidModuleSlug(slug: string): slug is ModuleSlug {
  return (MODULE_SLUGS as readonly string[]).includes(slug);
}

export interface ModuleInterestRecord {
  email: string;
  modules: ModuleSlug[];
  firstSeenAt: string;
  lastSeenAt: string;
  source?: string;
  ip?: string;
}

function normalize(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Marca a un email como interesado en un módulo. Idempotente.
 * Devuelve si era nuevo en ese módulo (true) o ya existía (false).
 */
export async function addModuleInterest(input: {
  email: string;
  module: ModuleSlug;
  source?: string;
  ip?: string;
}): Promise<{ ok: true; isNewForModule: boolean; isNewUser: boolean }> {
  const email = normalize(input.email);
  const now = new Date().toISOString();

  // Añadir a sets (idempotente)
  const isNewForModule = (await kv.sadd(KEY_EMAILS(input.module), email)) === 1;
  const isNewUser = (await kv.sadd(KEY_TOTAL, email)) === 1;

  // Update del record JSON
  const existing = (await kv.get<ModuleInterestRecord | string>(KEY_RECORD(email))) ?? null;
  let record: ModuleInterestRecord;
  if (existing) {
    const parsed = typeof existing === "string" ? (JSON.parse(existing) as ModuleInterestRecord) : existing;
    record = {
      ...parsed,
      lastSeenAt: now,
      modules: parsed.modules.includes(input.module) ? parsed.modules : [...parsed.modules, input.module],
    };
  } else {
    record = {
      email,
      modules: [input.module],
      firstSeenAt: now,
      lastSeenAt: now,
      source: input.source,
      ip: input.ip,
    };
  }
  await kv.set(KEY_RECORD(email), JSON.stringify(record));

  return { ok: true, isNewForModule, isNewUser };
}

/** Total de interesados en un módulo concreto. */
export async function getModuleCount(slug: ModuleSlug): Promise<number> {
  return (await kv.scard(KEY_EMAILS(slug))) ?? 0;
}

/** Total de usuarios únicos con al menos un módulo. */
export async function getTotalUsers(): Promise<number> {
  return (await kv.scard(KEY_TOTAL)) ?? 0;
}

/** Counts agregados de todos los módulos. */
export async function getAllModuleCounts(): Promise<Record<ModuleSlug, number>> {
  const entries = await Promise.all(
    MODULE_SLUGS.map(async (slug) => [slug, await getModuleCount(slug)] as const)
  );
  return Object.fromEntries(entries) as Record<ModuleSlug, number>;
}

/**
 * Lista de emails interesados en un módulo concreto. Para envíos
 * masivos cuando se lance el módulo.
 */
export async function listModuleEmails(slug: ModuleSlug): Promise<string[]> {
  return (await kv.smembers(KEY_EMAILS(slug))) ?? [];
}

/** Devuelve el record completo de un email (qué módulos le interesan). */
export async function getUserRecord(email: string): Promise<ModuleInterestRecord | null> {
  const raw = await kv.get(KEY_RECORD(normalize(email)));
  if (!raw) return null;
  try {
    return typeof raw === "string" ? (JSON.parse(raw) as ModuleInterestRecord) : (raw as ModuleInterestRecord);
  } catch {
    return null;
  }
}

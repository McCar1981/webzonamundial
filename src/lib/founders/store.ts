// src/lib/founders/store.ts
// Almacén KV de Founders Pass.
//
// Layout:
//   founders:emails:set        — Set de emails con pass activo (uniqueness + count)
//   founders:user:<user_id>    — Índice inverso email→user_id para lookup por user.id
//   founders:record:<email>    — JSON con detalles (precio, moneda, fecha, customerId, etc.)
//   founders:events:list       — Auditoría de eventos (compras, refunds) latest-first
//   founders:revenue:total     — Contador acumulado en céntimos para analytics rápido
//
// IDENTIDAD: la entitlement se vincula al email (para compatibilidad con Stripe)
// Y al user_id (para sobrevivir cambios de email). El lookup primero intenta
// por email; si no encuentra, por user_id.

import { kv } from "@vercel/kv";

const KEY_EMAILS = "founders:emails:set";
const KEY_USER = (userId: string) => `founders:user:${userId}`;
const KEY_RECORD = (email: string) => `founders:record:${email.toLowerCase()}`;
const KEY_EVENTS = "founders:events:list";
const KEY_REVENUE = "founders:revenue:total";

export interface FounderRecord {
  email: string;
  /** Supabase user.id (auth.users.id) para lookup robusto ante cambio de email. */
  userId?: string | null;
  /** Importe en céntimos (ej. 800 = 8.00 €). */
  amount: number;
  /** Código ISO 4217 minúsculas (eur, usd). */
  currency: string;
  /** Stripe customer id, opcional. */
  customerId?: string | null;
  /** Stripe payment intent id. */
  paymentIntentId?: string | null;
  /** Stripe checkout session id. */
  checkoutSessionId?: string | null;
  /** URL del recibo en Stripe (hosted invoice). */
  receiptUrl?: string | null;
  /** ISO timestamp. */
  purchasedAt: string;
  /** Si fue reembolsado, fecha. */
  refundedAt?: string | null;
}

export type FounderEvent =
  | { type: "purchase"; email: string; amount: number; currency: string; ts: string }
  | { type: "refund"; email: string; amount: number; currency: string; ts: string };

function normalize(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Marca un email como Founder. Idempotente: si el email ya existía, sólo
 * actualiza el record (útil cuando el webhook se entrega varias veces).
 * Si el record incluye userId, se crea un índice inverso para lookup robusto.
 */
export async function markFounder(record: FounderRecord): Promise<void> {
  const email = normalize(record.email);
  const wasNew = await kv.sadd(KEY_EMAILS, email);
  await kv.set(KEY_RECORD(email), JSON.stringify({ ...record, email }));
  // Índice inverso por user_id para sobrevivir cambios de email.
  if (record.userId) {
    await kv.set(KEY_USER(record.userId), email);
  }
  if (wasNew === 1) {
    // Sólo contamos ingresos la primera vez para no inflar al reintentar.
    await kv.incrby(KEY_REVENUE, record.amount);
    const event: FounderEvent = {
      type: "purchase",
      email,
      amount: record.amount,
      currency: record.currency,
      ts: new Date().toISOString(),
    };
    await kv.lpush(KEY_EVENTS, JSON.stringify(event));
  }
}

/** Comprueba si un email es Founder activo. */
export async function isFounder(email: string): Promise<boolean> {
  if (!email) return false;
  const result = await kv.sismember(KEY_EMAILS, normalize(email));
  return result === 1;
}

/** Comprueba si un user_id es Founder activo (útil tras cambio de email). */
export async function isFounderByUserId(userId: string): Promise<boolean> {
  if (!userId) return false;
  const email = await kv.get<string>(KEY_USER(userId));
  if (!email) return false;
  return isFounder(email);
}

/** Devuelve el record completo o null. */
export async function getFounderRecord(email: string): Promise<FounderRecord | null> {
  const raw = await kv.get(KEY_RECORD(normalize(email)));
  if (!raw) return null;
  try {
    return typeof raw === "string" ? (JSON.parse(raw) as FounderRecord) : (raw as FounderRecord);
  } catch {
    return null;
  }
}

/** Devuelve el record por user_id (lookup robusto ante cambio de email). */
export async function getFounderRecordByUserId(userId: string): Promise<FounderRecord | null> {
  if (!userId) return null;
  const email = await kv.get<string>(KEY_USER(userId));
  if (!email) return null;
  return getFounderRecord(email);
}

/** Para reembolsos: marca como refunded sin borrar el record histórico. */
export async function markFounderRefunded(email: string): Promise<void> {
  const e = normalize(email);
  await kv.srem(KEY_EMAILS, e);
  const record = await getFounderRecord(e);
  if (record) {
    record.refundedAt = new Date().toISOString();
    await kv.set(KEY_RECORD(e), JSON.stringify(record));
    // Limpiar índice inverso para que el user_id ya no resuelva a founder.
    if (record.userId) {
      await kv.del(KEY_USER(record.userId));
    }
    const event: FounderEvent = {
      type: "refund",
      email: e,
      amount: record.amount,
      currency: record.currency,
      ts: record.refundedAt,
    };
    await kv.lpush(KEY_EVENTS, JSON.stringify(event));
    // Restamos del revenue acumulado.
    await kv.decrby(KEY_REVENUE, record.amount);
  }
}

/** Total de Founders activos. */
export async function getFoundersCount(): Promise<number> {
  return (await kv.scard(KEY_EMAILS)) ?? 0;
}

/** Ingresos acumulados en céntimos (todas las monedas mezcladas — para analytics rápido). */
export async function getRevenueCents(): Promise<number> {
  return (await kv.get<number>(KEY_REVENUE)) ?? 0;
}

/** Lista paginada de founders (latest first). */
export async function listFounders(opts?: { limit?: number; offset?: number }): Promise<FounderRecord[]> {
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 100;
  const emails = await kv.smembers(KEY_EMAILS);
  if (!emails || emails.length === 0) return [];
  const slice = emails.slice(offset, offset + limit);
  const records = await Promise.all(slice.map((e) => getFounderRecord(e)));
  return records
    .filter((r): r is FounderRecord => r !== null)
    .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
}

/** Eventos de auditoría (latest first). */
export async function listEvents(limit = 50): Promise<FounderEvent[]> {
  const raw = await kv.lrange<string | FounderEvent>(KEY_EVENTS, 0, limit - 1);
  return raw.map((r) => (typeof r === "string" ? (JSON.parse(r) as FounderEvent) : r));
}

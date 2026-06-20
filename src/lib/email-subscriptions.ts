// src/lib/email-subscriptions.ts
//
// Helper server-only para gestionar suscripciones a emails (digest diario,
// match alerts, etc). Usa SUPABASE_SERVICE_ROLE_KEY porque los INSERT van
// desde /api/registro (donde aún no hay sesión completa) y desde el cron.
//
// Para queries del USUARIO autenticado, mejor usar el cliente SSR normal
// con RLS y leer/actualizar su propia fila.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export type SubscriptionKind =
  | "daily-digest"
  | "match-alerts"
  | "fav-team-news"
  | "blog-posts"
  | "newsletter";

let _admin: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing — email-subscriptions requires server-only admin",
    );
  }
  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}

/**
 * Crea o reactiva una suscripción. Idempotente: si ya existía pero
 * estaba dada de baja, la reactiva. Si ya estaba activa, no hace nada.
 */
export async function subscribe(opts: {
  email: string;
  userId?: string | null;
  kind?: SubscriptionKind;
  source?: string;
}): Promise<{ ok: boolean; alreadyActive: boolean; error?: string }> {
  try {
    const admin = getAdmin();
    const email = opts.email.trim().toLowerCase();
    const kind = opts.kind ?? "daily-digest";

    // Upsert por (email, kind). Si existe inactiva, la activamos.
    const { data: existing } = await admin
      .from("email_subscriptions")
      .select("id, unsubscribed_at, user_id")
      .eq("email", email)
      .eq("kind", kind)
      .maybeSingle();

    if (existing) {
      if (!existing.unsubscribed_at) {
        // Backfill del user_id si la fila se creó sin él (p. ej. la
        // auto-suscripción de /api/registro, anterior a que el usuario exista).
        // Sin user_id, el digest y los emails por-usuario (racha) no pueden
        // cruzar email↔usuario y nunca se envían a esa persona.
        if (!existing.user_id && opts.userId) {
          await admin
            .from("email_subscriptions")
            .update({ user_id: opts.userId })
            .eq("id", existing.id);
        }
        return { ok: true, alreadyActive: true };
      }
      // Re-suscribir: limpia el unsubscribed_at (y rellena user_id si falta).
      const { error } = await admin
        .from("email_subscriptions")
        .update({
          unsubscribed_at: null,
          source: opts.source ?? "resubscribe",
          ...(opts.userId ? { user_id: opts.userId } : {}),
        })
        .eq("id", existing.id);
      if (error) return { ok: false, alreadyActive: false, error: error.message };
      return { ok: true, alreadyActive: false };
    }

    // Nueva suscripción.
    const { error } = await admin.from("email_subscriptions").insert({
      email,
      user_id: opts.userId ?? null,
      kind,
      source: opts.source ?? "unknown",
    });
    if (error) return { ok: false, alreadyActive: false, error: error.message };
    return { ok: true, alreadyActive: false };
  } catch (err) {
    return {
      ok: false,
      alreadyActive: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Marca una suscripción como dada de baja (unsubscribed_at = NOW()).
 * Idempotente: si ya estaba inactiva no falla.
 */
export async function unsubscribe(opts: {
  email: string;
  kind?: SubscriptionKind;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = getAdmin();
    const email = opts.email.trim().toLowerCase();
    const kind = opts.kind ?? "daily-digest";

    const { error } = await admin
      .from("email_subscriptions")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("email", email)
      .eq("kind", kind)
      .is("unsubscribed_at", null);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Registra la BAJA de la newsletter para un email. A diferencia de unsubscribe()
 * (que solo ACTUALIZA filas existentes), aquí INSERTAMOS la fila si no existe:
 * a la newsletter masiva no se suscribe nadie por adelantado, se envía a TODOS
 * los usuarios MENOS los que están en esta lista de bajas. Sin la fila, la baja
 * no quedaría registrada y el usuario seguiría recibiendo correos.
 */
export async function optOutNewsletter(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = getAdmin();
    const e = email.trim().toLowerCase();
    const now = new Date().toISOString();
    const { data: existing } = await admin
      .from("email_subscriptions")
      .select("id")
      .eq("email", e)
      .eq("kind", "newsletter")
      .maybeSingle();
    if (existing) {
      const { error } = await admin
        .from("email_subscriptions")
        .update({ unsubscribed_at: now })
        .eq("id", existing.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await admin.from("email_subscriptions").insert({
        email: e,
        kind: "newsletter",
        source: "newsletter-baja",
        unsubscribed_at: now,
      });
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Emails (en minúsculas) que se han dado de BAJA de la newsletter. Se restan del
 * pool de destinatarios antes de enviar (y antes del dry-run). Best-effort: si la
 * lectura falla, devuelve set vacío (mejor no enviar de más por un fallo puntual…
 * pero aquí preferimos no romper el envío; el riesgo es bajo).
 */
export async function listNewsletterOptOuts(): Promise<Set<string>> {
  try {
    const admin = getAdmin();
    const { data, error } = await admin
      .from("email_subscriptions")
      .select("email")
      .eq("kind", "newsletter")
      .not("unsubscribed_at", "is", null);
    if (error) {
      console.error("[email-subscriptions] listNewsletterOptOuts failed:", error.message);
      return new Set();
    }
    return new Set((data ?? []).map((r) => (r.email as string).toLowerCase().trim()));
  } catch (err) {
    console.error("[email-subscriptions] listNewsletterOptOuts threw:", (err as Error).message);
    return new Set();
  }
}

/**
 * Devuelve todos los suscritos activos a un kind dado. Paginado.
 */
export async function listActiveSubscribers(opts: {
  kind?: SubscriptionKind;
  limit?: number;
  offset?: number;
}): Promise<{
  rows: Array<{ id: string; email: string; user_id: string | null }>;
  error?: string;
}> {
  try {
    const admin = getAdmin();
    const kind = opts.kind ?? "daily-digest";
    const limit = opts.limit ?? 500;
    const offset = opts.offset ?? 0;

    const { data, error } = await admin
      .from("email_subscriptions")
      .select("id, email, user_id")
      .eq("kind", kind)
      .is("unsubscribed_at", null)
      .order("subscribed_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) return { rows: [], error: error.message };
    return { rows: data ?? [] };
  } catch (err) {
    return { rows: [], error: (err as Error).message };
  }
}

/**
 * Marca varias filas como enviadas (actualiza last_sent_at).
 * Lo llama el cron después de enviar el digest.
 */
export async function markSent(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const admin = getAdmin();
    await admin
      .from("email_subscriptions")
      .update({ last_sent_at: new Date().toISOString() })
      .in("id", ids);
  } catch (err) {
    console.error("[email-subscriptions] markSent failed:", (err as Error).message);
  }
}

/**
 * Genera un token de unsubscribe firmado HMAC para que el link en el email
 * no sea adivinable. Formato: base64url(email|kind|expiry|hmac).
 *
 * Validez: 30 días (un usuario puede tardar en darse cuenta de que quiere
 * darse de baja). Tras la expiración tienen que ir a /cuenta/notificaciones.
 *
 * El secret va en EMAIL_UNSUB_SECRET (Vercel env). Si no está, fallback al
 * SUPABASE_SERVICE_ROLE_KEY (siempre presente y privado).
 */
function getUnsubSecret(): string {
  return (
    process.env.EMAIL_UNSUB_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "fallback-do-not-use-in-production"
  );
}

export function buildUnsubscribeToken(opts: {
  email: string;
  kind: SubscriptionKind;
  ttlDays?: number;
}): string {
  const ttlDays = opts.ttlDays ?? 30;
  const expiry = Math.floor(Date.now() / 1000) + ttlDays * 86400;
  const payload = `${opts.email.toLowerCase()}|${opts.kind}|${expiry}`;
  const hmac = crypto
    .createHmac("sha256", getUnsubSecret())
    .update(payload)
    .digest("hex")
    .slice(0, 24);
  return Buffer.from(`${payload}|${hmac}`, "utf-8")
    .toString("base64url");
}

export function verifyUnsubscribeToken(token: string): {
  ok: boolean;
  email?: string;
  kind?: SubscriptionKind;
  error?: string;
} {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split("|");
    if (parts.length !== 4) return { ok: false, error: "malformed_token" };
    const [email, kind, expiryStr, hmac] = parts;
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry)) return { ok: false, error: "bad_expiry" };
    if (Math.floor(Date.now() / 1000) > expiry) {
      return { ok: false, error: "expired" };
    }
    const expectedHmac = crypto
      .createHmac("sha256", getUnsubSecret())
      .update(`${email}|${kind}|${expiry}`)
      .digest("hex")
      .slice(0, 24);
    if (expectedHmac !== hmac) return { ok: false, error: "bad_signature" };
    return { ok: true, email, kind: kind as SubscriptionKind };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

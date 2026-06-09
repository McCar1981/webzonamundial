// src/lib/push-notifications.ts
//
// Server-only helper para gestionar Web Push.
// - Guarda/actualiza/borra subscriptions con service_role.
// - Envía pushes usando web-push (VAPID + AES-GCM payload).
// - Gestiona expiraciones: si el endpoint devuelve 410, borra la fila.

import webpush from "web-push";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface BrowserSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  // Sirve para agrupar pushes del mismo tipo y reemplazar el anterior
  // (p.ej. todos los "news" comparten tag → solo se ve el último).
  tag?: string;
  // Icono que muestra Chrome desktop / Android. Debe ser PNG 192x192 o 256x256.
  icon?: string;
  // Badge monocromo 72x72 (PNG transparente). Chrome lo pinta en la barra de
  // estado de Android; si no se envía, el SW usa /icons/badge-72.png.
  badge?: string;
  // Imagen grande del push (opcional, Android la muestra bajo el título).
  image?: string;
  // "Fijar": la notificación no se auto-cierra (queda anclada hasta que el
  // usuario la descarta). Lo usa "Seguir partido" para el efecto pin.
  requireInteraction?: boolean;
  // Actualización silenciosa: refresca la tarjeta (marcador/minuto) sin sonido
  // ni vibración. Para los "ticks" de minuto del partido seguido.
  silent?: boolean;
  // Identificador interno para tracking.
  pushId?: string;
}

let _admin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  }
  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}

let _vapidConfigured = false;
function configureVapid(): boolean {
  if (_vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:gol@zonamundial.app";
  if (!publicKey || !privateKey) {
    console.error(
      "[push] VAPID keys missing — set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY",
    );
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  _vapidConfigured = true;
  return true;
}

/**
 * Guarda o actualiza una subscription. UPSERT por endpoint.
 */
export async function savePushSubscription(opts: {
  subscription: BrowserSubscription;
  userId?: string | null;
  userAgent?: string;
  locale?: string;
  kinds?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = getAdmin();
    const row = {
      endpoint: opts.subscription.endpoint,
      p256dh: opts.subscription.keys.p256dh,
      auth: opts.subscription.keys.auth,
      user_id: opts.userId ?? null,
      user_agent: opts.userAgent ?? null,
      locale: opts.locale ?? null,
      kinds: opts.kinds && opts.kinds.length > 0 ? opts.kinds : ["news"],
      failure_count: 0,
      last_error_at: null,
    };
    const { error } = await admin
      .from("push_subscriptions")
      .upsert(row, { onConflict: "endpoint" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Borra la subscription por endpoint. Idempotente.
 */
export async function deletePushSubscription(
  endpoint: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = getAdmin();
    const { error } = await admin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** H-001-24: devuelve el user_id de una subscription (null si no existe o es anónima). */
export async function getPushSubscriptionOwner(endpoint: string): Promise<string | null> {
  try {
    const admin = getAdmin();
    const { data } = await admin
      .from("push_subscriptions")
      .select("user_id")
      .eq("endpoint", endpoint)
      .maybeSingle();
    return (data as { user_id?: string | null } | null)?.user_id ?? null;
  } catch {
    return null;
  }
}

/**
 * Devuelve todas las subscriptions suscritas a un kind dado.
 *
 * Implementaci\u00f3n h\u00edbrida durante la transici\u00f3n a FASE 3:
 *  1. Lee notification_preferences (category, channel='push', enabled=true)
 *     \u2192 source of truth nueva.
 *  2. Filtra push_subscriptions a los user_ids resultantes.
 *  3. Adem\u00e1s incluye legacy: subs con kind en kinds[] cuyo user a\u00fan no
 *     migr\u00f3 a preferences (compat retro).
 */
export async function listSubscriptionsForKind(kind: string): Promise<
  Array<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    failure_count: number;
  }>
> {
  try {
    const admin = getAdmin();

    // 1) Users con preferencia activa: category=kind, channel=push.
    const { data: prefRows } = await admin
      .from("notification_preferences")
      .select("user_id")
      .eq("category", kind)
      .eq("channel", "push")
      .eq("enabled", true);

    const allowedUserIds = new Set<string>(
      (prefRows ?? []).map((r) => r.user_id as string),
    );

    // 2) Users que tambi\u00e9n tienen preferencia EXPL\u00cdCITAMENTE deshabilitada.
    //    Estos los excluimos del fallback legacy.
    const { data: optOutRows } = await admin
      .from("notification_preferences")
      .select("user_id")
      .eq("category", kind)
      .eq("channel", "push")
      .eq("enabled", false);
    const optedOutUserIds = new Set<string>(
      (optOutRows ?? []).map((r) => r.user_id as string),
    );

    // 3) Base de destinatarios = UNI\u00d3N de dos fuentes:
    //    (a) subs con el kind en su kinds[] legacy (compat FASE 2), y
    //    (b) subs cuyo user activ\u00f3 la preferencia (category=kind, push) en
    //        FASE 3 \u2014 aunque su kinds[] NO contenga el kind. Sin esto, activar
    //        una categor\u00eda nueva en /cuenta/notificaciones no surt\u00eda efecto
    //        porque el array kinds[] (escrito al suscribirse, normalmente solo
    //        ["news"]) hac\u00eda de portero y exclu\u00eda al user.
    const byId = new Map<
      string,
      {
        id: string;
        endpoint: string;
        p256dh: string;
        auth: string;
        failure_count: number;
        user_id: string | null;
      }
    >();

    const { data: legacySubs, error } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, failure_count, user_id")
      .contains("kinds", [kind]);
    if (error) {
      console.error("[push] listSubscriptionsForKind failed:", error.message);
      return [];
    }
    for (const s of legacySubs ?? []) byId.set(s.id as string, s);

    // (b) subs de los users con preferencia activa (independiente de kinds[]).
    if (allowedUserIds.size > 0) {
      const { data: prefSubs, error: prefErr } = await admin
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth, failure_count, user_id")
        .in("user_id", [...allowedUserIds]);
      if (prefErr) {
        console.error("[push] listSubscriptionsForKind pref subs failed:", prefErr.message);
      } else {
        for (const s of prefSubs ?? []) byId.set(s.id as string, s);
      }
    }

    // 4) Filtra: excluye solo si el user tiene opt-out expl\u00edcito de esta
    //    categor\u00eda por push. El resto (legacy o con pref activa) recibe.
    const result = [...byId.values()].filter((s) => {
      const uid = s.user_id as string | null;
      if (!uid) return true; // an\u00f3nimas: no podemos filtrar, las incluimos
      if (optedOutUserIds.has(uid)) return false;
      return true;
    });

    return result.map((r) => ({
      id: r.id,
      endpoint: r.endpoint,
      p256dh: r.p256dh,
      auth: r.auth,
      failure_count: r.failure_count,
    }));
  } catch (err) {
    console.error("[push] listSubscriptionsForKind threw:", (err as Error).message);
    return [];
  }
}

/**
 * Envía un push a UNA subscription. Maneja errores 410/4xx.
 * Retorna { ok, gone, errorCode }. Si gone = true, el caller debe
 * borrar la subscription.
 */
export async function sendPushToSubscription(opts: {
  endpoint: string;
  p256dh: string;
  auth: string;
  payload: PushPayload;
  ttlSeconds?: number;
}): Promise<{ ok: boolean; gone: boolean; statusCode?: number; error?: string }> {
  if (!configureVapid()) {
    return { ok: false, gone: false, error: "vapid_not_configured" };
  }
  try {
    const result = await webpush.sendNotification(
      {
        endpoint: opts.endpoint,
        keys: { p256dh: opts.p256dh, auth: opts.auth },
      },
      JSON.stringify(opts.payload),
      {
        TTL: opts.ttlSeconds ?? 86400, // 24h por defecto
        urgency: "normal",
      },
    );
    return { ok: true, gone: false, statusCode: result.statusCode };
  } catch (err) {
    const e = err as Error & { statusCode?: number; body?: string };
    // 410 GONE / 404 NOT FOUND → subscription expirada, borrar.
    const gone = e.statusCode === 410 || e.statusCode === 404;
    return {
      ok: false,
      gone,
      statusCode: e.statusCode,
      error: e.body || e.message,
    };
  }
}

/**
 * Marca una subscription con +1 al failure_count. Si llega a 5, borra.
 */
async function markFailureOrDelete(id: string, currentFailures: number): Promise<void> {
  try {
    const admin = getAdmin();
    if (currentFailures + 1 >= 5) {
      await admin.from("push_subscriptions").delete().eq("id", id);
      return;
    }
    await admin
      .from("push_subscriptions")
      .update({
        failure_count: currentFailures + 1,
        last_error_at: new Date().toISOString(),
      })
      .eq("id", id);
  } catch (err) {
    console.error("[push] markFailureOrDelete failed:", (err as Error).message);
  }
}

/**
 * Marca una subscription como enviada exitosamente (resetea failure_count).
 */
async function markSuccess(id: string): Promise<void> {
  try {
    const admin = getAdmin();
    await admin
      .from("push_subscriptions")
      .update({
        failure_count: 0,
        last_sent_at: new Date().toISOString(),
        last_error_at: null,
      })
      .eq("id", id);
  } catch (err) {
    console.error("[push] markSuccess failed:", (err as Error).message);
  }
}

/**
 * Borra una subscription por id (cuando endpoint devuelve 410).
 */
async function deleteSubscriptionById(id: string): Promise<void> {
  try {
    const admin = getAdmin();
    await admin.from("push_subscriptions").delete().eq("id", id);
  } catch (err) {
    console.error("[push] deleteSubscriptionById failed:", (err as Error).message);
  }
}

/**
 * Envía un push a TODAS las subscriptions de un kind dado.
 * Maneja fallos individualmente.
 */
export async function broadcastPush(opts: {
  kind: string;
  payload: PushPayload;
}): Promise<{ total: number; sent: number; gone: number; failed: number }> {
  const subs = await listSubscriptionsForKind(opts.kind);
  let sent = 0;
  let gone = 0;
  let failed = 0;

  // Envío secuencial para no saturar al provider. Con N pequeño (decenas)
  // es suficiente. Si crece a miles, migrar a Promise.allSettled en batches.
  for (const sub of subs) {
    const result = await sendPushToSubscription({
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      payload: opts.payload,
    });
    if (result.ok) {
      sent += 1;
      await markSuccess(sub.id);
    } else if (result.gone) {
      gone += 1;
      await deleteSubscriptionById(sub.id);
    } else {
      failed += 1;
      await markFailureOrDelete(sub.id, sub.failure_count);
    }
  }

  return { total: subs.length, sent, gone, failed };
}

/**
 * Envía un push a una lista EXPLÍCITA de endpoints (no por kind). Lo usa
 * "Seguir partido": manda la versión fijada (requireInteraction) solo a los
 * que siguen ese partido. Busca sus claves en push_subscriptions y gestiona
 * los fallos igual que broadcastPush (410 → borrar, 5 fallos → borrar).
 */
export async function sendPushToEndpoints(opts: {
  endpoints: string[];
  payload: PushPayload;
}): Promise<{ total: number; sent: number; gone: number; failed: number }> {
  const uniq = [...new Set(opts.endpoints)].filter(Boolean);
  if (uniq.length === 0) return { total: 0, sent: 0, gone: 0, failed: 0 };

  let rows: Array<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    failure_count: number;
  }> = [];
  try {
    const admin = getAdmin();
    const { data, error } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, failure_count")
      .in("endpoint", uniq);
    if (error) {
      console.error("[push] sendPushToEndpoints query failed:", error.message);
      return { total: 0, sent: 0, gone: 0, failed: 0 };
    }
    rows = data ?? [];
  } catch (err) {
    console.error("[push] sendPushToEndpoints threw:", (err as Error).message);
    return { total: 0, sent: 0, gone: 0, failed: 0 };
  }

  let sent = 0;
  let gone = 0;
  let failed = 0;
  for (const sub of rows) {
    const result = await sendPushToSubscription({
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      payload: opts.payload,
    });
    if (result.ok) {
      sent += 1;
      await markSuccess(sub.id);
    } else if (result.gone) {
      gone += 1;
      await deleteSubscriptionById(sub.id);
    } else {
      failed += 1;
      await markFailureOrDelete(sub.id, sub.failure_count);
    }
  }
  return { total: rows.length, sent, gone, failed };
}

/**
 * Envía un push DIRIGIDO a uno o varios usuarios concretos (no broadcast ni por
 * kind). Lo usan los avisos 1v1 como los Duelos en Vivo, donde el destinatario es
 * un jugador específico. Resuelve sus subscriptions por user_id y reutiliza el
 * envío por endpoints (mismo manejo de 410/fallos).
 */
export async function sendPushToUsers(opts: {
  userIds: string[];
  payload: PushPayload;
}): Promise<{ total: number; sent: number; gone: number; failed: number }> {
  const uniqUsers = [...new Set(opts.userIds)].filter(Boolean);
  if (uniqUsers.length === 0) return { total: 0, sent: 0, gone: 0, failed: 0 };

  let endpoints: string[] = [];
  try {
    const admin = getAdmin();
    const { data, error } = await admin
      .from("push_subscriptions")
      .select("endpoint")
      .in("user_id", uniqUsers);
    if (error) {
      console.error("[push] sendPushToUsers query failed:", error.message);
      return { total: 0, sent: 0, gone: 0, failed: 0 };
    }
    endpoints = (data ?? []).map((r) => r.endpoint as string);
  } catch (err) {
    console.error("[push] sendPushToUsers threw:", (err as Error).message);
    return { total: 0, sent: 0, gone: 0, failed: 0 };
  }

  return sendPushToEndpoints({ endpoints, payload: opts.payload });
}

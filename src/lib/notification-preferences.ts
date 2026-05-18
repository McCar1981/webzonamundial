// src/lib/notification-preferences.ts
//
// Helper para consultar y mutar notification_preferences.
// Server-only. Usa service_role para los broadcasts del cron, RLS para
// los endpoints del user autenticado.
//
// Modelo:
//   notification_preferences (user_id, category, channel, enabled)
//
// Categor\u00edas (extensible):
//   - "news"                  \u2014 noticias publicadas
//   - "fav-team"              \u2014 eventos de la selecci\u00f3n favorita (app m\u00f3vil)
//   - "tournament-key-events" \u2014 sorteo, octavos, finales (admin)
//   - "predictions-reminder"  \u2014 antes de cada partido (app m\u00f3vil)
//   - "fantasy"               \u2014 movimientos en fantasy (app m\u00f3vil)
//   - "blog-posts"            \u2014 nuevos posts del blog
//   - "creators"              \u2014 creador favorito publica contenido
//
// Canales:
//   - "push"   \u2014 Web Push (SW) + FCM cuando app m\u00f3vil exista
//   - "email"  \u2014 Resend
//   - "in-app" \u2014 campana dentro de la app (futuro)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type NotificationCategory =
  | "news"
  | "fav-team"
  | "tournament-key-events"
  | "predictions-reminder"
  | "fantasy"
  | "blog-posts"
  | "creators";

export type NotificationChannel = "push" | "email" | "in-app";

export interface PreferenceRow {
  user_id: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  enabled: boolean;
}

let _admin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}

/**
 * Lista las preferencias de un user. Devuelve filas ya existentes;
 * el caller decide los defaults para las categor\u00edas no presentes.
 */
export async function listUserPreferences(
  userId: string,
): Promise<PreferenceRow[]> {
  const admin = getAdmin();
  const { data, error } = await admin
    .from("notification_preferences")
    .select("user_id, category, channel, enabled")
    .eq("user_id", userId);
  if (error) {
    console.error("[notif-prefs] list failed:", error.message);
    return [];
  }
  return (data ?? []) as PreferenceRow[];
}

/**
 * Upsert de una preferencia.
 */
export async function setPreference(opts: {
  userId: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  enabled: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = getAdmin();
  const { error } = await admin
    .from("notification_preferences")
    .upsert(
      {
        user_id: opts.userId,
        category: opts.category,
        channel: opts.channel,
        enabled: opts.enabled,
      },
      { onConflict: "user_id,category,channel" },
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Devuelve la lista de user_ids que tienen una (category, channel)
 * habilitada. Usado por los crons para filtrar destinatarios.
 *
 * Si la preferencia NO existe en notification_preferences:
 *   - Para categor\u00eda "news" + canal "email": fallback al estado de
 *     email_subscriptions.daily-digest (compat FASE 1).
 *   - Para categor\u00eda "news" + canal "push": fallback al estado de
 *     push_subscriptions.kinds (compat FASE 2).
 *   - Para otras categor\u00edas: usuario NO incluido por defecto (opt-in).
 */
export async function listUsersWithPreference(opts: {
  category: NotificationCategory;
  channel: NotificationChannel;
}): Promise<string[]> {
  const admin = getAdmin();
  const { data, error } = await admin
    .from("notification_preferences")
    .select("user_id")
    .eq("category", opts.category)
    .eq("channel", opts.channel)
    .eq("enabled", true);
  if (error) {
    console.error("[notif-prefs] listUsers failed:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.user_id as string);
}

/**
 * Defaults aplicados a un user nuevo al registrarse o al primer click
 * en /cuenta/notificaciones si nunca configur\u00f3 nada.
 *
 * Pol\u00edtica conservadora: solo 2 prefs activas por defecto.
 */
export async function ensureDefaultPreferences(
  userId: string,
): Promise<void> {
  const defaults: Array<Omit<PreferenceRow, "user_id">> = [
    { category: "news", channel: "email", enabled: true },
    // Push NO se activa por defecto \u2014 requiere consent expl\u00edcito
    // del navegador (Notification.requestPermission). El user lo activa
    // tocando el toggle en /cuenta/notificaciones.
  ];

  const admin = getAdmin();
  const rows = defaults.map((d) => ({ ...d, user_id: userId }));
  await admin
    .from("notification_preferences")
    .upsert(rows, { onConflict: "user_id,category,channel", ignoreDuplicates: true });
}

// /cuenta/notificaciones \u2014 panel granular de preferencias (FASE 3).
//
// Carga SSR:
//   - email (auth.users)
//   - estado legacy de email_subscriptions.daily-digest (compat)
//   - filas de notification_preferences (granular)
//
// El panel del cliente fusiona los 3 estados.

import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import NotificacionesPanel from "./NotificacionesPanel";

export const metadata: Metadata = {
  title: "Notificaciones | ZonaMundial",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SearchParams {
  unsubscribed?: string;
  error?: string;
}

export default async function NotificacionesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser("/cuenta/notificaciones");

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";

  // Estado legacy email_subscriptions (FASE 1) \u2014 sirve para fallback
  // visual cuando el user no tiene fila en notification_preferences.
  let isSubscribed = false;
  if (user?.id) {
    const { data } = await supabase
      .from("email_subscriptions")
      .select("unsubscribed_at")
      .eq("user_id", user.id)
      .eq("kind", "daily-digest")
      .maybeSingle();
    if (data) {
      isSubscribed = !data.unsubscribed_at;
    } else {
      const { data: byEmail } = await supabase
        .from("email_subscriptions")
        .select("unsubscribed_at")
        .eq("email", email)
        .eq("kind", "daily-digest")
        .maybeSingle();
      if (byEmail) {
        isSubscribed = !byEmail.unsubscribed_at;
      }
    }
  }

  // Preferencias granulares (FASE 3).
  let initialPrefs: Array<{
    category: string;
    channel: string;
    enabled: boolean;
  }> = [];
  if (user?.id) {
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("category, channel, enabled")
      .eq("user_id", user.id);
    initialPrefs = (prefs ?? []) as typeof initialPrefs;
  }

  return (
    <NotificacionesPanel
      email={email}
      initialSubscribed={isSubscribed}
      unsubscribedFlag={searchParams.unsubscribed === "1"}
      errorFlag={searchParams.error ?? null}
      initialPrefs={initialPrefs}
    />
  );
}

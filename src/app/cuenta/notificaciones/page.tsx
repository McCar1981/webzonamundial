// /cuenta/notificaciones — gestión de preferencias de email/push.
//
// FASE 1: solo daily-digest de noticias. En FASE 3 añadiremos toggles
// por categoría, fav-team alerts, push web, etc.

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

  // Leemos suscripción al daily-digest. RLS permite solo ver las propias.
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
      // También buscamos por email (caso registros sin user_id linkeado).
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

  return (
    <NotificacionesPanel
      email={email}
      initialSubscribed={isSubscribed}
      unsubscribedFlag={searchParams.unsubscribed === "1"}
      errorFlag={searchParams.error ?? null}
    />
  );
}

// POST /api/notifications/push/test
// Body: { endpoint?: string }
//
// Envía un push de prueba. Si se pasa endpoint, solo a esa subscription.
// Si no, broadcast a TODAS las del kind 'news' del usuario autenticado.
//
// Útil para verificar que las notificaciones llegan al device sin esperar
// a que se publique una noticia real.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendPushToSubscription } from "@/lib/push-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  let body: { endpoint?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* body vacío ok */
  }

  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);
  if (body.endpoint) query = query.eq("endpoint", body.endpoint);
  const { data: subs, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!subs || subs.length === 0) {
    return NextResponse.json(
      { error: "no_subscriptions_found_for_user" },
      { status: 404 },
    );
  }

  let sent = 0;
  let failed = 0;
  for (const sub of subs) {
    const result = await sendPushToSubscription({
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      payload: {
        title: "🏆 ZonaMundial",
        body: "Prueba de notificación. ¡Funciona!",
        url: "/cuenta/notificaciones",
        tag: "test",
        icon: "/img/email/logo-zonamundial.png",
      },
    });
    if (result.ok) sent += 1;
    else failed += 1;
  }
  return NextResponse.json({ ok: true, sent, failed, total: subs.length });
}

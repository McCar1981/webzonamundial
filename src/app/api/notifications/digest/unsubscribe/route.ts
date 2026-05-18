// GET  /api/notifications/digest/unsubscribe?token=XXX
//   Link en el footer del email. Token firmado HMAC (30 días validez).
//   Tras unsubscribe redirige a /cuenta/notificaciones?unsubscribed=1.
//
// POST /api/notifications/digest/unsubscribe
//   Body: { } (vacío). Para el toggle en /cuenta/notificaciones.
//   Usa sesión autenticada en vez de token.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { unsubscribe, verifyUnsubscribeToken } from "@/lib/email-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(
      `${origin}/cuenta/notificaciones?error=missing_token`,
    );
  }

  const v = verifyUnsubscribeToken(token);
  if (!v.ok || !v.email || !v.kind) {
    return NextResponse.redirect(
      `${origin}/cuenta/notificaciones?error=${encodeURIComponent(v.error || "invalid_token")}`,
    );
  }

  const result = await unsubscribe({ email: v.email, kind: v.kind });
  if (!result.ok) {
    console.error("[digest/unsubscribe] failed:", result.error);
    return NextResponse.redirect(
      `${origin}/cuenta/notificaciones?error=internal`,
    );
  }
  // Página pública confirmando baja, no requiere sesión.
  return NextResponse.redirect(
    `${origin}/cuenta/notificaciones?unsubscribed=1`,
  );
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }
  const result = await unsubscribe({
    email: user.email,
    kind: "daily-digest",
  });
  if (!result.ok) {
    console.error("[digest/unsubscribe POST] failed:", result.error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

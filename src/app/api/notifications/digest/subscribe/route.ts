// POST /api/notifications/digest/subscribe
// Body: { } (vacío — usa sesión actual)
//
// Suscribe al usuario autenticado al email digest diario de noticias.
// Idempotente: si ya estaba suscrito, devuelve ok sin error.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { subscribe } from "@/lib/email-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }
  const result = await subscribe({
    email: user.email,
    userId: user.id,
    kind: "daily-digest",
    source: "manual-cuenta",
  });
  if (!result.ok) {
    console.error("[digest/subscribe] failed:", result.error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    alreadyActive: result.alreadyActive,
  });
}

// POST /api/notifications/push/unsubscribe
// Body: { endpoint: string }
//
// Borra la subscription por endpoint. Idempotente: si no existe no falla.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { deletePushSubscription, getPushSubscriptionOwner } from "@/lib/push-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (typeof body.endpoint !== "string") {
    return NextResponse.json({ error: "endpoint_required" }, { status: 400 });
  }

  // H-001-24: probar posesión — solo el dueño puede borrar su subscription.
  const owner = await getPushSubscriptionOwner(body.endpoint);
  if (owner !== null && owner !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await deletePushSubscription(body.endpoint);
  if (!result.ok) {
    console.error("[push/unsubscribe] failed:", result.error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

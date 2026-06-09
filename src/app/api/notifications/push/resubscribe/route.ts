// POST /api/notifications/push/resubscribe
// Body: { oldEndpoint: string | null, subscription: PushSubscription.toJSON() }
//
// Llamado por el Service Worker cuando el browser rota la subscription.
// Borra la antigua (si existe) y guarda la nueva.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
  deletePushSubscription,
  savePushSubscription,
  type BrowserSubscription,
} from "@/lib/push-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  oldEndpoint?: string | null;
  subscription?: BrowserSubscription;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const sub = body.subscription;
  if (
    !sub ||
    typeof sub.endpoint !== "string" ||
    !sub.keys ||
    typeof sub.keys.p256dh !== "string" ||
    typeof sub.keys.auth !== "string"
  ) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }

  if (body.oldEndpoint && body.oldEndpoint !== sub.endpoint) {
    await deletePushSubscription(body.oldEndpoint);
  }

  const result = await savePushSubscription({
    subscription: sub,
    userId: user.id,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });
  if (!result.ok) {
    console.error("[push/resubscribe] failed:", result.error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

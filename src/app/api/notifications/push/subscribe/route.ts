// POST /api/notifications/push/subscribe
// Body: { subscription: PushSubscription.toJSON(), kinds?: string[] }
//
// Guarda la subscription del browser para que el backend pueda enviarle
// pushes. La sesión es opcional — si hay user_id se vincula. Si no, se
// guarda anónima (asociada solo al endpoint).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { savePushSubscription, type BrowserSubscription } from "@/lib/push-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  subscription?: BrowserSubscription;
  kinds?: string[];
  locale?: string;
}

export async function POST(request: NextRequest) {
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

  // Si hay user logueado, lo vinculamos. Si no, queda anónima.
  const user = await getCurrentUser();

  const result = await savePushSubscription({
    subscription: sub,
    userId: user?.id ?? null,
    userAgent: request.headers.get("user-agent") ?? undefined,
    locale: body.locale ?? undefined,
    kinds: body.kinds,
  });

  if (!result.ok) {
    console.error("[push/subscribe] failed:", result.error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

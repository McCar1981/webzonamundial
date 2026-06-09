// src/app/api/pro/portal/route.ts
// POST /api/pro/portal — abre el Stripe Billing Portal para que el suscriptor
// Pro gestione su suscripción (cambiar tarjeta, cancelar, ver facturas).
//
// Solo funciona para usuarios con suscripción (los Founders no tienen nada
// que gestionar: su acceso es vitalicio por pago único).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getStripe } from "@/lib/stripe/client";
import { getSubscription } from "@/lib/pro/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "zonamundial.app";
  const finalProto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : proto;
  return `${finalProto}://${host}`;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado", code: "no_session" }, { status: 401 });
  }

  const sub = await getSubscription(user.id);
  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No tienes una suscripción Pro que gestionar.", code: "no_subscription" },
      { status: 404 },
    );
  }

  try {
    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${getOrigin(request)}/cuenta/pro`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("[pro portal] failed", (err as Error).message);
    return NextResponse.json(
      { error: "No pudimos abrir el portal de facturación. Inténtalo en un momento." },
      { status: 500 },
    );
  }
}

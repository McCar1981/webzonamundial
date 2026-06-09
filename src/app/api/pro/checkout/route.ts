// src/app/api/pro/checkout/route.ts
// POST /api/pro/checkout — crea una Stripe Checkout Session de SUSCRIPCIÓN
// para el plan Pro (mensual o anual).
//
// Body: { interval: "monthly" | "yearly" }
//
// Misma política que el Founders Pass: requiere sesión, la moneda la asigna
// el servidor según profiles.country (anti-arbitraje) y los importes viven en
// código (price_data inline con `recurring`, sin Price IDs del Dashboard).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
  getStripe,
  PRO_PRICES,
  isValidProInterval,
  PRO_PRODUCT_NAME,
  PRO_PRODUCT_DESCRIPTION,
  type FoundersCurrency,
  type ProBillingInterval,
} from "@/lib/stripe/client";
import { currencyForCountry } from "@/lib/founders/currency-by-country";
import { getEntitlements } from "@/lib/pro/entitlement";
import { trackProEvent } from "@/lib/pro/metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  if (!user || !user.email) {
    return NextResponse.json({ error: "No autenticado", code: "no_session" }, { status: 401 });
  }
  const userEmail = user.email;

  // Si ya es Pro (suscripción activa o Founder), no le dejamos pagar de nuevo.
  const ent = await getEntitlements(user.id, userEmail);
  if (ent.isPro) {
    return NextResponse.json(
      {
        error:
          ent.source === "founder"
            ? "Tu Founders Pass ya incluye todos los beneficios Pro."
            : "Ya tienes una suscripción Pro activa.",
        code: "already_pro",
      },
      { status: 409 },
    );
  }

  let body: { interval?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* body vacío es OK */
  }
  const interval: ProBillingInterval =
    typeof body.interval === "string" && isValidProInterval(body.interval) ? body.interval : "yearly";

  // La moneda la determina el país del perfil, nunca el cliente.
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("country")
    .eq("id", user.id)
    .maybeSingle();
  const currency: FoundersCurrency = currencyForCountry(profile?.country ?? null);

  const priceTable = PRO_PRICES[currency];
  const price = priceTable[interval];
  const origin = getOrigin(request);

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "link"],
      customer_email: userEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: priceTable.currency,
            unit_amount: price.amount,
            recurring: { interval: interval === "monthly" ? "month" : "year" },
            product_data: {
              name: PRO_PRODUCT_NAME,
              description: PRO_PRODUCT_DESCRIPTION,
            },
          },
        },
      ],
      // Metadata en la sesión Y en la suscripción: los eventos posteriores
      // (subscription.updated/deleted) solo traen la suscripción, así que
      // necesita llevar el user_id consigo.
      metadata: {
        email: userEmail,
        user_id: user.id,
        currency: priceTable.currency,
        amount: String(price.amount),
        plan: interval,
        product: "pro",
      },
      subscription_data: {
        metadata: {
          email: userEmail,
          user_id: user.id,
          plan: interval,
          product: "pro",
        },
      },
      automatic_tax: { enabled: false },
      success_url: `${origin}/pro?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro?canceled=1`,
      allow_promotion_codes: false,
      locale: currency === "usd" ? "es-419" : "es",
    });

    trackProEvent("checkout_started");
    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });
  } catch (err) {
    const e = err as Error & { type?: string; code?: string; statusCode?: number };
    console.error("[pro checkout] failed", {
      message: e.message,
      type: e.type,
      code: e.code,
      statusCode: e.statusCode,
      currency,
      interval,
      userEmail,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    });
    return NextResponse.json(
      {
        error: "No pudimos iniciar el pago. Inténtalo de nuevo en un momento.",
        ...(process.env.NODE_ENV !== "production" ? { debug: e.message, code: e.code, type: e.type } : {}),
      },
      { status: 500 },
    );
  }
}

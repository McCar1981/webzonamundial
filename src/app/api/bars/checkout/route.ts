// src/app/api/bars/checkout/route.ts
// POST /api/bars/checkout — crea una Stripe Checkout Session para el plan del bar.
//
// Mismo patrón que /api/checkout (Founders Pass): requiere sesión, la moneda la
// decide el backend por país del usuario (anti-arbitraje) y el webhook confirma
// el pago. Body: { plan_id }. El bar es el del usuario autenticado (dueño).
//
// Si no hay sesión devuelve 401 y el cliente redirige a /login.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getStripe } from "@/lib/stripe/client";
import { currencyForCountry } from "@/lib/founders/currency-by-country";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBarByOwner, barHasActivePlan } from "@/lib/bars/store";
import { getPlan, isBarPlanId, barPlanAmountCents } from "@/lib/bars/plans";

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

  let body: { plan_id?: string } = {};
  try { body = await request.json(); } catch { /* body vacío */ }
  if (!isBarPlanId(body.plan_id)) {
    return NextResponse.json({ error: "Plan no válido", code: "bad_plan" }, { status: 400 });
  }
  const plan = getPlan(body.plan_id);

  const bar = await getBarByOwner(user.id);
  if (!bar) {
    return NextResponse.json({ error: "Primero crea tu bar", code: "bar_not_found" }, { status: 404 });
  }
  if (await barHasActivePlan(bar.id)) {
    return NextResponse.json({ error: "Tu bar ya tiene un plan activo", code: "already_paid" }, { status: 409 });
  }

  // SEGURIDAD: la moneda NO la elige el cliente; se deriva del país del perfil.
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles").select("country").eq("id", user.id).maybeSingle();
  const currency = currencyForCountry(profile?.country ?? null);
  const amount = barPlanAmountCents(plan, currency);
  const origin = getOrigin(request);

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "link"],
      customer_email: userEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: `Plan ${plan.name} · Porra de bar (${bar.name})`,
              description: plan.tagline,
            },
          },
        },
      ],
      // Metadata que el webhook necesita para asignar el plan al bar correcto.
      metadata: {
        product: `bar_plan_${plan.id}`,
        bar_id: bar.id,
        plan_id: plan.id,
        email: userEmail,
        currency,
        amount: String(amount),
      },
      payment_intent_data: {
        // Replicada en el PaymentIntent → Charge para poder revertir en refunds.
        metadata: { product: `bar_plan_${plan.id}`, bar_id: bar.id, plan_id: plan.id, email: userEmail },
        receipt_email: userEmail,
      },
      automatic_tax: { enabled: false },
      success_url: `${origin}/bar-dashboard?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/bar-dashboard?canceled=1`,
      allow_promotion_codes: false,
      locale: currency === "usd" ? "es-419" : "es",
    });

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });
  } catch (err) {
    const e = err as Error & { type?: string; code?: string; statusCode?: number };
    console.error("[bars/checkout] failed", {
      message: e.message, type: e.type, code: e.code, statusCode: e.statusCode,
      currency, planId: plan.id, barId: bar.id,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    });
    return NextResponse.json(
      {
        error: "No pudimos iniciar el pago. Inténtalo de nuevo en un momento.",
        ...(process.env.NODE_ENV !== "production" ? { debug: e.message, code: e.code, type: e.type } : {}),
      },
      { status: 500 }
    );
  }
}

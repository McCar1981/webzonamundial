// src/app/api/powerups/checkout/route.ts
// POST /api/powerups/checkout — crea la Stripe Checkout Session del Pack
// Comodines ×3 (la ÚNICA compra: 1,99 € por 3 usos universales; la comisión
// fija de Stripe hacía inviable vender los comodines sueltos a 0,99 €).
//
// Body: { intent?: { sku, prediction_id?, payload?, match_id?, trivia_session_id? } }
// El "intent" es el comodín que el usuario quería aplicar al comprar: se valida
// AHORA (para no vender a quien no puede usarlo) y el webhook lo aplica tras el
// pago gastando 1 de los 3 créditos. Si su ventana caduca durante el pago, los
// créditos quedan en el monedero igualmente (el pack vale por sí mismo).
//
// La moneda la fija el servidor según profiles.country (anti-arbitraje).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { getStripe } from "@/lib/stripe/client";
import { currencyForCountry } from "@/lib/founders/currency-by-country";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POWERUP_PACK } from "@/lib/powerups/catalog";
import { attachStripeSession, createPendingPurchase, type PackIntentPayload } from "@/lib/powerups/store";
import { validatePowerupUse, type UseRequestBody } from "@/lib/powerups/eligibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "zonamundial.app";
  const finalProto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : proto;
  return `${finalProto}://${host}`;
}

interface Body {
  intent?: UseRequestBody;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "no_session", message: "Inicia sesión para comprar comodines" }, { status: 401 });
  }

  const rl = await rateLimitByUser(user.id, "powerups:checkout", 10, 60);
  if (rl.limited) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    /* sin body: pack sin intent */
  }

  // Validar el comodín solicitado (si lo hay) ANTES de cobrar: si no es usable,
  // el usuario debe saberlo ahora, no tras pagar.
  let matchId: string | null = null;
  let predictionId: string | null = null;
  let triviaSessionId: string | null = null;
  let payload: PackIntentPayload | null = null;
  let backPath = "/app/predicciones/jugar";

  if (body.intent?.sku) {
    const v = await validatePowerupUse(user.id, body.intent);
    if (!v.ok) {
      return NextResponse.json({ error: v.error, message: v.message }, { status: v.httpStatus ?? 400 });
    }
    matchId = v.matchId ?? null;
    predictionId = v.predictionId ?? null;
    triviaSessionId = v.triviaSessionId ?? null;
    payload = { intent_sku: v.sku!, pick: v.payload ?? null };
    if (v.sku === "trivia_revive") backPath = "/trivia";
  }

  // ── Moneda por país del perfil (misma política que el Founders Pass) ───────
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("country")
    .eq("id", user.id)
    .maybeSingle();
  const currency = currencyForCountry(profile?.country ?? null);
  const price = POWERUP_PACK.prices[currency];
  const origin = getOrigin(request);

  try {
    const purchase = await createPendingPurchase({
      userId: user.id,
      sku: "pack3",
      amount: price.amount,
      currency,
      matchId,
      predictionId,
      triviaSessionId,
      payload,
    });

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "link"],
      customer_email: user.email,
      // Compra impulsiva atada al estado del partido/partida: la sesión caduca
      // a los 30 min (mínimo de Stripe) para acotar los pagos tardíos.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: price.amount,
            product_data: {
              name: `${POWERUP_PACK.emoji} ${POWERUP_PACK.name} · ZonaMundial`,
              description: POWERUP_PACK.description,
            },
          },
        },
      ],
      metadata: {
        product: "powerup",
        purchase_id: purchase.id,
        sku: "pack3",
        user_id: user.id,
        email: user.email,
      },
      payment_intent_data: {
        metadata: { product: "powerup", purchase_id: purchase.id, sku: "pack3" },
        receipt_email: user.email,
      },
      automatic_tax: { enabled: false },
      success_url: `${origin}/pago/comodin?pid=${purchase.id}&back=${encodeURIComponent(backPath)}`,
      cancel_url: `${origin}${backPath}?powerup=cancel`,
      allow_promotion_codes: false,
      locale: currency === "usd" ? "es-419" : "es",
    });

    await attachStripeSession(purchase.id, checkoutSession.id);
    return NextResponse.json({ url: checkoutSession.url, purchase_id: purchase.id });
  } catch (err) {
    const e = err as Error & { type?: string; code?: string };
    console.error("[powerups checkout] failed", {
      message: e.message, type: e.type, code: e.code, userEmail: user.email,
    });
    return NextResponse.json(
      { error: "checkout_failed", message: "No pudimos iniciar el pago. Inténtalo de nuevo en un momento." },
      { status: 500 },
    );
  }
}

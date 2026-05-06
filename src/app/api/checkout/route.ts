// src/app/api/checkout/route.ts
// POST /api/checkout — crea una Stripe Checkout Session para el Founders Pass.
//
// Requiere sesión autenticada (cookie magic-link). Si no hay sesión, devuelve
// 401 y el cliente redirige a /cuenta/entrar?intent=checkout.
//
// Body opcional: { currency: "eur" | "usd" } — si se omite, se infiere por
// header Accept-Language o se pone EUR por defecto.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
  getStripe,
  FOUNDERS_PASS_PRICES,
  isValidCurrency,
  PRODUCT_NAME,
  PRODUCT_DESCRIPTION,
  type FoundersCurrency,
} from "@/lib/stripe/client";
import { isFounder } from "@/lib/founders/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "zonamundial.app";
  const finalProto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : proto;
  return `${finalProto}://${host}`;
}

/** Si el cliente no especifica moneda, intentamos inferir por idioma. */
function inferCurrency(request: NextRequest): FoundersCurrency {
  const lang = (request.headers.get("accept-language") || "").toLowerCase();
  // ES, FR, DE, IT, NL... → EUR. EN-US, ES-MX, ES-AR, ES-CO... → USD.
  if (/^es-(mx|ar|co|cl|pe|uy|ec|ve|bo|py|do|gt|hn|ni|pa|sv)/.test(lang)) return "usd";
  if (/^en-us/.test(lang)) return "usd";
  return "eur";
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return NextResponse.json(
      { error: "No autenticado", code: "no_session" },
      { status: 401 }
    );
  }
  const userEmail = user.email;

  // Si ya es Founder, no le dejamos pagar dos veces.
  if (await isFounder(userEmail)) {
    return NextResponse.json(
      { error: "Ya tienes Founders Pass activo", code: "already_founder" },
      { status: 409 }
    );
  }

  let body: { currency?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* body vacío es OK */
  }

  const currency: FoundersCurrency =
    body.currency && isValidCurrency(body.currency) ? body.currency : inferCurrency(request);

  const price = FOUNDERS_PASS_PRICES[currency];
  const origin = getOrigin(request);

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      // Apple Pay y Google Pay van piggybacking en payment_method_types: ["card"]
      // — Stripe Checkout los detecta automáticamente cuando el navegador
      // del usuario tiene wallet configurado. Añadimos también métodos
      // locales según la moneda del precio.
      payment_method_types:
        currency === "eur"
          ? ["card", "link"]
          : ["card", "link"],
      // Forzamos email para que vaya pre-rellenado y atado a la sesión.
      customer_email: userEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: price.currency,
            unit_amount: price.amount,
            product_data: {
              name: PRODUCT_NAME,
              description: PRODUCT_DESCRIPTION,
            },
          },
        },
      ],
      // Metadata: el webhook necesita saber a qué email asignar el pass.
      metadata: {
        email: userEmail,
        currency: price.currency,
        amount: String(price.amount),
        product: "founders_pass",
      },
      payment_intent_data: {
        metadata: {
          email: userEmail,
          product: "founders_pass",
        },
        // Recibo automático por email.
        receipt_email: userEmail,
      },
      // VAT/Tax: dejamos que Stripe Tax lo gestione si está activado en
      // el dashboard. Si no, el precio que cobramos es total.
      automatic_tax: { enabled: false },
      // URLs de retorno
      success_url: `${origin}/cuenta?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cuenta/comprar?canceled=1`,
      // Allow promotional codes en futuro.
      allow_promotion_codes: false,
      locale: currency === "usd" ? "es-419" : "es",
    });

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });
  } catch (err) {
    console.error("[checkout] failed", (err as Error).message);
    return NextResponse.json(
      { error: "No pudimos iniciar el pago. Inténtalo de nuevo en un momento." },
      { status: 500 }
    );
  }
}

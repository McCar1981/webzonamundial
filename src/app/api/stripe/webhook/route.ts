// src/app/api/stripe/webhook/route.ts
// POST /api/stripe/webhook
//
// Recibe eventos de Stripe firmados con STRIPE_WEBHOOK_SECRET. Eventos que
// procesamos:
//
//   checkout.session.completed → marca al usuario como Founder + envía email
//                                 de confirmación
//   charge.refunded            → marca como refunded en KV (le quitamos el pass)
//
// CRITICAL: este endpoint NUNCA debe leer request.json() — Stripe firma el
// raw body. Si Next.js parsea el body, la verificación falla.

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import {
  markFounder,
  markFounderRefunded,
  getFounderRecord,
  type FounderRecord,
} from "@/lib/founders/store";
import { sendFounderConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatAmount(amountInCents: number, currency: string): string {
  const amount = amountInCents / 100;
  // Sin decimales si es entero
  return amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Para el Founders Pass viene en mode: "payment" → tenemos payment_intent
  // listo. Confirmamos que sea nuestro producto.
  const product = session.metadata?.product;
  if (product !== "founders_pass") return;

  const email = (session.metadata?.email || session.customer_email || "").toLowerCase().trim();
  if (!email) {
    console.warn("[stripe webhook] checkout.session.completed sin email", session.id);
    return;
  }

  // Resolvemos el receipt URL desde el PaymentIntent → Charge.
  let receiptUrl: string | null = null;
  let paymentIntentId: string | null = null;
  if (session.payment_intent) {
    paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id;
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      });
      const charge = pi.latest_charge as Stripe.Charge | null;
      receiptUrl = charge?.receipt_url || null;
    } catch (err) {
      console.warn("[stripe webhook] no pude resolver receipt", (err as Error).message);
    }
  }

  const amount = session.amount_total ?? Number(session.metadata?.amount ?? 0);
  const currency = (session.currency ?? session.metadata?.currency ?? "eur").toLowerCase();

  const record: FounderRecord = {
    email,
    amount,
    currency,
    customerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
    paymentIntentId,
    checkoutSessionId: session.id,
    receiptUrl,
    purchasedAt: new Date(((session.created ?? Date.now() / 1000) * 1000)).toISOString(),
  };

  await markFounder(record);

  // Email de confirmación (no bloquea ack al webhook)
  void sendFounderConfirmationEmail({
    to: email,
    amount: formatAmount(amount, currency),
    currency,
    receiptUrl,
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // Sólo nos interesan reembolsos completos del Founders Pass.
  const product = charge.metadata?.product;
  if (product !== "founders_pass") return;
  // amount_refunded < amount = parcial. Para Founders Pass tratamos cualquier
  // reembolso como total porque es un único pago de 1 unidad.
  if (charge.amount_refunded === 0) return;

  const email = (charge.metadata?.email || charge.receipt_email || "").toLowerCase().trim();
  if (!email) {
    console.warn("[stripe webhook] charge.refunded sin email", charge.id);
    return;
  }
  await markFounderRefunded(email);
}

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json(
      { error: "Webhook no configurado" },
      { status: 500 }
    );
  }

  // CRITICAL: leer raw body, no parsear JSON.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] firma inválida:", (err as Error).message);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        // Eventos que no procesamos: respondemos 200 igual para que Stripe
        // no nos los reintente.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[stripe webhook] handler ${event.type} falló:`, (err as Error).message);
    // Devolvemos 500 para que Stripe lo reintente (idempotencia gestionada
    // por markFounder con SADD que devuelve 0 si ya existía).
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}

/** Suprimir disabled-body-parser de Next.js: en Route Handlers no aplica. */
export async function GET() {
  return NextResponse.json({ ok: true, note: "Stripe webhook endpoint" });
}

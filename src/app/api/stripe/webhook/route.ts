// src/app/api/stripe/webhook/route.ts
// POST /api/stripe/webhook
//
// Recibe eventos de Stripe firmados con STRIPE_WEBHOOK_SECRET. Eventos que
// procesamos:
//
//   checkout.session.completed → marca al usuario como Founder + envía email
//                                 de confirmación. Si metadata.product es
//                                 "pro", da de alta la suscripción Pro.
//   customer.subscription.updated/deleted → ciclo de vida de la suscripción
//                                 Pro (renovación, impago, cancelación)
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
import { recordBarPlanPayment, markBarPaymentRefunded, getBarById } from "@/lib/bars/store";
import { getPlan } from "@/lib/bars/plans";
import {
  sendFounderConfirmationEmail,
  sendBarPlanConfirmationEmail,
  sendProWelcomeEmail,
  sendProPaymentFailedEmail,
} from "@/lib/email";
import {
  upsertSubscription,
  updateSubscriptionStatus,
  type ProPlan,
  type ProStatus,
} from "@/lib/pro/subscriptions";
import { trackProEvent } from "@/lib/pro/metrics";
import { kv } from "@vercel/kv";

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
  const userId = session.metadata?.user_id || null;
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
    userId,
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

async function handleBarPlanCheckout(session: Stripe.Checkout.Session) {
  const barId = session.metadata?.bar_id;
  const planId = session.metadata?.plan_id;
  if (!barId || !planId) {
    console.warn("[stripe webhook] bar_plan checkout sin bar_id/plan_id", session.id);
    return;
  }

  // Resolvemos receipt URL desde el PaymentIntent → Charge.
  let receiptUrl: string | null = null;
  let paymentIntentId: string | null = null;
  if (session.payment_intent) {
    paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent.id;
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
      const charge = pi.latest_charge as Stripe.Charge | null;
      receiptUrl = charge?.receipt_url || null;
    } catch (err) {
      console.warn("[stripe webhook] no pude resolver receipt (bar)", (err as Error).message);
    }
  }

  const amount = session.amount_total ?? Number(session.metadata?.amount ?? 0);
  const currency = (session.currency ?? session.metadata?.currency ?? "eur").toLowerCase();
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  await recordBarPlanPayment(barId, {
    planId,
    amount,
    currency,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    stripeCustomerId: customerId,
    receiptUrl,
  });

  // Email de confirmación al dueño (no bloquea el ack al webhook).
  const email = (session.metadata?.email || session.customer_email || "").toLowerCase().trim();
  if (email) {
    const bar = await getBarById(barId);
    void sendBarPlanConfirmationEmail({
      to: email,
      barName: bar?.name || "tu bar",
      planName: getPlan(planId).name,
      amount: formatAmount(amount, currency),
      currency,
      dashboardUrl: "https://zonamundial.app/bar-dashboard",
      receiptUrl,
    });
  }
}

// ─── Plan PRO (suscripción) ──────────────────────────────────────────────────

/** Mapea el estado de Stripe a los 4 que persistimos. */
function mapProStatus(s: Stripe.Subscription.Status): ProStatus {
  if (s === "active") return "active";
  if (s === "trialing") return "trialing";
  if (s === "past_due") return "past_due";
  // canceled | unpaid | incomplete | incomplete_expired | paused → sin acceso.
  return "canceled";
}

/**
 * Fin del periodo pagado. En versiones recientes de la API de Stripe (Basil,
 * 2025+) current_period_end vive en el subscription ITEM; en las anteriores,
 * en la suscripción. Probamos ambas para no depender del apiVersion de la
 * cuenta (no lo pineamos — ver lib/stripe/client.ts).
 */
function subscriptionPeriodEnd(sub: Stripe.Subscription): string | null {
  const onSub = (sub as unknown as { current_period_end?: number }).current_period_end;
  const onItem = (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)
    ?.current_period_end;
  const raw = onSub ?? onItem;
  return raw ? new Date(raw * 1000).toISOString() : null;
}

/** Alta Pro: checkout.session.completed con metadata.product === "pro". */
async function handleProCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const email = (session.metadata?.email || session.customer_email || "").toLowerCase().trim();
  if (!userId || !email) {
    console.warn("[stripe webhook] pro checkout sin user_id/email", session.id);
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  const plan: ProPlan = session.metadata?.plan === "monthly" ? "monthly" : "yearly";

  // Recuperamos la suscripción para el estado y el fin de periodo reales.
  let status: ProStatus = "active";
  let periodEnd: string | null = null;
  let cancelAtPeriodEnd = false;
  if (subscriptionId) {
    try {
      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      status = mapProStatus(sub.status);
      periodEnd = subscriptionPeriodEnd(sub);
      cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;
    } catch (err) {
      console.warn("[stripe webhook] no pude leer la suscripción pro", (err as Error).message);
    }
  }

  const currency = (session.currency ?? session.metadata?.currency ?? "eur").toLowerCase();
  const amount = session.amount_total ?? Number(session.metadata?.amount ?? 0);

  await upsertSubscription({
    userId,
    email,
    stripeCustomerId:
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
    stripeSubscriptionId: subscriptionId,
    plan,
    status,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd,
    currency,
    amount,
  });

  trackProEvent("checkout_completed");
  // Bienvenida (no bloquea el ack al webhook).
  void sendProWelcomeEmail({ to: email, plan, amount: formatAmount(amount, currency), currency });
}

/**
 * Ciclo de vida Pro: customer.subscription.updated/deleted (renovaciones,
 * impagos, cancelaciones). Actualiza por subscription id; si aún no existe la
 * fila (carrera con checkout.completed), la crea desde la metadata que
 * sembramos en subscription_data al hacer el checkout.
 */
async function handleProSubscriptionChange(sub: Stripe.Subscription) {
  if (sub.metadata?.product !== "pro") return;

  const status = mapProStatus(sub.status);

  // Funnel + dunning: cancelación definitiva y aviso de impago (una sola vez
  // por suscripción, con marca NX en KV para no reenviar en cada reintento).
  if (status === "canceled" && sub.status !== "incomplete" && sub.status !== "incomplete_expired") {
    trackProEvent("sub_canceled");
  }
  if (status === "past_due") {
    const email = (sub.metadata?.email || "").toLowerCase().trim();
    if (email) {
      try {
        const fresh = await kv.set(`pro:dunning:${sub.id}`, 1, { nx: true, ex: 60 * 60 * 24 * 14 });
        if (fresh) void sendProPaymentFailedEmail({ to: email });
      } catch {
        /* sin KV no arriesgamos a spamear: no enviamos */
      }
    }
  }

  const updated = await updateSubscriptionStatus({
    stripeSubscriptionId: sub.id,
    status,
    currentPeriodEnd: subscriptionPeriodEnd(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
  });
  if (updated) return;

  const userId = sub.metadata?.user_id;
  const email = (sub.metadata?.email || "").toLowerCase().trim();
  if (!userId || !email) {
    console.warn("[stripe webhook] subscription pro sin fila ni metadata", sub.id);
    return;
  }
  await upsertSubscription({
    userId,
    email,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
    stripeSubscriptionId: sub.id,
    plan: sub.metadata?.plan === "monthly" ? "monthly" : "yearly",
    status,
    currentPeriodEnd: subscriptionPeriodEnd(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    currency: sub.currency ?? null,
    amount: sub.items?.data?.[0]?.price?.unit_amount ?? null,
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const product = charge.metadata?.product;
  if (charge.amount_refunded === 0) return;

  // Reembolso de un plan de bar.
  if (product?.startsWith("bar_plan_")) {
    const barId = charge.metadata?.bar_id;
    if (!barId) {
      console.warn("[stripe webhook] charge.refunded (bar) sin bar_id", charge.id);
      return;
    }
    await markBarPaymentRefunded(barId);
    return;
  }

  // Reembolso del Founders Pass. Cualquier reembolso se trata como total
  // porque es un único pago de 1 unidad.
  if (product !== "founders_pass") return;
  const email = (charge.metadata?.email || charge.receipt_email || "").toLowerCase().trim();
  if (!email) {
    console.warn("[stripe webhook] charge.refunded sin email", charge.id);
    return;
  }
  await markFounderRefunded(email);
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  // Una disputa/chargeback implica que el usuario reclamó el dinero
  // a través de su banco/emisor. Revocamos la entitlement igual que
  // con un refund para no dejar acceso activo sin pago válido.
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;
  if (!chargeId) {
    console.warn("[stripe webhook] charge.dispute.created sin chargeId", dispute.id);
    return;
  }

  try {
    const stripe = getStripe();
    const charge = await stripe.charges.retrieve(chargeId);
    const product = charge.metadata?.product;

    // Disputa de plan de bar.
    if (product?.startsWith("bar_plan_")) {
      const barId = charge.metadata?.bar_id;
      if (!barId) {
        console.warn("[stripe webhook] dispute (bar) sin bar_id", dispute.id);
        return;
      }
      await markBarPaymentRefunded(barId);
      console.log("[stripe webhook] dispute → bar plan revoked", barId);
      return;
    }

    // Disputa del Founders Pass.
    if (product !== "founders_pass") return;
    const email = (charge.metadata?.email || charge.receipt_email || "").toLowerCase().trim();
    if (!email) {
      console.warn("[stripe webhook] dispute sin email", dispute.id);
      return;
    }
    await markFounderRefunded(email);
    console.log("[stripe webhook] dispute → founder revoked", email);
  } catch (err) {
    console.error("[stripe webhook] fallo resolviendo charge para dispute:", (err as Error).message);
  }
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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.product?.startsWith("bar_plan_")) {
          await handleBarPlanCheckout(session);
        } else if (session.metadata?.product === "pro") {
          await handleProCheckout(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleProSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
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

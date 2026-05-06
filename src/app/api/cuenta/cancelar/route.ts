// src/app/api/cuenta/cancelar/route.ts
// POST /api/cuenta/cancelar — solicita reembolso del Founders Pass.
//
// Crea un Refund completo en Stripe sobre el PaymentIntent del usuario.
// El estado en KV se actualiza después por el webhook charge.refunded.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getStripe } from "@/lib/stripe/client";
import { getFounderRecord } from "@/lib/founders/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const record = await getFounderRecord(user.email);
  if (!record) {
    return NextResponse.json({ error: "No tienes Founders Pass activo" }, { status: 404 });
  }
  if (record.refundedAt) {
    return NextResponse.json({ error: "Ya solicitaste reembolso anteriormente" }, { status: 409 });
  }
  if (!record.paymentIntentId) {
    return NextResponse.json({ error: "No encontramos el pago original" }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: record.paymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        email: user.email,
        product: "founders_pass",
      },
    });
    return NextResponse.json({
      ok: true,
      refundId: refund.id,
      status: refund.status,
      message:
        "Reembolso iniciado. Tu cuenta perderá el Founders Pass en cuanto Stripe confirme la devolución (1-3 días hábiles).",
    });
  } catch (err) {
    console.error("[cancelar] refund failed", (err as Error).message);
    return NextResponse.json(
      { error: "No pudimos procesar el reembolso. Contacta con soporte." },
      { status: 500 }
    );
  }
}

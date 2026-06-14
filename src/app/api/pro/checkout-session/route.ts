// src/app/api/pro/checkout-session/route.ts
// GET /api/pro/checkout-session?id=cs_xxx
//
// Devuelve el importe, la divisa y el plan REALES de una Stripe Checkout
// Session del plan Pro, para que la página de éxito (/pro?purchase=success)
// pueda emitir el evento GA4 `purchase` con value+currency correctos.
//
// ¿Por qué leer de Stripe y no calcular en el cliente?
//   - El `interval` (mensual/anual) que eligió el usuario NO sobrevive al
//     redirect a Stripe y de vuelta (el panel se remonta con el valor por
//     defecto). El objeto de Stripe sí sabe qué se compró.
//   - Con códigos promocionales de creador (allow_promotion_codes) el importe
//     cobrado puede ser MENOR que la tarifa de catálogo. amount_total refleja
//     el cobro real; hardcodear el precio inflaría los ingresos en GA4.
//
// Solo lectura: NO toca la suscripción ni el webhook (esos siguen siendo la
// fuente de verdad del desbloqueo Pro). Requiere sesión y que la Checkout
// Session pertenezca al usuario (metadata.user_id) para no exponer importes
// de terceros.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getStripe } from "@/lib/stripe/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get("id");
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Solo nuestras sesiones del plan Pro y solo las del propio usuario.
    if (session.metadata?.product !== "pro" || session.metadata?.user_id !== user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    // value: el cobro real (amount_total) si existe; durante la prueba de 3
    // días amount_total es 0, así que caemos al importe comprometido que el
    // checkout guardó en metadata.amount (céntimos). Ambos en céntimos → /100.
    const amountTotal =
      typeof session.amount_total === "number" && session.amount_total > 0
        ? session.amount_total
        : Number(session.metadata?.amount ?? 0);
    const value = amountTotal / 100;

    const currency = (
      session.currency ??
      session.metadata?.currency ??
      "eur"
    ).toUpperCase();

    const plan = session.metadata?.plan === "monthly" ? "monthly" : "yearly";

    return NextResponse.json({
      transaction_id: session.id,
      value,
      currency,
      plan,
    });
  } catch (err) {
    console.error("[pro checkout-session] retrieve falló", (err as Error).message);
    return NextResponse.json({ error: "No pudimos leer la sesión" }, { status: 502 });
  }
}

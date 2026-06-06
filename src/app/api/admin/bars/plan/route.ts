// src/app/api/admin/bars/plan/route.ts
//
// SOLO ADMIN (cookie zm_admin). Activa o revierte el plan de un bar SIN pasar
// por Stripe, para pruebas/demos internas. Reutiliza exactamente la misma lógica
// que el webhook real:
//   POST   { bar_id, plan_id } → recordBarPlanPayment (marca pago "active" + plan)
//   DELETE ?bar_id=...         → markBarPaymentRefunded (degrada como un reembolso)
//
// No es un endpoint público: la escritura de pagos sigue prohibida al cliente
// normal (RLS); aquí la hace el servidor con service role, igual que el webhook,
// pero protegido por la contraseña de admin.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { recordBarPlanPayment, markBarPaymentRefunded, getBarById } from "@/lib/bars/store";
import { getPlan, isBarPlanId, barPlanAmountCents } from "@/lib/bars/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function checkAdmin(): Promise<boolean> {
  const cookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!cookie) return false;
  return isValidAdminCookie(cookie);
}

export async function POST(request: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { bar_id?: string; plan_id?: string; currency?: string } = {};
  try { body = await request.json(); } catch { /* vacío */ }

  if (!body.bar_id) return NextResponse.json({ error: "bar_id requerido" }, { status: 400 });
  if (!isBarPlanId(body.plan_id)) return NextResponse.json({ error: "plan_id no válido" }, { status: 400 });

  const bar = await getBarById(body.bar_id);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });

  const plan = getPlan(body.plan_id);
  const currency = body.currency === "usd" ? "usd" : "eur";
  const amount = barPlanAmountCents(plan, currency);

  // Mismo efecto que un pago real confirmado por el webhook (pago de prueba).
  await recordBarPlanPayment(bar.id, {
    planId: plan.id,
    amount,
    currency,
    stripeSessionId: `test_${Date.now()}`,
    stripePaymentIntentId: null,
    stripeCustomerId: null,
    receiptUrl: null,
  });

  return NextResponse.json({ ok: true, bar_id: bar.id, plan_id: plan.id, amount, currency });
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const barId = new URL(request.url).searchParams.get("bar_id");
  if (!barId) return NextResponse.json({ error: "bar_id requerido" }, { status: 400 });

  const bar = await getBarById(barId);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });

  // Degrada el bar igual que un reembolso real (quita plan, despublica).
  await markBarPaymentRefunded(bar.id);

  return NextResponse.json({ ok: true, bar_id: bar.id });
}

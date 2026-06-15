// src/app/api/cromos/trades/[id]/accept/route.ts
//
// POST /api/cromos/trades/{id}/accept → aceptar una oferta de intercambio.

import { NextResponse } from "next/server";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { acceptTradeOffer } from "@/lib/cromos/trades";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { limited } = await rateLimitByUser(user.id, "cromos:trade-accept", 20, 60);
  if (limited) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const result = await acceptTradeOffer(params.id, user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

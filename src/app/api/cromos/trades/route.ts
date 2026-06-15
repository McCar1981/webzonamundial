// src/app/api/cromos/trades/route.ts
//
// GET  /api/cromos/trades → listar ofertas activas
// POST /api/cromos/trades → crear oferta

import { NextResponse } from "next/server";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { listTradeOffers, createTradeOffer } from "@/lib/cromos/trades";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const offers = await listTradeOffers(50);
  return NextResponse.json({ offers });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { limited } = await rateLimitByUser(user.id, "cromos:trade-create", 8, 60);
  if (limited) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { offeredCromoIds?: number[]; wantedCromoIds?: number[]; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!Array.isArray(body.offeredCromoIds) || !Array.isArray(body.wantedCromoIds)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const result = await createTradeOffer({
    creatorId: user.id,
    offeredCromoIds: body.offeredCromoIds,
    wantedCromoIds: body.wantedCromoIds,
    message: body.message,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ id: result.id });
}

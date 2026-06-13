// src/app/api/cromos/trades/[id]/route.ts
//
// DELETE /api/cromos/trades/{id} → cancelar una oferta propia.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { cancelTradeOffer } from "@/lib/cromos/trades";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await cancelTradeOffer(params.id, user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

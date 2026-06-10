// src/app/api/predictions/boosts/route.ts
//
// GET  /api/predictions/boosts → catálogo de boosts comprables.
// POST /api/predictions/boosts → comprar un boost con monedas. Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { boostCatalog, buyBoost } from "@/lib/predictions/gamification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ catalog: boostCatalog() });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // FIX 2: rate-limit de escritura (20 compras/min).
  const rl = await rateLimitByUser(user.id, "pred:boost", 20, 60);
  if (rl.limited) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  let body: { boost_id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.boost_id) return NextResponse.json({ error: "bad_request", message: "boost_id requerido" }, { status: 400 });
  const result = await buyBoost(user.id, body.boost_id);
  if (!result.ok) {
    const status = result.error === "insufficient_coins" ? 402 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}

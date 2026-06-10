// src/app/api/predictions/duels/route.ts
//
// GET  /api/predictions/duels → duelos del usuario (retados y recibidos).
// POST /api/predictions/duels → retar a alguien ({ opponent, match_id }) o
//                               responder ({ duel_id, accept }).

import { NextResponse } from "next/server";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { createDuel, myDuels, respondDuel } from "@/lib/predictions/gamification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const duels = await myDuels(user.id);
  // FIX 5: duelos del usuario → no cachear en el navegador.
  return NextResponse.json({ duels }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // FIX 2: rate-limit de escritura (20/min: retar o responder).
  const rl = await rateLimitByUser(user.id, "pred:duel", 20, 60);
  if (rl.limited) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  let body: { opponent?: string; match_id?: string; duel_id?: string; accept?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  if (body.duel_id) {
    const result = await respondDuel(user.id, body.duel_id, Boolean(body.accept));
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  }
  if (body.opponent && body.match_id) {
    const result = await createDuel(user.id, body.opponent, body.match_id);
    if (!result.ok) return NextResponse.json(result, { status: 404 });
    return NextResponse.json({ ok: true, duel: result.duel }, { status: 201 });
  }
  return NextResponse.json({ error: "bad_request", message: "Indica opponent+match_id (retar) o duel_id+accept (responder)" }, { status: 400 });
}

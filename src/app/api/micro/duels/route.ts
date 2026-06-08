// src/app/api/micro/duels/route.ts
//
// GET  /api/micro/duels → duelos de micro-predicciones del usuario.
// POST /api/micro/duels → retar ({ opponent, match_id }) o responder ({ duel_id, accept }).
//
// Duelo en Vivo ⚔️ (Fase 2): reto 1v1 a nivel de partido; gana quien sume más
// puntos de micro-predicciones. Mismo contrato que /api/predictions/duels.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createMicroDuel, myMicroDuels, respondMicroDuel } from "@/lib/micro/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const duels = await myMicroDuels(user.id);
  return NextResponse.json({ duels, me: user.id });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { opponent?: string; match_id?: string; duel_id?: string; accept?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  if (body.duel_id) {
    const result = await respondMicroDuel(user.id, body.duel_id, Boolean(body.accept));
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  }
  if (body.opponent && body.match_id) {
    const result = await createMicroDuel(user.id, body.opponent, body.match_id);
    if (!result.ok) {
      const code = result.error === "opponent_not_found" ? 404 : 400;
      return NextResponse.json(result, { status: code });
    }
    return NextResponse.json({ ok: true, duel: result.duel }, { status: 201 });
  }
  return NextResponse.json(
    { error: "bad_request", message: "Indica opponent+match_id (retar) o duel_id+accept (responder)" },
    { status: 400 },
  );
}

// src/app/api/powerups/use/route.ts
// POST /api/powerups/use — gasta 1 uso del monedero (Pack Comodines ×3) y
// aplica el comodín AL INSTANTE, sin pasar por Stripe.
//
// Body: { sku, prediction_id?, payload?, match_id?, trivia_session_id? }
//
// Débito atómico (RPC) + fila de uso en powerup_purchases (amount 0) + efecto.
// Si el efecto no puede aplicarse, el crédito se devuelve (compensación).

import { NextResponse } from "next/server";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { validatePowerupUse, type UseRequestBody } from "@/lib/powerups/eligibility";
import { useCredit } from "@/lib/powerups/store";
import { getSession } from "@/lib/trivia/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = await rateLimitByUser(user.id, "powerups:use", 20, 60);
  if (rl.limited) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: UseRequestBody;
  try {
    body = (await req.json()) as UseRequestBody;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const v = await validatePowerupUse(user.id, body);
  if (!v.ok) {
    return NextResponse.json({ error: v.error, message: v.message }, { status: v.httpStatus ?? 400 });
  }

  const result = await useCredit(user.id, {
    sku: v.sku!,
    matchId: v.matchId,
    predictionId: v.predictionId,
    triviaSessionId: v.triviaSessionId,
    payload: v.payload,
  });

  if (!result.ok) {
    const status = result.error === "no_credits" ? 402 : 409;
    return NextResponse.json(
      { error: result.error, message: result.message, credits: result.credits ?? 0 },
      { status },
    );
  }

  // El revive devuelve la racha restaurada para rehidratar la UI sin más viajes.
  let trivia: { streak: number } | null = null;
  if (v.sku === "trivia_revive" && v.triviaSessionId) {
    const session = await getSession(v.triviaSessionId);
    if (session) trivia = { streak: session.streak };
  }

  return NextResponse.json(
    { ok: true, credits: result.credits ?? 0, trivia },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

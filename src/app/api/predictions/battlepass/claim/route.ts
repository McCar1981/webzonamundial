// src/app/api/predictions/battlepass/claim/route.ts
//
// POST /api/predictions/battlepass/claim → reclamar la recompensa de un nivel y
// tramo (free|premium) del Battle Pass. Valida desbloqueo, premium y reclamo
// único (idempotente). Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { claimBattlePassTier } from "@/lib/predictions/gamification-store";
import type { Track } from "@/lib/predictions/battlepass";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ERROR_STATUS: Record<string, number> = {
  invalid_tier: 400,
  tier_locked: 403,
  premium_required: 403,
  already_claimed: 409,
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { tier?: number; track?: Track };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  const tier = Number(body.tier);
  const track = body.track;
  if (!Number.isFinite(tier) || (track !== "free" && track !== "premium")) {
    return NextResponse.json({ error: "bad_request", message: "tier (número) y track (free|premium) son obligatorios" }, { status: 400 });
  }

  const result = await claimBattlePassTier(user.id, tier, track);
  if (!result.ok) {
    return NextResponse.json(result, { status: ERROR_STATUS[result.error ?? ""] ?? 400 });
  }
  return NextResponse.json(result);
}

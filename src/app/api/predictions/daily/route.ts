// src/app/api/predictions/daily/route.ts
//
// POST /api/predictions/daily → reclamar el check-in diario (monedas/XP, cofre
// al 7º día). Idempotente por día UTC. Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { claimDaily } from "@/lib/predictions/gamification-store";
import { rewardDailyCheckin } from "@/lib/cromos/rewards";
import { utcDayKey } from "@/lib/predictions/gamification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // FIX 2: rate-limit de escritura (el check-in es idempotente pero acotamos abuso).
  const rl = await rateLimitByUser(user.id, "pred:daily", 5, 60);
  if (rl.limited) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const result = await claimDaily(user.id);
  if (result.already) {
    return NextResponse.json({ error: "already_claimed", message: "Ya reclamaste tu recompensa de hoy", ...result }, { status: 409 });
  }

  const cromoReward = await rewardDailyCheckin(user.id, utcDayKey());

  return NextResponse.json({ ...result, cromoReward });
}

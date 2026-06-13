// src/app/api/cromos/featured/route.ts
//
// GET /api/cromos/featured → 7 cromos destacados de la semana + estado de claim.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { getWeeklyFeatured, featuredClaimKey, isDayClaimable } from "@/lib/cromos/featured";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const weekly = getWeeklyFeatured();

  const claimedDays = new Set<number>();
  if (user) {
    const admin = adminClient();
    const keys = weekly.cromos.map((c) => featuredClaimKey(weekly.weekKey, c.dayIndex));
    const { data } = await admin
      .from("cromo_reward_claims")
      .select("claim_key")
      .eq("user_id", user.id)
      .in("claim_key", keys);

    const claimedKeys = new Set((data ?? []).map((r) => (r as { claim_key: string }).claim_key));
    for (const c of weekly.cromos) {
      if (claimedKeys.has(featuredClaimKey(weekly.weekKey, c.dayIndex))) {
        claimedDays.add(c.dayIndex);
      }
    }
  }

  const todayIndex = (new Date().getUTCDay() + 6) % 7;

  const result = weekly.cromos.map((c) => ({
    dayIndex: c.dayIndex,
    dayName: c.dayName,
    dayNameEs: c.dayNameEs,
    cromo: c.cromo,
    unlocksAt: c.unlocksAt,
    claimable: isDayClaimable(c.dayIndex),
    claimed: claimedDays.has(c.dayIndex),
    isToday: c.dayIndex === todayIndex,
  }));

  return NextResponse.json({
    weekKey: weekly.weekKey,
    cromos: result,
  });
}

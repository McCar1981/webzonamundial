// src/app/api/cromos/claim-featured/route.ts
//
// POST /api/cromos/claim-featured → body: { dayIndex: number }
// Reclama el cromo destacado de un día concreto de la semana actual.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { getWeeklyFeatured, featuredClaimKey, isDayClaimable } from "@/lib/cromos/featured";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { dayIndex?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const dayIndex = body.dayIndex;
  if (typeof dayIndex !== "number" || dayIndex < 0 || dayIndex > 6) {
    return NextResponse.json({ error: "invalid_day_index" }, { status: 400 });
  }

  if (!isDayClaimable(dayIndex)) {
    return NextResponse.json({ error: "not_yet_available" }, { status: 403 });
  }

  const weekly = getWeeklyFeatured();
  const featured = weekly.cromos.find((c) => c.dayIndex === dayIndex);
  if (!featured) {
    return NextResponse.json({ error: "featured_not_found" }, { status: 404 });
  }

  const claimKey = featuredClaimKey(weekly.weekKey, dayIndex);
  const admin = adminClient();

  const { error: claimError } = await admin.from("cromo_reward_claims").insert({
    user_id: user.id,
    claim_key: claimKey,
    cromo_id: featured.cromo.id,
    source: "featured",
  });

  if (claimError) {
    const code = (claimError as { code?: string }).code;
    if (code === "23505") {
      return NextResponse.json({ error: "already_claimed" }, { status: 409 });
    }
    console.error("[featured] claim insert failed:", claimError.message);
    return NextResponse.json({ error: "claim_failed" }, { status: 500 });
  }

  await admin.from("user_cromos").insert({
    user_id: user.id,
    cromo_id: featured.cromo.id,
    source: "featured",
  }).then(() => {}, () => {});

  return NextResponse.json({
    success: true,
    cromo: featured.cromo,
    dayIndex,
    claimKey,
  });
}

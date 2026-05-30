// src/app/api/predictions/leaderboard/route.ts
//
// GET /api/v1/predictions/leaderboard → ranking de mejores predictores. Público.
// Query: ?limit=50 (& my position si hay sesión).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getLeaderboard } from "@/lib/predictions/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));

  const rankings = await getLeaderboard(limit);
  const user = await getCurrentUser();
  const myPosition = user ? (rankings.find((r) => r.user.id === user.id)?.position ?? null) : null;

  return NextResponse.json({
    type: "global",
    period: "tournament",
    total_users: rankings.length,
    rankings,
    my_position: myPosition,
  });
}

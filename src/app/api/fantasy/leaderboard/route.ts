// src/app/api/fantasy/leaderboard/route.ts
//
// GET /api/fantasy/leaderboard → ranking global del Fantasy (managers reales).
// Query: ?limit=50 · ?period=weekly&gw=N para el ranking de una jornada.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getGlobalLeaderboard, getGameweekLeaderboard } from "@/lib/fantasy/store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
  const weekly = searchParams.get("period") === "weekly";
  const gw = parseInt(searchParams.get("gw") ?? "1", 10) || 1;
  const user = await getCurrentUser();

  const rankings = weekly ? await getGameweekLeaderboard(gw, limit) : await getGlobalLeaderboard(limit);
  const myPosition = user ? (rankings.find((r) => r.user_id === user.id)?.position ?? null) : null;

  return NextResponse.json({
    type: "global",
    period: weekly ? "weekly" : "tournament",
    gameweek: weekly ? gw : null,
    total_users: rankings.length,
    rankings,
    my_position: myPosition,
  });
}

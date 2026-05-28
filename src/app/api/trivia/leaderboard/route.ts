// src/app/api/trivia/leaderboard/route.ts
//
// Ranking de trivia. Público (sin auth). ?period=global|diaria&limit=50

import { NextResponse } from "next/server";
import { getLeaderboard, todayUTC } from "@/lib/trivia/store";
import type { LeaderboardPeriod } from "@/lib/trivia/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const period: LeaderboardPeriod =
    url.searchParams.get("period") === "diaria" ? "diaria" : "global";
  const limit = Math.min(100, Math.max(5, Number(url.searchParams.get("limit")) || 50));
  const date = url.searchParams.get("date") || todayUTC();

  const entries = await getLeaderboard(period, limit, date);
  return NextResponse.json({ period, date, entries });
}

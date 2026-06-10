// src/app/api/predictions/leaderboard/route.ts
//
// GET /api/v1/predictions/leaderboard → ranking de mejores predictores. Público.
// Query: ?limit=50 (& my position si hay sesión).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getLeaderboard } from "@/lib/predictions/store";
import { getWeeklyLeaderboard } from "@/lib/predictions/gamification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
  const weekly = searchParams.get("period") === "weekly";
  const user = await getCurrentUser();

  if (weekly) {
    const week = await getWeeklyLeaderboard(limit);
    // FIX 6: el ranking semanal NO calcula accuracy real (lo hará otro pase).
    // Antes mapeaba accuracy_pct: 0 (dato falso); ahora se OMITE para que el
    // front pueda ocultar la columna en vez de mostrar un 0% mentiroso.
    const rankings = week.map((e) => ({
      position: e.position,
      user: { id: e.user_id, display_name: e.display_name, avatar_url: e.avatar_url, is_premium: false, cosmetics: e.cosmetics },
      total_points: e.points,
      predictions_count: e.predictions,
    }));
    const myPosition = user ? (rankings.find((r) => r.user.id === user.id)?.position ?? null) : null;
    return NextResponse.json({ type: "global", period: "weekly", total_users: rankings.length, rankings, my_position: myPosition });
  }

  const rankings = await getLeaderboard(limit);
  const myPosition = user ? (rankings.find((r) => r.user.id === user.id)?.position ?? null) : null;

  return NextResponse.json({
    type: "global",
    period: "tournament",
    total_users: rankings.length,
    rankings,
    my_position: myPosition,
  });
}

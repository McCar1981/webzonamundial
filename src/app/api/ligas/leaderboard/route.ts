// src/app/api/ligas/leaderboard/route.ts
//
// GET /api/ligas/leaderboard?slug=liga-mx&limit=20
//   -> { slug, total, rankings:[{position,user,coins,correct_count,predictions_count}], my_position }
// Ranking de predictores por liga (Fútcoins). Público; si hay sesión, incluye la
// posición del usuario (si está en el top consultado). slug ausente = global.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCompetition } from "@/data/competitions";
import { getLigaLeaderboard } from "@/lib/ligas/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (slug && !getCompetition(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));

  const [rankings, user] = await Promise.all([getLigaLeaderboard(slug, limit), getCurrentUser()]);
  const my_position = user ? (rankings.find((r) => r.user.id === user.id)?.position ?? null) : null;

  return NextResponse.json(
    { slug: slug ?? null, total: rankings.length, rankings, my_position, authed: !!user },
    { headers: { "Cache-Control": "public, s-maxage=60" } },
  );
}

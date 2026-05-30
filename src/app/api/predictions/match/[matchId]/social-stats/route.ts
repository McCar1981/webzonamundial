// src/app/api/predictions/match/[matchId]/social-stats/route.ts
//
// GET /api/v1/predictions/match/{match_id}/social-stats → qué predice la
// comunidad (tipo 8, Modo Manada). NO requiere auth.

import { NextResponse } from "next/server";
import { getMatchMeta } from "@/lib/predictions/match-data";
import { getSocialStats } from "@/lib/predictions/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  const meta = getMatchMeta(params.matchId);
  if (!meta) return NextResponse.json({ error: "match_not_found" }, { status: 404 });

  const stats = await getSocialStats(params.matchId);
  return NextResponse.json({
    match_id: meta.match_id,
    total_predictions: stats.total_predictions,
    stats: stats.stats,
    updated_at: new Date().toISOString(),
  });
}

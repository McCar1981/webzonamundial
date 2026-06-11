// src/app/api/predictions/match/[matchId]/results/route.ts
//
// GET /api/v1/predictions/match/{match_id}/results → resultados de mis
// predicciones tras el partido. Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMatchMeta, matchMultiplier } from "@/lib/predictions/match-data";
import { getMatchPredictions, getMatchTopPredictors } from "@/lib/predictions/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const meta = getMatchMeta(params.matchId);
  if (!meta) return NextResponse.json({ error: "match_not_found" }, { status: 404 });

  const rows = await getMatchPredictions(user.id, params.matchId);
  const resolved = rows.filter((r) => r.resolved_at);
  const total = resolved.reduce((s, r) => s + (r.points_earned ?? 0), 0);
  const correct = resolved.filter((r) => r.is_correct).length;
  const mult = matchMultiplier(params.matchId);

  // Podio del partido: los 5 que más acertaron (cross-user). Vacío si nadie ha
  // resuelto aún → el front lo oculta. Incluye al usuario aunque no esté en su top.
  const topPredictors = await getMatchTopPredictors(params.matchId, 5);
  const myPodiumPosition = topPredictors.find((p) => p.user.id === user.id)?.position ?? null;

  return NextResponse.json({
    match_id: meta.match_id,
    match: { home_team: meta.home_team, away_team: meta.away_team, status: resolved.length ? "finished" : "scheduled" },
    match_multiplier: mult.multiplier,
    total_points_earned: total,
    correct_count: correct,
    total_count: resolved.length,
    top_predictors: topPredictors,
    my_podium_position: myPodiumPosition,
    predictions: resolved.map((r) => ({
      id: r.id,
      prediction_type: r.prediction_type,
      prediction_data: r.prediction_data,
      is_correct: r.is_correct,
      points_before_multiplier: r.points_before_multiplier,
      match_multiplier: r.match_multiplier,
      points_earned: r.points_earned,
      breakdown: r.resolution_breakdown,
    })),
    is_perfect: resolved.length === 8 && correct === 8,
  });
}

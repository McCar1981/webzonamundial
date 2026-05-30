// src/app/api/predictions/match/[matchId]/route.ts
//
// GET /api/v1/predictions/match/{match_id} → mis predicciones para un partido,
// con el progreso (cuántos de los 8 tipos llevo) y el cierre. Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { PREDICTION_TYPES, type PredictionType } from "@/lib/predictions/types";
import { getMatchMeta, matchMultiplier, predictionsCloseAt } from "@/lib/predictions/match-data";
import { isPremium, getMatchPredictions } from "@/lib/predictions/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const meta = getMatchMeta(params.matchId);
  if (!meta) return NextResponse.json({ error: "match_not_found" }, { status: 404 });

  const premium = await isPremium(user.id);
  const rows = await getMatchPredictions(user.id, params.matchId);
  const completed = rows.map((r) => r.prediction_type);
  const remaining = PREDICTION_TYPES.filter((t) => !completed.includes(t)) as PredictionType[];
  const mult = matchMultiplier(params.matchId);
  const closeAt = predictionsCloseAt(params.matchId, premium);

  return NextResponse.json({
    match_id: meta.match_id,
    match: {
      home_team: meta.home_team, away_team: meta.away_team,
      home_flag: meta.home_flag, away_flag: meta.away_flag,
      kickoff_at: meta.kickoff_at, phase: meta.phase, status: "scheduled",
    },
    match_multiplier: mult.multiplier,
    match_tier: mult.label,
    match_tier_emoji: mult.emoji,
    predictions_close_at: closeAt ? closeAt.toISOString() : null,
    predictions: rows.map((r) => ({
      id: r.id,
      prediction_type: r.prediction_type,
      prediction_data: r.prediction_data,
      confidence_multiplier: r.confidence_multiplier,
      is_contrarian: r.is_contrarian,
      status: r.resolved_at ? "resolved" : "pending",
      points_earned: r.points_earned,
      is_correct: r.is_correct,
      created_at: r.created_at,
    })),
    types_completed: completed,
    types_remaining: remaining,
    completion_pct: Math.round((completed.length / PREDICTION_TYPES.length) * 100),
  });
}

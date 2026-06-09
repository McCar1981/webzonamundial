// src/app/api/predictions/match/[matchId]/duels/route.ts
//
// GET /api/v1/predictions/match/{match_id}/duels → duelos generados para el
// partido (tipo 5). Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMatchMeta, generateDuels, predictionsCloseAt } from "@/lib/predictions/match-data";
import { isPro } from "@/lib/pro/entitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const meta = getMatchMeta(params.matchId);
  if (!meta) return NextResponse.json({ error: "match_not_found" }, { status: 404 });

  const premium = await isPro(user.id, user.email);
  const closeAt = predictionsCloseAt(params.matchId, premium);
  return NextResponse.json({
    match_id: meta.match_id,
    duels: generateDuels(params.matchId),
    available_until: closeAt ? closeAt.toISOString() : null,
  });
}

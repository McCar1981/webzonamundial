// src/app/api/predictions/match/[matchId]/scorers/route.ts
//
// GET /api/v1/predictions/match/{match_id}/scorers → candidatos a primer
// goleador (tipo 3). Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMatchMeta, scorerCandidates } from "@/lib/predictions/match-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const meta = getMatchMeta(params.matchId);
  if (!meta) return NextResponse.json({ error: "match_not_found" }, { status: 404 });

  return NextResponse.json({
    match_id: meta.match_id,
    candidates: scorerCandidates(params.matchId),
  });
}

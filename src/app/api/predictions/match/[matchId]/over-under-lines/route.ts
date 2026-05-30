// src/app/api/predictions/match/[matchId]/over-under-lines/route.ts
//
// GET /api/v1/predictions/match/{match_id}/over-under-lines → líneas Over/Under
// "ajustadas por IA" (tipo 6). Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMatchMeta, generateOverUnderLines } from "@/lib/predictions/match-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const meta = getMatchMeta(params.matchId);
  if (!meta) return NextResponse.json({ error: "match_not_found" }, { status: 404 });

  return NextResponse.json({
    match_id: meta.match_id,
    lines: generateOverUnderLines(params.matchId),
    generated_at: new Date().toISOString(),
  });
}

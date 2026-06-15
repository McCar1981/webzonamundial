// src/app/api/match-center/predictions/[id]/route.ts
//
// Comparativa/pronóstico propio de api-football para un partido (forma, ataque,
// defensa + % + consejo). Cacheado 6h en KV; 1 request a la API por partido.

import { NextResponse } from "next/server";
import { buildMeta, getFixtureId } from "@/lib/match-center/store";
import { getMatchPrediction } from "@/lib/match-center/predictions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const matchId = parseInt(params.id, 10);
  if (!Number.isInteger(matchId)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  if (!buildMeta(matchId)) {
    return NextResponse.json({ error: "match not found" }, { status: 404 });
  }
  try {
    const fixtureId = await getFixtureId(matchId);
    const pred = await getMatchPrediction(matchId, fixtureId);
    if (!pred) {
      return NextResponse.json({ found: false }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" } });
    }
    return NextResponse.json(
      { found: true, ...pred },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" } },
    );
  } catch {
    return NextResponse.json({ found: false });
  }
}

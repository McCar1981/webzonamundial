// src/app/api/match-center/odds/[id]/route.ts
//
// Probabilidad REAL de mercado (1X2) de un partido, para el "latido de
// probabilidad" del Match Center. Reutiliza getOddsForMatch (cuotas implícitas
// normalizadas de varias casas, ya cacheadas 12h en KV y compartidas con el IA
// Coach → coste de cuota ~0). Devuelve found:false si no hay cuotas.

import { NextResponse } from "next/server";
import { buildMeta, getFixtureId } from "@/lib/match-center/store";
import { getOddsForMatch } from "@/lib/ia-coach/team-odds";

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
  const meta = buildMeta(matchId);
  if (!meta) {
    return NextResponse.json({ error: "match not found" }, { status: 404 });
  }

  try {
    const fixtureId = await getFixtureId(matchId);
    const odds = await getOddsForMatch(String(matchId), {
      fixtureId: fixtureId ?? undefined,
    });
    if (!odds) {
      return NextResponse.json(
        { found: false },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } },
      );
    }
    return NextResponse.json(
      {
        found: true,
        // Probabilidad implícita normalizada (suma 1).
        home: odds.impliedHome,
        draw: odds.impliedDraw,
        away: odds.impliedAway,
        // Cuotas decimales promedio (para mostrar "@1.40" si se quiere).
        oddsHome: odds.averageHome,
        oddsDraw: odds.averageDraw,
        oddsAway: odds.averageAway,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } },
    );
  } catch {
    return NextResponse.json({ found: false });
  }
}

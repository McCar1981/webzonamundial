// src/app/api/fantasy/player-stats/route.ts
//
// GET /api/fantasy/player-stats → acumulado REAL por jugador del torneo
// (api-football). Público: son datos agregados del Mundial, no de un usuario.
// El pool del cliente arranca a 0 y se rellena con esto (applyRealStats). El
// recálculo está protegido en stats.server (caché 30 min + lock anti-estampida).

import { NextResponse } from "next/server";
import { getRealPlayerStats } from "@/lib/fantasy/stats.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const blob = await getRealPlayerStats();
  return NextResponse.json(
    { stats: blob?.players ?? {}, updatedAt: blob?.updatedAt ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

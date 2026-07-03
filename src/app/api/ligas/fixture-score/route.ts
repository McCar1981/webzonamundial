// src/app/api/ligas/fixture-score/route.ts
//
// GET /api/ligas/fixture-score?fixtureId=123 -> { status, elapsed, home, away }
//
// Marcador ligero para el auto-refresco EN VIVO del Centro de Partido. Reutiliza
// getFixtureDetailCached (KV): los sondeos de N espectadores caen sobre la caché,
// no sobre api-football (~1 fetch real por ventana de caché por partido). Solo
// el marcador y el minuto; para el detalle completo está la propia página.

import { NextResponse } from "next/server";
import { getFixtureDetailCached } from "@/lib/competitions/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = Number(new URL(request.url).searchParams.get("fixtureId"));
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "invalid_fixture" }, { status: 400 });
  }
  const d = await getFixtureDetailCached(id);
  if (!d) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(
    {
      status: d.fixture.status,
      elapsed: d.fixture.elapsed,
      home: d.fixture.score.home,
      away: d.fixture.score.away,
    },
    { headers: { "Cache-Control": "public, s-maxage=15" } },
  );
}

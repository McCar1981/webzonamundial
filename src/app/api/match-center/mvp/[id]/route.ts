// src/app/api/match-center/mvp/[id]/route.ts
//
// "Jugador del partido" con NOTAS REALES de api-football. Reutiliza getMatchMvp
// (1 request a /fixtures/players cacheado en KV). Devuelve found:false si todavía
// no hay notas (no jugado / sin cobertura) → la UI no pinta nada.

import { NextResponse } from "next/server";
import { buildMeta } from "@/lib/match-center/store";
import { getMatchMvp } from "@/lib/match-center/mvp";

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
    const mvp = await getMatchMvp(matchId);
    if (!mvp) {
      return NextResponse.json(
        { found: false },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
      );
    }
    return NextResponse.json(
      { found: true, ...mvp },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ found: false });
  }
}

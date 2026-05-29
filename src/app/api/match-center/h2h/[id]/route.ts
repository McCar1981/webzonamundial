// src/app/api/match-center/h2h/[id]/route.ts
//
// Historial head-to-head entre las dos selecciones del partido {id}.
// Reutiliza getH2H (KV + api-football). Si no hay datos/clave devuelve
// matches: [] para que la UI lo oculte sin inventar nada.

import { NextResponse } from "next/server";
import { buildMeta } from "@/lib/match-center/store";
import { getH2H } from "@/lib/ia-coach/team-h2h";

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
    const h2h = await getH2H(meta.home.id, meta.away.id);
    return NextResponse.json(h2h ?? { matches: [], recordText: "" }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ matches: [], recordText: "" });
  }
}

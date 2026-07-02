// src/app/api/ligas/match-summary/route.ts
//
// GET /api/ligas/match-summary?fixtureId=123 -> { summary, ai }
//
// "Ponme al día" con IA del Centro de Partido, CACHEADO en KV: el resumen se
// genera una vez por fixture por ventana de caché (corta en vivo, larga si ya
// terminó), así N espectadores cuestan 1 llamada a Anthropic, no N. Comparte la
// key del IA Coach; fail-soft: si la IA no está disponible cae al resumen
// determinista. Nunca revienta la página.

import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { getFixtureDetail } from "@/lib/competitions/api";
import { generateMatchSummary, deterministicSummary } from "@/lib/ligas/match-summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const cacheKey = (id: number) => `zl:summary:${id}`;

function ttlFor(status: string): number {
  if (FINISHED.has(status)) return 60 * 60 * 24 * 7; // 7 días: ya no cambia
  if (LIVE.has(status)) return 120; // en vivo: se refresca a menudo
  return 600; // por comenzar
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("fixtureId");
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "invalid_fixture" }, { status: 400 });
  }

  // Caché
  try {
    const cached = await kv.get<{ summary: string; ai: boolean }>(cacheKey(id));
    if (cached && cached.summary) {
      return NextResponse.json(cached, { headers: { "Cache-Control": "public, s-maxage=30" } });
    }
  } catch {
    // sin KV: seguimos y generamos
  }

  const detail = await getFixtureDetail(id);
  if (!detail) return NextResponse.json({ error: "fixture_not_found" }, { status: 404 });

  const aiText = await generateMatchSummary(detail);
  const payload = { summary: aiText ?? deterministicSummary(detail), ai: !!aiText };

  try {
    await kv.set(cacheKey(id), payload, { ex: ttlFor(detail.fixture.status) });
  } catch {
    // caché best-effort
  }

  return NextResponse.json(payload, { headers: { "Cache-Control": "public, s-maxage=30" } });
}

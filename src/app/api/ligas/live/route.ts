// src/app/api/ligas/live/route.ts
//
// Franja "En vivo y de hoy" del hub /ligas. Devuelve los partidos del catálogo
// EN VIVO ahora; si no hay ninguno, los de HOY. Una sola llamada a api-football
// (todas las ligas) filtrada al catálogo, CACHEADA en KV 30s -> N visitantes
// cuestan 1 llamada. Se oculta si no hay nada. Fail-soft.
//
// GET /api/ligas/live -> { mode: "live"|"today"|"none", fixtures: [...] }

import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { getCatalogLiveFixtures, getCatalogFixturesOnDate, type CatalogFixture } from "@/lib/competitions/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_KEY = "zl:live-strip:v1";
const CACHE_TTL_S = 30;
const MAX = 10;

type Payload = { mode: "live" | "today" | "none"; fixtures: CatalogFixture[] };

export async function GET() {
  try {
    const cached = await kv.get<Payload>(CACHE_KEY);
    if (cached) return NextResponse.json(cached, { headers: { "Cache-Control": "public, s-maxage=20" } });
  } catch {
    // sin KV: generamos
  }

  let payload: Payload;
  try {
    const live = await getCatalogLiveFixtures();
    if (live.length > 0) {
      payload = { mode: "live", fixtures: live.slice(0, MAX) };
    } else {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
      const fixtures = await getCatalogFixturesOnDate(today);
      payload = fixtures.length ? { mode: "today", fixtures: fixtures.slice(0, MAX) } : { mode: "none", fixtures: [] };
    }
  } catch {
    payload = { mode: "none", fixtures: [] };
  }

  try {
    await kv.set(CACHE_KEY, payload, { ex: CACHE_TTL_S });
  } catch {
    // caché best-effort
  }
  return NextResponse.json(payload, { headers: { "Cache-Control": "public, s-maxage=20" } });
}

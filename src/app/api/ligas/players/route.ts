// src/app/api/ligas/players/route.ts
//
// Plantillas de los DOS equipos de un partido, para el selector de jugadores de
// los mercados de predicción A2b (primer goleador, duelo). Reusa getTeamSquad
// (cacheado 7 días por equipo) — sin coste extra de api-football. El resultado
// se cachea en KV 12 h por fixture.
//
// GET ?fixtureId=123 -> { home: {teamId,name,players[]}, away: {teamId,name,players[]} }

import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { getFixtureDetail } from "@/lib/competitions/api";
import { getTeamSquad } from "@/lib/ligas/fantasy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_S = 60 * 60 * 12;
const cacheKey = (fixtureId: number) => `zl:players:${fixtureId}`;

interface PlayerLite { id: number; name: string }
interface SidePlayers { teamId: number; name: string; players: PlayerLite[] }
type Payload = { home: SidePlayers; away: SidePlayers };

function normFixtureId(v: string | null): number | null {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 && n < 1e12 ? Math.floor(n) : null;
}

export async function GET(request: Request) {
  const id = normFixtureId(new URL(request.url).searchParams.get("fixtureId"));
  if (!id) return NextResponse.json({ error: "invalid_fixture" }, { status: 400 });

  try {
    const cached = await kv.get<Payload>(cacheKey(id));
    if (cached) return NextResponse.json(cached, { headers: { "Cache-Control": "public, s-maxage=300" } });
  } catch { /* sin KV: generamos */ }

  const detail = await getFixtureDetail(id);
  if (!detail) return NextResponse.json({ error: "fixture_not_found" }, { status: 404 });

  const [homeSquad, awaySquad] = await Promise.all([
    getTeamSquad(detail.fixture.home.id),
    getTeamSquad(detail.fixture.away.id),
  ]);
  const toLite = (arr: { id: number; name: string }[]): PlayerLite[] =>
    arr.map((p) => ({ id: p.id, name: p.name })).sort((a, b) => a.name.localeCompare(b.name));

  const payload: Payload = {
    home: { teamId: detail.fixture.home.id, name: detail.fixture.home.name, players: toLite(homeSquad) },
    away: { teamId: detail.fixture.away.id, name: detail.fixture.away.name, players: toLite(awaySquad) },
  };

  try { await kv.set(cacheKey(id), payload, { ex: CACHE_TTL_S }); } catch { /* best-effort */ }
  return NextResponse.json(payload, { headers: { "Cache-Control": "public, s-maxage=300" } });
}

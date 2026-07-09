// src/app/api/ligas/equipos/route.ts
//
// Equipos de una competición del catálogo (para el selector de "Mi club").
// GET ?slug=liga-mx -> { teams: [{ id, name, logo }] }
//
// Fuente: la clasificación (1 request, trae todos los equipos con escudo);
// si viene vacía (parón entre torneos), cae al calendario (próximos + últimos)
// y colecciona los equipos únicos. Cacheado en KV 12 h por liga: los equipos
// de una competición cambian una vez por temporada.

import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { getCompetition } from "@/data/competitions";
import { getCompetitionStandings, getCompetitionFixtures, type CompetitionTeam } from "@/lib/competitions/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_S = 60 * 60 * 12;
const cacheKey = (slug: string) => `zl:equipos:${slug}`;

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") || "";
  const comp = getCompetition(slug);
  if (!comp) return NextResponse.json({ error: "invalid_slug" }, { status: 400 });

  try {
    const cached = await kv.get<CompetitionTeam[]>(cacheKey(slug));
    if (cached && cached.length) {
      return NextResponse.json({ teams: cached }, { headers: { "Cache-Control": "public, s-maxage=300" } });
    }
  } catch { /* sin KV: generamos */ }

  const byId = new Map<number, CompetitionTeam>();
  const standings = await getCompetitionStandings(comp.apiFootballId);
  for (const g of standings) for (const r of g.rows) byId.set(r.team.id, r.team);

  if (byId.size === 0) {
    // Parón/pretemporada: los equipos salen del calendario.
    const [next, last] = await Promise.all([
      getCompetitionFixtures(comp.apiFootballId, { next: 30 }),
      getCompetitionFixtures(comp.apiFootballId, { last: 30 }),
    ]);
    for (const f of [...next, ...last]) {
      byId.set(f.home.id, f.home);
      byId.set(f.away.id, f.away);
    }
  }

  const teams = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  if (teams.length) {
    try { await kv.set(cacheKey(slug), teams, { ex: CACHE_TTL_S }); } catch { /* best-effort */ }
  }
  return NextResponse.json({ teams }, { headers: { "Cache-Control": "public, s-maxage=300" } });
}

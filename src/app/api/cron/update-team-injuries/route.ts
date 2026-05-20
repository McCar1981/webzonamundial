// src/app/api/cron/update-team-injuries/route.ts
//
// Cron diario que actualiza lesiones de cada selección DERIVADAS de las
// lesiones de club en las 5 ligas top (Premier, La Liga, Serie A, Bundesliga,
// Ligue 1).
//
// 100% automático: matchea por nombre normalizado entre /injuries de cada
// liga y la `likely_squad` del JSON de cada selección.
//
// Coste: 5 calls api-sports en total (1 por liga top) en vez de 48.
// Programado: 04:00 UTC diariamente.

import { NextResponse } from "next/server";
import { BRACKET_TEAMS } from "@/lib/bracket/teams";
import {
  fetchAllTopLeaguesInjuries,
  buildAllTeamInjuriesFromLeaguePool,
  writeTeamInjuries,
} from "@/lib/ia-coach/team-injuries";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerOk = auth === `Bearer ${expected}`;
    const querySecret = new URL(req.url).searchParams.get("secret");
    const queryOk = querySecret === expected;
    if (!headerOk && !queryOk) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.API_SPORTS_KEY && !process.env.RAPIDAPI_KEY) {
    return NextResponse.json(
      { error: "API_SPORTS_KEY missing in env" },
      { status: 500 },
    );
  }
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ error: "KV not configured" }, { status: 500 });
  }

  const url = new URL(req.url);
  // En clubes la temporada en curso suele ser year-1 (2025 hasta jun, 2026 desde ago).
  // Mayo 2026 → temporada 2025 (que termina jun). Por defecto usamos year-1 hasta
  // junio; desde julio en adelante, year actual.
  const now = new Date();
  const defaultSeason =
    now.getUTCMonth() < 7 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const season = parseInt(
    url.searchParams.get("season") || String(defaultSeason),
    10,
  );
  const onlyParam = url.searchParams.get("only");
  const onlyList = onlyParam
    ? new Set(onlyParam.split(",").map((s) => s.trim().toUpperCase()))
    : null;

  const startMs = Date.now();

  // 1) Pull las 5 ligas top
  const pool = await fetchAllTopLeaguesInjuries(season);
  const fetchedMs = Date.now() - startMs;

  // 2) Lista de teamIds a procesar
  const teamIds = (onlyList
    ? BRACKET_TEAMS.filter((t) => onlyList.has(t.id))
    : BRACKET_TEAMS
  ).map((t) => t.id);

  // 3) Match por likely_squad de cada JSON
  const built = await buildAllTeamInjuriesFromLeaguePool(pool, teamIds);

  // 4) Write all to KV
  let writeOk = 0;
  let withInjuries = 0;
  let totalInjuries = 0;
  for (const [, injuries] of built) {
    await writeTeamInjuries(injuries);
    writeOk++;
    if (injuries.active.length > 0) {
      withInjuries++;
      totalInjuries += injuries.active.length;
    }
  }

  return NextResponse.json({
    ok: true,
    season,
    poolSize: pool.length,
    fetchedMs,
    durationMs: Date.now() - startMs,
    summary: {
      teamsProcessed: writeOk,
      withInjuries,
      totalInjuries,
      sampleTeamsWithInjuries: Array.from(built.entries())
        .filter(([, inj]) => inj.active.length > 0)
        .slice(0, 5)
        .map(([id, inj]) => ({ id, summary: inj.summary })),
    },
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[update-team-injuries] FATAL:", message, stack);
    return NextResponse.json(
      { error: "internal", message, stack: stack?.slice(0, 1500) },
      { status: 500 },
    );
  }
}

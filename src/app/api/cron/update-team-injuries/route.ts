// src/app/api/cron/update-team-injuries/route.ts
//
// Cron diario que actualiza lesiones/bajas de cada selección del Mundial 2026
// en Vercel KV. Lo lee api-football.com (endpoint /injuries).
//
// Free tier: 100 req/día. Junto con update-team-form (48 reqs), gasta 96/100.
// Programado a las 04:00 UTC (1h después del cron de forma reciente).
//
// Auth: Authorization: Bearer ${CRON_SECRET} o ?secret=XXX.

import { NextResponse } from "next/server";
import { BRACKET_TEAMS } from "@/lib/bracket/teams";
import {
  buildInjuriesSummary,
  fetchTeamInjuries,
  writeTeamInjuries,
  API_FOOTBALL_TEAM_IDS,
  type TeamInjuries,
} from "@/lib/ia-coach/team-injuries";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface Summary {
  ok: number;
  failed: number;
  skipped: number;
  withInjuries: number;
  totalInjuries: number;
  errors: Array<{ teamId: string; reason: string }>;
}

export async function GET(req: Request) {
  // Auth
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
  const season = parseInt(
    url.searchParams.get("season") || String(new Date().getFullYear()),
    10,
  );
  const onlyParam = url.searchParams.get("only");
  const onlyList = onlyParam
    ? new Set(onlyParam.split(",").map((s) => s.trim().toUpperCase()))
    : null;

  const summary: Summary = {
    ok: 0,
    failed: 0,
    skipped: 0,
    withInjuries: 0,
    totalInjuries: 0,
    errors: [],
  };

  const startMs = Date.now();
  const HARD_BUDGET_MS = 55_000;

  for (const team of BRACKET_TEAMS) {
    if (onlyList && !onlyList.has(team.id)) continue;
    if (!API_FOOTBALL_TEAM_IDS[team.id]) {
      summary.skipped++;
      summary.errors.push({ teamId: team.id, reason: "no api-football ID" });
      continue;
    }
    if (Date.now() - startMs > HARD_BUDGET_MS) {
      summary.skipped++;
      summary.errors.push({ teamId: team.id, reason: "time budget exhausted" });
      continue;
    }

    const list = await fetchTeamInjuries(team.id, season);
    if (list === null) {
      summary.failed++;
      summary.errors.push({ teamId: team.id, reason: "fetch failed" });
      continue;
    }
    const record: TeamInjuries = {
      teamId: team.id,
      apiTeamId: API_FOOTBALL_TEAM_IDS[team.id],
      fetchedAt: new Date().toISOString(),
      active: list,
      summary: buildInjuriesSummary(list),
    };
    await writeTeamInjuries(record);
    summary.ok++;
    if (list.length > 0) {
      summary.withInjuries++;
      summary.totalInjuries += list.length;
    }

    // Rate limit free tier: 10 req/min
    await new Promise((r) => setTimeout(r, 6500));
  }

  return NextResponse.json({
    ok: true,
    season,
    durationMs: Date.now() - startMs,
    summary,
  });
}

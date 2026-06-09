// src/app/api/cron/update-team-form/route.ts
//
// Cron diario que actualiza la forma reciente de cada selección del Mundial 2026
// en Vercel KV. Lo lee api-football.com (via RapidAPI).
//
// Free tier: 100 req/día. Con 48 selecciones, una pasada gasta 48/100 (~48%).
// Si tienes plan superior puedes pasar `?last=15` para más histórico.
//
// Auth idéntico al resto de crones: Authorization: Bearer ${CRON_SECRET}
// o ?secret=XXX como query.
//
// Programado en vercel.json para correr a las 03:00 UTC diariamente.

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { recordHeartbeat } from "@/lib/ops/store";
import { BRACKET_TEAMS } from "@/lib/bracket/teams";
import {
  API_FOOTBALL_TEAM_IDS,
  buildFormSummary,
  fetchTeamRecentMatches,
  writeTeamForm,
  type TeamForm,
} from "@/lib/ia-coach/team-form";

// Vercel: este cron puede tardar más que el default (necesita 48 llamadas API)
export const maxDuration = 60; // seg en Hobby tier
export const dynamic = "force-dynamic";

interface Summary {
  ok: number;
  failed: number;
  skipped: number;
  errors: Array<{ teamId: string; reason: string }>;
}

export async function GET(req: Request) {
  const denied = requireCron(req);
  if (denied) return denied;

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
  const last = Math.max(
    1,
    Math.min(20, parseInt(url.searchParams.get("last") || "10", 10)),
  );
  // Permite probar con un subconjunto: ?only=ESP,FRA
  const onlyParam = url.searchParams.get("only");
  const onlyList = onlyParam
    ? new Set(onlyParam.split(",").map((s) => s.trim().toUpperCase()))
    : null;

  const summary: Summary = { ok: 0, failed: 0, skipped: 0, errors: [] };

  // Procesa secuencial para no saturar el rate-limit del free tier (10 req/min).
  // Con 48 equipos a ~1.5s cada uno → ~72s. Con maxDuration 60s puede no terminar
  // todo en una sola ejecución. Solución: si llegamos al límite, devolvemos lo que
  // hayamos hecho y el siguiente día se completa.
  const startMs = Date.now();
  const HARD_BUDGET_MS = 55_000; // deja 5s de margen para responder

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

    const matches = await fetchTeamRecentMatches(team.id, last);
    if (!matches) {
      summary.failed++;
      summary.errors.push({ teamId: team.id, reason: "fetch failed" });
      continue;
    }
    const form: TeamForm = {
      teamId: team.id,
      apiTeamId: API_FOOTBALL_TEAM_IDS[team.id],
      fetchedAt: new Date().toISOString(),
      matches,
      summary: buildFormSummary(matches),
    };
    await writeTeamForm(form);
    summary.ok++;

    // Pequeña pausa para no saturar (10 req/min en free tier)
    await new Promise((r) => setTimeout(r, 6500));
  }

  await recordHeartbeat("update-team-form", true, { teams: summary.ok });

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - startMs,
    last,
    summary,
  });
}

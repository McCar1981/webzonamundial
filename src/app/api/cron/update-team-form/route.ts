// src/app/api/cron/update-team-form/route.ts
//
// Cron diario que actualiza la forma reciente de cada selección del Mundial 2026
// en Vercel KV. Lo lee api-football.com (api-sports directo).
//
// Plan Ultra: 75.000 req/día (~450 req/min). Las 48 selecciones se cubren en UNA
// pasada (~17s con pausa de 350ms). Si tienes plan superior puedes pasar
// `?last=15` para más histórico.
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

  // Procesa secuencial con una pausa corta. Plan Ultra admite ~450 req/min, así que
  // 48 selecciones a 350ms (~170 req/min) se cubren TODAS en ~17s, dentro del
  // presupuesto. El límite de tiempo queda solo como red de seguridad.
  const startMs = Date.now();
  const HARD_BUDGET_MS = 55_000; // deja 5s de margen para responder
  const PAUSE_MS = 350; // ~170 req/min, holgado bajo el límite de Ultra (450/min)

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

    // Pausa corta entre llamadas (plan Ultra admite ~450 req/min).
    await new Promise((r) => setTimeout(r, PAUSE_MS));
  }

  // Salud condicional: solo verde si se actualizó al menos un equipo y no falló más
  // de un puñado. Antes era `true` incondicional y ocultaba fallos masivos de datos
  // (p.ej. una API key inválida → 48 fetch fallidos pero heartbeat en verde).
  const healthy = summary.ok > 0 && summary.failed <= 3;
  await recordHeartbeat("update-team-form", healthy, {
    teams: summary.ok,
    failed: summary.failed,
    skipped: summary.skipped,
  });

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - startMs,
    last,
    summary,
  });
}

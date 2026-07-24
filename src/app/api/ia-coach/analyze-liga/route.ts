// src/app/api/ia-coach/analyze-liga/route.ts
//
// POST /api/ia-coach/analyze-liga  — IA Coach para partidos de LIGAS DE CLUBES.
//
// Body: { fixtureId, slug, homeId, homeName, awayId, awayName, kickoff?, venue? }
//
// Mismo patrón que /analyze (Mundial): caché primero, cuota Pro/Free, Claude
// después. Contexto desde datos de club (api-football cacheado) + prompt de
// ligas. La respuesta comparte shape (IACoachResponse / IACoachAnalysis).

import { NextResponse } from "next/server";
import { buildLeagueContext } from "@/lib/ia-coach/league-context";
import { LEAGUE_SYSTEM_PROMPT } from "@/lib/ia-coach/league-system-prompt";
import { generateAnalysis } from "@/lib/ia-coach/anthropic-client";
import { readCache, writeCache } from "@/lib/ia-coach/cache";
import { consumeIaCoachQuota, refundIaCoachQuota } from "@/lib/ia-coach/pro-quota";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { getCompetition } from "@/data/competitions";
import type { IACoachResponse, IACoachErrorResponse } from "@/lib/ia-coach/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  fixtureId?: number;
  slug?: string;
  homeId?: number;
  homeName?: string;
  awayId?: number;
  awayName?: string;
  kickoff?: string | null;
  venue?: string | null;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("unauthorized", 401);

  const rl = await rateLimitByUser(user.id, "ia-coach:analyze-liga", 10, 60);
  if (rl.limited) return errorResponse("rate_limited", 429);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return errorResponse("invalid_json", 400);
  }

  const { fixtureId, slug, homeId, homeName, awayId, awayName } = body;
  if (!fixtureId || !slug || !homeId || !awayId || !homeName || !awayName) {
    return errorResponse("missing_fields", 400);
  }
  const comp = getCompetition(slug);
  if (!comp) return errorResponse("invalid_league", 400);

  const matchId = `liga-${fixtureId}`;

  // 1. Contexto (datos de club cacheados)
  let ctx;
  try {
    ctx = await buildLeagueContext({
      fixtureId,
      apiFootballId: comp.apiFootballId,
      competitionName: comp.name,
      home: { id: homeId, name: homeName },
      away: { id: awayId, name: awayName },
      kickoff: body.kickoff ?? null,
      venue: body.venue ?? null,
    });
  } catch (err) {
    console.error("[ia-coach-liga] buildLeagueContext threw:", (err as Error).message);
    return errorResponse("context_build_failed", 500, matchId);
  }
  if (!ctx) return errorResponse("context_unavailable", 404, matchId);

  // 2. Caché (sale gratis, no consume cuota)
  const cached = await readCache(matchId, ctx.dataVersion);
  if (cached) {
    const resp: IACoachResponse = {
      ok: true, matchId, cached: true, dataVersion: ctx.dataVersion,
      generatedAt: cached.generatedAt, analysis: cached.analysis,
    };
    return NextResponse.json(resp, { headers: { "Cache-Control": "public, s-maxage=60" } });
  }

  // 3. Cuota Pro/Free (solo las generaciones reales)
  const quota = await consumeIaCoachQuota(user);
  if (!quota.allowed) return errorResponse("pro_required", 402, matchId);

  // 4. Claude con el prompt de ligas
  let analysis;
  try {
    analysis = await generateAnalysis(ctx.prompt, LEAGUE_SYSTEM_PROMPT);
  } catch (err) {
    console.error("[ia-coach-liga] generateAnalysis threw:", (err as Error).message);
    if (!quota.pro) await refundIaCoachQuota(user.id);
    return errorResponse("anthropic_failed", 502, matchId);
  }

  // 5. Persistir en caché
  await writeCache(matchId, ctx.dataVersion, analysis);

  const resp: IACoachResponse = {
    ok: true, matchId, cached: false, dataVersion: ctx.dataVersion,
    generatedAt: new Date().toISOString(), analysis,
  };
  return NextResponse.json(resp);
}

function errorResponse(error: string, status: number, matchId?: string): NextResponse {
  const body: IACoachErrorResponse = { ok: false, error, matchId };
  return NextResponse.json(body, { status });
}

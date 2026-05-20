// src/app/api/ia-coach/analyze/route.ts
//
// POST /api/ia-coach/analyze
//
// Body: { matchId: string, match: BracketMatch }
//
// El cliente pasa el matchId (para cache) y el BracketMatch entero
// (para no tener que reconstruir el state del bracket aquí). El
// servidor cruza con MATCHES + team data y genera el análisis.
//
// Cache primero, Anthropic después si no hay cache.

import { NextResponse } from "next/server";
import { buildContext } from "@/lib/ia-coach/context-builder";
import { generateAnalysis } from "@/lib/ia-coach/anthropic-client";
import { readCache, writeCache } from "@/lib/ia-coach/cache";
import type { BracketMatch } from "@/lib/bracket/types";
import type {
  IACoachResponse,
  IACoachErrorResponse,
} from "@/lib/ia-coach/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 60s = máximo del plan Hobby de Vercel. Necesario por extended thinking
// (Sonnet 4.5 con 4000 tokens de thinking + análisis tarda 25-50s).
export const maxDuration = 60;

interface Body {
  matchId?: string;
  match?: BracketMatch;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return errorResponse("invalid_json", 400);
  }

  const { matchId, match } = body;
  if (!matchId || !match) {
    return errorResponse("missing_matchId_or_match", 400);
  }
  if (!match.a || !match.b) {
    return errorResponse("match_not_ready", 400);
  }

  // 1. Construir contexto + data version
  let context;
  try {
    context = await buildContext(match);
  } catch (err) {
    console.error("[ia-coach] buildContext threw:", (err as Error).message);
    return errorResponse("context_build_failed", 500, matchId);
  }
  if (!context) {
    return errorResponse("teams_not_found", 404, matchId);
  }

  // 2. Cache lookup
  const cached = await readCache(matchId, context.dataVersion);
  if (cached) {
    const resp: IACoachResponse = {
      ok: true,
      matchId,
      cached: true,
      dataVersion: context.dataVersion,
      generatedAt: cached.generatedAt,
      analysis: cached.analysis,
    };
    return NextResponse.json(resp, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  }

  // 3. Llamar a Claude
  let analysis;
  try {
    analysis = await generateAnalysis(context.contextMarkdown);
  } catch (err) {
    console.error(
      "[ia-coach] generateAnalysis threw:",
      (err as Error).message,
    );
    return errorResponse("anthropic_failed", 502, matchId);
  }

  // 4. Persistir en cache
  await writeCache(matchId, context.dataVersion, analysis);

  const resp: IACoachResponse = {
    ok: true,
    matchId,
    cached: false,
    dataVersion: context.dataVersion,
    generatedAt: new Date().toISOString(),
    analysis,
  };
  return NextResponse.json(resp);
}

function errorResponse(
  error: string,
  status: number,
  matchId?: string,
): NextResponse {
  const body: IACoachErrorResponse = { ok: false, error, matchId };
  return NextResponse.json(body, { status });
}

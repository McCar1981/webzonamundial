// src/app/api/ia-coach/live/route.ts
//
// POST /api/ia-coach/live
//
// Body: { matchId: number, state: LiveStateInput }
//
// El cliente (Match Center) ya tiene el estado en vivo en pantalla (marcador,
// minuto, stats, eventos, momentum) y lo reenvía. El servidor resuelve los
// metadatos del partido, construye el contexto + perfiles de equipo y pide al
// coach una lectura del momento. Caché por (matchId + stateVersion) en KV con
// TTL corto, para no re-facturar a Claude mientras el estado no cambia.

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { buildMeta } from "@/lib/match-center/store";
import { buildLiveContext } from "@/lib/ia-coach/live-context";
import { generateLiveAnalysis } from "@/lib/ia-coach/live-client";
import { LIVE_PROMPT_VERSION } from "@/lib/ia-coach/live-system-prompt";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { consumeIaCoachQuota, refundIaCoachQuota } from "@/lib/ia-coach/pro-quota";
import type {
  IACoachLiveAnalysis,
  IACoachLiveResponse,
  IACoachLiveErrorResponse,
  LiveStateInput,
} from "@/lib/ia-coach/live-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CACHE_PREFIX = "iacoach:live:v1:";
const CACHE_TTL_SECONDS = 180; // el estado (marcador/minuto) es estable unos minutos

interface Body {
  matchId?: number;
  state?: LiveStateInput;
}

interface CachedEntry {
  generatedAt: string;
  analysis: IACoachLiveAnalysis;
}

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }
  const rl = await rateLimitByUser(user.id, "ia-coach:live", 10, 60);
  if (rl.limited) {
    return errorResponse("rate_limited", 429);
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return errorResponse("invalid_json", 400);
  }

  const { matchId, state } = body;
  if (typeof matchId !== "number" || !Number.isInteger(matchId) || !state) {
    return errorResponse("missing_matchId_or_state", 400);
  }
  if (!Array.isArray(state.score) || state.score.length !== 2) {
    return errorResponse("invalid_state", 400, matchId);
  }

  const meta = buildMeta(matchId);
  if (!meta) {
    return errorResponse("match_not_found", 404, matchId);
  }

  // Contexto + versión del estado
  let built;
  try {
    built = await buildLiveContext(meta, state);
  } catch (err) {
    console.error("[ia-coach/live] buildLiveContext threw:", (err as Error).message);
    return errorResponse("context_build_failed", 500, matchId);
  }

  const cacheKey = `${CACHE_PREFIX}${LIVE_PROMPT_VERSION}:${matchId}:${built.stateVersion}`;

  // Cache lookup
  if (kvEnabled()) {
    try {
      const cached = await kv.get<CachedEntry>(cacheKey);
      if (cached) {
        const resp: IACoachLiveResponse = {
          ok: true,
          matchId,
          cached: true,
          stateVersion: built.stateVersion,
          generatedAt: cached.generatedAt,
          analysis: cached.analysis,
        };
        return NextResponse.json(resp, {
          headers: { "Cache-Control": "private, no-store" },
        });
      }
    } catch {
      /* degrada: genera de nuevo */
    }
  }

  // Cuota Pro/Free: solo las generaciones reales consumen consulta diaria.
  const quota = await consumeIaCoachQuota(user);
  if (!quota.allowed) {
    return errorResponse("pro_required", 402, matchId);
  }

  // Genera
  let analysis: IACoachLiveAnalysis;
  try {
    analysis = await generateLiveAnalysis(built.contextMarkdown);
  } catch (err) {
    console.error("[ia-coach/live] generateLiveAnalysis threw:", (err as Error).message);
    if (!quota.pro) await refundIaCoachQuota(user.id);
    return errorResponse("anthropic_failed", 502, matchId);
  }

  const generatedAt = new Date().toISOString();
  if (kvEnabled()) {
    try {
      await kv.set<CachedEntry>(cacheKey, { generatedAt, analysis }, { ex: CACHE_TTL_SECONDS });
    } catch (err) {
      console.error("[ia-coach/live] cache write failed:", (err as Error).message);
    }
  }

  const resp: IACoachLiveResponse = {
    ok: true,
    matchId,
    cached: false,
    stateVersion: built.stateVersion,
    generatedAt,
    analysis,
  };
  return NextResponse.json(resp, { headers: { "Cache-Control": "private, no-store" } });
}

function errorResponse(error: string, status: number, matchId?: number): NextResponse {
  const body: IACoachLiveErrorResponse = { ok: false, error, matchId };
  return NextResponse.json(body, { status });
}

// src/app/api/ia-coach/coach/route.ts
//
// POST /api/ia-coach/coach  — IA Coach MODO 3: Entrenador Personal.
//
// Body: { state: BracketStateInput }  (picks + matches resueltos + champion)
//
// El cliente reenvía su quiniela completa (vive en localStorage). El servidor
// construye el contexto (resumen del bracket + perfiles de equipos clave) y pide
// al Entrenador Personal una lectura del estilo y los riesgos del usuario.
// Caché KV por huella del bracket (TTL medio): dos quinielas idénticas comparten.

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { buildCoachContext } from "@/lib/ia-coach/coach-context";
import { generateBracketCoaching } from "@/lib/ia-coach/coach-client";
import { COACH_PROMPT_VERSION } from "@/lib/ia-coach/coach-system-prompt";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { consumeIaCoachQuota, refundIaCoachQuota } from "@/lib/ia-coach/pro-quota";
import type {
  IACoachBracketAnalysis,
  IACoachBracketResponse,
  IACoachBracketErrorResponse,
  BracketStateInput,
} from "@/lib/ia-coach/coach-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // extended thinking puede tardar 25-50s

const CACHE_PREFIX = "iacoach:coach:";
const CACHE_TTL_SECONDS = 6 * 60 * 60; // la quiniela es estable; 6h de cache

interface Body {
  state?: BracketStateInput;
}

interface CachedEntry {
  generatedAt: string;
  analysis: IACoachBracketAnalysis;
}

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }
  const rl = await rateLimitByUser(user.id, "ia-coach:coach", 5, 60);
  if (rl.limited) {
    return errorResponse("rate_limited", 429);
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return errorResponse("invalid_json", 400);
  }

  const { state } = body;
  if (!state || !state.picks || !Array.isArray(state.matches)) {
    return errorResponse("missing_state", 400);
  }
  // Exige un mínimo de quiniela para que el análisis tenga sentido.
  const pickCount = Object.keys(state.picks).length;
  if (pickCount < 8) {
    return errorResponse("bracket_too_incomplete", 400);
  }

  let built;
  try {
    built = await buildCoachContext(state);
  } catch (err) {
    console.error("[ia-coach/coach] buildCoachContext threw:", (err as Error).message);
    return errorResponse("context_build_failed", 500);
  }

  const cacheKey = `${CACHE_PREFIX}${COACH_PROMPT_VERSION}:${built.bracketVersion}`;

  // Cache lookup
  if (kvEnabled()) {
    try {
      const cached = await kv.get<CachedEntry>(cacheKey);
      if (cached) {
        const resp: IACoachBracketResponse = {
          ok: true,
          cached: true,
          bracketVersion: built.bracketVersion,
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
    return errorResponse("pro_required", 402);
  }

  let analysis: IACoachBracketAnalysis;
  try {
    analysis = await generateBracketCoaching(built.contextMarkdown);
  } catch (err) {
    console.error("[ia-coach/coach] generateBracketCoaching threw:", (err as Error).message);
    if (!quota.pro) await refundIaCoachQuota(user.id);
    return errorResponse("anthropic_failed", 502);
  }

  const generatedAt = new Date().toISOString();
  if (kvEnabled()) {
    try {
      await kv.set<CachedEntry>(cacheKey, { generatedAt, analysis }, { ex: CACHE_TTL_SECONDS });
    } catch (err) {
      console.error("[ia-coach/coach] cache write failed:", (err as Error).message);
    }
  }

  const resp: IACoachBracketResponse = {
    ok: true,
    cached: false,
    bracketVersion: built.bracketVersion,
    generatedAt,
    analysis,
  };
  return NextResponse.json(resp, { headers: { "Cache-Control": "private, no-store" } });
}

function errorResponse(error: string, status: number): NextResponse {
  const body: IACoachBracketErrorResponse = { ok: false, error };
  return NextResponse.json(body, { status });
}

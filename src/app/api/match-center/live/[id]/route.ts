// src/app/api/match-center/live/[id]/route.ts
//
// Endpoint único del Match Center. Devuelve un MatchFeed para el partido {id}:
//   - mode "live"  -> snapshot real de api-football (si hay fixture mapeado).
//   - mode "sim"   -> guion de simulación determinista (por defecto y fallback).
//
// Query:
//   ?sim=1   fuerza simulación aunque exista fixture real.
//   ?ai=0    desactiva la locución IA (usa solo plantillas).
//
// El cliente reproduce el feed con su propio reloj; en modo live hace polling.

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { buildMeta, getFixtureId, getCachedSnapshot, cacheSnapshot } from "@/lib/match-center/store";
import { buildSimulation } from "@/lib/match-center/simulation";
import { fetchLiveSnapshot } from "@/lib/match-center/apiFootball";
import { aiNarrateBatch } from "@/lib/match-center/narrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SIMNARR_PREFIX = "mc:simnarr:v2:"; // v2: nombres de jugador (no dorsales)
const SIMNARR_TTL = 24 * 60 * 60;

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const matchId = parseInt(params.id, 10);
  if (!Number.isInteger(matchId)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const meta = buildMeta(matchId);
  if (!meta) {
    return NextResponse.json({ error: "match not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const forceSim = url.searchParams.get("sim") === "1";
  const useAI = url.searchParams.get("ai") !== "0" && !!process.env.ANTHROPIC_API_KEY;

  // --- Modo live real ---
  if (!forceSim) {
    const fixtureId = await getFixtureId(matchId);
    if (fixtureId) {
      const cached = await getCachedSnapshot(matchId);
      if (cached) {
        return NextResponse.json(cached, {
          headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" },
        });
      }
      const snap = await fetchLiveSnapshot(fixtureId, meta);
      if (snap) {
        if (useAI && snap.events.length > 0) {
          try {
            snap.narration = await aiNarrateBatch(snap.events, meta);
          } catch {
            /* plantillas en cliente */
          }
        }
        await cacheSnapshot(snap);
        return NextResponse.json(snap, {
          headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" },
        });
      }
      // si la API falla, caemos a simulación
    }
  }

  // --- Modo simulación ---
  const script = buildSimulation(meta);
  if (useAI) {
    const cacheKey = `${SIMNARR_PREFIX}${matchId}:${script.seed}`;
    let aiNarr: Record<string, string> | null = null;
    if (kvEnabled()) {
      try {
        aiNarr = await kv.get<Record<string, string>>(cacheKey);
      } catch {
        aiNarr = null;
      }
    }
    if (!aiNarr) {
      try {
        aiNarr = await aiNarrateBatch(script.events, meta);
        if (kvEnabled() && aiNarr && Object.keys(aiNarr).length > 0) {
          await kv.set(cacheKey, aiNarr, { ex: SIMNARR_TTL });
        }
      } catch {
        aiNarr = null;
      }
    }
    if (aiNarr) script.narration = { ...script.narration, ...aiNarr };
  }

  return NextResponse.json(script, {
    headers: { "Cache-Control": "no-store" },
  });
}

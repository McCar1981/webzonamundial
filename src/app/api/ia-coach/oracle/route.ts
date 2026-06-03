// src/app/api/ia-coach/oracle/route.ts
//
// POST /api/ia-coach/oracle  — IA Coach MODO 4: Oráculo / Monte Carlo.
//
// Body: { champion?: string }  (campeón del usuario, opcional)
//
// 1. Corre (o lee de caché) la simulación Monte Carlo del torneo — AUTOCONTENIDA,
//    determinista, sin red.
// 2. Pide al Oráculo (Claude) una narración de los números.
//
// Dos cachés KV: la simulación (estable, TTL largo) y la narración (por campeón).

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { TEAM_BY_ID } from "@/lib/bracket/teams";
import { runOracleSim, ORACLE_SIM_VERSION, type OracleSimResult } from "@/lib/ia-coach/oracle-sim";
import {
  buildOracleContext,
  generateOracleNarration,
} from "@/lib/ia-coach/oracle-client";
import { ORACLE_PROMPT_VERSION } from "@/lib/ia-coach/oracle-system-prompt";
import type {
  OracleNarration,
  OracleRequest,
  OracleResponse,
  OracleErrorResponse,
} from "@/lib/ia-coach/oracle-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SIM_CACHE_KEY = `iacoach:oracle:sim:${ORACLE_SIM_VERSION}`;
const SIM_TTL = 24 * 60 * 60; // la simulación es determinista; refresca cada día
const NARRATION_PREFIX = "iacoach:oracle:nar:";
const NARRATION_TTL = 12 * 60 * 60;

interface NarrationCache {
  generatedAt: string;
  narration: OracleNarration;
}

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

async function getSim(): Promise<OracleSimResult> {
  if (kvEnabled()) {
    try {
      const cached = await kv.get<OracleSimResult>(SIM_CACHE_KEY);
      if (cached && cached.version === ORACLE_SIM_VERSION) return cached;
    } catch {
      /* degrada: recalcula */
    }
  }
  const sim = runOracleSim();
  if (kvEnabled()) {
    try {
      await kv.set(SIM_CACHE_KEY, sim, { ex: SIM_TTL });
    } catch {
      /* ignora */
    }
  }
  return sim;
}

export async function POST(req: Request) {
  let body: OracleRequest = {};
  try {
    body = (await req.json()) as OracleRequest;
  } catch {
    /* body opcional: si no hay JSON, seguimos sin campeón */
  }

  const championId =
    typeof body.champion === "string" && TEAM_BY_ID[body.champion.toUpperCase()]
      ? body.champion.toUpperCase()
      : null;

  let sim: OracleSimResult;
  try {
    sim = await getSim();
  } catch (err) {
    console.error("[ia-coach/oracle] sim failed:", (err as Error).message);
    return errorResponse("sim_failed", 500);
  }

  const top = sim.teams.slice(0, 12);
  const userChampion =
    championId && !top.some((t) => t.id === championId)
      ? sim.teams.find((t) => t.id === championId) ?? null
      : null;

  // Narración: caché por versión de prompt + versión de sim + campeón del usuario.
  const narrationKey = `${NARRATION_PREFIX}${ORACLE_PROMPT_VERSION}:${sim.version}:${championId ?? "none"}`;

  if (kvEnabled()) {
    try {
      const cached = await kv.get<NarrationCache>(narrationKey);
      if (cached) {
        return json({
          ok: true,
          cached: true,
          iterations: sim.iterations,
          generatedAt: cached.generatedAt,
          top,
          userChampion,
          narration: cached.narration,
        });
      }
    } catch {
      /* degrada */
    }
  }

  let narration: OracleNarration;
  try {
    const context = buildOracleContext(sim.teams, sim.iterations, championId);
    narration = await generateOracleNarration(context);
  } catch (err) {
    console.error("[ia-coach/oracle] narration failed:", (err as Error).message);
    return errorResponse("anthropic_failed", 502);
  }

  const generatedAt = new Date().toISOString();
  if (kvEnabled()) {
    try {
      await kv.set<NarrationCache>(narrationKey, { generatedAt, narration }, { ex: NARRATION_TTL });
    } catch {
      /* ignora */
    }
  }

  return json({
    ok: true,
    cached: false,
    iterations: sim.iterations,
    generatedAt,
    top,
    userChampion,
    narration,
  });
}

function json(resp: OracleResponse): NextResponse {
  return NextResponse.json(resp, { headers: { "Cache-Control": "private, no-store" } });
}

function errorResponse(error: string, status: number): NextResponse {
  const body: OracleErrorResponse = { ok: false, error };
  return NextResponse.json(body, { status });
}

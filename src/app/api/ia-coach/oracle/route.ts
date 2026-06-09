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
  buildOracleOddsTable,
  generateOracleNarration,
  generateOracleFollowup,
} from "@/lib/ia-coach/oracle-client";
import { ORACLE_PROMPT_VERSION } from "@/lib/ia-coach/oracle-system-prompt";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import type {
  OracleNarration,
  OracleFollowupMessage,
  OracleRequest,
  OracleResponse,
  OracleFollowupResponse,
  OracleErrorResponse,
} from "@/lib/ia-coach/oracle-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SIM_CACHE_KEY = `iacoach:oracle:sim:${ORACLE_SIM_VERSION}`;
const SIM_TTL = 24 * 60 * 60; // la simulación es determinista; refresca cada día
const NARRATION_PREFIX = "iacoach:oracle:nar:";
const NARRATION_TTL = 12 * 60 * 60;

// Seguimiento (multi-turn): topes para acotar coste/abuso del chat.
const MAX_FOLLOWUP_TURNS = 8;
const MAX_FOLLOWUP_MSG_LEN = 600;
const MAX_FOLLOWUP_HISTORY = MAX_FOLLOWUP_TURNS * 2;

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
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("unauthorized", 401);
  }
  const rl = await rateLimitByUser(user.id, "ia-coach:oracle", 5, 60);
  if (rl.limited) {
    return errorResponse("rate_limited", 429);
  }

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

  // ── Rama SEGUIMIENTO (multi-turn): si el body trae messages, el usuario
  //    está conversando con el Oráculo sobre las odds. Respuesta libre y sin
  //    cachear, anclada en la misma tabla de probabilidades. ──
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    const messages = sanitizeFollowup(body.messages);
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return errorResponse("invalid_messages", 400);
    }
    const userTurns = messages.filter((m) => m.role === "user").length;
    if (userTurns > MAX_FOLLOWUP_TURNS) {
      return errorResponse("turn_limit", 429);
    }
    try {
      const oddsTable = buildOracleOddsTable(sim.teams, sim.iterations, championId);
      const reply = await generateOracleFollowup(oddsTable, messages);
      const followup: OracleFollowupResponse = {
        ok: true,
        generatedAt: new Date().toISOString(),
        reply,
      };
      return NextResponse.json(followup, {
        headers: { "Cache-Control": "private, no-store" },
      });
    } catch (err) {
      console.error("[ia-coach/oracle] followup failed:", (err as Error).message);
      return errorResponse("anthropic_failed", 502);
    }
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

/** Normaliza el historial del chat de seguimiento: roles válidos, texto no vacío,
 *  longitudes acotadas y recorte a los últimos MAX_FOLLOWUP_HISTORY mensajes. */
function sanitizeFollowup(raw: unknown): OracleFollowupMessage[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: OracleFollowupMessage[] = [];
  for (const m of raw) {
    if (typeof m !== "object" || m === null) continue;
    const o = m as Record<string, unknown>;
    const role = o.role === "user" || o.role === "assistant" ? o.role : null;
    const content = typeof o.content === "string" ? o.content.trim() : "";
    if (!role || !content) continue;
    cleaned.push({ role, content: content.slice(0, MAX_FOLLOWUP_MSG_LEN) });
  }
  return cleaned.slice(-MAX_FOLLOWUP_HISTORY);
}

function json(resp: OracleResponse): NextResponse {
  return NextResponse.json(resp, { headers: { "Cache-Control": "private, no-store" } });
}

function errorResponse(error: string, status: number): NextResponse {
  const body: OracleErrorResponse = { ok: false, error };
  return NextResponse.json(body, { status });
}

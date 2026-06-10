// src/app/api/ia-coach/debate/route.ts
//
// POST /api/ia-coach/debate — IA Coach MODO 5: Debate / Reto IA vs Humanos.
//
// Body: { champion?: string, messages: DebateMessage[] }
//
// MULTI-TURN + GATED:
//   1. Requiere cuenta (getCurrentUser).
//   2. Requiere plan Pro (isPro; los Founders lo heredan) — feature premium.
//   3. Reenvía el historial al Retador (Claude) y devuelve su turno.
//
// No cacheamos: cada conversación es única. Limitamos el nº de turnos para
// acotar el coste por sesión.

import { NextResponse } from "next/server";
import { getCurrentUserWithName, rateLimitByUser } from "@/lib/auth-helpers";
import { isPro } from "@/lib/pro/entitlement";
import { TEAM_BY_ID } from "@/lib/bracket/teams";
import { generateDebateReply } from "@/lib/ia-coach/debate-client";
import { readDebateMemory, writeDebateMemory } from "@/lib/ia-coach/debate-memory";
import type {
  DebateMessage,
  DebateRequest,
  DebateResponse,
  DebateTurn,
  DebateErrorResponse,
} from "@/lib/ia-coach/debate-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Tope de mensajes del usuario por sesión de debate (acota coste y abuso).
const MAX_USER_TURNS = 10;
const MAX_MESSAGE_LEN = 1200;
const MAX_HISTORY = MAX_USER_TURNS * 2; // user + assistant alternados

export async function POST(req: Request) {
  // ── 1. Cuenta ──
  const user = await getCurrentUserWithName();
  if (!user?.email) {
    return errorResponse("auth_required", 401);
  }

  // ── 2. Premium (plan Pro; los Founders lo heredan) ──
  let pro = false;
  try {
    pro = await isPro(user.id, user.email);
  } catch {
    return errorResponse("premium_check_failed", 503);
  }
  if (!pro) {
    return errorResponse("premium_required", 402);
  }

  // ── 2.b Rate-limit por usuario ──
  // Freno de COSTE real: el tope de turnos por sesión se cuenta sobre el historial
  // que envía el cliente (manipulable enviando siempre 1 mensaje), así que por sí
  // solo no impide llamadas ilimitadas a Claude. Un debate humano no supera ~10
  // mensajes/min; este límite corta el abuso automatizado sin molestar al usuario.
  const rl = await rateLimitByUser(user.id, "ia-coach:debate", 10, 60);
  if (rl.limited) {
    return errorResponse("rate_limited", 429);
  }

  // ── 3. Body ──
  let body: DebateRequest;
  try {
    body = (await req.json()) as DebateRequest;
  } catch {
    return errorResponse("bad_request", 400);
  }

  const messages = sanitizeMessages(body.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return errorResponse("invalid_messages", 400);
  }

  const turnsUsed = messages.filter((m) => m.role === "user").length;
  if (turnsUsed > MAX_USER_TURNS) {
    return errorResponse("turn_limit", 429);
  }

  const championId =
    typeof body.champion === "string" && TEAM_BY_ID[body.champion.toUpperCase()]
      ? body.champion.toUpperCase()
      : null;

  // ── 4. Memoria cross-session (best-effort): solo al ARRANCAR una sesión
  //    nueva (un único turno de usuario en el historial). En mitad del debate
  //    el propio historial ya da el contexto. ──
  const isNewSession = turnsUsed === 1;
  const priorMemory = isNewSession ? await readDebateMemory(user.id) : null;

  // ── 5. Turno del Retador ──
  let turn: DebateTurn;
  try {
    turn = await generateDebateReply(messages, {
      championId,
      userName: user.name,
      turnsUsed,
      maxTurns: MAX_USER_TURNS,
      priorMemory,
    });
  } catch (err) {
    console.error("[ia-coach/debate] reply failed:", (err as Error).message);
    return errorResponse("anthropic_failed", 502);
  }

  // ── 6. Persiste la memoria tras el turno (no bloquea la respuesta si falla). ──
  await writeDebateMemory(
    user.id,
    { championId, stance: turn.stance, isNewSession },
    priorMemory,
  );

  const resp: DebateResponse = {
    ok: true,
    generatedAt: new Date().toISOString(),
    turnsUsed,
    turn,
  };
  return NextResponse.json(resp, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

/** Normaliza el historial: roles válidos, texto no vacío, longitudes acotadas
 *  y recorte a los últimos MAX_HISTORY mensajes. */
function sanitizeMessages(raw: unknown): DebateMessage[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: DebateMessage[] = [];
  for (const m of raw) {
    if (typeof m !== "object" || m === null) continue;
    const o = m as Record<string, unknown>;
    const role = o.role === "user" || o.role === "assistant" ? o.role : null;
    const content = typeof o.content === "string" ? o.content.trim() : "";
    if (!role || !content) continue;
    cleaned.push({ role, content: content.slice(0, MAX_MESSAGE_LEN) });
  }
  return cleaned.slice(-MAX_HISTORY);
}

function errorResponse(error: string, status: number): NextResponse {
  const body: DebateErrorResponse = { ok: false, error };
  return NextResponse.json(body, { status });
}

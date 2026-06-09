// src/app/api/match-center/narrate/route.ts
//
// Narración bajo demanda para eventos NUEVOS detectados durante el polling de un
// partido real. El cliente envía el lote de eventos recién aparecidos y recibe
// el texto de locución (IA si hay key, plantillas si no).

import { NextResponse } from "next/server";
import { narrateAll } from "@/lib/match-center/narrator";
import { buildMeta } from "@/lib/match-center/store";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { isPro } from "@/lib/pro/entitlement";
import type { MatchEvent } from "@/lib/match-center/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rl = await rateLimitByUser(user.id, "match-center:narrate", 20, 60);
  if (rl.limited) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { matchId?: number; events?: MatchEvent[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const matchId = Number(body.matchId);
  const events = Array.isArray(body.events) ? body.events.slice(0, 12) : [];
  if (!Number.isInteger(matchId) || events.length === 0) {
    return NextResponse.json({ lines: {} });
  }
  const meta = buildMeta(matchId);
  if (!meta) return NextResponse.json({ lines: {} });

  // Narración AVANZADA (Claude) = beneficio Pro. Free recibe siempre la
  // narración por plantilla — nunca se queda sin relato, solo sin IA.
  const useAI = !!process.env.ANTHROPIC_API_KEY && (await isPro(user.id, user.email));
  const lines = await narrateAll(events, meta, useAI);
  return NextResponse.json({ lines });
}

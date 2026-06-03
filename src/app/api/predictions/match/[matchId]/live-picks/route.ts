// src/app/api/predictions/match/[matchId]/live-picks/route.ts
//
// Micro-picks en vivo durante el partido.
//   GET  → estado del partido (minuto), liquida los picks vencidos del usuario,
//          devuelve los mercados disponibles y sus picks. Auth requerida.
//   POST → crea un micro-pick para un mercado. Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { LIVE_MARKETS, LIVE_MARKET_KEYS, LIVE_MAX_MINUTE } from "@/lib/predictions/live-picks";
import {
  authoritativeState,
  createLivePick,
  listLivePicks,
  settleDuePicks,
} from "@/lib/predictions/live-picks-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const state = await authoritativeState(params.matchId);
  if (!state) return NextResponse.json({ error: "match_not_found" }, { status: 404 });

  await settleDuePicks(user.id, params.matchId, state).catch(() => {});
  const picks = await listLivePicks(user.id, params.matchId);

  const pendingMarkets = new Set(picks.filter((p) => p.status === "pending").map((p) => p.market));
  const markets =
    state.live && state.minute < LIVE_MAX_MINUTE
      ? LIVE_MARKET_KEYS.filter((m) => !pendingMarkets.has(m)).map((m) => LIVE_MARKETS[m])
      : [];

  return NextResponse.json({
    live: state.live,
    minute: state.minute,
    finished: state.finished,
    markets,
    picks,
  });
}

const ERROR_STATUS: Record<string, number> = {
  invalid_market: 400,
  invalid_choice: 400,
  match_not_found: 404,
  match_not_live: 403,
  too_late: 403,
  pending_exists: 409,
  insert_failed: 500,
};

export async function POST(req: Request, { params }: { params: { matchId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { market?: string; choice?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.market || !body.choice) {
    return NextResponse.json({ error: "bad_request", message: "market y choice son obligatorios" }, { status: 400 });
  }

  const res = await createLivePick(user.id, params.matchId, body.market, body.choice);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: ERROR_STATUS[res.error ?? ""] ?? 400 });
  }
  return NextResponse.json(res.pick, { status: 201 });
}

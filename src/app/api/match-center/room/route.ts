// src/app/api/match-center/room/route.ts
//
// Crear / unirse a una SALA CON AMIGOS (watch party) de un partido.
// POST { action: "create"|"join", matchId?, code?, memberId, name }

import { NextResponse } from "next/server";
import { createRoom, joinRoom, getRoomView, roomRateLimited } from "@/lib/match-center/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(req: Request) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > 2048) return NextResponse.json({ error: "too large" }, { status: 413 });

  // Anti-spam: crear/unir es una acción puntual; nadie hace más de un puñado.
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  if (await roomRateLimited(ip, "create", 10)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { action?: string; matchId?: number; code?: string; memberId?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (body.action === "create") {
    const matchId = Number(body.matchId);
    if (!Number.isInteger(matchId) || matchId <= 0) {
      return NextResponse.json({ error: "bad match" }, { status: 400 });
    }
    const res = await createRoom(matchId, body.memberId, body.name);
    if (!res) return NextResponse.json({ error: "create_failed" }, { status: 500 });
    const view = await getRoomView(res.code);
    return NextResponse.json({ ok: true, code: res.code, view }, { headers: { "Cache-Control": "no-store" } });
  }

  if (body.action === "join") {
    const r = await joinRoom(body.code, body.memberId, body.name);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: r.error === "not_found" ? 404 : 400 });
    const view = await getRoomView(body.code);
    return NextResponse.json({ ok: true, code: (body.code || "").toUpperCase(), view }, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({ error: "bad action" }, { status: 400 });
}

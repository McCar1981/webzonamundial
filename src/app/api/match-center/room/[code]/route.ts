// src/app/api/match-center/room/[code]/route.ts
//
// GET  → estado de la sala (miembros + chat) para el sondeo del cliente.
// POST → publica un mensaje { memberId, name, text?, gif? } en la sala.

import { NextResponse } from "next/server";
import { getRoomView, postMessage, roomRateLimited } from "@/lib/match-center/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
}

export async function GET(
  req: Request,
  { params }: { params: { code: string } },
) {
  // Sondeo legítimo ~10/min/miembro; 30 cubre varias pestañas y corta martilleo.
  if (await roomRateLimited(clientIp(req), "get", 30)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const view = await getRoomView(params.code);
  if (!view) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(view, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(
  req: Request,
  { params }: { params: { code: string } },
) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > 4096) return NextResponse.json({ error: "too large" }, { status: 413 });
  if (await roomRateLimited(clientIp(req), "msg", 40)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let body: { memberId?: string; name?: string; text?: string; gif?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const r = await postMessage(params.code, body.memberId, body.name, body.text, body.gif);
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: r.error === "not_found" ? 404 : 400 });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

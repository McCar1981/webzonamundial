// src/app/api/bars/prizes/route.ts
//
// GET    /api/bars/prizes        → premios del bar del usuario.
// POST   /api/bars/prizes        → crea un premio { title, description?, prizeType?, conditions? }.
// DELETE /api/bars/prizes?id=…   → elimina un premio del bar del usuario.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getBarByOwner, listPrizes, createPrize, deletePrize } from "@/lib/bars/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const bar = await getBarByOwner(user.id);
  if (!bar) return NextResponse.json({ prizes: [] });
  const prizes = await listPrizes(bar.id);
  return NextResponse.json({ prizes });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const bar = await getBarByOwner(user.id);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });

  let body: { title?: string; description?: string; prizeType?: string; conditions?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.title || !body.title.trim()) return NextResponse.json({ error: "bad_request", message: "title requerido" }, { status: 400 });

  const prize = await createPrize(user.id, bar.id, {
    title: body.title, description: body.description, prizeType: body.prizeType, conditions: body.conditions,
  });
  return NextResponse.json({ ok: true, prize }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const bar = await getBarByOwner(user.id);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  await deletePrize(user.id, bar.id, id);
  return NextResponse.json({ ok: true });
}

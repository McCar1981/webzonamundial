// src/app/api/friendlies/[id]/route.ts
//
// Snapshot completo de un amistoso (fixture + eventos + alineaciones) para la
// vista de detalle en vivo. Degrada a 404 si no existe o no hay API key.

import { NextResponse } from "next/server";
import { apiFootballEnabled, fetchFriendlySnapshot } from "@/lib/friendlies/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fixtureId = Number(id);
  if (!Number.isFinite(fixtureId)) {
    return NextResponse.json({ error: "bad_id" }, { status: 400 });
  }
  if (!apiFootballEnabled()) {
    return NextResponse.json({ error: "api_not_configured" }, { status: 503 });
  }

  const snapshot = await fetchFriendlySnapshot(fixtureId);
  if (!snapshot) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}

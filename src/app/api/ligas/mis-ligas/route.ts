// src/app/api/ligas/mis-ligas/route.ts
//
// Preferencia "Mis ligas" (multi-selección).
// GET  -> { authed, ligas: ["liga-mx", ...] }
// POST { ligas: [...] } -> guarda (valida contra el catálogo, tope 8)
//
// Requiere la migración 2026-46 (fail-soft: sin columna responde not_available).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMisLigas, setMisLigas } from "@/lib/ligas/mis-ligas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const noStore = { headers: { "Cache-Control": "private, no-store" } };
  if (!user) return NextResponse.json({ authed: false, ligas: [] }, noStore);
  const ligas = await getMisLigas(user.id);
  return NextResponse.json({ authed: true, ligas }, noStore);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { ligas?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!Array.isArray(body.ligas)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const res = await setMisLigas(user.id, body.ligas as string[]);
  if (!res.ok) {
    if (res.reason === "not_available") return NextResponse.json({ error: "not_available" }, { status: 503 });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  const ligas = await getMisLigas(user.id);
  return NextResponse.json({ ok: true, ligas });
}

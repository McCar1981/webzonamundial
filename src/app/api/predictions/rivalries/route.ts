// src/app/api/predictions/rivalries/route.ts
//
// GET /api/predictions/rivalries → historial cara a cara (rivalidades 1v1
// persistentes) del usuario autenticado.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { myRivalries } from "@/lib/predictions/rivalries-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rivalries = await myRivalries(user.id);
  return NextResponse.json({ rivalries });
}

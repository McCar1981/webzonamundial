// src/app/api/predictions/stats/me/route.ts
//
// GET /api/v1/predictions/stats/me → estadísticas personales del usuario.
// Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMyStats } from "@/lib/predictions/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const stats = await getMyStats(user.id);
  return NextResponse.json(stats);
}

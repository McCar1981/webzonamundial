// src/app/api/predictions/me/route.ts
//
// GET /api/predictions/me → resumen de gamificación del usuario (nivel/XP,
// monedas, racha, logros, reto diario, flash multiplier, boosts). Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getGamificationSummary } from "@/lib/predictions/gamification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const summary = await getGamificationSummary(user.id);
  return NextResponse.json(summary);
}

// src/app/api/cromos/achievements/route.ts
//
// GET /api/cromos/achievements → logros del álbum del usuario autenticado.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { evaluateAchievements } from "@/lib/cromos/rewards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const achievements = await evaluateAchievements(user.id);
  return NextResponse.json({ achievements });
}

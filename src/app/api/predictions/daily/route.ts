// src/app/api/predictions/daily/route.ts
//
// POST /api/predictions/daily → reclamar el check-in diario (monedas/XP, cofre
// al 7º día). Idempotente por día UTC. Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { claimDaily } from "@/lib/predictions/gamification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await claimDaily(user.id);
  if (result.already) {
    return NextResponse.json({ error: "already_claimed", message: "Ya reclamaste tu recompensa de hoy", ...result }, { status: 409 });
  }
  return NextResponse.json(result);
}

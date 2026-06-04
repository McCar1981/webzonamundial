// src/app/api/predictions/battlepass/route.ts
//
// GET /api/predictions/battlepass → estado de la pista de temporada del usuario
// (temporada vigente, XP de temporada, nivel, recompensas y reclamos). Auth.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getBattlePass } from "@/lib/predictions/gamification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const view = await getBattlePass(user.id);
  return NextResponse.json(view);
}

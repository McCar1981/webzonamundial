// src/app/api/predictions/leagues/[id]/route.ts
//
// GET    /api/predictions/leagues/{id} → clasificación de la liga.
// DELETE /api/predictions/leagues/{id} → abandonar la liga.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { leagueLeaderboard, leaveLeague } from "@/lib/predictions/gamification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const standings = await leagueLeaderboard(params.id);
  return NextResponse.json({ league_id: params.id, standings });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await leaveLeague(user.id, params.id);
  return NextResponse.json({ ok: true });
}

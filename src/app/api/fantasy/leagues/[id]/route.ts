// src/app/api/fantasy/leagues/[id]/route.ts
//
// GET    /api/fantasy/leagues/{id} → clasificación de la liga (solo miembros).
// DELETE /api/fantasy/leagues/{id} → abandonar la liga.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { leagueLeaderboard, leaveLeague, isMember } from "@/lib/fantasy/leagues.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isMember(user.id, params.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const standings = await leagueLeaderboard(params.id);
  return NextResponse.json({ league_id: params.id, standings });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await leaveLeague(user.id, params.id);
  return NextResponse.json({ ok: true });
}

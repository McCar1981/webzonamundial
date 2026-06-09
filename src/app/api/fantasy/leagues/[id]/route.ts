// src/app/api/fantasy/leagues/[id]/route.ts
//
// GET    /api/fantasy/leagues/{id}        → clasificación de la liga (solo miembros).
//        ?gw=N  → clasificación de la jornada N en vez del total del torneo.
// PATCH  /api/fantasy/leagues/{id}        → renombrar liga ({ name }). Solo dueño.
// DELETE /api/fantasy/leagues/{id}        → abandonar la liga (miembro) o
//        borrarla entera (dueño). Con body { memberId } el dueño expulsa a alguien.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
  leagueLeaderboard, leaveLeague, isMember, isOwner,
  renameLeague, kickMember, deleteLeague,
} from "@/lib/fantasy/leagues.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isMember(user.id, params.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const gwParam = new URL(req.url).searchParams.get("gw");
  const gw = gwParam ? Math.max(1, parseInt(gwParam, 10) || 0) : undefined;
  const standings = await leagueLeaderboard(params.id, gw);
  const is_owner = await isOwner(user.id, params.id);
  return NextResponse.json({ league_id: params.id, standings, is_owner, gameweek: gw ?? null });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { name?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.name || !body.name.trim()) return NextResponse.json({ error: "bad_name" }, { status: 400 });
  const ok = await renameLeague(user.id, params.id, body.name);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Body opcional { memberId } → el dueño expulsa a ese miembro.
  let body: { memberId?: string } = {};
  try { body = await req.json(); } catch { /* sin body: acción por defecto */ }

  if (body.memberId) {
    const ok = await kickMember(user.id, params.id, body.memberId);
    if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ ok: true, action: "kicked" });
  }

  // Dueño → borra la liga; miembro → solo se va.
  if (await isOwner(user.id, params.id)) {
    await deleteLeague(user.id, params.id);
    return NextResponse.json({ ok: true, action: "deleted" });
  }
  await leaveLeague(user.id, params.id);
  return NextResponse.json({ ok: true, action: "left" });
}

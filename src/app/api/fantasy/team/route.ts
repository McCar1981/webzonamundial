// src/app/api/fantasy/team/route.ts
//
// GET  /api/fantasy/team → equipo del usuario autenticado (null si aún no tiene).
// PUT  /api/fantasy/team → guarda el equipo del usuario ({ state }).
//
// Persistencia real del Fantasy: sustituye al localStorage cuando hay sesión.
// El localStorage sigue actuando como modo invitado y se sincroniza al iniciar.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getTeam, saveTeam, recordGameweekScore, awardGameweekCoins, getFavCreator } from "@/lib/fantasy/store.server";
import { isValidGameweek } from "@/lib/fantasy/fixtures";
import type { FantasyTeamState } from "@/lib/fantasy/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // favCreator permite marcar el equipo con el creador del registro: el cliente
  // lo aplica al crear el equipo (o lo backfillea si aún no lo tenía).
  const [team, favCreator] = await Promise.all([getTeam(user.id), getFavCreator(user.id)]);
  return NextResponse.json({ team, favCreator });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { state?: FantasyTeamState; gameweekScore?: { gw: number; points: number; powerUp: string | null } };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const state = body.state;
  if (!state || !Array.isArray(state.slots)) {
    return NextResponse.json({ error: "bad_request", message: "state inválido" }, { status: 400 });
  }

  await saveTeam(user.id, state);
  // Al confirmar una jornada el cliente envía gameweekScore para el ranking semanal.
  // Además abonamos Fútcoins una sola vez por jornada (idempotente en el backend).
  let reward = { coins: 0, xp: 0 };
  if (body.gameweekScore && isValidGameweek(body.gameweekScore.gw)) {
    const gs = body.gameweekScore;
    await recordGameweekScore(user.id, gs.gw, gs.points, gs.powerUp ?? null);
    reward = await awardGameweekCoins(user.id, gs.gw, gs.points);
  }
  return NextResponse.json({ ok: true, futcoins: reward.coins, xpAwarded: reward.xp });
}

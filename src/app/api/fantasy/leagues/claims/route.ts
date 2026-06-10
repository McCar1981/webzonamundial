// src/app/api/fantasy/leagues/claims/route.ts
//
// GET /api/fantasy/leagues/claims → jugadores PILLADOS por otros managers en la
// liga Draft del usuario (a lo sumo una). El mercado los pinta bloqueados y el
// picker los rechaza con el nombre del dueño. {league_id: null} si el usuario
// no está en ninguna liga Draft.
//
// Nota de rutas: el segmento estático /claims tiene prioridad sobre el dinámico
// /[id], así que no colisiona con GET /api/fantasy/leagues/{uuid}.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { draftTakenForUser } from "@/lib/fantasy/leagues.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const data = await draftTakenForUser(user.id);
  if (!data) return NextResponse.json({ league_id: null, league_name: null, taken: [] });
  return NextResponse.json(data);
}

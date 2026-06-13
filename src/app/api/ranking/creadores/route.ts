// src/app/api/ranking/creadores/route.ts
//
// GET /api/ranking/creadores → RANKING DE COMUNIDADES. Agrupa a los jugadores
// con saldo por su creador (profiles.fav_creator) y ordena las comunidades por
// las Fútcoins que suman. Responde:
//   · creators: top de comunidades (por defecto 100, máx 250 vía ?limit=).
//   · me:       tu puesto DENTRO de tu comunidad (MyCreatorRank | null).
//   · myCreator: la fila del ranking de tu comunidad (rank de la comunidad | null).
//
// Solo lectura/agregación (cliente admin). El staff/propietario queda excluido
// igual que en el resto de rankings.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCreatorsLeaderboard, getUserCreatorRank } from "@/lib/economy/ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(250, Number(url.searchParams.get("limit")) || 100));

  const [creators, user] = await Promise.all([getCreatorsLeaderboard(limit), getCurrentUser()]);
  const me = user ? await getUserCreatorRank(user.id) : null;
  const myCreator = me ? creators.find((c) => c.creator === me.creator) ?? null : null;

  return NextResponse.json({ creators, me, myCreator }, { headers: { "Cache-Control": "no-store" } });
}

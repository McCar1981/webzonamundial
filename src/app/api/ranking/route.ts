// src/app/api/ranking/route.ts
//
// GET /api/ranking → ranking GLOBAL por Fútcoins (la moneda única de la app).
//   · entries: top global (por defecto 50, máx 200 vía ?limit=).
//   · me: posición del usuario autenticado (null si no hay sesión).
//
// ?only=me  → omite el top y devuelve solo la posición del usuario. Lo usa la
//             cabecera, que solo necesita el saldo + el puesto y no la lista.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getGlobalCoinRanking, getUserRank } from "@/lib/economy/ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const onlyMe = url.searchParams.get("only") === "me";
  const limit = Number(url.searchParams.get("limit")) || 50;

  const user = await getCurrentUser();
  const me = user ? await getUserRank(user.id) : null;

  if (onlyMe) {
    return NextResponse.json({ me }, { headers: { "Cache-Control": "no-store" } });
  }

  const entries = await getGlobalCoinRanking(limit);
  return NextResponse.json({ entries, me }, { headers: { "Cache-Control": "no-store" } });
}

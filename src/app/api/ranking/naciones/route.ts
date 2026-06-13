// src/app/api/ranking/naciones/route.ts
//
// GET /api/ranking/naciones → MEDALLERO de naciones. Agrupa a todos los
// jugadores con saldo por su país (profiles.country, ISO-2) y ordena los países
// por la suma de Fútcoins de su afición. Responde:
//   · nations: top de países (por defecto 100, máx 250 vía ?limit=).
//   · me:      tu puesto DENTRO de tu país (MyCountryRank | null).
//   · myNation: la fila del medallero de tu país (rank del país | null).
//
// Solo lectura/agregación (cliente admin). El staff/propietario queda excluido
// igual que en el resto de rankings.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getNationsLeaderboard, getUserCountryRank } from "@/lib/economy/ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(250, Number(url.searchParams.get("limit")) || 100));

  const [nations, user] = await Promise.all([getNationsLeaderboard(limit), getCurrentUser()]);
  const me = user ? await getUserCountryRank(user.id) : null;

  // Si el medallero pedido no llega hasta el país del usuario, igualmente le
  // devolvemos su nación buscándola en la lista completa (sin recortar) sería
  // otra consulta; con el top mostrado basta para el caso normal.
  const myNation = me ? nations.find((n) => n.country === me.country) ?? null : null;

  return NextResponse.json({ nations, me, myNation }, { headers: { "Cache-Control": "no-store" } });
}

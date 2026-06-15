// src/app/api/ranking/semana/route.ts
//
// GET /api/ranking/semana → CAMPEÓN DE LA SEMANA. Top de jugadores por Fútcoins
// GANADAS en los últimos `days` días (por defecto 7), leyendo coin_ledger por
// created_at. A diferencia del ranking global (saldo acumulado de siempre), este
// RESETEA con la ventana móvil: cada semana todos parten de cero y cualquiera
// puede ser campeón. Premio en estatus (la corona), no en dinero.
//
// Solo lectura/agregación (cliente admin). El staff/propietario queda excluido
// igual que en el resto de rankings. Best-effort: si el ledger falla, champions=[].

import { NextResponse } from "next/server";
import { getWeeklyCoinChampions } from "@/lib/economy/ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit")) || 10));
  const days = Math.max(1, Math.min(30, Number(url.searchParams.get("days")) || 7));

  const champions = await getWeeklyCoinChampions(days, limit);

  return NextResponse.json({ champions, days }, { headers: { "Cache-Control": "no-store" } });
}

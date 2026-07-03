// src/app/api/ligas/wallet/route.ts
//
// GET /api/ligas/wallet -> { authed, coins }
// Saldo de Fútcoins del usuario logueado, para pintar el distintivo en las
// pantallas de Zona de Ligas. Sin sesión: { authed:false, coins:0 } (no 401) para
// que la UI degrade sin ruido.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getWalletBalance } from "@/lib/economy/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authed: false, coins: 0 }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const coins = await getWalletBalance(user.id);
  return NextResponse.json({ authed: true, coins }, { headers: { "Cache-Control": "private, no-store" } });
}

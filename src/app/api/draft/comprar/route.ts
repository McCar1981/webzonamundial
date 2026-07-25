// src/app/api/draft/comprar/route.ts
//
// POST /api/draft/comprar  { item: "reroll" | "ojeador" | "partida" }
//
// Sumideros de Fútcoins del Draft de Ligas. El Draft era el único módulo del
// universo que SOLO imprimía moneda: se ganaban Fútcoins partida tras partida
// sin un sitio donde gastarlas dentro del propio juego, así que la moneda no
// significaba nada ahí y el tope diario Free expulsaba al usuario en vez de
// ofrecerle un escalón intermedio antes de la suscripción anual.
//
// El cobro es SERVER-AUTHORITATIVE: el precio sale del catálogo único
// (lib/economy/spend.ts) y se cobra por la puerta única spendCoins (wallet.ts),
// que es atómica y nunca deja el saldo negativo. El cliente NUNCA manda importes.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { spendCoins } from "@/lib/economy/wallet";
import {
  DRAFT_REROLL_EXTRA,
  DRAFT_OJEADOR,
  DRAFT_PARTIDA_EXTRA,
} from "@/lib/economy/spend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRECIOS: Record<string, { cost: number; label: string }> = {
  reroll: { cost: DRAFT_REROLL_EXTRA, label: "Re-tirada extra" },
  ojeador: { cost: DRAFT_OJEADOR, label: "Ojeador" },
  partida: { cost: DRAFT_PARTIDA_EXTRA, label: "Partida extra" },
};

export async function POST(req: Request) {
  let body: { item?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const item = String(body.item || "");
  const precio = PRECIOS[item];
  if (!precio) {
    return NextResponse.json({ error: "item_desconocido" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const spend = await spendCoins(user.id, precio.cost);
  if (!spend.ok) {
    return NextResponse.json(
      { error: "saldo_insuficiente", coins: spend.coins, cost: precio.cost },
      { status: 402 }
    );
  }

  return NextResponse.json({
    ok: true,
    item,
    label: precio.label,
    cost: precio.cost,
    coins: spend.coins,
  });
}

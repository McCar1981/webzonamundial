// src/app/api/modo-carrera/narrativa/refill/route.ts
//
// POST /api/modo-carrera/narrativa/refill → compra una RECARGA de cupo de
// narrativa IA con Fútcoins. Es un sumidero más de la economía única: cobra por
// la puerta única (spendCoins) y, solo si el cobro tuvo éxito, amplía el cupo IA
// del día. Si ampliar el cupo falla (KV caído), devuelve las Fútcoins.
//
// Requiere sesión: solo un usuario autenticado tiene billetera. El Pase DT ya
// tiene IA ilimitada, así que no necesita (ni debe) recargar.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isPaseDT } from "@/lib/pasedt/entitlement";
import { spendCoins, grantCoins } from "@/lib/economy/wallet";
import { addNarrativeBonus, REFILL_GENERATIONS } from "@/lib/modo-carrera/narrative-quota";
import { CAREER_NARRATIVE_REFILL } from "@/lib/economy/spend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  // El Pase DT ya tiene IA ilimitada: recargar no tendría sentido.
  if (user.email && (await isPaseDT(user.email, user.id))) {
    return NextResponse.json({ ok: false, error: "already_unlimited" }, { status: 400 });
  }

  const spent = await spendCoins(user.id, CAREER_NARRATIVE_REFILL);
  if (!spent.ok) {
    return NextResponse.json(
      { ok: false, error: "insufficient_coins", coins: spent.coins, price: CAREER_NARRATIVE_REFILL },
      { status: 402 },
    );
  }

  const added = await addNarrativeBonus(user.id, REFILL_GENERATIONS);
  if (added === 0) {
    // No se pudo ampliar el cupo: devolvemos las Fútcoins (no cobrar sin entregar).
    await grantCoins(user.id, CAREER_NARRATIVE_REFILL, 0, { seasonXp: false }).catch(() => {});
    return NextResponse.json({ ok: false, error: "refill_failed", coins: spent.coins + CAREER_NARRATIVE_REFILL }, { status: 503 });
  }

  return NextResponse.json(
    { ok: true, coins: spent.coins, added, price: CAREER_NARRATIVE_REFILL },
    { headers: { "Cache-Control": "no-store" } },
  );
}

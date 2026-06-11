// POST /api/notifications/push/claim-reward
//
// Otorga Fútcoins UNA sola vez por usuario al activar las notificaciones push.
// Idempotente vía push_notification_claims (PK user_id): si ya reclamó, no
// vuelve a abonar (no farmeable activando/desactivando). Lo llaman los puntos
// de activación (lobby, onboarding, perfil, amistosos, banner) tras suscribir.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { grantCoins } from "@/lib/economy/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PUSH_REWARD_COINS = 25;
export const PUSH_REWARD_XP = 10;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    // Anónimo: no hay a quién premiar. No es error para el cliente.
    return NextResponse.json({ ok: true, alreadyClaimed: false, coins: 0 });
  }

  const admin = adminClient();

  // 1) Reclamar el claim de forma atómica: insertar y ver si fue fila NUEVA.
  const { data: inserted, error: insertErr } = await admin
    .from("push_notification_claims")
    .upsert(
      { user_id: user.id, coins: PUSH_REWARD_COINS, xp: PUSH_REWARD_XP },
      { onConflict: "user_id", ignoreDuplicates: true },
    )
    .select("user_id");

  if (insertErr) {
    console.error("[push/claim-reward] insert failed:", insertErr.message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  // Ya había reclamado → no abonar de nuevo.
  if (!inserted || inserted.length === 0) {
    return NextResponse.json({ ok: true, alreadyClaimed: true, coins: 0 });
  }

  // 2) Abonar (una única vez garantizado por el paso 1).
  try {
    const grant = await grantCoins(user.id, PUSH_REWARD_COINS, PUSH_REWARD_XP, { module: "otros" });
    return NextResponse.json({
      ok: true,
      alreadyClaimed: false,
      coins: grant.coinsAwarded,
      xp: grant.xpAwarded,
      balance: grant.coins,
    });
  } catch (err) {
    // Si el abono falla, deshacemos el claim para poder reintentar.
    await admin.from("push_notification_claims").delete().eq("user_id", user.id);
    console.error("[push/claim-reward] grant failed:", (err as Error).message);
    return NextResponse.json({ error: "grant_failed" }, { status: 500 });
  }
}

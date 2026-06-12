// src/app/api/draft/guardar/route.ts
//
// POST /api/draft/guardar
// Guarda un resultado de Draft Mundial y, si el usuario está autenticado,
// acredita Fútcoins + XP a la billetera única.
//
// Body: {
//   formacion: string,
//   estilo: string,
//   modo: string,
//   puntaje: number,
//   calificacion: string,
//   fuerza: number,
//   balance: number,
//   coherencia: number,
//   bonusEstilo: number,
//   equipo: Array<{posicion,nombre,seleccion,year,fuerza}>,
//   coins: number,   -- monedas a acreditar
//   xp: number       -- xp a acreditar
// }

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { grantCoins } from "@/lib/economy/wallet";
import { isPro } from "@/lib/pro/entitlement";
import { consumeDailyQuota } from "@/lib/pro/quota";
import { FREE_LIMITS } from "@/lib/pro/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "body_invalid" }, { status: 400 });
  }

  const {
    formacion,
    estilo,
    modo,
    puntaje,
    calificacion,
    fuerza,
    balance,
    coherencia,
    bonusEstilo,
    equipo,
    coins = 0,
    xp = 0,
  } = body;

  // Validaciones mínimas
  if (!formacion || !estilo || !modo || typeof puntaje !== "number") {
    return NextResponse.json({ error: "campos_requeridos" }, { status: 400 });
  }

  const admin = adminClient();

  // ── 1) Guardar resultado ────────────────────────────────────────────────
  // Si NO hay usuario autenticado, guardamos como anónimo (NULL user_id)
  // para tener estadísticas globales, pero NO se acreditan monedas.
  const { data: resultRow, error: resultErr } = await admin
    .from("draft_results")
    .insert({
      user_id: user?.id ?? null,
      formacion,
      estilo,
      modo,
      puntaje,
      calificacion,
      fuerza: fuerza ?? 0,
      balance: balance ?? 0,
      coherencia: coherencia ?? 0,
      bonus_estilo: bonusEstilo ?? 0,
      equipo: Array.isArray(equipo) ? equipo : [],
    })
    .select("id")
    .single();

  if (resultErr || !resultRow) {
    console.error("[draft/guardar] error insertando resultado:", resultErr);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const resultId = resultRow.id;

  // ── 1b) Tope diario Free (5 partidas/día). Pro: ilimitado. ─────────────
  // Consumimos una unidad por partida COMPLETADA. Si el Free ya agotó su cupo,
  // el resultado se guarda igual (estadística/ranking) pero NO se acreditan
  // monedas. La UI ya debería haber bloqueado el inicio; esto es la red de
  // seguridad server-side.
  let limiteAgotado = false;
  if (user) {
    const pro = await isPro(user.id, user.email);
    if (!pro) {
      const q = await consumeDailyQuota(user.id, "draft", FREE_LIMITS.draft.dailyGames);
      limiteAgotado = !q.allowed;
    }
  }

  // ── 2) Acreditar monedas (solo usuarios autenticados y dentro del tope) ─
  let grant: { coinsAwarded: number; xpAwarded: number } | null = null;

  if (user && !limiteAgotado && coins > 0) {
    // Idempotencia: un solo claim por resultado
    const { data: existingClaim } = await admin
      .from("draft_claims")
      .select("result_id")
      .eq("user_id", user.id)
      .eq("result_id", resultId)
      .maybeSingle();

    if (!existingClaim) {
      // Acreditar
      grant = await grantCoins(user.id, coins, xp, {
        module: "draft-mundial",
        seasonXp: true,
      });

      // Marcar como cobrado
      await admin.from("draft_claims").insert({
        user_id: user.id,
        result_id: resultId,
        coins: grant.coinsAwarded,
        xp: grant.xpAwarded,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    resultId,
    anónimo: !user,
    limiteAgotado,
    grant: grant
      ? { coins: grant.coinsAwarded, xp: grant.xpAwarded }
      : null,
  });
}

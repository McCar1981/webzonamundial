// src/app/api/draft/guardar/route.ts
//
// POST /api/draft/guardar
// Requiere sesión: guarda un resultado de Draft Mundial y acredita
// Fútcoins + XP a la billetera única (mismo patrón que fantasy y modo-carrera).
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  // draft_results.user_id es NOT NULL (igual que fantasy y modo-carrera): el
  // guardado exige sesión. Sin usuario no se persiste nada ni se acreditan monedas.
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
  const { data: resultRow, error: resultErr } = await admin
    .from("draft_results")
    .insert({
      user_id: user.id,
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

  // ── 2) Acreditar monedas ───────────────────────────────────────────────
  let grant: { coinsAwarded: number; xpAwarded: number } | null = null;

  if (coins > 0) {
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
    grant: grant
      ? { coins: grant.coinsAwarded, xp: grant.xpAwarded }
      : null,
  });
}

// src/app/api/draft/logros/route.ts
//
// POST /api/draft/logros  { ids: string[] }
// Persiste en SERVIDOR los logros del Draft que el cliente acaba de desbloquear
// y acredita sus Fútcoins UNA sola vez por logro.
//
// Antes los logros vivían en localStorage: se borraban al cambiar de móvil
// (habitual en gama media), no pagaban nada y nadie más los veía. Ahora la
// tabla draft_achievements (migración 2026-56) los hace persistentes y con
// recompensa, con el mismo patrón idempotente de draft_claims.
//
// El pago es SERVER-AUTHORITATIVE: el cliente manda qué ids desbloqueó, pero el
// importe sale de este catálogo, no del cliente. Fail-soft: si la tabla aún no
// existe (migración sin aplicar), responde silencioso sin romper la partida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { grantCoins } from "@/lib/economy/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Recompensa por logro (Fútcoins, XP). Solo se pagan ids de este catálogo.
const REWARDS: Record<string, { coins: number; xp: number }> = {
  "primer-draft": { coins: 10, xp: 10 },
  "draft-experto": { coins: 20, xp: 15 },
  "draft-maestro": { coins: 35, xp: 25 },
  "leyenda-viva": { coins: 60, xp: 50 },
  "arquitecto": { coins: 25, xp: 15 },
  "contra-el-tiempo": { coins: 25, xp: 15 },
  // Estos 4 estaban en LOGROS (logros.ts) pero NO en REWARDS: el filtro
  // `x in REWARDS` los descartaba, así que se desbloqueaban en el cliente pero
  // nunca se persistían ni pagaban. Importes acordes a su dificultad.
  "de-memoria": { coins: 40, xp: 30 },
  "equilibrista": { coins: 30, xp: 20 },
  "historiador": { coins: 30, xp: 20 },
  "muralla": { coins: 50, xp: 40 },
};

export async function POST(req: Request) {
  const noStore = { headers: { "Cache-Control": "private, no-store" } };
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, authed: false }, noStore);

  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids)
    ? body.ids.filter((x: unknown): x is string => typeof x === "string" && x in REWARDS).slice(0, 20)
    : [];
  if (ids.length === 0) return NextResponse.json({ ok: true, nuevos: [] }, noStore);

  const admin = adminClient();

  // Insert idempotente: ignoreDuplicates hace que .select() devuelva SOLO las
  // filas realmente nuevas → esas, y solo esas, se pagan.
  const rows = ids.map((id) => ({
    user_id: user.id,
    achievement_id: id,
    coins: REWARDS[id].coins,
    xp: REWARDS[id].xp,
  }));

  const { data: inserted, error } = await admin
    .from("draft_achievements")
    .upsert(rows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true })
    .select("achievement_id,coins,xp");

  if (error) {
    // 42P01 = tabla inexistente → migración 2026-56 sin aplicar. No es error
    // del usuario: la partida sigue, los logros se reintentarán la próxima vez.
    if (error.code === "42P01") return NextResponse.json({ ok: false, migrated: false }, noStore);
    console.error("[draft/logros] error:", error);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500, ...noStore });
  }

  const nuevos = inserted ?? [];
  let coinsTotal = 0;
  let xpTotal = 0;
  for (const r of nuevos) {
    coinsTotal += r.coins ?? 0;
    xpTotal += r.xp ?? 0;
  }
  if (coinsTotal > 0 || xpTotal > 0) {
    await grantCoins(user.id, coinsTotal, xpTotal, { module: "draft-mundial", seasonXp: true });
  }

  return NextResponse.json(
    { ok: true, nuevos: nuevos.map((r) => r.achievement_id), coins: coinsTotal, xp: xpTotal },
    noStore
  );
}

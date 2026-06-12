// src/app/api/draft/estado/route.ts
//
// GET /api/draft/estado
// Estado del jugador para gating del límite diario de Draft Mundial.
// Free: 5 partidas/día (FREE_LIMITS.draft.dailyGames). Pro: ilimitado.
//
// Devuelve siempre 200 (incluso anónimo) para que la UI decida sin tratar el
// caso como error. El anónimo no tiene cuota servidor → la UI lo cuenta en
// localStorage como tope blando que empuja al registro.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isPro } from "@/lib/pro/entitlement";
import { peekDailyQuota } from "@/lib/pro/quota";
import { FREE_LIMITS } from "@/lib/pro/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITE = FREE_LIMITS.draft.dailyGames;

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { anon: true, isPro: false, limite: LIMITE },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const pro = await isPro(user.id, user.email);
  if (pro) {
    return NextResponse.json(
      { anon: false, isPro: true, limite: null, restantes: null, usadas: 0, agotado: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const q = await peekDailyQuota(user.id, "draft", LIMITE);
  return NextResponse.json(
    { anon: false, isPro: false, limite: LIMITE, restantes: q.remaining, usadas: q.used, agotado: q.exhausted },
    { headers: { "Cache-Control": "no-store" } },
  );
}

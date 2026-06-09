// src/app/api/predictions/me/route.ts
//
// GET /api/predictions/me → resumen de gamificación del usuario (nivel/XP,
// monedas, racha, logros, reto diario, flash multiplier, boosts). Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getGamificationSummary } from "@/lib/predictions/gamification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const summary = await getGamificationSummary(user.id);
  // no-store: el saldo de Fútcoins/XP cambia tras cada partida. Sin esto el
  // navegador cachea la respuesta y "Tu progreso" + el chip quedan congelados en
  // un valor viejo (p. ej. 0) aunque el abono ya esté en profiles. Igual que el
  // ranking, esta lectura debe ser siempre fresca.
  return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
}

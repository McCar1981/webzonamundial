// src/app/api/predictions/mine/route.ts
//
// GET /api/predictions/mine → resumen ligero de las predicciones del usuario por
// partido (match_id → nº de tipos predichos), para marcar las cards del tablero
// como "Jugar" / "Pendiente" / "Ya predicho". Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { predictedCountsByUser, getMyRecentResolvedMatches } from "@/lib/predictions/store";
import { PREDICTION_TYPES } from "@/lib/predictions/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [counts, recentResults] = await Promise.all([
    predictedCountsByUser(user.id),
    getMyRecentResolvedMatches(user.id, 5),
  ]);
  // FIX 5: conteo de predicciones del usuario → no cachear en el navegador.
  return NextResponse.json(
    { counts, types_total: PREDICTION_TYPES.length, recent_results: recentResults },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

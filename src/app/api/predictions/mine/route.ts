// src/app/api/predictions/mine/route.ts
//
// GET /api/predictions/mine → resumen ligero de las predicciones del usuario por
// partido (match_id → nº de tipos predichos), para marcar las cards del tablero
// como "Jugar" / "Pendiente" / "Ya predicho". Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { myMatchScores, getMyRecentResolvedMatches } from "@/lib/predictions/store";
import { PREDICTION_TYPES } from "@/lib/predictions/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [scores, recentResults] = await Promise.all([
    myMatchScores(user.id),
    getMyRecentResolvedMatches(user.id, 5),
  ]);
  // counts (nº de tipos jugados por partido) derivado de scores → sin consulta extra.
  const counts: Record<string, number> = {};
  for (const [mid, s] of Object.entries(scores)) counts[mid] = s.total;
  // FIX 5: datos del propio usuario → no cachear en el navegador.
  return NextResponse.json(
    { counts, types_total: PREDICTION_TYPES.length, recent_results: recentResults, scores },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

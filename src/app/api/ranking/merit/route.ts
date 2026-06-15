// src/app/api/ranking/merit/route.ts
//
// GET /api/ranking/merit -> ranking PAY-NEUTRAL del GRAN PREMIO: top por TASA DE
// ACIERTO de predicciones (correct/total) con un minimo de intentos. Pagar el
// Pase NO da ventaja aqui (predecir mas no sube tu %), asi que el premio en
// metalico no se "compra" -> concurso de habilidad, no juego de azar.
//
// Endpoint SEPARADO del ranking global por saldo (/api/ranking): el saldo sigue
// mostrando "como va la gente" en general; el premio cuelga solo de este.

import { NextResponse } from "next/server";
import { aggregateAccuracy } from "@/lib/predictions/leaderboard-agg";
import { adminClient } from "@/lib/predictions/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Minimo de predicciones resueltas para entrar al Gran Premio (un solo sitio).
const MIN_N = 20;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(20, Number(url.searchParams.get("limit")) || 3));

  const agg = await aggregateAccuracy(MIN_N, limit);
  if (!agg.length) {
    return NextResponse.json({ entries: [], minN: MIN_N }, { headers: { "Cache-Control": "no-store" } });
  }

  // Hidratar perfiles (nombre/avatar/pais) de los del top, en una sola consulta.
  const admin = adminClient();
  const ids = agg.map((a) => a.user_id);
  const { data: profs } = await admin
    .from("profiles")
    .select("id,username,avatar_url,country")
    .in("id", ids);
  const byId = new Map(
    ((profs ?? []) as { id: string; username: string | null; avatar_url: string | null; country: string | null }[]).map((p) => [p.id, p]),
  );

  const entries = agg.map((a, i) => {
    const p = byId.get(a.user_id);
    return {
      rank: i + 1,
      userId: a.user_id,
      name: p?.username ?? null,
      avatarUrl: p?.avatar_url ?? null,
      country: p?.country ?? null,
      pct: a.pct,
      total: a.total,
      correct: a.correct,
    };
  });

  return NextResponse.json({ entries, minN: MIN_N }, { headers: { "Cache-Control": "no-store" } });
}

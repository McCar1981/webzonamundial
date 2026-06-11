// src/app/api/draft/me/route.ts
//
// GET /api/draft/me
// Devuelve los resultados del usuario autenticado + su posición en el ranking.
// Requiere sesión.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 10));

  // ── 1) Mis últimos resultados ──────────────────────────────────────────
  const { data: results, error: resultsErr } = await admin
    .from("draft_results")
    .select("id,formacion,estilo,modo,puntaje,calificacion,fuerza,balance,coherencia,bonus_estilo,equipo,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (resultsErr) {
    console.error("[draft/me] error resultados:", resultsErr);
  }

  // ── 2) Mi mejor puntaje ────────────────────────────────────────────────
  const { data: best } = await admin
    .from("draft_results")
    .select("puntaje,calificacion")
    .eq("user_id", user.id)
    .order("puntaje", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── 3) Mi posición en el ranking ───────────────────────────────────────
  const { data: rankData } = await admin.rpc("draft_user_rank", {
    p_uid: user.id,
    p_period: "all",
  });

  const rank = Array.isArray(rankData) && rankData.length > 0 ? rankData[0] : null;

  // ── 4) Total de partidas jugadas ───────────────────────────────────────
  const { count: totalGames } = await admin
    .from("draft_results")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return NextResponse.json({
    results: results ?? [],
    best: best ?? null,
    rank: rank ?? null,
    totalGames: totalGames ?? 0,
  }, { headers: { "Cache-Control": "no-store" } });
}

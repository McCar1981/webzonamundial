// src/app/api/draft/ranking/route.ts
//
// GET /api/draft/ranking?limit=50&period=all
// Ranking global de Draft Mundial por mejor puntaje.
//
// Query:
//   · limit:  cuántos entries (default 50, máx 200)
//   · period: 'week' | 'month' | 'all' (default 'all')

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/predictions/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const period = ["week", "month"].includes(url.searchParams.get("period") || "")
    ? (url.searchParams.get("period") as "week" | "month")
    : "all";
  // Ranking POR LIGA (migración 2026-55): ?liga=laliga filtra la tabla a esa
  // competición. Sin liga = global, como siempre.
  const ligaRaw = url.searchParams.get("liga");
  const liga = ligaRaw && /^[a-z0-9-]{2,40}$/.test(ligaRaw) ? ligaRaw : null;

  const admin = adminClient();

  // Overload de 3 args (2026-55). Si la migración aún no está aplicada, esa
  // firma no existe → se reintenta con la de 2 args (global), fail-soft.
  let { data, error } = await admin.rpc("draft_ranking", {
    p_limit: limit,
    p_period: period,
    p_liga: liga,
  });
  if (error && (error.code === "PGRST202" || /function .*draft_ranking/.test(error.message || ""))) {
    ({ data, error } = await admin.rpc("draft_ranking", { p_limit: limit, p_period: period }));
  }

  if (error) {
    console.error("[draft/ranking] error:", error);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json(
    { entries: data ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}

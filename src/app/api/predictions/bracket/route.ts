// src/app/api/predictions/bracket/route.ts
//
// GET  /api/predictions/bracket → bracket guardado del usuario + su puntuación.
// PUT  /api/predictions/bracket → guarda/actualiza el bracket del usuario.
// Auth requerida. El borrador lo gestiona el propio usuario (RLS); la puntuación
// la calcula el backend al graduar contra los resultados reales.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getUserBracket, getUserBracketScore, saveUserBracket } from "@/lib/predictions/bracket-store";
import { maxBracketScore } from "@/lib/bracket/scoring";
import type { Pick } from "@/lib/bracket/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PICKS = 104;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [bracket, score] = await Promise.all([
    getUserBracket(user.id),
    getUserBracketScore(user.id),
  ]);
  return NextResponse.json({ bracket, score, max_score: maxBracketScore() });
}

function isValidPicks(v: unknown): v is Record<string, Pick> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const entries = Object.entries(v as Record<string, unknown>);
  if (entries.length === 0 || entries.length > MAX_PICKS) return false;
  for (const [, p] of entries) {
    if (!p || typeof p !== "object") return false;
    const pk = p as Record<string, unknown>;
    if (typeof pk.scoreA !== "number" || typeof pk.scoreB !== "number") return false;
    if (pk.winner !== null && typeof pk.winner !== "string") return false;
  }
  return true;
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { picks?: unknown; champion?: unknown; total_goals?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  if (!isValidPicks(body.picks)) {
    return NextResponse.json({ error: "invalid_picks", message: "Faltan predicciones o el formato no es válido" }, { status: 400 });
  }
  const champion = body.champion == null ? null : String(body.champion);
  const totalGoals = Number.isFinite(Number(body.total_goals)) ? Math.max(0, Math.round(Number(body.total_goals))) : 0;

  await saveUserBracket(user.id, body.picks, champion, totalGoals);
  return NextResponse.json({ ok: true, saved_at: new Date().toISOString() });
}

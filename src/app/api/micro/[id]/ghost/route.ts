// POST /api/micro/[id]/ghost
//
// Modo Fantasma 👻: jugar una micro YA RESUELTA a toro pasado (replay/práctica).
// Devuelve al instante si acertaste y los puntos a ×0.5. No afecta tu racha real.
// Body: { option }.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { respondGhostMicro } from "@/lib/micro/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { option?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.option) return NextResponse.json({ error: "missing_option" }, { status: 400 });

  const result = await respondGhostMicro(user.id, params.id, body.option);
  if (!result.ok) {
    const code = result.error === "not_found" ? 404 : result.error === "already_played" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status: code });
  }
  return NextResponse.json({
    ok: true,
    is_correct: result.is_correct,
    correct_option: result.correct_option,
    points: result.points,
  }, { status: 201 });
}

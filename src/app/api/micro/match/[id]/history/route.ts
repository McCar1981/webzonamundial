// GET /api/micro/match/[id]/history
//
// Historial de micro-predicciones del partido (resueltas y abiertas). Si hay
// sesión, anota la opción del usuario y si acertó, para pintar su recorrido.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMatchMicroHistory, myMicroResponses } from "@/lib/micro/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const matchId = params.id;
  const micros = await getMatchMicroHistory(matchId);

  const user = await getCurrentUser();
  const myByMicro = new Map<string, { option: string; correct: boolean | null; points: number | null }>();
  if (user) {
    const mine = await myMicroResponses(user.id, matchId);
    for (const r of mine) {
      myByMicro.set(r.micro_id, { option: r.selected_option, correct: r.is_correct, points: r.points_earned });
    }
  }

  return NextResponse.json({
    match_id: matchId,
    micros: micros.map((m) => ({
      id: m.id,
      kind: m.kind,
      category: m.category,
      emoji: m.trigger_data?.emoji ?? "⚡",
      question: m.question,
      options: m.options,
      status: m.status,
      correct_option: m.correct_option,
      base_points: m.base_points,
      open_minute: m.open_minute,
      activated_at: m.activated_at,
      resolved_at: m.resolved_at,
      mine: myByMicro.get(m.id) ?? null,
    })),
  });
}

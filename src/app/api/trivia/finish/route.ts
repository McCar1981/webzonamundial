// src/app/api/trivia/finish/route.ts
//
// Cierra una sesión: aplica bonus de horario (early bird / night owl) y de día
// perfecto, registra el resultado en stats + leaderboard y borra la sesión.
// Identidad: usuario Supabase si hay sesión, si no un anonId del cliente.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  deleteSession,
  getSession,
  recordSession,
} from "@/lib/trivia/store";
import { timeBonusMultiplier } from "@/lib/trivia/types";
import type { SessionResult } from "@/lib/trivia/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { sessionId?: string; name?: string; anonId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.sessionId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const session = await getSession(body.sessionId);
  if (!session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }
  if (session.finished) {
    return NextResponse.json({ error: "already_finished" }, { status: 409 });
  }

  // Identidad
  let userId = "";
  let name = (body.name || "").trim().slice(0, 24);
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      if (!name) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();
        name = (profile?.username as string) || user.email?.split("@")[0] || "Jugador";
      }
    }
  } catch {
    /* sin sesión supabase → anon */
  }
  if (!userId) {
    userId = (body.anonId || "").trim().slice(0, 40);
    if (!userId) {
      // No hay identidad: cerramos la sesión pero no registramos en ranking.
      session.finished = true;
      await deleteSession(session.id);
      return NextResponse.json({
        recorded: false,
        points: session.points,
        correct: session.correct,
        answered: session.answered.length,
        bestStreak: session.bestStreak,
      });
    }
    name = name || "Anónimo";
  }

  // Bonus de horario + día perfecto
  const { mult, bonus } = timeBonusMultiplier(new Date());
  const answered = session.answered.length;
  const perfectDay = answered > 0 && session.correct === answered;
  let finalPoints = Math.round(session.points * mult);
  if (perfectDay) finalPoints += 50;

  const result: SessionResult = {
    mode: session.mode,
    date: session.date,
    answered,
    correct: session.correct,
    points: finalPoints,
    bestStreak: session.bestStreak,
    avgResponseMs: answered > 0 ? Math.round(session.responseMsSum / answered) : undefined,
    survival: session.mode === "muerte-subita" ? session.correct : undefined,
  };

  session.finished = true;
  const stats = await recordSession(userId, name, result);
  await deleteSession(session.id);

  return NextResponse.json({
    recorded: true,
    points: finalPoints,
    basePoints: session.points,
    timeBonus: bonus,
    timeBonusMult: mult,
    perfectDay,
    correct: session.correct,
    answered,
    bestStreak: session.bestStreak,
    survival: result.survival ?? null,
    stats,
  });
}

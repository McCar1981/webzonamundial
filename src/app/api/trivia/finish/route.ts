// src/app/api/trivia/finish/route.ts
//
// Cierra una sesión: aplica bonus de horario (early bird / night owl) y de día
// perfecto, registra el resultado en stats + leaderboard y borra la sesión.
// Identidad: usuario Supabase si hay sesión, si no un anonId del cliente.

import { NextResponse } from "next/server";
import {
  addSeenIds,
  deleteSession,
  getSession,
  recordSession,
} from "@/lib/trivia/store";
import { resolveIdentity } from "@/lib/trivia/identity";
import { timeBonusMultiplier } from "@/lib/trivia/types";
import type { SessionResult } from "@/lib/trivia/types";

/** Quita el sufijo "-rN" que añade repeatToLength para volver al id base. */
function baseId(id: string): string {
  return id.replace(/-r\d+$/, "");
}

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
  const { userId, name } = await resolveIdentity(body.name, body.anonId);

  // Marca como vistas las preguntas mostradas (anti-repetición), aunque no se
  // registre en ranking. Se usa el id base (sin sufijo de repetición).
  if (userId) {
    const seenIds = [...new Set(session.questions.map((q) => baseId(q.id)))];
    await addSeenIds(userId, seenIds);
  }

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

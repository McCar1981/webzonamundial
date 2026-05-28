// src/app/api/trivia/answer/route.ts
//
// Responde una pregunta de una sesión. El servidor es la fuente de la verdad:
// determina si es correcta, calcula puntos (base × racha × rapidez) y actualiza
// el estado de la sesión. El cliente nunca conoce la respuesta de antemano.

import { NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/trivia/store";
import {
  BASE_POINTS,
  speedMultiplier,
  streakMultiplier,
} from "@/lib/trivia/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    sessionId?: string;
    questionId?: string;
    choice?: number;
    responseMs?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { sessionId, questionId } = body;
  const choice = Number(body.choice);
  const responseMs = Math.max(0, Number(body.responseMs) || 0);

  if (!sessionId || !questionId || !Number.isInteger(choice)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const session = await getSession(sessionId);
  if (!session || session.finished) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }
  if (session.answered.includes(questionId)) {
    return NextResponse.json({ error: "already_answered" }, { status: 409 });
  }

  const q = session.questions.find((x) => x.id === questionId);
  if (!q) {
    return NextResponse.json({ error: "question_not_found" }, { status: 404 });
  }

  const correct = choice === q.correctIndex;
  let points = 0;
  if (correct) {
    session.streak += 1;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
    const base = BASE_POINTS[q.difficulty];
    const streakMult = streakMultiplier(session.streak);
    const speedMult =
      session.mode === "relampago" ? speedMultiplier(responseMs) : 1;
    points = Math.round(base * streakMult * speedMult);
    session.correct += 1;
  } else {
    session.streak = 0;
  }

  session.answered.push(questionId);
  session.points += points;
  session.responseMsSum += responseMs;
  await saveSession(session);

  return NextResponse.json({
    correct,
    correctIndex: q.correctIndex,
    explanation: q.explanation ?? null,
    points,
    streak: session.streak,
    totalPoints: session.points,
    // En muerte súbita, un fallo termina la partida.
    gameOver: session.mode === "muerte-subita" && !correct,
  });
}

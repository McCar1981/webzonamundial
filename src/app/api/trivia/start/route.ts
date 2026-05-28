// src/app/api/trivia/start/route.ts
//
// Inicia una partida. Crea una sesión en servidor (con las respuestas) y
// devuelve al cliente las preguntas SIN las respuestas correctas.

import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/trivia/generator";
import { getDailySet, saveDailySet, saveSession, todayUTC } from "@/lib/trivia/store";
import { newSessionId, pickQuestions, toClientQuestion } from "@/lib/trivia/play";
import type { DailyTriviaSet, ServerSession, TriviaMode } from "@/lib/trivia/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODES: TriviaMode[] = ["diaria", "relampago", "muerte-subita"];

export async function POST(req: Request) {
  let body: { mode?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const mode: TriviaMode = MODES.includes(body.mode as TriviaMode)
    ? (body.mode as TriviaMode)
    : "diaria";

  const date = todayUTC();
  let set = await getDailySet(date);

  // Fallback: si el cron aún no generó el set de hoy, lo generamos al vuelo
  // (la primera visita del día lo dispara). Idempotente para el resto.
  if (!set || set.questions.length < 10) {
    const questions = await generateQuestions(18);
    if (questions.length < 5) {
      return NextResponse.json(
        { error: "trivia_unavailable", message: "No hay preguntas disponibles ahora." },
        { status: 503 },
      );
    }
    set = { date, generatedAt: new Date().toISOString(), questions } as DailyTriviaSet;
    await saveDailySet(set);
  }

  const questions = pickQuestions(set, mode);
  const session: ServerSession = {
    id: newSessionId(),
    mode,
    date,
    questions,
    answered: [],
    correct: 0,
    points: 0,
    streak: 0,
    bestStreak: 0,
    responseMsSum: 0,
    finished: false,
    startedAt: new Date().toISOString(),
  };
  await saveSession(session);

  return NextResponse.json({
    sessionId: session.id,
    mode,
    date,
    total: mode === "muerte-subita" ? null : questions.length,
    questions: questions.map(toClientQuestion),
  });
}

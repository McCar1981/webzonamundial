// src/app/api/trivia/start/route.ts
//
// Inicia una partida. Crea una sesión en servidor (con las respuestas) y
// devuelve al cliente las preguntas SIN las respuestas correctas.
//
// Las preguntas salen del BANCO ACUMULATIVO de preguntas verificadas (doble
// pase de IA), excluyendo las que este usuario YA ha visto (anti-repetición).
// Si el banco se queda corto, se generan más al vuelo (verificadas) y se
// acumulan; si el usuario ya jugó todo el banco, se recicla su historial.

import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/trivia/generator";
import {
  addToBank,
  getQuestionBank,
  getSeenIds,
  resetSeen,
  saveSession,
  todayUTC,
} from "@/lib/trivia/store";
import { resolveIdentity } from "@/lib/trivia/identity";
import { newSessionId, pickQuestions, toClientQuestion } from "@/lib/trivia/play";
import { FALLBACK_QUESTIONS } from "@/data/trivia-fallback";
import type { ServerSession, TriviaMode, TriviaQuestion } from "@/lib/trivia/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODES: TriviaMode[] = ["diaria", "relampago", "muerte-subita"];

export async function POST(req: Request) {
  let body: { mode?: string; anonId?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const mode: TriviaMode = MODES.includes(body.mode as TriviaMode)
    ? (body.mode as TriviaMode)
    : "diaria";

  const { userId } = await resolveIdentity(body.name, body.anonId);

  // 1) Banco acumulativo. Se siembra con el banco verificado a mano la primera vez.
  let bank = await getQuestionBank();
  if (bank.length < FALLBACK_QUESTIONS.length) {
    await addToBank(FALLBACK_QUESTIONS);
    bank = await getQuestionBank();
  }

  // 2) Excluir lo que este usuario ya vio.
  const seen = await getSeenIds(userId);
  let pool: TriviaQuestion[] = bank.filter((q) => !seen.has(q.id));

  // 3) Si quedan pocas sin ver, generar más (verificadas) y acumular. Para
  // muerte-súbita basta un colchón menor: repeatToLength rellena la partida.
  const target = mode === "muerte-subita" ? 12 : 10;
  if (pool.length < target) {
    const avoid = bank.map((q) => q.question);
    const fresh = await generateQuestions(20, avoid);
    if (fresh.length > 0) {
      await addToBank(fresh);
      bank = await getQuestionBank();
      pool = bank.filter((q) => !seen.has(q.id));
    }
  }

  // 4) Si el usuario ya jugó TODO el banco, reciclar su historial.
  if (pool.length === 0) {
    await resetSeen(userId);
    pool = bank;
  }

  const questions = pickQuestions(pool, mode);
  const session: ServerSession = {
    id: newSessionId(),
    mode,
    date: todayUTC(),
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
    date: session.date,
    total: mode === "muerte-subita" ? null : questions.length,
    questions: questions.map(toClientQuestion),
  });
}

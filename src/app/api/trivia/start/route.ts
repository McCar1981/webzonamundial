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
import { isPro } from "@/lib/pro/entitlement";
import { consumeDailyQuota, consumeDailyQuotaUnits, peekDailyQuota } from "@/lib/pro/quota";
import { FREE_LIMITS, PRO_REQUIRED_CODE, type ProRequiredPayload } from "@/lib/pro/limits";
import { trackLimitHit } from "@/lib/pro/metrics";

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

  const { userId, authUserId } = await resolveIdentity(body.name, body.anonId);

  // ── Límites del plan Free ──
  // Diaria: FREE_LIMITS.trivia.dailyQuestions preguntas al día (acumulado).
  // Relámpago y Muerte Súbita: 1 partida al día cada uno. Pro = sin límites.
  // La cuota se ancla a la identidad de juego (auth o anonId). Sin identidad
  // (p. ej. la pregunta de muestra de la home, que no manda anonId) cae a un
  // cupo GLOBAL compartido y generoso — protege el gasto sin romper la demo
  // (mismo criterio que el cupo de invitados de la narrativa del Modo Carrera).
  const pro = authUserId ? await isPro(authUserId) : false;
  const isGuestGlobal = !userId;
  const quotaId = userId || "guest-global";
  const dailyQuestionsLimit = isGuestGlobal ? 500 : FREE_LIMITS.trivia.dailyQuestions;
  const runsLimit = isGuestGlobal ? 300 : FREE_LIMITS.trivia.dailyRunsOtherModes;
  let diariaRemaining: number | null = null;
  if (!pro) {
    if (mode === "diaria") {
      const peek = await peekDailyQuota(quotaId, "trivia-diaria", dailyQuestionsLimit);
      if (peek.exhausted) {
        trackLimitHit("trivia_daily");
        const payload: ProRequiredPayload = {
          error: `Has jugado tus ${FREE_LIMITS.trivia.dailyQuestions} preguntas diarias. Con Pro la trivia no tiene límite.`,
          code: PRO_REQUIRED_CODE,
          feature: "trivia_daily",
          limit: FREE_LIMITS.trivia.dailyQuestions,
        };
        return NextResponse.json(payload, { status: 403 });
      }
      diariaRemaining = peek.remaining;
    } else {
      const q = await consumeDailyQuota(quotaId, `trivia-${mode}`, runsLimit);
      if (!q.allowed) {
        trackLimitHit("trivia_runs");
        const payload: ProRequiredPayload = {
          error: "Ya jugaste tu partida diaria de este modo. Con Pro puedes jugar sin límite.",
          code: PRO_REQUIRED_CODE,
          feature: "trivia_runs",
          limit: FREE_LIMITS.trivia.dailyRunsOtherModes,
        };
        return NextResponse.json(payload, { status: 403 });
      }
    }
  }

  // 1) Banco acumulativo. Se siembra con el banco verificado a mano la primera vez.
  let bank = await getQuestionBank();
  if (bank.length < FALLBACK_QUESTIONS.length) {
    await addToBank(FALLBACK_QUESTIONS);
    bank = await getQuestionBank();
  }

  // 2) Excluir lo que este usuario ya vio.
  const seen = await getSeenIds(userId);
  let pool: TriviaQuestion[] = bank.filter((q) => !seen.has(q.id));

  // 3) Si no quedan preguntas sin ver suficientes para una partida completa,
  // reciclamos el historial de "visto" de este usuario y reusamos el banco.
  //
  // IMPORTANTE: aquí NO se generan preguntas nuevas. Generarlas implica una
  // llamada de IA + verificación (decenas de segundos) DENTRO del request: en
  // Vercel eso da timeout (504) y, peor, en el plan Free el cupo del día ya se
  // había descontado → el usuario perdía su partida sin jugar. El banco lo
  // alimenta el cron diario `generate-trivia`; aquí solo se sirve y se recicla.
  const target = mode === "muerte-subita" ? 12 : 10;
  if (pool.length < target) {
    await resetSeen(userId);
    pool = bank;
  }

  let questions = pickQuestions(pool, mode);
  // Free + diaria: la partida se recorta a las preguntas que le quedan hoy y
  // se descuentan del cupo al servirlas.
  if (diariaRemaining !== null) {
    questions = questions.slice(0, diariaRemaining);
    await consumeDailyQuotaUnits(quotaId, "trivia-diaria", dailyQuestionsLimit, questions.length);
  }
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
    lastTickAt: Date.now(),
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

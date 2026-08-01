// src/app/api/trivia/answer/route.ts
//
// Responde una pregunta de una sesión. El servidor es la fuente de la verdad:
// determina si es correcta, calcula puntos (base × racha × rapidez) y actualiza
// el estado de la sesión. El cliente nunca conoce la respuesta de antemano.

import { NextResponse } from "next/server";
import { claimAnswer, getSession, saveSession } from "@/lib/trivia/store";
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
  const clientMs = Math.max(0, Number(body.responseMs) || 0);

  if (!sessionId || !questionId || !Number.isInteger(choice)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const session = await getSession(sessionId);
  if (!session || session.finished || session.gameOver) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }
  if (session.answered.includes(questionId)) {
    return NextResponse.json({ error: "already_answered" }, { status: 409 });
  }

  const q = session.questions.find((x) => x.id === questionId);
  if (!q) {
    return NextResponse.json({ error: "question_not_found" }, { status: 404 });
  }

  // Reserva atómica de ESTA respuesta: un doble-submit de la misma pregunta
  // (timeout del timer que coincide con un clic, o doble clic) no puntúa dos veces.
  if (!(await claimAnswer(sessionId, questionId))) {
    return NextResponse.json({ error: "already_answered" }, { status: 409 });
  }

  // Tiempo de respuesta efectivo. Solo Relámpago usa el multiplicador de rapidez.
  //
  // El reloj del servidor mide de RESPUESTA a RESPUESTA, así que incluye el rato
  // que el jugador pasa leyendo la explicación de la anterior (el juego obliga a
  // pulsar "Siguiente" a mano). Antes se tomaba el MAYOR entre ese hueco y el
  // tiempo del cliente, restando solo 1,5 s: quien leía la explicación 20 s veía
  // su respuesta de 2 s contabilizada como 18,5 s. Perdía el multiplicador por
  // leer, y además le ensuciaba el tiempo medio y su mejor marca. Castigaba
  // justo al jugador atento.
  //
  // El cliente SÍ mide bien (arranca el cronómetro al pintar la pregunta), así
  // que se toma su valor y el reloj del servidor queda como TECHO: nadie puede
  // declarar menos tiempo del que... —al revés— nadie puede contar como propio
  // más tiempo del que de verdad ha pasado. Contra el cliente manipulado que
  // enviaría 0 para forzar el ×2 queda un suelo humano: nadie lee la pregunta y
  // responde en menos de 350 ms.
  let responseMs = clientMs;
  if (session.mode === "relampago") {
    const last = session.lastTickAt ?? Date.parse(session.startedAt);
    const serverGap = Math.max(0, Date.now() - last);
    const MIN_HUMANO_MS = 350;
    responseMs = Math.min(Math.max(clientMs, MIN_HUMANO_MS), serverGap || 60000, 60000);
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
    // Guardar la racha que se rompe: el comodín "Salvarracha" (revive de
    // Muerte Súbita) la restaura tal cual si el usuario paga.
    session.streakBeforeMiss = session.streak;
    session.streak = 0;
  }

  session.answered.push(questionId);
  session.points += points;
  session.responseMsSum += responseMs;
  // En Muerte Súbita, un fallo congela la partida en el servidor: así no se puede
  // seguir respondiendo (ignorando el gameOver del cliente) para inflar el récord.
  const gameOver = session.mode === "muerte-subita" && !correct;
  if (gameOver) session.gameOver = true;
  // Marca temporal para acotar el responseMs de la siguiente pregunta (Relámpago).
  session.lastTickAt = Date.now();
  await saveSession(session);

  return NextResponse.json({
    correct,
    correctIndex: q.correctIndex,
    explanation: q.explanation ?? null,
    points,
    streak: session.streak,
    totalPoints: session.points,
    gameOver,
  });
}

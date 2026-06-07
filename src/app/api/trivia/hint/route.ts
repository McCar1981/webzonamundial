// src/app/api/trivia/hint/route.ts
//
// POST /api/trivia/hint → compra una pista 50/50 con Fútcoins para la pregunta
// actual de una sesión. El servidor (que es el único que conoce la respuesta)
// descarta DOS opciones erróneas y devuelve sus índices. Es un sumidero de la
// economía única: cobra por la puerta única (spendCoins).
//
// Anti-abuso:
//   · Requiere sesión (solo un usuario autenticado tiene billetera).
//   · No se puede pedir pista de una pregunta YA respondida.
//   · La pista se memoriza en la sesión: re-pedirla NO vuelve a cobrar (devuelve
//     los mismos índices). Así un re-render o un doble clic no cobran dos veces.

import { NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/trivia/store";
import { getCurrentUser } from "@/lib/auth-helpers";
import { spendCoins } from "@/lib/economy/wallet";
import { TRIVIA_HINT_FIFTY } from "@/lib/economy/spend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { sessionId?: string; questionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { sessionId, questionId } = body;
  if (!sessionId || !questionId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
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

  // Ya comprada antes: devolvemos los mismos índices sin volver a cobrar.
  const cached = session.hints?.[questionId];
  if (cached) {
    return NextResponse.json({ ok: true, removed: cached, charged: false });
  }

  const spent = await spendCoins(user.id, TRIVIA_HINT_FIFTY);
  if (!spent.ok) {
    return NextResponse.json(
      { ok: false, error: "insufficient_coins", coins: spent.coins, price: TRIVIA_HINT_FIFTY },
      { status: 402 },
    );
  }

  // Dos opciones erróneas al azar (de las 3 incorrectas) para descartar.
  const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correctIndex);
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
  }
  const removed = wrong.slice(0, 2);

  session.hints = { ...(session.hints ?? {}), [questionId]: removed };
  await saveSession(session);

  return NextResponse.json({ ok: true, removed, charged: true, coins: spent.coins });
}

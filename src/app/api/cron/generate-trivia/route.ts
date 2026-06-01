// src/app/api/cron/generate-trivia/route.ts
//
// Cron diario: genera el set de preguntas de trivia del día con Claude y lo
// guarda en KV. Mismo patrón de auth que el resto de crons (Bearer CRON_SECRET
// o ?secret=). Idempotente: si ya existe el set de hoy y no se fuerza, no
// vuelve a llamar al modelo (ahorro de tokens).

import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/trivia/generator";
import { getDailySet, saveDailySet, todayUTC } from "@/lib/trivia/store";
import type { DailyTriviaSet } from "@/lib/trivia/types";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerOk = auth === `Bearer ${expected}`;
    const querySecret = new URL(req.url).searchParams.get("secret");
    if (!headerOk && querySecret !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const count = Math.min(
    30,
    Math.max(8, Number(url.searchParams.get("count")) || 30),
  );
  const date = todayUTC();

  const existing = await getDailySet(date);
  if (existing && existing.questions.length >= 10 && !force) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "ya existe el set de hoy",
      date,
      count: existing.questions.length,
    });
  }

  const questions = await generateQuestions(count);
  if (questions.length < 5) {
    return NextResponse.json(
      { ok: false, error: "generación insuficiente", got: questions.length },
      { status: 502 },
    );
  }

  const set: DailyTriviaSet = {
    date,
    generatedAt: new Date().toISOString(),
    questions,
  };
  await saveDailySet(set);

  try {
    revalidatePath("/trivia");
  } catch {
    /* noop */
  }

  return NextResponse.json({
    ok: true,
    date,
    count: questions.length,
  });
}

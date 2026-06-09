// src/app/api/cron/generate-trivia/route.ts
//
// Cron diario: genera preguntas de trivia con Claude (verificadas por doble
// pase) y las ACUMULA en el banco persistente. El banco crece cada día, así la
// trivia tiende a "infinita" sin repetir. Mismo patrón de auth que el resto de
// crons (Bearer CRON_SECRET o ?secret=).

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { recordHeartbeat } from "@/lib/ops/store";
import { generateQuestions } from "@/lib/trivia/generator";
import { addToBank, getQuestionBank } from "@/lib/trivia/store";
import { FALLBACK_QUESTIONS } from "@/data/trivia-fallback";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const denied = requireCron(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const count = Math.min(
    40,
    Math.max(8, Number(url.searchParams.get("count")) || 30),
  );

  // Siembra del banco con las preguntas verificadas a mano (la primera vez).
  let bank = await getQuestionBank();
  if (bank.length < FALLBACK_QUESTIONS.length) {
    await addToBank(FALLBACK_QUESTIONS);
    bank = await getQuestionBank();
  }

  // Genera preguntas nuevas evitando todo lo que ya hay en el banco.
  const avoid = bank.map((q) => q.question);
  const questions = await generateQuestions(count, avoid);
  const added = await addToBank(questions);
  const bankSize = (await getQuestionBank()).length;

  try {
    revalidatePath("/trivia");
  } catch {
    /* noop */
  }

  await recordHeartbeat("generate-trivia", true, { added, bankSize });

  return NextResponse.json({
    ok: true,
    generated: questions.length, // pasaron generación + verificación
    added, // nuevas (no duplicadas) que entraron al banco
    bankSize, // tamaño real del banco tras añadir
  });
}

// src/app/api/cron/score-brackets/route.ts
//
// Worker de puntuación de brackets. Gradúa todos los brackets guardados por los
// usuarios contra los resultados reales del torneo staged en KV
// (pred:bracket:actuals). Idempotente: recalcula y reescribe la puntuación.
//
// Auth idéntico al resto de crones: Authorization: Bearer ${CRON_SECRET}
// o ?secret=XXX como query.

import { NextResponse } from "next/server";
import { scoreAllBrackets } from "@/lib/predictions/bracket-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerOk = auth === `Bearer ${expected}`;
    const queryOk = new URL(req.url).searchParams.get("secret") === expected;
    if (!headerOk && !queryOk) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await scoreAllBrackets();
  return NextResponse.json({ ok: true, ...result });
}

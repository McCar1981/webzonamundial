// Cron endpoint (Mejora H): recordatorios de engagement del módulo Predicciones.
//
// Programación recomendada: `0 20 * * *` (20:00 UTC) — unas horas antes de la
// medianoche UTC, que es cuando la lógica de check-in da por rota la cadena del
// día. Avisa por push + email a quien tenga una racha de check-in en peligro.
//
// Auth: Vercel Cron manda Authorization: Bearer ${CRON_SECRET}. También se
// acepta ?secret=XXX para disparo manual de debug.

import { NextRequest, NextResponse } from "next/server";
import { runStreakReminders } from "@/lib/predictions/engagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerOk = auth === `Bearer ${expected}`;
    const queryOk = new URL(req.url).searchParams.get("secret") === expected;
    if (!headerOk && !queryOk) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const streak = await runStreakReminders();
    return NextResponse.json({ ok: true, streak });
  } catch (err) {
    console.error("[predictions-engagement] failed:", (err as Error).message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

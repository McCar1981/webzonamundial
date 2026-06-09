// Cron endpoint: recordatorio PRE-PARTIDO. Manda un push ~90 min antes del
// saque de cada partido del Mundial (ver src/lib/match-reminders.ts).
//
// Programación recomendada: cada 10 min (`*/10 * * * *`). La ventana de
// selección (±WINDOW_MINUTES) y el dedup en KV aseguran que cada partido avise
// una sola vez aunque las pasadas se solapen.
//
// Auth: Vercel Cron manda Authorization: Bearer ${CRON_SECRET}. También se
// acepta ?secret=XXX para disparo manual de debug.

import { NextRequest, NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { runMatchReminders } from "@/lib/match-reminders";
import { recordHeartbeat } from "@/lib/ops/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const denied = requireCron(req);
  if (denied) return denied;

  try {
    const reminders = await runMatchReminders();
    await recordHeartbeat("match-reminders", true, { reminders });
    return NextResponse.json({ ok: true, reminders });
  } catch (err) {
    console.error("[match-reminders] failed:", (err as Error).message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

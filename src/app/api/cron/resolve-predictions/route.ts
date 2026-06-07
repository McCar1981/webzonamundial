// src/app/api/cron/resolve-predictions/route.ts
//
// Worker de resolución. Recorre los partidos con predicciones sin resolver, y
// para los que ya han terminado y tienen un resultado oficial "staged" en KV,
// resuelve todas sus predicciones (puntúa, aplica bonus/multiplicador y detecta
// predicciones perfectas 8/8).
//
// Auth idéntico al resto de crones: Authorization: Bearer ${CRON_SECRET}
// o ?secret=XXX como query.
//
// Programado en vercel.json. Puede ejecutarse a mano (con el secret) sin riesgo:
// es idempotente — solo toca predicciones con resolved_at = null.

import { NextResponse } from "next/server";
import { recordHeartbeat } from "@/lib/ops/store";
import { getMatchMeta } from "@/lib/predictions/match-data";
import { getUnresolvedMatchIds, resolveMatch, type ResolveSummary } from "@/lib/predictions/store";
import { getStagedResult, clearStagedResult, resultStoreAvailable } from "@/lib/predictions/result-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Un partido se considera terminado pasadas ~2h15 desde el kickoff
// (90' + descanso + añadido + margen). Hasta entonces no se resuelve.
const FINISHED_AFTER_MS = 135 * 60_000;
// Margen para responder dentro del maxDuration aunque haya muchos partidos.
const TIME_BUDGET_MS = 55_000;

export async function GET(req: Request) {
  const startMs = Date.now();

  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerOk = auth === `Bearer ${expected}`;
    const queryOk = new URL(req.url).searchParams.get("secret") === expected;
    if (!headerOk && !queryOk) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!resultStoreAvailable()) {
    return NextResponse.json({ error: "kv_not_configured", message: "KV_REST_API_URL / KV_REST_API_TOKEN requeridos" }, { status: 500 });
  }

  const now = Date.now();
  const matchIds = await getUnresolvedMatchIds();

  const resolved: ResolveSummary[] = [];
  const notFinished: string[] = [];
  const awaitingResult: string[] = [];

  for (const matchId of matchIds) {
    if (Date.now() - startMs > TIME_BUDGET_MS) break; // continúa en la próxima pasada

    const meta = getMatchMeta(matchId);
    if (!meta?.kickoff_at) continue; // partido desconocido, lo ignoramos

    const finishedAt = new Date(meta.kickoff_at).getTime() + FINISHED_AFTER_MS;
    if (now < finishedAt) { notFinished.push(matchId); continue; }

    const result = await getStagedResult(matchId);
    if (!result) { awaitingResult.push(matchId); continue; }

    const summary = await resolveMatch(matchId, result);
    await clearStagedResult(matchId);
    resolved.push(summary);
  }

  await recordHeartbeat("resolve-predictions", true, { resolved: resolved.length });

  return NextResponse.json({
    ok: true,
    checked: matchIds.length,
    resolved_count: resolved.length,
    resolved,
    not_finished: notFinished,
    awaiting_result: awaitingResult,
    duration_ms: Date.now() - startMs,
  });
}

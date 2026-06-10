// src/app/api/cron/resolve-micro/route.ts
//
// Worker de resolución de MICRO-predicciones en vivo. A diferencia de
// resolve-predictions (que espera al final del partido), las micros se resuelven
// EN VIVO: en cuanto su ventana vence, se cierran y se pagan a partir de los
// eventos autoritativos del partido. Por eso este cron corre cada minuto.
//
// Para cada micro vencida agrupa por partido, obtiene el estado autoritativo
// (mismo que usan los live-picks: snapshot real de api-football o simulación) y
// liquida. Idempotente: settleMicro usa guardia de estado y resolved_at.
//
// Auth idéntico al resto de crones: Authorization: Bearer ${CRON_SECRET} o ?secret=.

import { NextResponse } from "next/server";
import {
  getDueMicros,
  settleMicro,
  repairOrphanResponses,
  matchesWithActiveMicroDuels,
  resolveMicroDuelsForMatch,
  type SettleSummary,
} from "@/lib/micro/store";
import { authoritativeState } from "@/lib/predictions/live-picks-store";
import { recordHeartbeat } from "@/lib/ops/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  const due = await getDueMicros();
  // Cachea el estado autoritativo por partido para no re-pedirlo por cada micro.
  const stateByMatch = new Map<string, Awaited<ReturnType<typeof authoritativeState>>>();
  const settled: SettleSummary[] = [];

  for (const micro of due) {
    if (Date.now() - startMs > TIME_BUDGET_MS) break;

    let state = stateByMatch.get(micro.match_id);
    if (state === undefined) {
      state = await authoritativeState(micro.match_id);
      stateByMatch.set(micro.match_id, state);
    }
    if (!state) continue; // sin datos del partido aún: reintenta en la próxima pasada
    // NUNCA liquidar con simulación: si la API/caché fallan, authoritativeState
    // degrada a "sim" y pagaríamos con eventos falsos. Reintenta en la próxima.
    if (state.source !== "live") continue;

    const summary = await settleMicro(micro, state.events, state.minute, state.finished);
    if (summary) settled.push(summary);
  }

  // ── Barrido de reparación: respuestas que un settle interrumpido (timeout,
  //    crash, tope de filas) dejó sin liquidar aunque su micro ya esté resuelta.
  //    Sin esto quedaban huérfanas PARA SIEMPRE (el cron no revisita resueltas). ──
  let repaired = 0;
  try {
    if (Date.now() - startMs < TIME_BUDGET_MS) repaired = await repairOrphanResponses();
  } catch (err) {
    console.error("[resolve-micro] repair sweep failed", (err as Error).message);
  }

  // ── Duelo en Vivo (Fase 2): resuelve los duelos cuyos partidos ya terminaron.
  //    Reusa la caché de estado por partido para no re-pedir. ──
  let duelsResolved = 0;
  try {
    const duelMatches = await matchesWithActiveMicroDuels();
    for (const matchId of duelMatches) {
      if (Date.now() - startMs > TIME_BUDGET_MS) break;
      let state = stateByMatch.get(matchId);
      if (state === undefined) {
        state = await authoritativeState(matchId);
        stateByMatch.set(matchId, state);
      }
      // Igual que el settle: el "final del partido" debe venir del feed real,
      // no de la duración de la simulación.
      if (state?.source === "live" && state.finished) duelsResolved += await resolveMicroDuelsForMatch(matchId);
    }
  } catch (err) {
    console.error("[resolve-micro] duel resolution failed", (err as Error).message);
  }

  await recordHeartbeat("resolve-micro", true, { due: due.length, settled: settled.length, repaired });

  return NextResponse.json({
    ok: true,
    due: due.length,
    settled_count: settled.length,
    settled,
    repaired,
    duels_resolved: duelsResolved,
    duration_ms: Date.now() - startMs,
  });
}

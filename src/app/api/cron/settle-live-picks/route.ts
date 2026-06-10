// src/app/api/cron/settle-live-picks/route.ts
//
// Liquidación de micro-picks EN VIVO con independencia del usuario.
// Auditoría predicciones-2026-06-10 (NP-24): antes, un live-pick ganador solo se
// resolvía y pagaba si el usuario volvía a abrir la vista del partido (única
// llamada a settleDuePicks). Si cerraba la pestaña, las Fútcoins quedaban a deber.
// Este cron recorre los picks pendientes vencidos y los liquida server-side, igual
// que resolve-micro hace con las micro-predicciones.
//
// Auth idéntico al resto de crones: Authorization: Bearer ${CRON_SECRET}.

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { recordHeartbeat } from "@/lib/ops/store";
import { adminClient } from "@/lib/predictions/admin";
import { authoritativeState, settleDuePicks } from "@/lib/predictions/live-picks-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TIME_BUDGET_MS = 55_000;

export async function GET(req: Request) {
  const startMs = Date.now();

  const denied = requireCron(req);
  if (denied) return denied;

  const admin = adminClient();
  // Todas las parejas (usuario, partido) con picks pendientes.
  const { data } = await admin
    .from("prediction_live_picks")
    .select("user_id, match_id")
    .eq("status", "pending");

  const rows = (data ?? []) as { user_id: string; match_id: string }[];

  // Agrupar usuarios por partido (calculamos el estado del partido una sola vez).
  const usersByMatch = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!usersByMatch.has(r.match_id)) usersByMatch.set(r.match_id, new Set());
    usersByMatch.get(r.match_id)!.add(r.user_id);
  }

  let settledMatches = 0;
  let skippedSim = 0;

  for (const [matchId, users] of usersByMatch) {
    if (Date.now() - startMs > TIME_BUDGET_MS) break; // sigue en la próxima pasada

    const state = await authoritativeState(matchId);
    if (!state) continue;
    // settleDuePicks ya ignora estados simulados; lo evitamos también aquí para
    // no recorrer usuarios en vano cuando el feed real no está disponible.
    if (state.source === "sim") { skippedSim++; continue; }

    for (const uid of users) {
      if (Date.now() - startMs > TIME_BUDGET_MS) break;
      await settleDuePicks(uid, matchId, state).catch((e) =>
        console.error(`[settle-live-picks] fallo liquidando ${uid}/${matchId}:`, e),
      );
    }
    settledMatches++;
  }

  await recordHeartbeat("settle-live-picks", true, { matches: settledMatches });

  return NextResponse.json({
    ok: true,
    pending_pairs: rows.length,
    matches_processed: settledMatches,
    matches_skipped_sim: skippedSim,
    duration_ms: Date.now() - startMs,
  });
}

// src/app/api/cron/stage-results/route.ts
//
// Puente AUTOMÁTICO feed real → resolución de Predicciones (cierra NP-03).
// Cada 2 min: para cada partido con predicciones pendientes cuyo feed real
// (api-football vía Match Center) diga FT/AET/PEN, compone el MatchResultReal,
// lo deja staged (persistencia dual KV+Supabase, NP-04) y resuelve EN EL ACTO
// (resolveMatch es idempotente: solo toca predicciones con resolved_at=null).
// El cron resolve-predictions (cada 30 min) queda como red de seguridad para
// resultados staged a mano. NUNCA resuelve con simulación.
//
// Auth idéntico al resto de crones: Authorization: Bearer ${CRON_SECRET}
// o ?secret=XXX. Puede ejecutarse a mano sin riesgo (idempotente).

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { recordHeartbeat } from "@/lib/ops/store";
import { buildMeta, getFixtureId, getLastSnapshot, cacheSnapshot } from "@/lib/match-center/store";
import { fetchLiveSnapshot } from "@/lib/match-center/apiFootball";
import { getMatchMeta } from "@/lib/predictions/match-data";
import { getUnresolvedMatchIds, resolveMatch, type ResolveSummary } from "@/lib/predictions/store";
import { stageMatchResult, clearStagedResult, resultStoreAvailable } from "@/lib/predictions/result-store";
import { composeResultFromSnapshot, isFinishedRealSnapshot, ratingsForMatch } from "@/lib/predictions/auto-result";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Un partido real no puede estar terminado antes de ~100' tras el kickoff:
// hasta entonces ni se consulta el feed (ahorra cuota y bloquea falsos FT).
const MIN_FINISHED_MS = 100 * 60_000;
// Margen para responder dentro del maxDuration aunque haya muchos partidos.
const TIME_BUDGET_MS = 50_000;

export async function GET(req: Request) {
  const startMs = Date.now();

  const denied = requireCron(req);
  if (denied) return denied;

  if (!resultStoreAvailable()) {
    return NextResponse.json({ error: "kv_not_configured", message: "KV_REST_API_URL / KV_REST_API_TOKEN requeridos" }, { status: 500 });
  }

  const now = Date.now();
  const matchIds = await getUnresolvedMatchIds();

  const resolved: ResolveSummary[] = [];
  const notYet: string[] = [];       // demasiado pronto para estar terminado
  const awaitingFeed: string[] = []; // sin snapshot real disponible aún
  const inPlay: string[] = [];       // el feed real dice que sigue en juego
  const errors: string[] = [];

  for (const matchId of matchIds) {
    if (Date.now() - startMs > TIME_BUDGET_MS) break; // sigue en la próxima pasada

    const meta = getMatchMeta(matchId);
    if (!meta?.kickoff_at) continue; // partido desconocido: lo ignoramos
    const kickoffMs = new Date(meta.kickoff_at).getTime();
    if (now < kickoffMs + MIN_FINISHED_MS) { notYet.push(matchId); continue; }

    const id = parseInt(matchId, 10);
    if (Number.isNaN(id)) continue;

    try {
      // 1) Último snapshot del Match Center (el poll lo mantiene al día y un
      //    snapshot ya terminado es definitivo aunque tenga minutos de edad).
      let snap = await getLastSnapshot(id);

      // 2) Sin snapshot terminado: consulta puntual al feed real (1 request).
      if (!isFinishedRealSnapshot(snap)) {
        const fixtureId = await getFixtureId(id);
        const mcMeta = buildMeta(id);
        if (!fixtureId || !mcMeta) { awaitingFeed.push(matchId); continue; }
        snap = await fetchLiveSnapshot(fixtureId, mcMeta);
        if (snap) await cacheSnapshot(snap);
      }

      if (!snap) { awaitingFeed.push(matchId); continue; }
      if (!isFinishedRealSnapshot(snap)) { inPlay.push(matchId); continue; }

      // 3) Resultado oficial + ratings (fail-soft: sin ratings, los duelos se
      //    anulan en neutro por FIX 9 — nunca se pagan mal).
      const result = composeResultFromSnapshot(matchId, snap);
      const fixtureId = await getFixtureId(id);
      if (fixtureId) {
        result.player_ratings = await ratingsForMatch(matchId, fixtureId).catch(() => ({}));
      }

      // 4) Staging (persistencia dual) y resolución inmediata.
      await stageMatchResult(matchId, result, { status: snap.status, source: "auto:api-football" });
      const summary = await resolveMatch(matchId, result);
      await clearStagedResult(matchId);
      resolved.push(summary);
    } catch (e) {
      console.error(`[stage-results] fallo en ${matchId}:`, e);
      errors.push(matchId);
    }
  }

  await recordHeartbeat("stage-results", errors.length === 0, { resolved: resolved.length });

  return NextResponse.json({
    ok: true,
    checked: matchIds.length,
    resolved_count: resolved.length,
    resolved,
    not_yet: notYet,
    awaiting_feed: awaitingFeed,
    in_play: inPlay,
    errors,
    duration_ms: Date.now() - startMs,
  });
}

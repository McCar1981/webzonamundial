// src/app/api/predictions/match/[matchId]/live-status/route.ts
//
// GET → veredicto PROVISIONAL en vivo de mis predicciones de un partido:
// "ahora mismo la ganas / la pierdes / se decide al final", con marcador y
// minuto reales. Pura emoción de seguimiento: NO paga nada, NO escribe nada —
// la resolución oficial la hace el cron stage-results al pitido final.
//
// Fuente: SOLO la caché de snapshots del Match Center (el poll por minuto la
// mantiene fresca). Sin peticiones a api-football por usuario: cero estampidas
// y cero gasto de cuota. Si no hay feed real, no se inventa nada (sin chip).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getLastSnapshot } from "@/lib/match-center/store";
import { snapshotStarted } from "@/lib/fantasy/scoring.live";
import { getMatchMeta } from "@/lib/predictions/match-data";
import { getMatchPredictions } from "@/lib/predictions/store";
import { scoreBase } from "@/lib/predictions/scoring";
import { composeResultFromSnapshot, isFinishedRealSnapshot } from "@/lib/predictions/auto-result";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LiveVerdict {
  id: string;
  prediction_type: string;
  now: "winning" | "losing" | "pending" | "resolved";
  points_now?: number;
  detail?: string;
}

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const meta = getMatchMeta(params.matchId);
  if (!meta) return NextResponse.json({ error: "match_not_found" }, { status: 404 });

  const noLive = (extra?: Record<string, unknown>) =>
    NextResponse.json(
      { live: false, finished: false, verdicts: [], ...extra },
      { headers: { "Cache-Control": "private, no-store" } },
    );

  if (!meta.kickoff_at || Date.now() < new Date(meta.kickoff_at).getTime()) {
    return noLive({ started: false });
  }

  const id = parseInt(params.matchId, 10);
  if (Number.isNaN(id)) return noLive({ started: false });

  // Solo caché del Match Center: el feed real lo refresca el poll por minuto.
  const snap = await getLastSnapshot(id);
  if (!snap || snap.mode !== "live" || !snapshotStarted(snap)) {
    return noLive({ started: true, feed: "unavailable" });
  }

  const finished = isFinishedRealSnapshot(snap);
  const result = composeResultFromSnapshot(params.matchId, snap);
  const rows = await getMatchPredictions(user.id, params.matchId);

  const verdicts: LiveVerdict[] = rows.map((r) => {
    if (r.resolved_at) {
      return {
        id: r.id,
        prediction_type: r.prediction_type,
        now: "resolved",
        points_now: r.points_earned ?? 0,
      };
    }
    // Mismo motor que la resolución oficial, sobre el estado ACTUAL del
    // partido. `voided` aquí significa "aún sin datos para juzgar" → pendiente.
    const base = scoreBase(r.prediction_type, r.prediction_data, r.confidence_multiplier, result);
    return {
      id: r.id,
      prediction_type: r.prediction_type,
      now: base.voided ? "pending" : base.correct ? "winning" : "losing",
      points_now: base.voided ? 0 : base.points,
      detail: base.detail,
    };
  });

  return NextResponse.json(
    {
      live: !finished,
      finished,
      status: snap.status,
      minute: snap.elapsed,
      score: { home: snap.score[0], away: snap.score[1] },
      verdicts,
      updated_at: snap.updatedAt,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

// src/app/api/fantasy/live/route.ts
//
// Fase 3 — Snapshots REALES para la puntuación en vivo del Fantasy. Dado un
// conjunto de partidos (los de las selecciones del usuario en la jornada), los
// resuelve a fixtures de api-football y devuelve los snapshots reales. Solo datos
// reales: nunca simulación. Los partidos sin empezar o sin fixture mapeado se
// devuelven como "NS" (por comenzar) para que el cliente los muestre parados.

import { NextResponse } from "next/server";
import { buildMeta, getFixtureId, getCachedSnapshot, cacheSnapshot } from "@/lib/match-center/store";
import { fetchLiveSnapshots } from "@/lib/match-center/apiFootball";
import { EMPTY_STATS, type LiveSnapshot, type MatchMeta } from "@/lib/match-center/types";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isPro } from "@/lib/pro/entitlement";
import { PRO_REQUIRED_CODE, type ProRequiredPayload } from "@/lib/pro/limits";
import { trackLimitHit } from "@/lib/pro/metrics";

export const dynamic = "force-dynamic";

/** Snapshot "por comenzar": el partido aún no tiene datos reales. */
function scheduledSnapshot(meta: MatchMeta): LiveSnapshot {
  return {
    mode: "live",
    matchId: meta.id,
    status: "NS",
    elapsed: 0,
    score: [0, 0],
    events: [],
    narration: {},
    stats: EMPTY_STATS,
    homeLineup: null,
    awayLineup: null,
    meta,
    updatedAt: Date.now(),
  };
}

export async function GET(req: Request) {
  // Puntuación EN VIVO = beneficio Pro (Free ve los puntos al resolverse la
  // jornada). El gate vive aquí porque este endpoint es la única fuente de
  // snapshots en vivo del Fantasy.
  const user = await getCurrentUser();
  if (!user || !(await isPro(user.id, user.email))) {
    if (user) trackLimitHit("fantasy_live");
    const payload: ProRequiredPayload = {
      error: "Los puntos en tiempo real del Fantasy son una función del plan Pro.",
      code: PRO_REQUIRED_CODE,
      feature: "fantasy_live",
    };
    return NextResponse.json(payload, { status: user ? 403 : 401 });
  }

  const url = new URL(req.url);
  const raw = url.searchParams.get("ids") || "";
  const ids = [...new Set(raw.split(/[-,]/).map((s) => parseInt(s, 10)).filter((n) => Number.isFinite(n)))].slice(0, 24);

  const snapshots: Record<number, LiveSnapshot> = {};
  const misses: { matchId: number; fixtureId: number; meta: MatchMeta }[] = [];

  for (const id of ids) {
    const meta = buildMeta(id);
    if (!meta) continue;
    const cached = await getCachedSnapshot(id);
    if (cached) {
      snapshots[id] = cached;
      continue;
    }
    const fixtureId = await getFixtureId(id);
    if (!fixtureId) {
      // Sin fixture real mapeado todavía → "por comenzar".
      snapshots[id] = scheduledSnapshot(meta);
      continue;
    }
    misses.push({ matchId: id, fixtureId, meta });
  }

  if (misses.length > 0) {
    try {
      const fetched = await fetchLiveSnapshots(misses);
      for (const m of misses) {
        const snap = fetched[m.matchId];
        if (snap) {
          await cacheSnapshot(snap);
          snapshots[m.matchId] = snap;
        } else {
          snapshots[m.matchId] = scheduledSnapshot(m.meta);
        }
      }
    } catch {
      for (const m of misses) snapshots[m.matchId] = scheduledSnapshot(m.meta);
    }
  }

  return NextResponse.json({ snapshots }, { headers: { "Cache-Control": "no-store" } });
}

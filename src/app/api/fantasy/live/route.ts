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
import { snapshotStarted, snapshotFinished } from "@/lib/fantasy/scoring.live";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isPro } from "@/lib/pro/entitlement";
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

/**
 * Versión "directo bloqueado" para no-Pro: mantiene el marcador y el estado real
 * del partido EN JUEGO, pero oculta el detalle (eventos, alineaciones, narración)
 * del que cuelga la puntuación minuto a minuto. Así los no-Pro ven que la jornada
 * está en curso pero sus puntos se materializan al final del partido (cuando se
 * sirve el snapshot completo). Ver la jornada EN VIVO sigue siendo un perk Pro.
 */
function liveLockedSnapshot(s: LiveSnapshot): LiveSnapshot {
  return { ...s, events: [], narration: {}, stats: EMPTY_STATS, homeLineup: null, awayLineup: null };
}

export async function GET(req: Request) {
  // Los snapshots de partidos TERMINADOS (y por comenzar) son para TODOS: así
  // cualquier usuario —incluido Free e invitado— ve sus puntos al resolverse la
  // jornada y puede confirmarla. El minuto a minuto EN JUEGO se reserva a Pro:
  // a los no-Pro se les oculta el detalle del partido en curso (más abajo).
  const user = await getCurrentUser();
  const pro = user ? await isPro(user.id, user.email) : false;

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

  // Gate del DIRECTO (no del resultado): a los no-Pro se les oculta el detalle de
  // los partidos EN JUEGO; los terminados y los que no han empezado pasan intactos.
  let liveLocked = false;
  if (!pro) {
    for (const id of Object.keys(snapshots)) {
      const s = snapshots[Number(id)];
      if (snapshotStarted(s) && !snapshotFinished(s)) {
        snapshots[Number(id)] = liveLockedSnapshot(s);
        liveLocked = true;
      }
    }
    if (liveLocked && user) trackLimitHit("fantasy_live"); // oportunidad de upsell
  }

  return NextResponse.json({ snapshots, liveLocked }, { headers: { "Cache-Control": "no-store" } });
}

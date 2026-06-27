// src/app/api/match-center/knockout/route.ts
//
// CUADRO DE ELIMINATORIAS: los 32 partidos de fase final (16avos → Final) con
// su último estado conocido y, lo importante, con el CRUCE REAL ya resuelto a
// partir de las clasificaciones vivas de grupo (aunque falte una jornada): los
// slots "2A", "1E", "3ABCDF" se traducen a la selección real y se actualizan
// conforme avanzan los resultados. Distinto del simulador /bracket.
//
// Coste CERO contra api-football: se sirve solo de las copias durables de KV
// (mc:last:, en lote con MGET) que el cron ya calienta — leemos también los
// partidos de grupos para construir las tablas.

import { NextResponse } from "next/server";
import { MATCHES } from "@/data/matches";
import { getLastSnapshotsBulk, matchSlug } from "@/lib/match-center/store";
import { etToDate } from "@/lib/bracket/match-time";
import type { LiveMap } from "@/lib/calendario/live";
import { resolveKnockoutSlots, applyResolution, type KoResult } from "@/lib/match-center/knockout-resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const IN_PLAY = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);

// Todos los partidos oficiales (grupos para las tablas + KO para el cuadro).
const ALL = MATCHES.filter((m) => m.i < 9000);
const KO = ALL.filter((m) => m.p !== "Fase de grupos");

export async function GET() {
  const snaps = await getLastSnapshotsBulk(ALL.map((m) => m.i));

  // LiveMap (keyed por matchId) que alimenta el motor de clasificaciones.
  const live: LiveMap = {};
  for (const m of ALL) {
    const snap = snaps[m.i];
    if (!snap) continue;
    live[m.i] = { s: snap.status, sc: [snap.score?.[0] ?? 0, snap.score?.[1] ?? 0], el: snap.elapsed ?? 0 };
  }

  // Resultado completo de cada KO (incluida la tanda de penaltis) para encadenar
  // los ganadores W## correctamente.
  const koResults: Record<number, KoResult> = {};
  for (const m of KO) {
    const snap = snaps[m.i];
    if (!snap) continue;
    koResults[m.i] = {
      status: snap.status,
      score: [snap.score?.[0] ?? 0, snap.score?.[1] ?? 0],
      penalty: snap.penalty ? [snap.penalty[0] ?? 0, snap.penalty[1] ?? 0] : undefined,
    };
  }

  const resolved = resolveKnockoutSlots(live, koResults);

  const matches = KO.map((m) => {
    const snap = snaps[m.i];
    const status = snap?.status ?? "NS";
    const ko = etToDate(m.d, m.t);
    const home = applyResolution(m.h, m.hf, resolved);
    const away = applyResolution(m.a, m.af, resolved);
    return {
      matchId: m.i,
      slug: matchSlug(m.i) ?? String(m.i),
      phase: m.p,
      status,
      live: IN_PLAY.has(status),
      finished: FINISHED.has(status),
      elapsed: snap?.elapsed ?? 0,
      score: snap?.score ?? [null, null],
      kickoff: snap?.kickoff ?? (ko ? ko.toISOString() : null),
      venue: m.vn || null,
      city: m.vc || null,
      home: { name: home.name, flag: home.flag, slot: m.h, provisional: home.provisional },
      away: { name: away.name, flag: away.flag, slot: m.a, provisional: away.provisional },
    };
  });

  return NextResponse.json(
    { matches },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" } },
  );
}

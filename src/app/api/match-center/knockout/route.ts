// src/app/api/match-center/knockout/route.ts
//
// CUADRO DE ELIMINATORIAS: los 32 partidos de fase final (16avos → Final) con
// su último estado conocido, en UNA respuesta compacta para la página
// /app/eliminatorias.
//
// Coste CERO contra api-football: se sirve solo de las copias durables de KV
// (mc:last:, en lote con MGET) que el cron ya calienta. El marcador y el estado
// son REALES (api-football); los NOMBRES de equipo salen de matches.ts, así que
// muestran la etiqueta de slot ("2A", "ganador E", "mejor 3º") hasta que se
// rellenan con los clasificados reales conforme avanza el cuadro.

import { NextResponse } from "next/server";
import { MATCHES } from "@/data/matches";
import { getLastSnapshotsBulk, matchSlug } from "@/lib/match-center/store";
import { etToDate } from "@/lib/bracket/match-time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const IN_PLAY = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);

// Partidos de fase final del cuadro oficial (excluye fase de grupos y los slots
// de prueba id >= 9000). Mantiene el orden natural de matches.ts.
const KO = MATCHES.filter((m) => m.i < 9000 && m.p !== "Fase de grupos");

export async function GET() {
  const ids = KO.map((m) => m.i);
  const snaps = await getLastSnapshotsBulk(ids);

  const matches = KO.map((m) => {
    const snap = snaps[m.i];
    const status = snap?.status ?? "NS";
    const ko = etToDate(m.d, m.t);
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
      // Nombre/bandera de matches.ts: etiqueta de slot ("2A") hasta que se
      // rellena con el clasificado real. flag "tbd" = sin bandera.
      home: { name: m.h, flag: m.hf },
      away: { name: m.a, flag: m.af },
    };
  });

  return NextResponse.json(
    { now: undefined, matches },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" } },
  );
}

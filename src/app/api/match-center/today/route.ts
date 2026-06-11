// src/app/api/match-center/today/route.ts
//
// MODO JORNADA: los partidos de HOY (y los que sigan en juego de ayer) con su
// último estado conocido, en UNA respuesta compacta para el tablero del hub.
//
// Coste CERO contra api-football: se sirve exclusivamente de las copias
// durables de KV (mc:last:, leídas en lote con MGET) que el cron ya calienta.
// Para partidos sin snapshot todavía (previa), devuelve el estado "NS" con la
// hora de saque del calendario oficial.

import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { MATCHES } from "@/data/matches";
import { getLastSnapshotsBulk, matchSlug } from "@/lib/match-center/store";
import { etToDate } from "@/lib/bracket/match-time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const IN_PLAY = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);
// Ventana "hoy": desde 6 h antes (partidos recién terminados siguen visibles)
// hasta 26 h después (la agenda completa del día, cruce de husos incluido).
const PAST_MS = 6 * 60 * 60_000;
const FUTURE_MS = 26 * 60 * 60_000;
// El set de partidos aún vivos que mantiene el cron (puede incluir partidos
// cuya ventana de calendario ya pasó: prórrogas, saques retrasados).
const LIVESET_KEY = "mc:liveset:v1";

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export async function GET() {
  const now = Date.now();

  const ids = new Set<number>();
  const kickoffById = new Map<number, string>();
  for (const m of MATCHES) {
    const ko = etToDate(m.d, m.t);
    if (!ko) continue;
    const t = ko.getTime();
    if (t >= now - PAST_MS && t <= now + FUTURE_MS) {
      ids.add(m.i);
      kickoffById.set(m.i, ko.toISOString());
    }
  }
  if (kvEnabled()) {
    try {
      const stillLive = await kv.smembers(LIVESET_KEY);
      for (const id of stillLive ?? []) {
        const n = Number(id);
        if (Number.isInteger(n)) ids.add(n);
      }
    } catch {
      /* solo calendario */
    }
  }

  const snaps = await getLastSnapshotsBulk([...ids]);

  const items = [...ids]
    .map((id) => {
      const m = MATCHES.find((x) => x.i === id);
      if (!m) return null;
      const snap = snaps[id];
      const status = snap?.status ?? "NS";
      const last = snap?.events?.length
        ? snap.events[snap.events.length - 1]
        : null;
      return {
        matchId: id,
        slug: matchSlug(id) ?? String(id),
        status,
        live: IN_PLAY.has(status),
        finished: FINISHED.has(status),
        elapsed: snap?.elapsed ?? 0,
        score: snap?.score ?? [null, null],
        kickoff: snap?.kickoff ?? kickoffById.get(id) ?? null,
        phase: m.p,
        group: m.g,
        home: { name: m.h, flag: m.hf },
        away: { name: m.a, flag: m.af },
        possession: snap?.stats?.possession ?? null,
        lastEvent: last
          ? { minute: last.minute, type: last.type, player: last.player ?? null }
          : null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => {
      // En juego primero (más avanzados arriba); luego próximos por saque;
      // los terminados al final.
      const rank = (x: typeof a) => (x.live ? 0 : x.finished ? 2 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      if (a.live && b.live) return b.elapsed - a.elapsed;
      return String(a.kickoff ?? "").localeCompare(String(b.kickoff ?? ""));
    });

  return NextResponse.json(
    { now, matches: items },
    { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" } },
  );
}

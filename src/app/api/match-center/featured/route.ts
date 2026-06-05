// src/app/api/match-center/featured/route.ts
//
// Devuelve el partido DESTACADO del Match Center para el banner del hero,
// aplicando la REGLA FIJA (ver src/lib/match-center/programmed.ts):
//   1. Recorre los partidos programados en orden cronológico.
//   2. Salta los que ya terminaron; devuelve el que está en juego o el próximo.
//   3. Si no queda ninguno por jugar, cae al PRIMER partido del Mundial.
//
// La respuesta es un LiveSnapshot (mismo shape que /live/[id]) enriquecido con
// `matchId` y `slug`, de modo que el banner lo pinta y enlaza con una sola
// petición. Degrada limpiamente: si no hay datos en vivo, devuelve el estado
// "por comenzar" con la info disponible.

import { NextResponse } from "next/server";
import { MATCHES } from "@/data/matches";
import { PROGRAMMED_MATCH_IDS, firstWorldCupMatchId } from "@/lib/match-center/programmed";
import {
  buildMeta,
  getFixtureId,
  getCachedSnapshot,
  getLastSnapshot,
  cacheSnapshot,
  matchSlug,
} from "@/lib/match-center/store";
import { fetchLiveSnapshot, scheduledSnapshot } from "@/lib/match-center/apiFootball";
import type { LiveSnapshot } from "@/lib/match-center/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Ventana de saque (horarios de MATCHES en ET; EDT en junio = UTC-4).
const POSTMATCH_MS = 150 * 60_000;
const IN_PLAY = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);

function kickoffMs(date: string, time: string): number {
  const iso = `${date}T${time.length === 5 ? time : "00:00"}:00-04:00`;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NaN : t;
}

function isoKickoff(date: string, time: string): string {
  return `${date}T${time.length === 5 ? time : "00:00"}:00-04:00`;
}

/** Aplica la REGLA FIJA y devuelve el matchId destacado. */
async function pickFeaturedId(now: number): Promise<number> {
  const programmed = PROGRAMMED_MATCH_IDS
    .map((id) => MATCHES.find((m) => m.i === id))
    .filter((m): m is NonNullable<typeof m> => !!m)
    .sort((a, b) => kickoffMs(a.d, a.t) - kickoffMs(b.d, b.t));

  for (const m of programmed) {
    // El estado REAL conocido (KV) manda sobre la ventana temporal.
    const last = await getLastSnapshot(m.i);
    if (last) {
      if (FINISHED.has(last.status)) continue; // terminó -> siguiente
      if (IN_PLAY.has(last.status)) return m.i; // en juego -> este
      // NS (por comenzar): cae a la lógica de ventana de abajo.
    }
    const ko = kickoffMs(m.d, m.t);
    if (Number.isNaN(ko)) {
      if (last) return m.i;
      continue;
    }
    // Por venir o dentro de la ventana de partido -> este.
    if (now <= ko + POSTMATCH_MS) return m.i;
    // Pasó la ventana sin datos en vivo: se considera terminado -> siguiente.
  }

  return firstWorldCupMatchId();
}

/** Mejor feed disponible para un partido (cacheado > vivo > por comenzar). */
async function feedFor(matchId: number): Promise<LiveSnapshot | null> {
  const meta = buildMeta(matchId);
  if (!meta) return null;

  const cached = await getCachedSnapshot(matchId);
  if (cached) return cached;

  const fixtureId = await getFixtureId(matchId);
  if (fixtureId) {
    const snap = await fetchLiveSnapshot(fixtureId, meta);
    if (snap) {
      await cacheSnapshot(snap);
      return snap;
    }
    const last = await getLastSnapshot(matchId);
    if (last) return last;
  }

  // Sin fixture/datos: estado estático "por comenzar" con la fecha del calendario.
  return scheduledSnapshot(meta, isoKickoff(meta.date, meta.time));
}

export async function GET() {
  const now = Date.now();
  const matchId = await pickFeaturedId(now);
  const feed = await feedFor(matchId);
  if (!feed) {
    return NextResponse.json({ error: "no match" }, { status: 404 });
  }
  return NextResponse.json(
    { matchId, slug: matchSlug(matchId), ...feed },
    {
      headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" },
    },
  );
}

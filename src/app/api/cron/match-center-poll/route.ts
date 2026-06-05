// src/app/api/cron/match-center-poll/route.ts
//
// Poller CENTRALIZADO del Match Center. Corre cada minuto. En cada pasada:
//   1. Selecciona los partidos del Mundial dentro de su ventana en vivo
//      (desde 30 min antes del saque hasta ~2,5 h después).
//   2. Resuelve su fixtureId real (KV/env) y los agrupa.
//   3. Los descarga EN LOTE con UNA sola petición `/fixtures?ids=` (hasta 20),
//      en vez de N×4 peticiones sueltas. Gran ahorro de cuota.
//   4. Cachea cada snapshot en KV.
//
// Así "calienta" la caché compartida: los sondeos de cada navegador (que pegan
// a /api/match-center/live/[id] cada 15 s) se sirven desde KV sin volver a
// pegarle a api-football. La latencia de origen sigue siendo ~15 s (límite del
// proveedor), pero la cuota se reparte entre TODOS los espectadores.
//
// Auth idéntico al resto de crones: Authorization: Bearer ${CRON_SECRET} o
// ?secret=XXX. Idempotente: si no hay partidos en ventana, no hace nada.

import { NextResponse } from "next/server";
import { MATCHES } from "@/data/matches";
import { buildMeta, getFixtureId, cacheSnapshot } from "@/lib/match-center/store";
import { fetchLiveSnapshots } from "@/lib/match-center/apiFootball";
import type { MatchMeta } from "@/lib/match-center/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Ventana de sondeo alrededor del saque. Los horarios de MATCHES están en ET
// (EDT en junio = UTC-4), así que componemos el instante con ese offset.
const PREKICK_MS = 30 * 60_000;
const POSTMATCH_MS = 150 * 60_000;

function kickoffMs(date: string, time: string): number {
  const iso = `${date}T${time.length === 5 ? time : "00:00"}:00-04:00`;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NaN : t;
}

function inLiveWindow(date: string, time: string, now: number): boolean {
  const ko = kickoffMs(date, time);
  if (Number.isNaN(ko)) return false;
  return now >= ko - PREKICK_MS && now <= ko + POSTMATCH_MS;
}

function apiKeyPresent(): boolean {
  return !!(process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY);
}

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

  if (!apiKeyPresent()) {
    return NextResponse.json(
      { error: "api_not_configured", message: "API_SPORTS_KEY requerida" },
      { status: 500 },
    );
  }

  const now = Date.now();
  const windowed = MATCHES.filter((m) => inLiveWindow(m.d, m.t, now));

  // Resuelve fixtureIds (KV/env) solo para los que tienen mapeo real.
  const pairs: { matchId: number; fixtureId: number; meta: MatchMeta }[] = [];
  for (const m of windowed) {
    const meta = buildMeta(m.i);
    if (!meta) continue;
    const fixtureId = await getFixtureId(m.i);
    if (!fixtureId) continue;
    pairs.push({ matchId: m.i, fixtureId, meta });
  }

  if (pairs.length === 0) {
    return NextResponse.json({
      ok: true,
      windowed: windowed.length,
      mapped: 0,
      cached: 0,
      duration_ms: Date.now() - startMs,
    });
  }

  // UNA petición por lote de 20 trae todos los partidos en vivo.
  const snapshots = await fetchLiveSnapshots(pairs);
  let cached = 0;
  for (const snap of Object.values(snapshots)) {
    await cacheSnapshot(snap);
    cached++;
  }

  return NextResponse.json({
    ok: true,
    windowed: windowed.length,
    mapped: pairs.length,
    cached,
    duration_ms: Date.now() - startMs,
  });
}

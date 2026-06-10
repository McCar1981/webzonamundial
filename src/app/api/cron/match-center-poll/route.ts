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
import { requireCron } from "@/lib/auth-helpers";
import { MATCHES } from "@/data/matches";
import { buildMeta, getFixtureId, cacheSnapshot } from "@/lib/match-center/store";
import { fetchLiveSnapshots } from "@/lib/match-center/apiFootball";
import { processMatchPush } from "@/lib/match-center/push";
import { processMicroGeneration } from "@/lib/micro/engine";
import type { MatchMeta } from "@/lib/match-center/types";
import { recordHeartbeat } from "@/lib/ops/store";
import { sendOpsAlert } from "@/lib/ops/alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Ventana de sondeo alrededor del saque. Los horarios de MATCHES están en ET
// (EDT en junio = UTC-4), así que componemos el instante con ese offset.
const PREKICK_MS = 30 * 60_000;
const POSTMATCH_MS = 150 * 60_000;
// Margen para responder dentro del maxDuration.
const TIME_BUDGET_MS = 50_000;
// Opción 1: bucle interno sub-minuto. Mientras haya algún partido EN VIVO,
// repetimos la pasada cada POLL_INTERVAL_MS para bajar la latencia del push de
// ~1-4 min (drift/skips del cron de Vercel) a ~15s.
const POLL_INTERVAL_MS = 15_000;
// Estados de api-football que indican partido en curso (no NS/FT/PST/CANC...).
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

/** Una pasada completa: ventana → fixtureIds → lote → caché + push. Devuelve los
 *  contadores y cuántos snapshots siguen EN VIVO (para decidir si repetir). */
async function runPass(): Promise<{
  windowed: number;
  mapped: number;
  cached: number;
  pushes: number;
  live: number;
}> {
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
    return { windowed: windowed.length, mapped: 0, cached: 0, pushes: 0, live: 0 };
  }

  // UNA petición por lote de 20 trae todos los partidos en vivo.
  const snapshots = await fetchLiveSnapshots(pairs);
  let cached = 0;
  let pushes = 0;
  let live = 0;
  for (const snap of Object.values(snapshots)) {
    await cacheSnapshot(snap);
    cached++;
    if (LIVE_STATUSES.has(snap.status)) live++;
    // Tras calentar la caché, diff contra el estado guardado y manda los push
    // de novedades (gol, roja, inicio, descanso, final). No falla la pasada si
    // el push peta: la caché ya está servida.
    try {
      pushes += await processMatchPush(snap);
    } catch (err) {
      console.error("[mc-poll] push failed", snap.matchId, (err as Error).message);
    }
    // Genera micro-predicciones EN VIVO a partir del mismo snapshot (eventos +
    // minuto). Reusa el diff ya descargado; degrada en silencio si falla.
    try {
      await processMicroGeneration(snap);
    } catch (err) {
      console.error("[mc-poll] micro generation failed", snap.matchId, (err as Error).message);
    }
  }

  return { windowed: windowed.length, mapped: pairs.length, cached, pushes, live };
}

export async function GET(req: Request) {
  const startMs = Date.now();

  const denied = requireCron(req);
  if (denied) return denied;

  if (!apiKeyPresent()) {
    // Sin key el lobby degrada a "Por comenzar" para TODOS los partidos.
    // Alerta crítica (con throttle por key) en vez de morir en silencio.
    await sendOpsAlert({
      key: "mc_poll_no_api_key",
      severity: "critical",
      title: "Match Center sin API key",
      body: "match-center-poll no encuentra API_SPORTS_KEY/RAPIDAPI_KEY. El hero y el Match Center quedan congelados en 'Por comenzar'.",
      repeatMinutes: 30,
      url: "/admin/monitor",
    });
    await recordHeartbeat("match-center-poll", false, { error: "api_not_configured" });
    return NextResponse.json(
      { error: "api_not_configured", message: "API_SPORTS_KEY requerida" },
      { status: 500 },
    );
  }

  // Bucle interno sub-minuto (Opción 1): mientras haya partido EN VIVO y quede
  // presupuesto, repetimos la pasada cada POLL_INTERVAL_MS. Si no hay nada en
  // vivo, una sola pasada (idéntico al comportamiento anterior).
  let totalCached = 0;
  let totalPushes = 0;
  let lastWindowed = 0;
  let lastMapped = 0;
  let passes = 0;

  for (;;) {
    const { windowed, mapped, cached, pushes, live } = await runPass();
    totalCached += cached;
    totalPushes += pushes;
    lastWindowed = windowed;
    lastMapped = mapped;
    passes++;

    if (live === 0) break;
    const budgetLeft = TIME_BUDGET_MS - (Date.now() - startMs);
    if (budgetLeft < POLL_INTERVAL_MS + 5_000) break;
    await sleep(POLL_INTERVAL_MS);
  }

  // Partidos en ventana con fixture mapeado pero CERO snapshots descargados =
  // api-football no devuelve nada (key inválida/revocada o cuota agotada).
  // Es distinto de "no hay partidos ahora" (lastMapped === 0, normal).
  if (lastMapped > 0 && totalCached === 0) {
    await sendOpsAlert({
      key: "mc_poll_zero_snapshots",
      severity: "critical",
      title: "api-football no devuelve datos",
      body: `match-center-poll: ${lastMapped} partido(s) en ventana y 0 snapshots descargados. Posible key inválida o cuota agotada — el marcador en vivo está congelado.`,
      repeatMinutes: 15,
      url: "/admin/monitor",
    });
  }

  await recordHeartbeat("match-center-poll", totalCached > 0 || lastMapped === 0, { passes, cached: totalCached, pushes: totalPushes });

  return NextResponse.json({
    ok: true,
    passes,
    windowed: lastWindowed,
    mapped: lastMapped,
    cached: totalCached,
    pushes: totalPushes,
    duration_ms: Date.now() - startMs,
  });
}

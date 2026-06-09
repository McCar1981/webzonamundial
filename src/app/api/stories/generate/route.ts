// GET/POST /api/stories/generate
//
// Disparador del MOTOR AUTOMÁTICO de Stories del sistema. Pensado para un cron
// (cada 1-2 min). En cada pasada:
//   1. Selecciona los partidos del Mundial dentro de su ventana (pre-saque →
//      fin) y LEE su snapshot ya cacheado del Match Center (SOLO LECTURA: no
//      pega a api-football, eso es trabajo del poller del Match Center).
//   2. Pasa los snapshots al motor (runSystemGeneration), que emite las Stories
//      nuevas (previa/gol) deduplicando por gen_key.
//
// En LOCAL (sin service role / sin KV) usa snapshots de ejemplo para poder VER
// el motor funcionando (regla: validar en local antes de producción).
//
// Auth idéntico al resto de crones: Authorization: Bearer ${CRON_SECRET} o
// ?secret=XXX. Si no hay CRON_SECRET configurado (local), no exige auth.

import { NextResponse } from "next/server";
import { MATCHES } from "@/data/matches";
import { getLastSnapshot } from "@/lib/match-center/store";
import { hasServiceRole, demoSampleSnapshots } from "@/lib/stories/demo";
import { runSystemGeneration } from "@/lib/stories/store";
import type { LiveSnapshot } from "@/lib/match-center/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PREKICK_MS = 30 * 60_000;
const POSTMATCH_MS = 150 * 60_000;

function kickoffMs(date: string, time: string): number {
  const iso = `${date}T${time.length === 5 ? time : "00:00"}:00-04:00`;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NaN : t;
}

function inWindow(date: string, time: string, now: number): boolean {
  const ko = kickoffMs(date, time);
  if (Number.isNaN(ko)) return false;
  return now >= ko - PREKICK_MS && now <= ko + POSTMATCH_MS;
}

// Lee (solo lectura) los snapshots ya cacheados de los partidos en ventana.
async function readWindowedSnapshots(): Promise<LiveSnapshot[]> {
  const now = Date.now();
  const out: LiveSnapshot[] = [];
  for (const m of MATCHES) {
    if (!inWindow(m.d, m.t, now)) continue;
    const snap = await getLastSnapshot(m.i);
    if (snap) out.push(snap);
  }
  return out;
}

async function run() {
  // Sin service role (local) → snapshots de ejemplo para demostrar el motor.
  const snapshots = hasServiceRole() ? await readWindowedSnapshots() : demoSampleSnapshots();
  const result = await runSystemGeneration(snapshots);
  return { ok: true, snapshots: snapshots.length, ...result };
}

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // local sin secret
  const auth = req.headers.get("authorization");
  const headerOk = auth === `Bearer ${expected}`;
  const queryOk = new URL(req.url).searchParams.get("secret") === expected;
  return headerOk || queryOk;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await run());
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await run());
}

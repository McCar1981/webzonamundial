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
import {
  runSystemGeneration,
  archiveExpired,
  resolveMicroChallenges,
  existingGenKeys,
  createSystemStory,
} from "@/lib/stories/store";
import { dailyStory, genKeyDaily, FINAL_STATUSES } from "@/lib/stories/generator";
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

// Fecha y hora actuales en ET (los horarios de MATCHES van en Eastern Time;
// en junio-julio rige EDT = UTC-4, igual que kickoffMs arriba).
function nowInET(): { dateStr: string; hour: number } {
  const et = new Date(Date.now() - 4 * 3600 * 1000);
  return { dateStr: et.toISOString().slice(0, 10), hour: et.getUTCHours() };
}

// Story diaria "Buenos días, DT": una por día (gen_key diario:fecha), solo si
// hay partidos ese día y a partir de las 08:00 ET. Datos 100% reales (MATCHES).
async function emitDailyStory(existing: Set<string>): Promise<number> {
  const { dateStr, hour } = nowInET();
  if (hour < 8) return 0;
  const key = genKeyDaily(dateStr);
  if (existing.has(key)) return 0;
  const matchCount = MATCHES.filter((m) => m.d === dateStr).length;
  if (matchCount === 0) return 0;
  await createSystemStory(dailyStory(dateStr, matchCount));
  return 1;
}

async function run() {
  // Sin service role (local) → snapshots de ejemplo para demostrar el motor.
  const snapshots = hasServiceRole() ? await readWindowedSnapshots() : demoSampleSnapshots();
  const result = await runSystemGeneration(snapshots);

  // Story diaria (reutiliza las claves ya emitidas para no duplicar).
  let daily = 0;
  try {
    daily = await emitDailyStory(await existingGenKeys());
  } catch {
    daily = 0; // no bloquea la pasada del motor
  }

  // Partidos terminados en ventana → corregir micro-retos "¿Habrá más goles?".
  const finals = snapshots.filter((s) => FINAL_STATUSES.has(s.status));
  let resolved = 0;
  try {
    resolved = (await resolveMicroChallenges(finals)).resolved;
  } catch {
    resolved = 0;
  }

  // Archivado: apaga is_active de las Stories vencidas (TTL 24h).
  let archived = 0;
  try {
    archived = (await archiveExpired()).archived;
  } catch {
    archived = 0;
  }

  return { ok: true, snapshots: snapshots.length, ...result, daily, resolved, archived };
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

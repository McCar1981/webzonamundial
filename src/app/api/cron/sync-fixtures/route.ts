// src/app/api/cron/sync-fixtures/route.ts
//
// Cron que mantiene SIEMPRE conectado el mapa matchId -> fixtureId del Mundial
// 2026 con api-football. En cada pasada descarga el calendario oficial (1 sola
// petición) y escribe en Vercel KV los partidos que resuelve con confianza. En
// cuanto la FIFA/api-football publiquen el cuadro, el Match Center y el scoring
// EN VIVO del Fantasy quedan enganchados automáticamente, sin tocar nada a mano.
//
// Idempotente: re-mapea en cada corrida (absorbe cambios de horario/sede y va
// resolviendo las eliminatorias a medida que se conocen). Programado en
// vercel.json. Auth idéntico al resto de crones:
//   Authorization: Bearer ${CRON_SECRET}  ó  ?secret=XXX
//
// Modos de prueba:
//   ?dry=1   → calcula el emparejamiento SIN escribir en KV (previsualización)
//   ?full=1  → devuelve el detalle por partido (matchId, fixtureId, score)

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { recordHeartbeat } from "@/lib/ops/store";
import { syncWorldCupFixtures } from "@/lib/match-center/fixtureSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const startMs = Date.now();
  const url = new URL(req.url);

  const denied = requireCron(req);
  if (denied) return denied;

  const dryRun = url.searchParams.get("dry") === "1";
  const full = url.searchParams.get("full") === "1";

  const report = await syncWorldCupFixtures({ dryRun });

  await recordHeartbeat("sync-fixtures", report.ok, { mapped: report.mapped, unmatched: report.unmatched });

  return NextResponse.json(
    {
      ok: report.ok,
      reason: report.reason,
      leagueId: report.leagueId,
      season: report.season,
      apiFixtures: report.apiFixtures,
      mapped: report.mapped,
      ambiguous: report.ambiguous,
      unmatched: report.unmatched,
      dryRun: report.dryRun,
      duration_ms: Date.now() - startMs,
      ...(full ? { details: report.details } : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

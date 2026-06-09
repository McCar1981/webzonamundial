// src/app/api/cron/monitor/route.ts
// GET /api/cron/monitor — disparado por Vercel Cron cada 2 minutos.
//
// Es el latido del centro de control: ejecuta todas las sondas (servidores,
// latencia, frescura de crons), abre/cierra incidentes, alerta al teléfono del
// CEO y ejecuta auto-remediación segura. Ver src/lib/ops/monitor.ts.
//
// Auth idéntica al resto de crons: Authorization: Bearer <CRON_SECRET>.

import { NextRequest, NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { runMonitor } from "@/lib/ops/monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const denied = requireCron(request);
  if (denied) return denied;
  try {
    const report = await runMonitor();
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    // Si el propio monitor revienta, devolvemos 500 para que Vercel lo registre.
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

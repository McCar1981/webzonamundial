// src/app/api/cron/monitor/route.ts
// GET /api/cron/monitor — disparado por Vercel Cron cada 2 minutos.
//
// Es el latido del centro de control: ejecuta todas las sondas (servidores,
// latencia, frescura de crons), abre/cierra incidentes, alerta al teléfono del
// CEO y ejecuta auto-remediación segura. Ver src/lib/ops/monitor.ts.
//
// Auth idéntica al resto de crons: Authorization: Bearer <CRON_SECRET>.

import { NextRequest, NextResponse } from "next/server";
import { runMonitor } from "@/lib/ops/monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("authorization") || "";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return true;
    return request.headers.get("x-vercel-cron") === "1";
  }
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
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

// src/app/api/cron/poll-ligas-live/route.ts
//
// Poller EN VIVO de micro-predicciones para Zona de Ligas (Ola 1). Análogo a
// match-center-poll pero para ligas: en cada pasada descubre los partidos de Ola
// 1 en directo (/fixtures?live=all filtrado por league id), los baja como
// LiveSnapshot con eventos embebidos y llama a processMicroGeneration para que el
// MISMO motor del Mundial genere las micro-predicciones. El match_id es el
// fixtureId de api-football; la resolución/pago la hace resolve-micro (que
// reconoce el rango de ids de liga en authoritativeState).
//
// DORMIDO por defecto: si LIGAS_MICRO_ENABLED !== "1" no hace nada (ni toca la
// API). Además NO está en vercel.json todavía: no se ejecuta hasta que se le dé
// un schedule. Así queda LISTO sin gastar cuota ni pagar Fútcoins.
//
// Auth: requireCron (Authorization: Bearer ${CRON_SECRET}).

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { processMicroGeneration } from "@/lib/micro/engine";
import { fetchOla1LiveSnapshots, markLigasLive, ligasMicroEnabled } from "@/lib/ligas/micro-live";
import { recordHeartbeat } from "@/lib/ops/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = requireCron(req);
  if (denied) return denied;

  if (!ligasMicroEnabled()) {
    return NextResponse.json({ ok: true, skipped: "disabled" });
  }

  const snaps = await fetchOla1LiveSnapshots();
  let created = 0;
  for (const snap of snaps) {
    try {
      created += await processMicroGeneration(snap);
    } catch (err) {
      console.error("[poll-ligas-live] generación falló", snap.matchId, (err as Error).message);
    }
  }
  // Señal para que resolve-micro no salte por "idle" mientras haya ligas en vivo.
  if (snaps.length > 0) await markLigasLive();

  try {
    await recordHeartbeat("poll-ligas-live");
  } catch {
    // heartbeat best-effort
  }
  return NextResponse.json({ ok: true, live: snaps.length, created });
}

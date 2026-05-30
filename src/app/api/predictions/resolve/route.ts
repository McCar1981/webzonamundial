// src/app/api/predictions/resolve/route.ts
//
// POST /api/v1/predictions/resolve → resolver todas las predicciones de un
// partido finalizado. INTERNO: no expuesto al frontend. Protegido con
// `Authorization: Bearer <CRON_SECRET>` (mismo patrón que /api/cron/*).
// Disparado por el worker/webhook de la API de partidos.

import { NextResponse } from "next/server";
import type { MatchResultReal } from "@/lib/predictions/types";
import { getMatchMeta } from "@/lib/predictions/match-data";
import { resolveMatch } from "@/lib/predictions/store";
import { stageMatchResult, resultStoreAvailable } from "@/lib/predictions/result-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { match_id?: string; match_result?: MatchResultReal; mode?: "now" | "stage" };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.match_id || !body.match_result) {
    return NextResponse.json({ error: "bad_request", message: "match_id y match_result requeridos" }, { status: 400 });
  }
  if (!getMatchMeta(body.match_id)) {
    return NextResponse.json({ error: "match_not_found" }, { status: 404 });
  }

  // mode="stage": deja el resultado en cola; el cron lo resolverá cuando el
  // partido haya terminado. Por defecto se resuelve de inmediato (force-resolve).
  if (body.mode === "stage") {
    if (!resultStoreAvailable()) {
      return NextResponse.json({ error: "kv_not_configured", message: "KV requerido para staging" }, { status: 500 });
    }
    await stageMatchResult(body.match_id, body.match_result);
    return NextResponse.json({ ok: true, match_id: body.match_id, staged: true });
  }

  const summary = await resolveMatch(body.match_id, body.match_result);
  return NextResponse.json(summary);
}

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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { match_id?: string; match_result?: MatchResultReal };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.match_id || !body.match_result) {
    return NextResponse.json({ error: "bad_request", message: "match_id y match_result requeridos" }, { status: 400 });
  }
  if (!getMatchMeta(body.match_id)) {
    return NextResponse.json({ error: "match_not_found" }, { status: 404 });
  }

  const summary = await resolveMatch(body.match_id, body.match_result);
  return NextResponse.json(summary);
}

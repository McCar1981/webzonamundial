// src/app/api/admin/predictions/regrade/route.ts
//
// Re-calificación TOP-UP de partidos ya resueltos (tras corregir los bugs de
// calificación de la auditoría 2026-06-12). SOLO sube lo que faltó, nunca recorta
// (política de Carlos). Operación de administración: misma auth que los crones
// (Authorization: Bearer ${CRON_SECRET}).
//
// Uso:
//   DRY-RUN (no escribe, solo informa los deltas):
//     curl -k -H "Authorization: Bearer $SECRET" "https://zonamundial.app/api/admin/predictions/regrade?all=1"
//     curl -k -H "Authorization: Bearer $SECRET" "https://zonamundial.app/api/admin/predictions/regrade?match=1"
//   APLICAR (escribe puntos y abona el delta de Fútcoins/XP):
//     …mismas URLs añadiendo &apply=1
//
// Revisa SIEMPRE el dry-run antes de aplicar.

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { regradeMatch, regradeAll } from "@/lib/predictions/regrade";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = requireCron(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const apply = url.searchParams.get("apply") === "1";
  const mode = apply ? "apply" : "dry-run";

  if (url.searchParams.get("all") === "1") {
    const r = await regradeAll(apply);
    return NextResponse.json({ ok: true, mode, ...r });
  }

  const match = url.searchParams.get("match");
  if (!match) {
    return NextResponse.json({ error: "bad_request", message: "Usa ?match=<id> o ?all=1 (y &apply=1 para escribir)" }, { status: 400 });
  }
  const report = await regradeMatch(match, apply);
  return NextResponse.json({ ok: true, mode, report });
}

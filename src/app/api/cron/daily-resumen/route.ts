// src/app/api/cron/daily-resumen/route.ts
//
// Cron diario (07:30 UTC = 09:30 Madrid en verano): publica el RESUMEN de la
// jornada de AYER (hora española) con los resultados reales de los snapshots
// FT del Match Center. Si ayer no hubo partidos terminados, no publica nada.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireCron } from "@/lib/auth-helpers";
import { madridDateOf, publishResumenJornada } from "@/lib/editorial/daily";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = requireCron(req);
  if (denied) return denied;

  // Por defecto, la jornada de AYER en hora de Madrid. ?date=YYYY-MM-DD para
  // regenerar un día concreto.
  const url = new URL(req.url);
  const explicit = url.searchParams.get("date");
  const yesterday = madridDateOf(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const date = explicit || yesterday;

  const result = await publishResumenJornada(date);
  if (result.published) {
    revalidatePath("/noticias");
    if (result.slug) revalidatePath(`/noticias/${result.slug}`);
  }
  return NextResponse.json({ date, ...result });
}

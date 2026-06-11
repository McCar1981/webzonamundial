// src/app/api/cron/daily-previa/route.ts
//
// Cron diario (06:00 UTC = 08:00 Madrid en verano): publica la PREVIA del día
// con los partidos del Mundial de hoy (hora española), generada desde el
// calendario oficial y las fichas BIBLIA. Idempotente: slug fijo por fecha.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireCron } from "@/lib/auth-helpers";
import { madridDateOf, publishPreviaDelDia } from "@/lib/editorial/daily";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = requireCron(req);
  if (denied) return denied;

  // ?date=YYYY-MM-DD permite regenerar un día concreto (p. ej. tras un fallo).
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || madridDateOf(new Date());

  const result = await publishPreviaDelDia(date);
  if (result.published) {
    revalidatePath("/noticias");
    if (result.slug) revalidatePath(`/noticias/${result.slug}`);
  }
  return NextResponse.json({ date, ...result });
}

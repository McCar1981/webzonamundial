// src/app/api/admin/test-digest/route.ts
//
// GET /api/admin/test-digest — envía UNA copia de prueba del digest diario
// "Tu día en el Mundial" para que el CEO pueda revisar el email real antes de
// que el cron lo mande a toda la base (09:00 España).
//
// SEGURIDAD:
//   - Protegido por la cookie de admin (zm_admin), igual que el resto de /admin.
//   - El destinatario está HARDCODEADO a TEST_RECIPIENT: este endpoint NO acepta
//     ninguna dirección por query/body, así que es IMPOSIBLE que la prueba
//     alcance a nadie que no sea esa dirección. No es un envío masivo.
//
// Usa exactamente la misma construcción que el cron real (buildDigestData):
// partidos del día + noticias priorizadas por el partido del día y deduplicadas
// contra el último envío (lee los slugs de KV, pero NO los persiste — un test no
// debe alterar el estado de dedup del envío real).

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { kv } from "@vercel/kv";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { sendDailyDigest } from "@/lib/email";
import { buildDigestData, DIGEST_LAST_SENT_KEY } from "@/lib/daily-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Único destinatario posible de la prueba. NO se acepta por parámetro.
const TEST_RECIPIENT = "sprintmarkt@gmail.com";

export async function GET() {
  const cookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!cookie || !(await isValidAdminCookie(cookie))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Mismo contenido que produciría el próximo envío real (dedup incluido), sin
  // persistir el estado.
  let lastSent: string[] = [];
  try {
    lastSent = (await kv.get<string[]>(DIGEST_LAST_SENT_KEY)) ?? [];
  } catch {
    lastSent = [];
  }
  const { fixtures, fixturesAreToday, articles } = await buildDigestData({
    excludeSlugs: lastSent,
  });

  const ok = await sendDailyDigest({
    to: TEST_RECIPIENT,
    unsubscribeUrl: "https://zonamundial.app/cuenta/notificaciones",
    fixtures,
    fixturesAreToday,
    articles,
  });

  return NextResponse.json({
    ok,
    sentTo: TEST_RECIPIENT,
    fixtures: fixtures.length,
    fixturesAreToday,
    articles: articles.length,
    excludedFromLastSend: lastSent.length,
  });
}

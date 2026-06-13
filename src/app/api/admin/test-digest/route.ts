// src/app/api/admin/test-digest/route.ts
//
// GET /api/admin/test-digest — envía UNA copia de prueba del digest diario
// "Tu día en el Mundial" para que el CEO pueda revisar el email real antes de
// que el cron lo mande a toda la base (mañana 09:00 España).
//
// SEGURIDAD:
//   - Protegido por la cookie de admin (zm_admin), igual que el resto de /admin.
//   - El destinatario está HARDCODEADO a TEST_RECIPIENT: este endpoint NO acepta
//     ninguna dirección por query/body, así que es IMPOSIBLE que la prueba
//     alcance a nadie que no sea esa dirección. No es un envío masivo.
//
// Reutiliza exactamente la misma construcción de partidos+noticias que el cron
// real (src/app/api/cron/send-daily-digest) y la misma plantilla sendDailyDigest,
// de modo que lo que llega es idéntico al email de producción.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { getAllPublicNoticias } from "@/lib/noticias-store";
import { sendDailyDigest } from "@/lib/email";
import { MATCHES } from "@/data/matches";
import { etToDate } from "@/lib/bracket/match-time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Único destinatario posible de la prueba. NO se acepta por parámetro.
const TEST_RECIPIENT = "sprintmarkt@gmail.com";

export async function GET() {
  const cookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!cookie || !(await isValidAdminCookie(cookie))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 1. Noticias recientes (mismo origen que el cron).
  const all = await getAllPublicNoticias();
  const recent = all.slice(0, 5);

  // 2. Partidos del día — idéntica lógica al cron send-daily-digest: "hoy" en
  //    Europe/Madrid por el instante real del saque, con fallback a "próximos".
  const now = new Date();
  const madridDate = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  const madridTime = (d: Date) =>
    new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  const todayStr = madridDate(now);
  const withDt = MATCHES.map((m) => ({ m, dt: etToDate(m.d, m.t) })).filter(
    (x) => x.dt !== null,
  ) as { m: (typeof MATCHES)[number]; dt: Date }[];
  let fixturesAreToday = true;
  let slate = withDt.filter(
    (x) =>
      madridDate(x.dt) === todayStr &&
      x.dt.getTime() >= now.getTime() - 2 * 60 * 60 * 1000,
  );
  if (slate.length === 0) {
    fixturesAreToday = false;
    const upcoming = withDt
      .filter((x) => x.dt.getTime() >= now.getTime())
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());
    const nextDate = upcoming.length ? madridDate(upcoming[0].dt) : null;
    slate = nextDate
      ? upcoming.filter((x) => madridDate(x.dt) === nextDate)
      : [];
  }
  slate.sort((a, b) => a.dt.getTime() - b.dt.getTime());
  const fixtures = slate.slice(0, 8).map((x) => ({
    home: x.m.h,
    homeFlag: x.m.hf,
    away: x.m.a,
    awayFlag: x.m.af,
    time: madridTime(x.dt),
    group: x.m.g,
  }));

  // 3. Enviar SOLO al destinatario de prueba (nunca a la lista).
  const ok = await sendDailyDigest({
    to: TEST_RECIPIENT,
    unsubscribeUrl: "https://zonamundial.app/cuenta/notificaciones",
    fixtures,
    fixturesAreToday,
    articles: recent.map((n) => ({
      title: n.title,
      slug: n.slug,
      excerpt: n.excerpt,
      image: n.realImage ?? null,
      date: n.date,
      cat: n.cat,
    })),
  });

  return NextResponse.json({
    ok,
    sentTo: TEST_RECIPIENT,
    fixtures: fixtures.length,
    fixturesAreToday,
    articles: recent.length,
  });
}

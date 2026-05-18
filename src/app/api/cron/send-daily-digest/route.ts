// Cron endpoint: envía el digest diario de noticias a todos los
// suscriptores activos a `daily-digest`.
//
// Programación: `0 7 * * *` (07:00 UTC = 09:00 hora España).
//
// Flujo:
//   1. Lee todas las noticias publicadas en las últimas 24h (las nuevas
//      del último cron de ingesta).
//   2. Si no hay nuevas, NO envía nada (no queremos spammear con un
//      email vacío "no hubo novedades hoy").
//   3. Toma top 5 ordenadas por fecha desc.
//   4. Lee la lista de suscriptores activos vía service_role.
//   5. Para cada uno: genera token de unsubscribe + envía email.
//   6. Marca last_sent_at en bulk.
//
// Rate limiting: enviamos secuencialmente para no saturar Resend. Con
// volumen actual (decenas de suscriptores) es suficiente. Si crece a
// miles, migrar a envío en batches paralelos con Promise.allSettled.

import { NextRequest, NextResponse } from "next/server";
import { getAllPublicNoticias } from "@/lib/noticias-store";
import {
  listActiveSubscribers,
  markSent,
  buildUnsubscribeToken,
} from "@/lib/email-subscriptions";
import { sendDailyDigest } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel Hobby cap = 60s. Esto debería bastar para ~30-40 suscriptores
// con Resend respondiendo en ~1s cada uno.
export const maxDuration = 300;

const SITE = "https://zonamundial.app";

export async function GET(req: NextRequest) {
  // Auth: Vercel Cron envía Authorization: Bearer ${CRON_SECRET}.
  // También aceptamos ?secret=XXX para debug manual.
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerOk = auth === `Bearer ${expected}`;
    const querySecret = new URL(req.url).searchParams.get("secret");
    const queryOk = querySecret === expected;
    if (!headerOk && !queryOk) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // 1. Cargar noticias publicadas en últimas 24h.
  const all = await getAllPublicNoticias();
  const cutoff = new Date();
  cutoff.setUTCHours(cutoff.getUTCHours() - 24);
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  const recent = all
    .filter((n) => n.date >= cutoffISO)
    .slice(0, 5);

  if (recent.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: "no_news_in_last_24h",
      sent: 0,
    });
  }

  // 2. Lista de suscriptores activos.
  const { rows, error } = await listActiveSubscribers({
    kind: "daily-digest",
    limit: 1000,
  });
  if (error) {
    console.error("[digest-cron] listActiveSubscribers failed:", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  if (rows.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: "no_active_subscribers",
      sent: 0,
    });
  }

  // 3. Enviar a cada uno (secuencial). Logueamos fallos pero no
  //    interrumpimos: queremos enviarle al máximo posible.
  let sent = 0;
  let failed = 0;
  const sentIds: string[] = [];

  for (const row of rows) {
    try {
      const token = buildUnsubscribeToken({
        email: row.email,
        kind: "daily-digest",
      });
      const unsubscribeUrl = `${SITE}/api/notifications/digest/unsubscribe?token=${token}`;
      const ok = await sendDailyDigest({
        to: row.email,
        unsubscribeUrl,
        articles: recent.map((n) => ({
          title: n.title,
          slug: n.slug,
          excerpt: n.excerpt,
          image: n.realImage ?? null,
          date: n.date,
          cat: n.cat,
        })),
      });
      if (ok) {
        sent += 1;
        sentIds.push(row.id);
      } else {
        failed += 1;
      }
    } catch (err) {
      failed += 1;
      console.error(
        `[digest-cron] sending to ${row.email} failed:`,
        (err as Error).message,
      );
    }
  }

  // 4. Marcar last_sent_at en bulk.
  if (sentIds.length > 0) {
    await markSent(sentIds);
  }

  return NextResponse.json({
    ok: true,
    articles: recent.length,
    subscribers: rows.length,
    sent,
    failed,
  });
}

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
import { createClient } from "@supabase/supabase-js";

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

  // 1. Cargar las 5 noticias más recientes.
  //
  // Antes filtrábamos por "publicadas en últimas 24h" pero el campo n.date
  // viene de GNews (publishedAt del artículo original), no de cuándo lo
  // reescribimos en ZonaMundial. Eso hacía que el digest no enviara nada
  // si las noticias de la fuente eran de hace 2-3 días.
  //
  // Mejor enfoque: getAllPublicNoticias ya devuelve ordenado por fecha
  // descendente. Tomamos los primeros 5, que son los más recientes.
  // Garantía contra spam: si la lista NO ha cambiado desde ayer, el user
  // recibirá los mismos titulares — aceptable porque son los del momento.
  const all = await getAllPublicNoticias();
  const recent = all.slice(0, 5);

  if (recent.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: "no_articles_published",
      sent: 0,
    });
  }

  // 2. Lista de suscriptores activos (legacy email_subscriptions).
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

  // 2b. Filtro por FASE 3 \u2014 respetar preferencias granulares.
  //
  // Si un user tiene una fila expl\u00edcita en notification_preferences con
  //   category='news', channel='email', enabled=false
  // entonces NO le enviamos, aunque siga en email_subscriptions.
  //
  // Si tiene enabled=true o no tiene fila (legacy), s\u00ed le enviamos.
  // Esto preserva compat con FASE 1 mientras los users no opten out.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const optedOutUserIds = new Set<string>();
  if (supabaseUrl && serviceKey) {
    try {
      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: optOut } = await admin
        .from("notification_preferences")
        .select("user_id")
        .eq("category", "news")
        .eq("channel", "email")
        .eq("enabled", false);
      for (const r of optOut ?? []) {
        if (r.user_id) optedOutUserIds.add(r.user_id as string);
      }
    } catch (err) {
      console.error("[digest-cron] preferences fetch failed:", (err as Error).message);
    }
  }
  const filteredRows = rows.filter((r) => {
    if (!r.user_id) return true; // sin user_id no filtramos
    return !optedOutUserIds.has(r.user_id);
  });
  if (filteredRows.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: "all_subscribers_opted_out",
      sent: 0,
      filtered_out: rows.length,
    });
  }

  // 3. Enviar a cada uno (secuencial). Logueamos fallos pero no
  //    interrumpimos: queremos enviarle al máximo posible.
  let sent = 0;
  let failed = 0;
  const sentIds: string[] = [];

  for (const row of filteredRows) {
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

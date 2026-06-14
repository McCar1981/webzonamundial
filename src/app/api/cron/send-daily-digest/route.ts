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
import { kv } from "@vercel/kv";
import { requireCron } from "@/lib/auth-helpers";
import { recordHeartbeat } from "@/lib/ops/store";
import {
  listActiveSubscribers,
  markSent,
  buildUnsubscribeToken,
} from "@/lib/email-subscriptions";
import { sendDailyDigest } from "@/lib/email";
import { buildDigestData, DIGEST_LAST_SENT_KEY } from "@/lib/daily-digest";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel Hobby cap = 60s. Esto debería bastar para ~30-40 suscriptores
// con Resend respondiendo en ~1s cada uno.
export const maxDuration = 300;

const SITE = "https://zonamundial.app";

export async function GET(req: NextRequest) {
  const denied = requireCron(req);
  if (denied) return denied;

  // 1. Construir el contenido del email (partidos del día + noticias) con la
  //    lógica compartida en buildDigestData: lidera con los PARTIDOS DE HOY,
  //    prioriza las noticias del partido del día (por flags) y DEDUPLICA contra
  //    lo enviado en el último digest (slugs guardados en KV) para no repetir
  //    titulares día tras día. Si KV falla, seguimos sin dedup (no bloqueamos).
  let lastSent: string[] = [];
  try {
    lastSent = (await kv.get<string[]>(DIGEST_LAST_SENT_KEY)) ?? [];
  } catch {
    lastSent = [];
  }
  const { fixtures, fixturesAreToday, articles } = await buildDigestData({
    excludeSlugs: lastSent,
  });

  // Solo nos saltamos el envío si NO hay ni partidos ni noticias.
  if (articles.length === 0 && fixtures.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: "no_articles_or_fixtures",
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
        fixtures,
        fixturesAreToday,
        articles,
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

  // 5. Guardar los slugs enviados para no repetirlos en el próximo digest
  //    (TTL 3 días por si un cron falla). Best-effort: si KV falla, el peor
  //    caso es repetir titulares un día.
  if (sent > 0 && articles.length > 0) {
    try {
      await kv.set(
        DIGEST_LAST_SENT_KEY,
        articles.map((a) => a.slug),
        { ex: 3 * 24 * 60 * 60 },
      );
    } catch {
      /* noop */
    }
  }

  await recordHeartbeat("send-daily-digest", true, { sent, failed });

  return NextResponse.json({
    ok: true,
    articles: articles.length,
    subscribers: rows.length,
    sent,
    failed,
  });
}

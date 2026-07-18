// src/app/api/cron/daily-stats/route.ts
// GET /api/cron/daily-stats — disparado diariamente por Vercel Cron a las 09:00 UTC.
//
// Calcula un snapshot de las métricas clave (registros, founders, ingresos
// brutos en céntimos, posts del blog publicados) y se lo envía por email a
// la dirección configurada en CRON_REPORT_EMAIL.
//
// La autenticación de los crons de Vercel se hace mediante el header
// `Authorization: Bearer <CRON_SECRET>` (env var de Vercel) — si no
// está presente y la request no viene de Vercel, devolvemos 401.

import { NextRequest, NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { recordHeartbeat } from "@/lib/ops/store";
import { getCount as getRegistrosCount, getRealCount } from "@/lib/registros-store";
import { getFoundersCount, getRevenueCents, listEvents } from "@/lib/founders/store";
import { getAllPosts } from "@/lib/blog";
import { sendEmail, brandedEmail } from "@/lib/email";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KV_LAST_SNAPSHOT = "stats:daily:last";

interface Snapshot {
  date: string;
  registrosTotal: number;
  registrosReal: number;
  foundersCount: number;
  revenueCents: number;
  blogPosts: number;
  eventsToday: number;
}

export async function GET(request: NextRequest) {
  const denied = requireCron(request);
  if (denied) return denied;

  const today = new Date().toISOString().slice(0, 10);

  // Recolectamos métricas en paralelo
  const [registrosTotal, registrosReal, foundersCount, revenueCents, events] = await Promise.all([
    getRegistrosCount(),
    getRealCount(),
    getFoundersCount(),
    getRevenueCents(),
    listEvents(50),
  ]);

  const eventsToday = events.filter((e) => e.ts.startsWith(today)).length;

  const blogPosts = await (async () => {
    try {
      return (await getAllPosts()).length;
    } catch {
      return 0;
    }
  })();

  const snapshot: Snapshot = {
    date: today,
    registrosTotal,
    registrosReal,
    foundersCount,
    revenueCents,
    blogPosts,
    eventsToday,
  };

  // Comparamos con el snapshot del día anterior (si existe)
  const previousRaw = await kv.get(KV_LAST_SNAPSHOT);
  let previous: Snapshot | null = null;
  if (previousRaw) {
    try {
      previous = typeof previousRaw === "string" ? JSON.parse(previousRaw) : (previousRaw as Snapshot);
    } catch {
      previous = null;
    }
  }

  // Guardamos el snapshot de hoy
  await kv.set(KV_LAST_SNAPSHOT, JSON.stringify(snapshot));

  // Enviamos email si hay destinatario configurado
  const reportEmail = process.env.CRON_REPORT_EMAIL;
  let emailSent = false;
  if (reportEmail) {
    const delta = (current: number, prev: number | undefined) => {
      if (prev === undefined || prev === null) return "";
      const diff = current - prev;
      if (diff === 0) return "<span style='color:#a69a82'> (=)</span>";
      const sign = diff > 0 ? "+" : "";
      const color = diff > 0 ? "#10B981" : "#EF4444";
      return ` <span style='color:${color}'>(${sign}${diff})</span>`;
    };

    const html = brandedEmail({
      preheader: `Snapshot diario · ${today} · ${registrosReal} registros · ${foundersCount} founders`,
      heading: `📊 Snapshot diario — ${today}`,
      bodyHtml: `
        <p>Resumen de métricas clave de ZonaMundial al final del día anterior.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:10px 0;font-weight:600;">Registros (con base ficticia)</td>
            <td style="text-align:right;font-family:monospace;">${registrosTotal}${delta(registrosTotal, previous?.registrosTotal)}</td>
          </tr>
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:10px 0;font-weight:600;">Registros reales</td>
            <td style="text-align:right;font-family:monospace;">${registrosReal}${delta(registrosReal, previous?.registrosReal)}</td>
          </tr>
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:10px 0;font-weight:600;">Founders activos</td>
            <td style="text-align:right;font-family:monospace;">${foundersCount}${delta(foundersCount, previous?.foundersCount)}</td>
          </tr>
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:10px 0;font-weight:600;">Ingresos brutos (céntimos mezclados EUR+USD)</td>
            <td style="text-align:right;font-family:monospace;">${revenueCents}${delta(revenueCents, previous?.revenueCents)}</td>
          </tr>
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:10px 0;font-weight:600;">Posts blog publicados</td>
            <td style="text-align:right;font-family:monospace;">${blogPosts}${delta(blogPosts, previous?.blogPosts)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:600;">Eventos founders hoy</td>
            <td style="text-align:right;font-family:monospace;">${eventsToday}</td>
          </tr>
        </table>
        <p style="font-size:12px;color:#6b7280;">
          Snapshot generado automáticamente por el cron <code>/api/cron/daily-stats</code>.
        </p>
      `,
      ctaLabel: "Abrir panel admin",
      ctaHref: "https://zonamundial.app/admin/founders",
    });

    emailSent = await sendEmail({
      to: reportEmail,
      subject: `📊 Snapshot ZM — ${today} · ${foundersCount} founders · ${registrosReal} registros`,
      html,
    });
  }

  await recordHeartbeat("daily-stats", true, { registros: registrosReal, founders: foundersCount });

  return NextResponse.json({
    ok: true,
    snapshot,
    previous,
    emailSent,
    emailConfigured: !!reportEmail,
  });
}

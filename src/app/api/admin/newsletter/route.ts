// src/app/api/admin/newsletter/route.ts
// POST /api/admin/newsletter — envío masivo a la lista de registros.
//
// Protegido por la cookie zm_admin (middleware /admin/* + comprobación
// adicional aquí por si alguien llama directo al endpoint).
//
// Body: { subject: string, html: string, preheader?: string, dryRun?: boolean }
//
// Si dryRun=true devuelve la lista de destinatarios sin enviar nada.
// El envío real se hace en lotes de 25 con pausa de 1.5s entre lotes
// para evitar rate-limit del SMTP.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { listRegistros } from "@/lib/registros-store";
import { brandedEmail, sendResendBatch } from "@/lib/email";
import { listSupabaseUserEmails } from "@/lib/supabase-emails";
import { listNewsletterOptOuts, buildUnsubscribeToken } from "@/lib/email-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Con el Batch API (100 correos/petición) enviar ~2.500 es cuestión de segundos;
// dejamos margen amplio por si hay reintentos de backoff. (Vercel Pro.)
export const maxDuration = 300;

const CHUNK_SIZE = 100;        // máximo de correos por petición del Batch API de Resend
const REQUEST_DELAY_MS = 250;  // ~4 req/s, por debajo del límite de Resend (5 req/s)

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function checkAdmin(): Promise<boolean> {
  const cookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!cookie) return false;
  return isValidAdminCookie(cookie);
}

interface Body {
  subject?: string;
  html?: string;
  heading?: string;
  preheader?: string;
  ctaLabel?: string;
  ctaHref?: string;
  dryRun?: boolean;
  /** Origen de destinatarios. "usuarios" = TODOS los usuarios de Supabase. */
  kind?: "full" | "waitlist" | "usuarios" | "all";
  /** Limit de destinatarios (para pruebas). Por defecto sin límite. */
  limit?: number;
  /** Si viene, ENVÍA SOLO a esta dirección (prueba), ignorando lista y opt-outs. */
  testEmail?: string;
}

export async function POST(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const subject = (body.subject || "").trim();
  const heading = (body.heading || subject).trim();
  const html = (body.html || "").trim();
  if (!subject || !html || subject.length < 3) {
    return NextResponse.json(
      { error: "Faltan subject/html (mínimo 3 caracteres en subject)" },
      { status: 400 }
    );
  }

  // Envío de PRUEBA: si viene testEmail, mandamos SOLO a esa dirección (ignorando
  // la lista y los opt-outs) para previsualizar el correo real antes del disparo
  // masivo. Si no, construimos la lista normal según el origen.
  const testEmail = body.testEmail?.trim().toLowerCase();
  let unique: string[];
  if (testEmail && testEmail.includes("@")) {
    unique = [testEmail];
  } else {
    //  · "usuarios": TODOS los usuarios reales de Supabase (auth.users).
    //  · "all": registros KV + usuarios Supabase, deduplicado.
    //  · "full"/"waitlist"/sin kind: solo la lista KV de registros (como antes).
    const wantSupabase = body.kind === "usuarios" || body.kind === "all";
    const [registros, supaEmails] = await Promise.all([
      listRegistros(),
      wantSupabase ? listSupabaseUserEmails() : Promise.resolve([] as string[]),
    ]);

    const kvEmails =
      body.kind === "usuarios"
        ? []
        : registros
            .filter((r) => body.kind === "all" || !body.kind || r.kind === body.kind)
            .map((r) => r.email)
            .filter(Boolean);

    let pool = [...kvEmails, ...supaEmails]
      .map((e) => e.toLowerCase().trim())
      .filter(Boolean);

    // RGPD: respetar SIEMPRE las bajas de la newsletter (también en el dry-run).
    const optOuts = await listNewsletterOptOuts();
    pool = pool.filter((e) => !optOuts.has(e));

    // Deduplicar y aplicar límite opcional.
    unique = Array.from(new Set(pool));
    if (body.limit) unique = unique.slice(0, body.limit);
  }

  if (body.dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      count: unique.length,
      sample: unique.slice(0, 10),
    });
  }

  // Un correo POR destinatario (cada uno con su token de baja firmado en el pie,
  // RGPD), enviados vía Resend Batch API: 100 por petición para no pasar del rate
  // limit (5 req/s). Backoff exponencial si aun así rebota algún lote (429).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zonamundial.app";
  const items = unique.map((to) => ({
    to,
    subject,
    html: brandedEmail({
      preheader: body.preheader,
      heading,
      bodyHtml: html,
      ctaLabel: body.ctaLabel,
      ctaHref: body.ctaHref,
      unsubscribeUrl: `${siteUrl}/baja?token=${buildUnsubscribeToken({ email: to, kind: "newsletter" })}`,
    }),
  }));

  let sent = 0;
  let failed = 0;
  let lastError: string | undefined;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    let attempt = 0;
    for (;;) {
      const r = await sendResendBatch(chunk);
      if (r.error === "rate_limited" && attempt < 4) {
        attempt++;
        await sleep(REQUEST_DELAY_MS * Math.pow(2, attempt)); // 500, 1000, 2000, 4000 ms
        continue;
      }
      sent += r.sent;
      failed += r.failed;
      if (r.error) lastError = r.error;
      break;
    }
    if (i + CHUNK_SIZE < items.length) await sleep(REQUEST_DELAY_MS);
  }

  return NextResponse.json({
    ok: true,
    total: items.length,
    sent,
    failed,
    note: lastError ? `Algunos fallaron (último motivo: ${lastError}).` : undefined,
  });
}

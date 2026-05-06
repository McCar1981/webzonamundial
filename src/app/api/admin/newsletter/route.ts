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
import { sendEmail, brandedEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 1500;

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
  /** Filtro opcional: enviar sólo a este tipo de registro. */
  kind?: "full" | "waitlist" | "all";
  /** Limit de destinatarios (para pruebas). Por defecto sin límite. */
  limit?: number;
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

  // Listamos todos los registros (sin paginar) y filtramos
  const registros = await listRegistros();
  const filtered = registros.filter((r) => {
    if (body.kind === "all" || !body.kind) return true;
    return r.kind === body.kind;
  });
  const recipients = (body.limit ? filtered.slice(0, body.limit) : filtered)
    .map((r) => r.email)
    .filter(Boolean);

  // Quitar duplicados
  const unique = Array.from(new Set(recipients));

  if (body.dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      count: unique.length,
      sample: unique.slice(0, 10),
    });
  }

  // Renderizamos cuerpo con la plantilla branded
  const fullHtml = brandedEmail({
    preheader: body.preheader,
    heading,
    bodyHtml: html,
    ctaLabel: body.ctaLabel,
    ctaHref: body.ctaHref,
  });

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((to) => sendEmail({ to, subject, html: fullHtml }))
    );
    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value === true) sent++;
      else failed++;
    });
    // Pausa entre lotes salvo el último
    if (i + BATCH_SIZE < unique.length) await sleep(BATCH_DELAY_MS);
  }

  return NextResponse.json({
    ok: true,
    total: unique.length,
    sent,
    failed,
  });
}

// src/app/api/admin/reactivacion/route.ts
//
// GET /api/admin/reactivacion           → DRY-RUN: cuenta destinatarios únicos
//                                          de la base de registros y NO envía nada.
// GET /api/admin/reactivacion?confirm=ENVIAR → ENVÍO REAL del email de reactivación
//                                          "El Mundial ya rueda" a TODA la base.
//
// SEGURIDAD:
//   - Protegido por la cookie de admin (zm_admin), igual que el resto de /admin.
//   - Por defecto es DRY-RUN: hace falta ?confirm=ENVIAR explícito para enviar,
//     así un prefetch/apertura accidental NUNCA dispara el envío masivo.
//   - Lee los destinatarios del MISMO sitio que el panel /admin/registros
//     (listRegistros), deduplica por email y valida formato.
//
// BAJA (RGPD): cada email lleva un enlace de baja FIRMADO por persona
// (buildUnsubscribeToken → /api/notifications/digest/unsubscribe) y la cabecera
// List-Unsubscribe. El envío usa la API de Resend con la clave de SMTP_PASS.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { listRegistros } from "@/lib/registros-store";
import { buildUnsubscribeToken } from "@/lib/email-subscriptions";
import {
  REACTIVACION_HTML,
  REACTIVACION_SUBJECT,
} from "@/lib/emails/reactivacion-mundial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FROM = `ZonaMundial <${process.env.SMTP_FROM || "noreply@zonamundial.app"}>`;
const REPLY_TO = "gol@zonamundial.app";
const RESEND_KEY = process.env.SMTP_PASS || ""; // En config Resend, SMTP_PASS = API key (re_...)
const CONCURRENCY = 10;
const EMAIL_RX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function isAdmin(): Promise<boolean> {
  const cookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return !!cookie && (await isValidAdminCookie(cookie));
}

function maskEmail(e: string): string {
  const [u, d] = e.split("@");
  const head = u.length <= 2 ? u : u.slice(0, 2) + "***";
  return `${head}@${d}`;
}

/** Envía un email vía Resend con reintento ante 429/5xx. */
async function sendOne(origin: string, email: string): Promise<boolean> {
  const token = buildUnsubscribeToken({ email, kind: "daily-digest" });
  const unsub = `${origin}/api/notifications/digest/unsubscribe?token=${token}`;
  const html = REACTIVACION_HTML.split("{{unsubscribe_url}}").join(unsub);
  const body = JSON.stringify({
    from: FROM,
    to: [email],
    subject: REACTIVACION_SUBJECT,
    html,
    reply_to: REPLY_TO,
    headers: {
      "List-Unsubscribe": `<${unsub}>, <mailto:gol@zonamundial.app?subject=Baja>`,
    },
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body,
      });
      if (r.ok) return true;
      if (r.status === 429 || r.status >= 500) {
        await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
        continue;
      }
      return false; // 4xx no recuperable
    } catch {
      await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
    }
  }
  return false;
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!RESEND_KEY) {
    return NextResponse.json(
      { error: "SMTP_PASS (clave Resend) no configurada en el entorno" },
      { status: 500 },
    );
  }

  const origin = request.nextUrl.origin;
  const sp = request.nextUrl.searchParams;

  // Destinatarios: misma fuente que el panel, deduplicados y validados.
  const regs = await listRegistros();
  const seen = new Set<string>();
  for (const r of regs) {
    const e = (r.email || "").trim().toLowerCase();
    if (EMAIL_RX.test(e)) seen.add(e);
  }
  let emails = [...seen];

  // Permite trocear manualmente si hiciera falta: ?offset=0&limit=800
  const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10) || 0);
  const limitParam = parseInt(sp.get("limit") || "0", 10);
  const sliced = limitParam > 0 ? emails.slice(offset, offset + limitParam) : emails.slice(offset);

  if (sp.get("confirm") !== "ENVIAR") {
    return NextResponse.json({
      dryRun: true,
      registrosBrutos: regs.length,
      destinatariosUnicos: emails.length,
      enEsteLote: sliced.length,
      muestra: sliced.slice(0, 5).map(maskEmail),
      paraEnviar: `${origin}/api/admin/reactivacion?confirm=ENVIAR`,
    });
  }

  // ENVÍO REAL con límite de concurrencia.
  let sent = 0;
  let failed = 0;
  let idx = 0;
  async function worker() {
    while (idx < sliced.length) {
      const i = idx++;
      const ok = await sendOne(origin, sliced[i]);
      if (ok) sent++;
      else failed++;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  return NextResponse.json({
    ok: true,
    destinatariosUnicos: emails.length,
    intentados: sliced.length,
    enviados: sent,
    fallidos: failed,
    offset,
  });
}

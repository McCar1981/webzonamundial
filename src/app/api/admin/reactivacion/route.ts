// src/app/api/admin/reactivacion/route.ts
//
// GET /api/admin/reactivacion               → DRY-RUN: cuenta los usuarios REALES
//                                              (auth.users de Supabase) y NO envía.
// GET /api/admin/reactivacion?confirm=ENVIAR → ENVÍO REAL del email de reactivación.
//
// FUENTE DE DESTINATARIOS: auth.users de Supabase (los usuarios que de verdad
// iniciaron sesión, ~2.164). NO el KV de pre-registros (~559) ni el seed de demo
// del CSV (~8.642 ficticios). Se lee con SUPABASE_SERVICE_ROLE_KEY contra el
// admin API de Supabase, mismo patrón que src/app/api/auth/check-email/route.ts.
//
// SEGURIDAD:
//   - Cookie admin (zm_admin), igual que el resto de /admin.
//   - DRY-RUN por defecto: hace falta ?confirm=ENVIAR explícito para enviar, así
//     un prefetch/apertura accidental NUNCA dispara el envío masivo.
//   - Filtra direcciones de rol (noreply@, postmaster@, …) y emails inválidos.
//
// BAJA (RGPD): cada email lleva enlace de baja FIRMADO por persona
// (buildUnsubscribeToken → /api/notifications/digest/unsubscribe) + cabecera
// List-Unsubscribe. Envío vía Resend (SMTP_PASS) en lotes concurrentes.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
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
const ROLE_PREFIXES = [
  "noreply@",
  "no-reply@",
  "donotreply@",
  "postmaster@",
  "mailer-daemon@",
  "abuse@",
];

async function isAdmin(): Promise<boolean> {
  const cookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return !!cookie && (await isValidAdminCookie(cookie));
}

function maskEmail(e: string): string {
  const [u, d] = e.split("@");
  const head = u.length <= 2 ? u : u.slice(0, 2) + "***";
  return `${head}@${d}`;
}

/**
 * Lee TODOS los emails de auth.users vía Supabase Admin API, paginado.
 * Termina cuando una página viene vacía (robusto ante el cap real de per_page).
 */
async function fetchAllAuthEmails(): Promise<{ emails: string[]; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { emails: [], error: "Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" };
  }
  const set = new Set<string>();
  const perPage = 1000;
  for (let page = 1; page <= 200; page++) {
    const resp = await fetch(
      `${url}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    if (!resp.ok) {
      if (page === 1) return { emails: [], error: `Supabase admin API ${resp.status}` };
      break;
    }
    const data = (await resp.json()) as { users?: Array<{ email?: string | null }> };
    const users = data.users ?? [];
    if (users.length === 0) break;
    for (const u of users) {
      const e = (u.email || "").trim().toLowerCase();
      if (!EMAIL_RX.test(e)) continue;
      if (ROLE_PREFIXES.some((p) => e.startsWith(p))) continue;
      set.add(e);
    }
  }
  return { emails: [...set] };
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
      return false;
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

  // Destinatarios reales: auth.users de Supabase (dedup + validados + sin rol).
  const { emails: all, error } = await fetchAllAuthEmails();
  if (error) return NextResponse.json({ error }, { status: 500 });

  // Permite trocear si hiciera falta: ?offset=0&limit=800
  const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10) || 0);
  const limitParam = parseInt(sp.get("limit") || "0", 10);
  const sliced = limitParam > 0 ? all.slice(offset, offset + limitParam) : all.slice(offset);

  if (sp.get("confirm") !== "ENVIAR") {
    return NextResponse.json({
      dryRun: true,
      fuente: "supabase auth.users",
      usuariosReales: all.length,
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
    fuente: "supabase auth.users",
    usuariosReales: all.length,
    intentados: sliced.length,
    enviados: sent,
    fallidos: failed,
    offset,
  });
}

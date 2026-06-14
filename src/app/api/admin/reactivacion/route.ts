// src/app/api/admin/reactivacion/route.ts
//
// Envío de la campaña de reactivación a los usuarios REALES (Supabase auth.users),
// en TANDAS y de forma IDEMPOTENTE (nunca envía dos veces al mismo email).
//
// Acciones (GET, siempre con cookie admin zm_admin):
//   (sin params)                     → DRY-RUN: cuántos reales, cuántos ya enviados,
//                                       cuántos pendientes (NO envía).
//   ?confirm=ENVIAR[&limit=N]        → envía la siguiente tanda de PENDIENTES
//                                       (por defecto 400). Repetir hasta pendientes=0.
//   ?markSentFirst=N                 → marca los PRIMEROS N reales como "ya enviados"
//                                       SIN enviar (para saltar lo que ya salió en el
//                                       intento que se cortó por timeout). NO envía.
//   ?reset=SI                        → vacía el registro de enviados (empezar de cero).
//
// Idempotencia: KV Set `reactivacion:sent` con los emails ya enviados. Cada envío
// con éxito hace SADD inmediato → si la función se corta, lo ya enviado queda
// registrado y la siguiente tanda NO lo repite.
//
// FUENTE: auth.users vía SUPABASE_SERVICE_ROLE_KEY (admin API, paginado).
// BAJA (RGPD): enlace firmado por persona + List-Unsubscribe. Envío vía Resend.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { kv } from "@vercel/kv";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { buildUnsubscribeToken } from "@/lib/email-subscriptions";
import {
  REACTIVACION_HTML,
  REACTIVACION_SUBJECT,
} from "@/lib/emails/reactivacion-mundial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SENT_KEY = "reactivacion:sent";
const FROM = `ZonaMundial <${process.env.SMTP_FROM || "noreply@zonamundial.app"}>`;
const REPLY_TO = "gol@zonamundial.app";
const RESEND_KEY = process.env.SMTP_PASS || "";
const CONCURRENCY = 5; // suave con el rate-limit de Resend
const DEFAULT_LIMIT = 400; // tanda por invocación (cabe de sobra en el timeout)
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

/** TODOS los emails de auth.users (Supabase Admin API), paginado, en orden estable. */
async function fetchAllAuthEmails(): Promise<{ emails: string[]; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { emails: [], error: "Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" };
  }
  const seen = new Set<string>();
  const ordered: string[] = [];
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
      if (seen.has(e)) continue;
      seen.add(e);
      ordered.push(e);
    }
  }
  return { emails: ordered };
}

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

  // Acción: reset del registro de enviados.
  if (sp.get("reset") === "SI") {
    await kv.del(SENT_KEY);
    return NextResponse.json({ ok: true, accion: "reset", registroEnviadosVaciado: true });
  }

  const { emails: all, error } = await fetchAllAuthEmails();
  if (error) return NextResponse.json({ error }, { status: 500 });

  // Acción: descargar la lista COMPLETA de emails reales (auth.users), uno por
  // línea, como archivo. Sirve para cruzarla con los ya enviados (export de
  // Resend) y saber EXACTAMENTE cuáles faltan, sin duplicar.
  if (sp.get("dump") === "SI") {
    return new NextResponse(all.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "attachment; filename=zonamundial-usuarios-reales.txt",
      },
    });
  }

  const sentArr = (await kv.smembers(SENT_KEY)) as string[];
  const sentSet = new Set(sentArr ?? []);

  // Acción: marcar los primeros N como ya enviados (para saltar lo del intento cortado).
  const markFirst = parseInt(sp.get("markSentFirst") || "0", 10);
  if (markFirst > 0) {
    const toMark = all.slice(0, markFirst).filter((e) => !sentSet.has(e));
    for (let i = 0; i < toMark.length; i += 200) {
      const batch = toMark.slice(i, i + 200);
      if (batch.length) await kv.sadd(SENT_KEY, ...batch);
    }
    return NextResponse.json({
      ok: true,
      accion: "markSentFirst",
      marcadosAhora: toMark.length,
      yaEnviadosTotal: sentSet.size + toMark.length,
      reales: all.length,
    });
  }

  const pending = all.filter((e) => !sentSet.has(e));

  if (sp.get("confirm") !== "ENVIAR") {
    return NextResponse.json({
      dryRun: true,
      fuente: "supabase auth.users",
      reales: all.length,
      yaEnviados: sentSet.size,
      pendientes: pending.length,
      muestraPendientes: pending.slice(0, 5).map(maskEmail),
      paraEnviarTanda: `${origin}/api/admin/reactivacion?confirm=ENVIAR`,
    });
  }

  // Envío de UNA tanda de pendientes.
  const limit = Math.max(1, parseInt(sp.get("limit") || "", 10) || DEFAULT_LIMIT);
  const tanda = pending.slice(0, limit);

  let sent = 0;
  let failed = 0;
  let idx = 0;
  async function worker() {
    while (idx < tanda.length) {
      const i = idx++;
      const email = tanda[i];
      const ok = await sendOne(origin, email);
      if (ok) {
        sent++;
        try {
          await kv.sadd(SENT_KEY, email);
        } catch {
          /* si falla el registro, peor un posible duplicado que un fallo de envío */
        }
      } else {
        failed++;
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const pendientesRestantes = pending.length - sent;
  return NextResponse.json({
    ok: true,
    reales: all.length,
    enviadosEnEstaTanda: sent,
    fallidosEnEstaTanda: failed,
    yaEnviadosTotal: sentSet.size + sent,
    pendientesRestantes,
    terminado: pendientesRestantes <= 0,
    siguiente:
      pendientesRestantes > 0
        ? `${origin}/api/admin/reactivacion?confirm=ENVIAR`
        : "completado",
  });
}

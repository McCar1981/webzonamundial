// POST /api/app-link/email
// Body: { email: string }
//
// Env\u00eda un email con el link de descarga a la app m\u00f3vil al usuario.
// Pensado para "estoy en PC, mand\u00e1melo al m\u00f3vil".
//
// Rate limit: 3 env\u00edos por IP cada 60s (anti-spam).
// No guarda el email en base de datos \u2014 es transaccional puro.

import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { sendEmail, brandedEmail, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://zonamundial.app";
const RATE_LIMIT_WINDOW_S = 60;
const RATE_LIMIT_MAX = 3;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function checkRateLimit(ip: string): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return true; // dev local sin KV
  }
  try {
    const key = `app-link:rate:${ip}`;
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW_S);
    }
    return count <= RATE_LIMIT_MAX;
  } catch {
    return true;
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429 },
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const raw = body?.email;
  if (typeof raw !== "string") {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  const email = raw.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  // El email es transaccional simple. No guardamos. No suscribimos.
  // Solo enviamos el link de descarga.
  const downloadUrl = `${SITE}/descarga?utm_source=email&utm_medium=app-link&utm_campaign=self-send`;

  const html = brandedEmail({
    preheader: "Tu enlace para descargar ZonaMundial en el m\u00f3vil",
    heading: "Aqu\u00ed tienes el enlace para tu m\u00f3vil",
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3D3D5C;">
        Ped\u00edste que te env\u00ediemos el enlace de descarga al email para
        instalar ZonaMundial en tu m\u00f3vil.
      </p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#3D3D5C;">
        \ud83d\udc47 Abre este email <strong>desde tu m\u00f3vil</strong> y pulsa el bot\u00f3n
        de abajo. Te llevar\u00e1 a la p\u00e1gina de descarga adaptada a tu
        dispositivo (iOS o Android).
      </p>
      <p style="margin:18px 0 0;font-size:12px;color:#94A3B8;line-height:1.5;text-align:center;">
        Si abriste este email en el PC: el bot\u00f3n te lleva a la misma p\u00e1gina
        con el QR y otras opciones de env\u00edo.
      </p>
    `,
    ctaLabel: "Descargar ZonaMundial",
    ctaHref: downloadUrl,
  });

  const ok = await sendEmail({
    to: email,
    subject: "\ud83d\udcf1 Tu enlace para descargar ZonaMundial",
    html,
  });

  if (!ok) {
    return NextResponse.json(
      { error: "send_failed" },
      { status: 500 },
    );
  }

  // Evita filtrar al cliente exactamente lo que recibimos.
  // El IP rate-limit ya nos protege de scraping de existencia.
  void escapeHtml; // no usado, importado por si extendemos
  return NextResponse.json({ ok: true });
}

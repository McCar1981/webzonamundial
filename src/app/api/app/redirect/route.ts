// GET /api/app/redirect
//
// Smart Link \u2014 \u00fanico destino del QR de descarga.
// ZonaMundial es una webapp instalable (PWA): no hay tiendas. El QR lleva
// siempre a /descarga, donde el usuario puede instalarla en su pantalla de
// inicio (Android/desktop: prompt nativo; iOS: Compartir \u2192 A\u00f1adir a inicio).
//
// Tracking: incrementa contadores en KV por plataforma para anal\u00edtica.
//   `app:redirect:total` y `app:redirect:ios`, `:android`, `:desktop`.

import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://zonamundial.app";

type Platform = "ios" | "android" | "desktop" | "other";

function detectPlatform(userAgent: string): Platform {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows|macintosh|linux|x11/.test(ua)) return "desktop";
  return "other";
}

async function incrementCounter(key: string): Promise<void> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
  try {
    await kv.incr(key);
  } catch {
    // No bloqueamos el redirect por anal\u00edtica.
  }
}

export async function GET(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "";
  const platform = detectPlatform(userAgent);
  const searchParams = req.nextUrl.searchParams;
  const utmSource = searchParams.get("utm_source") || "qr";

  // T\u00e9rmino para anal\u00edtica: combina plataforma + source.
  void incrementCounter("app:redirect:total");
  void incrementCounter(`app:redirect:${platform}`);
  void incrementCounter(`app:redirect:source:${utmSource}`);

  // Webapp instalable: todos los dispositivos van a /descarga, donde pueden
  // instalar la PWA (o usarla directamente en el navegador).
  const destination = `${SITE}/descarga?utm_source=${encodeURIComponent(utmSource)}&utm_medium=qr-${platform}`;

  return NextResponse.redirect(destination, { status: 302 });
}

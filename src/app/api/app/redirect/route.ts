// GET /api/app/redirect
//
// Smart Link \u2014 \u00fanico destino del QR de descarga.
// Detecta el User-Agent del dispositivo y redirige al lugar correcto:
//
//   iOS    \u2192 App Store (cuando est\u00e9 publicada) o /registro mientras tanto
//   Android \u2192 Google Play (cuando est\u00e9 publicada) o /registro mientras tanto
//   Desktop \u2192 /descarga (donde puede ver el QR + form email/wa)
//   Bot/crawler \u2192 /descarga (landing p\u00fablica con SEO)
//
// Tracking: incrementa contadores en KV por plataforma para anal\u00edtica.
//   `app:redirect:total` y `app:redirect:ios`, `:android`, `:desktop`.
//
// Cuando salgan las URLs reales de App Store / Play Store, solo hay que
// cambiar APP_STORE_URL y PLAY_STORE_URL aqu\u00ed \u2014 ni un cambio m\u00e1s en
// ning\u00fan otro sitio.

import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://zonamundial.app";

// TODO: Cuando la app est\u00e9 publicada, sustituir estas URLs por las reales.
// Ejemplo:
//   const APP_STORE_URL = "https://apps.apple.com/app/zonamundial/id1234567890";
//   const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.zonamundial.ios";
const APP_STORE_URL: string | null = null;
const PLAY_STORE_URL: string | null = null;

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

  // Decidir destino seg\u00fan plataforma + disponibilidad de la app.
  let destination: string;

  if (platform === "ios" && APP_STORE_URL) {
    destination = APP_STORE_URL;
  } else if (platform === "android" && PLAY_STORE_URL) {
    destination = PLAY_STORE_URL;
  } else if (platform === "ios" || platform === "android") {
    // App a\u00fan no publicada: a /registro con UTM para tracking.
    destination = `${SITE}/registro?utm_source=${encodeURIComponent(utmSource)}&utm_medium=qr-${platform}&utm_campaign=pre-registro`;
  } else {
    // Desktop o bot: a /descarga con QR + form.
    destination = `${SITE}/descarga?utm_source=${encodeURIComponent(utmSource)}&utm_medium=qr-${platform}`;
  }

  return NextResponse.redirect(destination, { status: 302 });
}

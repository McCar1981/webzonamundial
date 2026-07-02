// POST /api/zona-futbol/reservar
// Body: { email, website? }
//
// Captura de email (SIN cuenta) desde la landing puente a "Zona Futbol" (la
// temporada de ligas de clubes). El tráfico del Mundial se evapora con la final
// del 19-jul; esta lista es el puente que convierte a esa audiencia orgánica en
// el arranque de la próxima temporada. Cada email capturado ahora vale más que
// cualquier banner.
//
// Reutiliza subscribe({kind:'daily-digest'}) — la ÚNICA lista con cron de envío
// y baja (unsubscribe) ya en producción — con source='zona-futbol-waitlist' para
// poder segmentar estos leads y avisarles al lanzar. Efecto colateral bueno: los
// mantiene calientes con el resumen del fútbol hasta entonces (retención).
// NO toca auth ni el formulario de registro.
//
// SEGURIDAD (mismo endurecimiento que /api/terceros/avisame):
//  - fail-CLOSED: sin KV o ante error → BLOQUEA (nunca sin freno).
//  - IP de confianza de Vercel (x-vercel-forwarded-for), no el x-forwarded-for
//    falsificable por el cliente.
//  - tope por IP + tope GLOBAL por hora.
//  - honeypot (campo oculto) contra bots.
// Doble opt-in omitido a propósito (reintroduciría la fricción del viaje al
// correo que esta captura evita); rate-limit + baja en 1 clic acotan el abuso.

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { subscribe } from "@/lib/email-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IP_WINDOW_S = 600; // 10 min
const IP_MAX = 5; // altas por IP / ventana
const GLOBAL_WINDOW_S = 3600; // 1 h
const GLOBAL_MAX = 120; // tope global/hora

function trustedIp(request: Request): string {
  return (
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Fail-CLOSED: sin KV o ante error, BLOQUEA. Tope por IP + tope global/hora.
async function allowed(ip: string): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return false;
  try {
    const gKey = `zonafutbol:rate:global:${Math.floor(Date.now() / 1000 / GLOBAL_WINDOW_S)}`;
    const g = await kv.incr(gKey);
    if (g === 1) await kv.expire(gKey, GLOBAL_WINDOW_S);
    if (g > GLOBAL_MAX) return false;

    const ipKey = `zonafutbol:rate:ip:${ip}`;
    const c = await kv.incr(ipKey);
    if (c === 1) await kv.expire(ipKey, IP_WINDOW_S);
    return c <= IP_MAX;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: { email?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Honeypot: campo oculto que solo rellenan los bots. Fingimos éxito sin tocar
  // la lista (no damos pistas al bot).
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  if (!(await allowed(trustedIp(request)))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const result = await subscribe({
    email,
    kind: "daily-digest",
    source: "zona-futbol-waitlist",
  });
  if (!result.ok) {
    console.error("[zona-futbol/reservar] subscribe failed:", result.error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

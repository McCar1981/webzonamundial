// POST /api/terceros/avisame
// Body: { email, website? }
//
// Captura ANÓNIMA de email (SIN cuenta) desde la landing #1 de tráfico
// (/grupos/mejores-terceros). Ataca el cuello REAL del embudo: el ~98,7% de la
// ola que NO se registra porque su intención es informacional ("¿pasa mi
// selección?"). En vez de pedirle un alta (que no quiere), le pedimos lo único
// que le importa AHORA con fricción mínima (1 campo): su email para el resumen
// diario del Mundial, que cubre la carrera de grupos hasta el cierre (27-jun) y
// reimpacta en eliminatorias (julio).
//
// Reutiliza subscribe({kind:'daily-digest'}) — MISMA lista que la auto-
// suscripción de /api/registro, con cron de envío y baja (unsubscribe) ya en
// prod. source='terceros-aviso' permite contar estos leads por sí solos.
// NO toca auth ni el formulario de registro.
//
// SEGURIDAD (endpoint público que escribe en la lista de un dominio en warm-up):
//  - fail-CLOSED como /api/registro: sin KV o ante error → BLOQUEA (nunca queda
//    sin freno, ni siquiera en un incidente de KV).
//  - IP de confianza de Vercel (x-vercel-forwarded-for), NO el primer token de
//    x-forwarded-for (que el cliente puede falsificar).
//  - tope por IP + tope GLOBAL por hora (cinturón contra IPs distribuidas).
//  - honeypot (campo oculto) contra bots.
// El doble opt-in se omite a propósito: reintroduciría el viaje al correo que es
// justo la fricción que esta captura evita; el rate-limit + la baja en 1 clic
// acotan el abuso.

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { subscribe } from "@/lib/email-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IP_WINDOW_S = 600; // 10 min
const IP_MAX = 5; // altas por IP / ventana
const GLOBAL_WINDOW_S = 3600; // 1 h
const GLOBAL_MAX = 120; // tope global/hora (legítimo esperado ~10-30/h)

// En Vercel, x-vercel-forwarded-for es la IP real inyectada por el edge (de
// confianza), a diferencia del primer token de x-forwarded-for (lo envía el
// cliente y es falsificable). Caemos a x-real-ip y, en último término, 'unknown'.
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
    const gKey = `terceros:rate:global:${Math.floor(Date.now() / 1000 / GLOBAL_WINDOW_S)}`;
    const g = await kv.incr(gKey);
    if (g === 1) await kv.expire(gKey, GLOBAL_WINDOW_S);
    if (g > GLOBAL_MAX) return false;

    const ipKey = `terceros:rate:ip:${ip}`;
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
    source: "terceros-aviso",
  });
  if (!result.ok) {
    console.error("[terceros/avisame] subscribe failed:", result.error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

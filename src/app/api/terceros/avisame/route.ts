// POST /api/terceros/avisame
// Body: { email }
//
// Captura ANÓNIMA de email (SIN cuenta) desde la landing #1 de tráfico
// (/grupos/mejores-terceros). Ataca el cuello REAL del embudo: el ~98,7% de la
// ola que NO se registra porque su intención es informacional ("¿pasa mi
// selección?"). En vez de pedirle un alta (que no quiere), le pedimos lo único
// que le importa AHORA y con fricción mínima (1 campo): su email para el
// resumen diario del Mundial, que cubre la carrera de terceros hasta el cierre
// de grupos (27-jun) y reimpacta en eliminatorias (julio).
//
// Reutiliza subscribe({kind:'daily-digest'}) — MISMA lista que la auto-
// suscripción de /api/registro, con cron de envío y baja (unsubscribe) ya en
// prod. source='terceros-aviso' permite contar estos leads por sí solos.
// NO toca auth ni el formulario de registro.

import { NextResponse } from "next/server";
import { subscribe } from "@/lib/email-subscriptions";
import { rateLimitByUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  // Rate-limit por IP (degrada sin KV): protege la reputación del dominio
  // (en warm-up) frente a envíos masivos de emails basura.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByUser(ip, "terceros-avisame", 5, 600);
  if (rl.limited) {
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

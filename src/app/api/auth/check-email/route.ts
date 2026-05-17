import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  POST /api/auth/check-email
  Body: { email: string }
  Resp: { exists: boolean, provider?: 'email' | 'google' | 'apple' }

  Comprueba si un email ya está dado de alta en auth.users de Supabase.
  Se usa antes de signInWithOtp en FormularioRegistro para advertir al
  usuario que ya tiene cuenta (en vez de enviarle un magic link genérico
  que él interpreta como "no funcionó").

  SEGURIDAD — este endpoint es un oráculo de emails registrados. Mitigaciones:
    - Rate limit por IP via Vercel KV (5 req / 60s).
    - Devuelve solo { exists, provider }, nunca user_id ni timestamps.
    - No registra emails consultados.
    - Fail-open: si no podemos consultar, devolvemos exists:false para
      no bloquear el flujo de registro.

  Implementación:
    Llamamos al endpoint REST de admin de Supabase:
      GET {SUPABASE_URL}/auth/v1/admin/users?email={email}
    Devuelve { users: [...] } con 0 o 1 elemento.

  Env vars:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY      ← Sensitive en Vercel
    KV_REST_API_URL/TOKEN          (opcional para rate limit)
*/

const RATE_LIMIT_WINDOW_S = 60;
const RATE_LIMIT_MAX = 5;

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
    const key = `check-email:rate:${ip}`;
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW_S);
    }
    return count <= RATE_LIMIT_MAX;
  } catch {
    return true; // fail-open
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[check-email] SUPABASE_SERVICE_ROLE_KEY missing");
    return NextResponse.json({ exists: false });
  }

  try {
    // Llamada REST directa al admin endpoint con filtro por email.
    // Es exactamente lo que hace el dashboard de Supabase internamente.
    const adminUrl = `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(`email.eq.${email}`)}`;
    const resp = await fetch(adminUrl, {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: "no-store",
    });

    if (!resp.ok) {
      console.error("[check-email] admin API error:", resp.status, resp.statusText);
      return NextResponse.json({ exists: false });
    }

    const data = (await resp.json()) as {
      users?: Array<{
        email?: string;
        app_metadata?: { provider?: string };
      }>;
    };

    const users = data.users ?? [];
    // Algunos despliegues no soportan filter — match en memoria por seguridad.
    const match = users.find((u) => u.email?.toLowerCase() === email);
    const exists = !!match;
    const provider = match?.app_metadata?.provider;

    return NextResponse.json({ exists, ...(provider ? { provider } : {}) });
  } catch (err) {
    console.error("[check-email] unexpected error:", (err as Error).message);
    return NextResponse.json({ exists: false });
  }
}

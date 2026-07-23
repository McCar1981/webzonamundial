// GET /api/health
//
// Endpoint de health-check pensado para monitoring externo (UptimeRobot,
// BetterStack, Pingdom, etc.).
//
// Diseño:
//   - Responde SIEMPRE en <2 segundos. Si una dependencia tarda, marcamos
//     "degraded" pero NO bloqueamos el response.
//   - Comprueba 3 cosas críticas: env vars, Supabase ping, Vercel KV ping.
//   - Devuelve 200 si todo OK, 503 si alguna dep crítica falla.
//   - NO expone valores de secrets — solo dice "present"/"missing".
//   - Cache: max-age=0 para que UptimeRobot vea estado real cada vez.
//
// Formato de respuesta:
//   {
//     "ok": true|false,
//     "status": "healthy"|"degraded"|"unhealthy",
//     "checks": {
//       "env":      { "ok": true, ... },
//       "supabase": { "ok": true, "latencyMs": 42 },
//       "kv":       { "ok": true, "latencyMs": 18 }
//     },
//     "timestamp": "ISO-8601",
//     "uptime_s": 1234
//   }

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { createClient } from "@supabase/supabase-js";
import { getApiFootballStatus } from "@/lib/competitions/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

// Variables de entorno que el sitio NO puede operar sin ellas.
const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "CRON_SECRET",
] as const;

function checkEnvVars(): CheckResult {
  const missing: string[] = [];
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) missing.push(key);
  }
  if (missing.length > 0) {
    // H-001-26: no exponer qué variables faltan (info disclosure).
    return { ok: false, error: `env_vars_missing (${missing.length})` };
  }
  return { ok: true };
}

async function checkSupabase(): Promise<CheckResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, error: "config_missing" };

  const start = Date.now();
  try {
    const client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    // SELECT count cheap — touches DB without scanning large tables.
    const { error } = await Promise.race([
      client.from("profiles").select("id", { count: "exact", head: true }),
      new Promise<{ error: { message: string } }>((_, reject) =>
        setTimeout(() => reject(new Error("timeout_1500ms")), 1500),
      ),
    ]);
    const latencyMs = Date.now() - start;
    if (error) return { ok: false, latencyMs, error: error.message };
    return { ok: true, latencyMs };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: (err as Error).message,
    };
  }
}

// api-football: la web de "Zona de Ligas" no sirve datos sin ella, pero SU caída
// no debe disparar un 503 de UptimeRobot (el resto del sitio funciona). La
// incluimos como check INFORMATIVO con el consumo de cuota del día, para que un
// "100% used" (que vacía ligas/clubes con 404) sea VISIBLE aquí y no invisible.
interface ApiFootballCheck extends CheckResult {
  // Solo el % de cuota consumida (señal operativa). NO exponemos límite absoluto
  // ni nombre de plan en un endpoint público (info disclosure; ver H-001-26).
  usedPct?: number;
}

async function checkApiFootball(): Promise<ApiFootballCheck> {
  const start = Date.now();
  try {
    const status = await Promise.race([
      getApiFootballStatus(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("timeout_1500ms")), 1500),
      ),
    ]);
    const latencyMs = Date.now() - start;
    if (!status) return { ok: false, latencyMs, error: "no_response_or_key_missing" };
    const usedPct = status.limit > 0 ? Math.round((status.used / status.limit) * 100) : 0;
    // "ok" mientras la clave responda y quede cuota; sin cuota => degradado.
    return {
      ok: status.active && status.used < status.limit,
      latencyMs,
      usedPct,
    };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, error: (err as Error).message };
  }
}

async function checkKv(): Promise<CheckResult> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return { ok: false, error: "config_missing" };
  }
  const start = Date.now();
  try {
    // PING-like: GET de una key que no existe — Upstash responde rápido.
    await Promise.race([
      kv.get("__health_ping__"),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("timeout_1500ms")), 1500),
      ),
    ]);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: (err as Error).message,
    };
  }
}

// Tiempo de inicio del proceso para calcular uptime aproximado del lambda.
// Vercel reutiliza el container N veces, así que este uptime es del cold start
// más reciente, no de la web entera. Es útil para detectar restarts frecuentes.
const PROCESS_START_MS = Date.now();

export async function GET() {
  const [envCheck, supabaseCheck, kvCheck, apiFootballCheck] = await Promise.all([
    Promise.resolve(checkEnvVars()),
    checkSupabase(),
    checkKv(),
    checkApiFootball(),
  ]);

  // Status overall:
  //  - "healthy"   → todos OK
  //  - "degraded"  → env OK pero alguna dep lenta o caída no crítica
  //  - "unhealthy" → env mal o Supabase caído (Supabase es crítico)
  let status: "healthy" | "degraded" | "unhealthy";
  let httpStatus: number;

  if (!envCheck.ok || !supabaseCheck.ok) {
    status = "unhealthy";
    httpStatus = 503;
  } else if (!kvCheck.ok || !apiFootballCheck.ok) {
    // KV y api-football son no-críticos para "está el sitio en pie": marcamos
    // degraded pero devolvemos 200 para que UptimeRobot no avise por un fallo
    // no crítico. api-football sin cuota vacía ligas/clubes pero el resto va.
    status = "degraded";
    httpStatus = 200;
  } else {
    status = "healthy";
    httpStatus = 200;
  }

  const response = {
    ok: status === "healthy",
    status,
    checks: {
      env: envCheck,
      supabase: supabaseCheck,
      kv: kvCheck,
      apifootball: apiFootballCheck,
    },
    timestamp: new Date().toISOString(),
    uptime_s: Math.round((Date.now() - PROCESS_START_MS) / 1000),
    // H-001-26: no exponer región ni uptime (info disclosure mínima).
    // region: process.env.VERCEL_REGION ?? null,
  };

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
    },
  });
}

// HEAD/OPTIONS — algunos monitorings hacen HEAD en lugar de GET para
// ahorrar transferencia. Devolvemos 200 si las deps críticas están,
// sin contenido. UptimeRobot por defecto hace GET, pero damos soporte.
export async function HEAD() {
  const envCheck = checkEnvVars();
  if (!envCheck.ok) {
    return new NextResponse(null, { status: 503 });
  }
  const supabaseCheck = await checkSupabase();
  if (!supabaseCheck.ok) {
    return new NextResponse(null, { status: 503 });
  }
  return new NextResponse(null, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

// src/app/api/admin/monitor/route.ts
//
// API del panel de control. Dos vías de auth (cualquiera vale):
//   1) Cookie de admin (zm_admin): si ya entraste en /admin con tu contraseña,
//      el monitor confía en esa sesión y NO necesitas ningún token.
//   2) ADMIN_TOKEN (Bearer o ?token=): para accesos externos sin sesión (cron,
//      monitoreo de terceros).
//   GET  → último report + history + incidentes abiertos.
//   POST → ejecuta runMonitor() bajo demanda ("escanear ahora").

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { getLatestReport, getHistory, getIncident } from "@/lib/ops/store";
import { ENDPOINT_PROBES, CRON_WATCHES } from "@/lib/ops/config";
import { ADVANCED_CHECK_NAMES } from "@/lib/ops/checks";
import { runMonitor } from "@/lib/ops/monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function checkAuth(request: NextRequest): Promise<{ ok: boolean; reason?: string }> {
  // 1) Sesión de admin por cookie (lo normal: ya entraste en /admin).
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookie && (await isValidAdminCookie(cookie))) return { ok: true };

  // 2) Token explícito (acceso externo sin sesión).
  const token = process.env.ADMIN_TOKEN;
  if (token) {
    const auth = request.headers.get("authorization") || "";
    const headerToken = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    const queryToken = request.nextUrl.searchParams.get("token") || "";
    const provided = headerToken || queryToken;
    if (provided && provided === token) return { ok: true };
  }

  // Ni cookie válida ni token válido.
  return { ok: false, reason: token ? "unauthorized" : "not_configured" };
}

function deny(reason?: string) {
  if (reason === "not_configured") {
    return NextResponse.json({ error: "ADMIN_TOKEN no configurado en el servidor" }, { status: 503 });
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function collectIncidents() {
  const keys = [
    ...ENDPOINT_PROBES.map((p) => `endpoint:${p.name}`),
    ...CRON_WATCHES.map((w) => `cron:${w.job}`),
    ...ADVANCED_CHECK_NAMES.map((n) => `check:${n}`),
  ];
  const states = await Promise.all(keys.map((k) => getIncident(k)));
  return states.filter(Boolean);
}

export async function GET(request: NextRequest) {
  const auth = await checkAuth(request);
  if (!auth.ok) return deny(auth.reason);

  const historyLimit = Number(request.nextUrl.searchParams.get("history") || "100");
  const [latest, history, incidents] = await Promise.all([
    getLatestReport(),
    getHistory(Number.isFinite(historyLimit) ? historyLimit : 100),
    collectIncidents(),
  ]);

  return NextResponse.json(
    { ok: true, latest, history, incidents, watching: { endpoints: ENDPOINT_PROBES, crons: CRON_WATCHES } },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth(request);
  if (!auth.ok) return deny(auth.reason);
  const report = await runMonitor();
  return NextResponse.json({ ok: true, report }, { headers: { "Cache-Control": "no-store" } });
}

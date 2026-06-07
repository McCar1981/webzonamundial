// src/lib/ops/checks.ts
//
// Chequeos AVANZADOS del centro de control (más allá de endpoints y crons):
//   - Cuota de api-football (presupuesto 75k/día) + detección de API key inválida
//     (pilla el bug conocido de tener una Stripe key en la var por error).
//   - Frescura del feed de noticias (incidente de las ~140 noticias perdidas).
//   - Roundtrip de escritura en KV (no basta con que LEA; debe ESCRIBIR).
//   - Salud de entrega de Web Push (ratio de subscriptions fallando).
//   - Alcanzabilidad de dependencias externas: Anthropic, Stripe, Sanity.
//
// Cada función devuelve un CheckOutcome y NUNCA lanza: un fallo del propio
// chequeo se reporta como "warning", no tumba el monitor.

import { kv } from "@vercel/kv";
import { createClient } from "@supabase/supabase-js";
import type { CheckOutcome } from "./store";

const API_SPORTS_BASE = "https://v3.football.api-sports.io";

// Nombres de todos los chequeos avanzados (para que el panel sepa qué claves
// `check:<name>` consultar al recolectar incidentes abiertos).
export const ADVANCED_CHECK_NAMES = [
  "apifootball-quota",
  "news-feed",
  "kv-write",
  "push-health",
  "dep:anthropic",
  "dep:stripe",
  "dep:sanity",
] as const;

function ok(name: string, latencyMs: number, detail?: string): CheckOutcome {
  return { name, ok: true, severity: "ok", latencyMs, detail };
}
function info(name: string, detail: string): CheckOutcome {
  return { name, ok: true, severity: "info", detail };
}
function bad(name: string, severity: "warning" | "critical", detail: string, latencyMs?: number): CheckOutcome {
  return { name, ok: false, severity, latencyMs, detail };
}

// ── Cuota api-football ──────────────────────────────────────────────────────
async function checkApiFootballQuota(): Promise<CheckOutcome> {
  const name = "apifootball-quota";
  const key = process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
  if (!key) return info(name, "API_SPORTS_KEY no configurada");
  const start = Date.now();
  try {
    const res = await fetch(`${API_SPORTS_BASE}/status`, {
      headers: { "x-apisports-key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    const latencyMs = Date.now() - start;
    const json = (await res.json()) as {
      errors?: unknown;
      response?: { requests?: { current?: number; limit_day?: number }; subscription?: { active?: boolean } };
    };

    // errors puede ser objeto {token: "..."} o array. Si trae algo, la key falla.
    const errors = json.errors;
    const hasErrors = Array.isArray(errors) ? errors.length > 0 : errors && Object.keys(errors).length > 0;
    if (hasErrors) {
      return bad(name, "critical", `API key inválida/rechazada: ${JSON.stringify(errors).slice(0, 120)}`, latencyMs);
    }

    const reqs = json.response?.requests;
    const current = reqs?.current ?? 0;
    const limit = reqs?.limit_day ?? 0;
    if (!limit) return info(name, "status sin datos de cuota");
    const pct = Math.round((current / limit) * 100);
    const detail = `${current}/${limit} req (${pct}%)`;
    if (pct >= 95) return bad(name, "critical", `cuota casi agotada · ${detail}`, latencyMs);
    if (pct >= 80) return bad(name, "warning", `cuota alta · ${detail}`, latencyMs);
    return ok(name, latencyMs, detail);
  } catch (err) {
    return bad(name, "warning", `status inalcanzable: ${(err as Error).message}`, Date.now() - start);
  }
}

// ── Frescura del feed de noticias ───────────────────────────────────────────
async function checkNewsFeed(): Promise<CheckOutcome> {
  const name = "news-feed";
  try {
    const { getAllPublicNoticias } = await import("@/lib/noticias-store");
    const list = await getAllPublicNoticias();
    if (!list || list.length === 0) {
      return bad(name, "warning", "feed VACÍO (0 noticias públicas)");
    }
    // Noticia más reciente por ingestedAt (fallback date).
    let newest = 0;
    for (const n of list) {
      const t = new Date((n as { ingestedAt?: string; date?: string }).ingestedAt || (n as { date?: string }).date || 0).getTime();
      if (Number.isFinite(t) && t > newest) newest = t;
    }
    if (!newest) return info(name, `${list.length} noticias, sin fecha legible`);
    const ageH = (Date.now() - newest) / 3_600_000;
    const detail = `${list.length} noticias · última hace ${ageH.toFixed(1)}h`;
    // Ingesta a 07/13/19 UTC: el hueco nocturno máximo es ~12h. >18h = anómalo.
    if (ageH > 30) return bad(name, "critical", `feed MUY desactualizado · ${detail}`);
    if (ageH > 18) return bad(name, "warning", `feed desactualizado · ${detail}`);
    return ok(name, 0, detail);
  } catch (err) {
    return bad(name, "warning", `no se pudo leer el feed: ${(err as Error).message}`);
  }
}

// ── Roundtrip de escritura en KV ────────────────────────────────────────────
async function checkKvWrite(): Promise<CheckOutcome> {
  const name = "kv-write";
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return info(name, "KV no configurado");
  }
  const k = `ops:selftest:${Math.random().toString(36).slice(2)}`;
  const token = Date.now().toString();
  const start = Date.now();
  try {
    await kv.set(k, token, { ex: 60 });
    const got = await kv.get<string>(k);
    await kv.del(k);
    const latencyMs = Date.now() - start;
    if (String(got) !== token) return bad(name, "critical", "KV no devuelve lo escrito (corrupción/replica)", latencyMs);
    return ok(name, latencyMs, "lectura+escritura OK");
  } catch (err) {
    return bad(name, "critical", `KV no escribe: ${(err as Error).message}`, Date.now() - start);
  }
}

// ── Salud de entrega de Web Push ────────────────────────────────────────────
async function checkPushHealth(): Promise<CheckOutcome> {
  const name = "push-health";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !srv) return info(name, "Supabase service role no configurado");
  const start = Date.now();
  try {
    const admin = createClient(url, srv, { auth: { autoRefreshToken: false, persistSession: false } });
    const total = await admin.from("push_subscriptions").select("id", { count: "exact", head: true });
    const failing = await admin
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .gte("failure_count", 3);
    const latencyMs = Date.now() - start;
    if (total.error) return bad(name, "warning", `consulta push falló: ${total.error.message}`, latencyMs);
    const totalN = total.count ?? 0;
    const failN = failing.count ?? 0;
    const detail = `${totalN} subs · ${failN} con fallos`;
    if (totalN >= 20 && failN / totalN > 0.3) {
      return bad(name, "warning", `entrega de push degradada · ${detail}`, latencyMs);
    }
    return ok(name, latencyMs, detail);
  } catch (err) {
    return bad(name, "warning", `push-health falló: ${(err as Error).message}`, Date.now() - start);
  }
}

// ── Alcanzabilidad de dependencias externas ─────────────────────────────────
async function reachable(name: string, url: string, init?: RequestInit): Promise<CheckOutcome> {
  const start = Date.now();
  try {
    // CUALQUIER respuesta HTTP (incluido 401/404) significa que el servicio
    // responde: lo que detectamos es caída total / DNS / red.
    const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(6000) });
    return ok(name, Date.now() - start, `HTTP ${res.status}`);
  } catch (err) {
    return bad(name, "warning", `inalcanzable: ${(err as Error).message}`, Date.now() - start);
  }
}

async function checkAnthropic(): Promise<CheckOutcome> {
  if (!process.env.ANTHROPIC_API_KEY) return info("dep:anthropic", "no configurado");
  // HEAD a la raíz: sólo medimos alcanzabilidad, sin gastar tokens.
  return reachable("dep:anthropic", "https://api.anthropic.com/", { method: "HEAD" });
}
async function checkStripe(): Promise<CheckOutcome> {
  if (!process.env.STRIPE_SECRET_KEY) return info("dep:stripe", "no configurado");
  // Sin auth: 401 = vivo. Detectamos sólo caída total.
  return reachable("dep:stripe", "https://api.stripe.com/v1/charges", { method: "GET" });
}
async function checkSanity(): Promise<CheckOutcome> {
  const pid = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!pid) return info("dep:sanity", "no configurado");
  // /users/me sin token = 401, pero confirma que el API del proyecto responde.
  return reachable("dep:sanity", `https://${pid}.api.sanity.io/v1/users/me`, { method: "GET" });
}

/**
 * Ejecuta TODOS los chequeos avanzados en paralelo. El monitor los trata igual
 * que los endpoints (abre/cierra incidentes + alerta), salvo los de severidad
 * "info" (no configurados) que no generan incidente.
 */
export async function runAdvancedChecks(): Promise<CheckOutcome[]> {
  return Promise.all([
    checkApiFootballQuota(),
    checkNewsFeed(),
    checkKvWrite(),
    checkPushHealth(),
    checkAnthropic(),
    checkStripe(),
    checkSanity(),
  ]);
}

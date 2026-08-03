// src/lib/ops/store.ts
//
// Capa de persistencia del centro de control ("mega máquina"). Todo el estado
// del sistema de monitorización vive en Vercel KV bajo el namespace `ops:`.
//
// Diseño:
//   - Nunca lanza: si KV falla, devolvemos valores neutros. El monitor JAMÁS
//     debe caerse por su propia capa de estado (sería el colmo de la ironía).
//   - History es un ring buffer (lpush + ltrim) para no crecer sin límite.
//   - Heartbeats: cada cron crítico llama a recordHeartbeat() al terminar; el
//     monitor lee getHeartbeat() para detectar jobs que dejaron de ejecutarse.
//   - Throttle: gate temporal para no spamear alertas ni re-remediar en bucle.

import { kv } from "@vercel/kv";

// ── Namespacing de keys ────────────────────────────────────────────────────
const NS = "ops:";
const K_REPORT_LATEST = `${NS}report:latest`;
const K_REPORT_HISTORY = `${NS}report:history`;
const HISTORY_MAX = 500; // ~ últimos 1-2 días a 1 sample / 3 min

export const opsKey = {
  heartbeat: (job: string) => `${NS}heartbeat:${job}`,
  // Centinela SIN TTL: se escribe la primera vez que un job late y no expira
  // jamás. Deja distinguir "este job nunca ha latido" (arranque) de "latía y
  // dejó de hacerlo" (caída real), que es justo lo que el monitor necesita.
  seen: (job: string) => `${NS}seen:${job}`,
  incident: (key: string) => `${NS}incident:${key}`,
  throttle: (key: string) => `${NS}throttle:${key}`,
  remediation: (job: string) => `${NS}remediation:${job}`,
};

// ── Tipos compartidos ──────────────────────────────────────────────────────
export type Severity = "ok" | "info" | "warning" | "critical";

export interface Heartbeat {
  at: string; // ISO
  ok: boolean;
  meta?: Record<string, unknown>;
}

export interface CheckOutcome {
  name: string;
  ok: boolean;
  severity: Severity;
  latencyMs?: number;
  detail?: string;
}

export interface MonitorReport {
  at: string; // ISO
  status: Severity; // peor severidad del run
  durationMs: number;
  checks: CheckOutcome[];
  incidents: string[]; // keys de incidentes abiertos tras este run
  remediations: string[]; // acciones de auto-reparación ejecutadas
}

// Sample compacto que guardamos en el ring buffer de history.
export interface HistorySample {
  at: string;
  status: Severity;
  durationMs: number;
  failing: string[]; // nombres de checks no-ok
}

function parse<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return raw as T;
}

// ── Heartbeats ─────────────────────────────────────────────────────────────
// El TTL por defecto DEBE superar con holgura el mayor maxAgeMinutes de
// CRON_WATCHES (hoy 26h, los crons diarios con gracia). Antes era 1h: los 8
// jobs con umbral > 60min tenían su key EXPIRADA antes de poder considerarse
// obsoletos, así que el monitor los leía como "sin datos" = OK y no alertaban
// jamás. Y para los crons de minutos, una caída de >1h auto-cerraba el
// incidente con un falso "recuperado". La antigüedad se mide por `hb.at` dentro
// del valor, no por el TTL: el TTL solo recoge la basura de un job muerto de
// verdad, mucho después de que el monitor ya haya cantado la caída.
export const HEARTBEAT_TTL_S = 8 * 24 * 3600; // 8 días

/**
 * Registra un latido de un job. Llamar desde cada cron crítico al terminar.
 * También deja un centinela permanente (opsKey.seen) para que el monitor
 * distinga "nunca latió" de "dejó de latir".
 */
export async function recordHeartbeat(
  job: string,
  ok = true,
  meta?: Record<string, unknown>,
  ttlSeconds = HEARTBEAT_TTL_S,
): Promise<void> {
  try {
    const hb: Heartbeat = { at: new Date().toISOString(), ok, meta };
    await kv.set(opsKey.heartbeat(job), JSON.stringify(hb), { ex: ttlSeconds });
    // Centinela sin TTL: marca que este job existe y ha latido alguna vez.
    await kv.set(opsKey.seen(job), "1");
  } catch {
    // Silencioso: un latido perdido no debe romper el cron de negocio.
  }
}

export async function getHeartbeat(job: string): Promise<Heartbeat | null> {
  try {
    return parse<Heartbeat>(await kv.get(opsKey.heartbeat(job)));
  } catch {
    return null;
  }
}

/** ¿Este job ha latido alguna vez? (centinela permanente sin TTL). */
export async function hasEverBeaten(job: string): Promise<boolean> {
  try {
    return (await kv.get(opsKey.seen(job))) != null;
  } catch {
    return false;
  }
}

// ── Throttle / dedupe ──────────────────────────────────────────────────────
/**
 * Devuelve true si la acción `key` PUEDE ejecutarse ahora (no fue ejecutada en
 * los últimos `windowSeconds`). Si puede, marca el timestamp y "consume" la
 * ventana. Atómico-suficiente para nuestro caso (1 monitor cada vez).
 */
export async function throttleAllow(
  key: string,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const k = opsKey.throttle(key);
    const last = await kv.get<number>(k);
    const now = Date.now();
    if (last && now - Number(last) < windowSeconds * 1000) {
      return false;
    }
    await kv.set(k, now, { ex: windowSeconds });
    return true;
  } catch {
    // Si KV falla, permitimos: preferimos una alerta de más que silencio.
    return true;
  }
}

// ── Incidentes (estado abierto/cerrado para detectar recuperaciones) ────────
export interface IncidentState {
  key: string;
  severity: Severity;
  openedAt: string;
  lastSeenAt: string;
  detail: string;
}

export async function getIncident(key: string): Promise<IncidentState | null> {
  try {
    return parse<IncidentState>(await kv.get(opsKey.incident(key)));
  } catch {
    return null;
  }
}

export async function openIncident(
  key: string,
  severity: Severity,
  detail: string,
): Promise<{ isNew: boolean; state: IncidentState }> {
  const existing = await getIncident(key);
  const now = new Date().toISOString();
  const state: IncidentState = existing
    ? { ...existing, severity, lastSeenAt: now, detail }
    : { key, severity, openedAt: now, lastSeenAt: now, detail };
  try {
    await kv.set(opsKey.incident(key), JSON.stringify(state), { ex: 86400 });
  } catch {
    /* noop */
  }
  return { isNew: !existing, state };
}

export async function closeIncident(key: string): Promise<IncidentState | null> {
  const existing = await getIncident(key);
  if (!existing) return null;
  try {
    await kv.del(opsKey.incident(key));
  } catch {
    /* noop */
  }
  return existing;
}

// ── Reports + history ──────────────────────────────────────────────────────
export async function saveReport(report: MonitorReport): Promise<void> {
  try {
    await kv.set(K_REPORT_LATEST, JSON.stringify(report));
    const sample: HistorySample = {
      at: report.at,
      status: report.status,
      durationMs: report.durationMs,
      failing: report.checks.filter((c) => !c.ok).map((c) => c.name),
    };
    await kv.lpush(K_REPORT_HISTORY, JSON.stringify(sample));
    await kv.ltrim(K_REPORT_HISTORY, 0, HISTORY_MAX - 1);
  } catch {
    /* noop */
  }
}

export async function getLatestReport(): Promise<MonitorReport | null> {
  try {
    return parse<MonitorReport>(await kv.get(K_REPORT_LATEST));
  } catch {
    return null;
  }
}

export async function getHistory(limit = 100): Promise<HistorySample[]> {
  try {
    const rows = await kv.lrange<string>(K_REPORT_HISTORY, 0, limit - 1);
    return (rows ?? [])
      .map((r) => parse<HistorySample>(r))
      .filter((x): x is HistorySample => x != null);
  } catch {
    return [];
  }
}

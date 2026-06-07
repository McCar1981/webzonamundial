// src/lib/ops/monitor.ts
//
// El CEREBRO del centro de control. runMonitor() ejecuta todas las sondas,
// decide severidad, abre/cierra incidentes, dispara alertas al teléfono y
// lanza auto-remediación SEGURA (sólo acciones reversibles e idempotentes).
//
// Principio rector: autónomo en lo seguro, humano-en-el-bucle en lo destructivo.
// Aquí JAMÁS se borran datos, ni se hacen rollbacks, ni se tocan secrets. Lo
// más "agresivo" que hace es re-disparar un cron idempotente que dejó de latir.

import {
  ENDPOINT_PROBES,
  CRON_WATCHES,
  baseUrl,
  type EndpointProbe,
  type CronWatch,
} from "./config";
import {
  recordHeartbeat,
  getHeartbeat,
  openIncident,
  closeIncident,
  getIncident,
  throttleAllow,
  saveReport,
  type CheckOutcome,
  type MonitorReport,
  type Severity,
} from "./store";
import { sendOpsAlert } from "./alert";
import { runAdvancedChecks } from "./checks";

const SEVERITY_RANK: Record<Severity, number> = { ok: 0, info: 1, warning: 2, critical: 3 };
function worst(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

// ── Sonda de endpoint HTTP ──────────────────────────────────────────────────
async function probeEndpoint(p: EndpointProbe): Promise<CheckOutcome> {
  const url = `${baseUrl()}${p.path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "user-agent": "ZM-OpsMonitor/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - start;

    // 5xx = caído (critical). 4xx en endpoints públicos = warning (algo cambió).
    if (res.status >= 500) {
      return { name: p.name, ok: false, severity: "critical", latencyMs, detail: `HTTP ${res.status}` };
    }
    if (res.status >= 400) {
      return { name: p.name, ok: false, severity: "warning", latencyMs, detail: `HTTP ${res.status}` };
    }

    // Health JSON: inspeccionamos el cuerpo para distinguir degraded/unhealthy.
    if (p.expectHealthJson) {
      try {
        const json = (await res.json()) as { status?: string; checks?: Record<string, { ok?: boolean }> };
        if (json.status === "unhealthy") {
          return { name: p.name, ok: false, severity: "critical", latencyMs, detail: "health: unhealthy" };
        }
        if (json.status === "degraded") {
          const bad = Object.entries(json.checks ?? {})
            .filter(([, v]) => v && v.ok === false)
            .map(([k]) => k)
            .join(",");
          return { name: p.name, ok: false, severity: "warning", latencyMs, detail: `degraded: ${bad || "?"}` };
        }
      } catch {
        return { name: p.name, ok: false, severity: "warning", latencyMs, detail: "health: invalid JSON" };
      }
    }

    // OK funcional, pero ¿lento?
    if (latencyMs > p.warnLatencyMs) {
      return { name: p.name, ok: false, severity: "warning", latencyMs, detail: `lento (${latencyMs}ms > ${p.warnLatencyMs}ms)` };
    }
    return { name: p.name, ok: true, severity: "ok", latencyMs };
  } catch (err) {
    return {
      name: p.name,
      ok: false,
      severity: "critical",
      latencyMs: Date.now() - start,
      detail: `inalcanzable: ${(err as Error).message}`,
    };
  }
}

// ── Sonda de frescura de cron (heartbeat) ───────────────────────────────────
async function probeCron(w: CronWatch): Promise<CheckOutcome & { stale: boolean }> {
  const hb = await getHeartbeat(w.job);
  // Sin latido aún: lo reportamos como "info" (no alarma) hasta que el cron
  // adopte recordHeartbeat y empecemos a tener datos.
  if (!hb) {
    return { name: `cron:${w.job}`, ok: true, severity: "info", detail: "sin datos de latido aún", stale: false };
  }
  const ageMin = (Date.now() - new Date(hb.at).getTime()) / 60000;
  if (ageMin > w.maxAgeMinutes) {
    return {
      name: `cron:${w.job}`,
      ok: false,
      severity: w.severity,
      detail: `parado ${Math.round(ageMin)}min (máx ${w.maxAgeMinutes})`,
      stale: true,
    };
  }
  if (!hb.ok) {
    return { name: `cron:${w.job}`, ok: false, severity: "warning", detail: "último latido reportó fallo", stale: false };
  }
  return { name: `cron:${w.job}`, ok: true, severity: "ok", detail: `hace ${Math.round(ageMin)}min`, stale: false };
}

// ── Auto-remediación segura: re-disparar un cron idempotente parado ──────────
async function retriggerCron(w: CronWatch): Promise<string | null> {
  if (!w.safeRetrigger) return null;
  // Como mucho un re-disparo cada 10 min por job, para no entrar en bucle.
  const allowed = await throttleAllow(`remediate:${w.job}`, 10 * 60);
  if (!allowed) return null;

  const secret = process.env.CRON_SECRET;
  if (!secret) return null; // sin secret no podemos autenticarnos contra el cron
  try {
    const res = await fetch(`${baseUrl()}${w.path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}`, "user-agent": "ZM-OpsMonitor/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    return `re-disparado ${w.job} → HTTP ${res.status}`;
  } catch (err) {
    return `re-disparo ${w.job} FALLÓ: ${(err as Error).message}`;
  }
}

// ── Orquestación ────────────────────────────────────────────────────────────
export async function runMonitor(): Promise<MonitorReport> {
  const start = Date.now();

  const [endpointResults, cronResults, advancedResults] = await Promise.all([
    Promise.all(ENDPOINT_PROBES.map(probeEndpoint)),
    Promise.all(CRON_WATCHES.map(async (w) => ({ w, r: await probeCron(w) }))),
    runAdvancedChecks(),
  ]);

  const checks: CheckOutcome[] = [
    ...endpointResults,
    ...cronResults.map(({ r }) => r),
    ...advancedResults,
  ];

  // Severidad global del run. Los "info" (no configurado) no degradan el estado.
  let status: Severity = "ok";
  for (const c of checks) status = worst(status, c.ok ? "ok" : c.severity);

  // ── Gestión de incidentes + alertas ──
  const incidents: string[] = [];
  const remediations: string[] = [];

  // Endpoints + chequeos avanzados: misma lógica (abrir/cerrar incidente + avisar).
  const simpleGroups: Array<{ prefix: string; results: CheckOutcome[] }> = [
    { prefix: "endpoint", results: endpointResults },
    { prefix: "check", results: advancedResults },
  ];
  for (const { prefix, results } of simpleGroups) {
    for (const c of results) {
      const key = `${prefix}:${c.name}`;
      // "info" = no configurado / sin datos: ni incidente ni alerta.
      if (c.ok || c.severity === "info") {
        const closed = await closeIncident(key);
        if (closed) {
          await sendOpsAlert({
            key,
            severity: "ok",
            recovery: true,
            title: `Recuperado: ${c.name}`,
            body: `Vuelve a OK${c.latencyMs != null ? ` (${c.latencyMs}ms)` : ""}.`,
          });
        }
        continue;
      }
      incidents.push(key);
      const { isNew } = await openIncident(key, c.severity, c.detail || "");
      await sendOpsAlert({
        key,
        severity: c.severity,
        title: isNew ? `Fallo: ${c.name}` : `Sigue mal: ${c.name}`,
        body: `${c.detail || "sin detalle"}${c.latencyMs != null ? ` · ${c.latencyMs}ms` : ""}`,
        repeatMinutes: c.severity === "critical" ? 10 : 30,
      });
    }
  }

  // Crons parados → intentar remediar + alertar.
  for (const { w, r } of cronResults) {
    const key = `cron:${w.job}`;
    if (r.ok || r.severity === "info") {
      const closed = await closeIncident(key);
      if (closed) {
        await sendOpsAlert({
          key,
          severity: "ok",
          recovery: true,
          title: `Cron recuperado: ${w.job}`,
          body: `Vuelve a latir (${r.detail}).`,
        });
      }
      continue;
    }
    incidents.push(key);
    const { isNew } = await openIncident(key, r.severity, r.detail || "");

    // Auto-remediación: re-disparo seguro.
    let remediationNote = "";
    if (r.stale && w.safeRetrigger) {
      const note = await retriggerCron(w);
      if (note) {
        remediations.push(note);
        remediationNote = `\nAuto-acción: ${note}`;
      }
    }

    await sendOpsAlert({
      key,
      severity: r.severity,
      title: isNew ? `Cron parado: ${w.job}` : `Cron sigue parado: ${w.job}`,
      body: `${r.detail}${remediationNote}`,
      repeatMinutes: r.severity === "critical" ? 10 : 30,
    });
  }

  const report: MonitorReport = {
    at: new Date().toISOString(),
    status,
    durationMs: Date.now() - start,
    checks,
    incidents,
    remediations,
  };

  await saveReport(report);
  // El propio monitor deja su latido: así sabemos que la vigilancia está viva.
  await recordHeartbeat("monitor", true, { status, checks: checks.length }, 1800);

  return report;
}

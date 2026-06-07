"use client";

// /admin/monitor — Panel de control en tiempo real del centro de mando ZM.
//
// Acceso: /admin/monitor?token=<ADMIN_TOKEN>
// Hace polling al API cada 20s y permite "Escanear ahora" (POST).
// UI deliberadamente sobria: claro de base, dorado sólo como acento.

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Severity = "ok" | "info" | "warning" | "critical";

interface CheckOutcome {
  name: string;
  ok: boolean;
  severity: Severity;
  latencyMs?: number;
  detail?: string;
}
interface Report {
  at: string;
  status: Severity;
  durationMs: number;
  checks: CheckOutcome[];
  incidents: string[];
  remediations: string[];
}
interface Incident {
  key: string;
  severity: Severity;
  openedAt: string;
  lastSeenAt: string;
  detail: string;
}
interface ApiResponse {
  ok: boolean;
  latest: Report | null;
  history: { at: string; status: Severity; durationMs: number; failing: string[] }[];
  incidents: Incident[];
}

const COLORS: Record<Severity, string> = {
  ok: "#10B981",
  info: "#3B82F6",
  warning: "#F59E0B",
  critical: "#EF4444",
};
const LABEL: Record<Severity, string> = {
  ok: "OPERATIVO",
  info: "INFO",
  warning: "DEGRADADO",
  critical: "CRÍTICO",
};

function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `hace ${s}s`;
  if (s < 3600) return `hace ${Math.round(s / 60)}min`;
  return `hace ${Math.round(s / 3600)}h`;
}

function MonitorPageInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setError("Falta ?token= en la URL.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/monitor?token=${encodeURIComponent(token)}&history=120`, {
        cache: "no-store",
      });
      if (res.status === 401) throw new Error("Token inválido.");
      if (res.status === 503) throw new Error("ADMIN_TOKEN no configurado en el servidor.");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setData((await res.json()) as ApiResponse);
      setError(null);
      setLastFetch(new Date().toLocaleTimeString("es-ES"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const scanNow = useCallback(async () => {
    if (!token) return;
    setScanning(true);
    try {
      await fetch(`/api/admin/monitor?token=${encodeURIComponent(token)}`, { method: "POST" });
      await fetchData();
    } finally {
      setScanning(false);
    }
  }, [token, fetchData]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 20000);
    return () => clearInterval(id);
  }, [fetchData]);

  const status = data?.latest?.status ?? "info";

  return (
    <div style={{ minHeight: "100vh", background: "#0f1115", color: "#e7e9ee", fontFamily: "ui-sans-serif, system-ui" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
              Centro de Control <span style={{ color: "#D4AF37" }}>ZonaMundial</span>
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9aa0ac" }}>
              Monitorización en tiempo real · auto-remediación · alertas al teléfono
            </p>
          </div>
          <button
            onClick={scanNow}
            disabled={scanning || !token}
            style={{
              background: "#D4AF37", color: "#1a1a1a", border: "none", borderRadius: 8,
              padding: "10px 16px", fontWeight: 700, cursor: scanning ? "wait" : "pointer", fontSize: 14,
            }}
          >
            {scanning ? "Escaneando…" : "Escanear ahora"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 20, background: "#3b1f1f", border: "1px solid #7f1d1d", borderRadius: 8, padding: 14, color: "#fecaca" }}>
            ⚠ {error}
          </div>
        )}

        {/* Estado global */}
        <div
          style={{
            marginTop: 24, borderRadius: 12, padding: 24,
            background: `linear-gradient(135deg, ${COLORS[status]}22, transparent)`,
            border: `1px solid ${COLORS[status]}55`,
            display: "flex", alignItems: "center", gap: 16,
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: COLORS[status], boxShadow: `0 0 16px ${COLORS[status]}` }} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: COLORS[status] }}>{LABEL[status]}</div>
            <div style={{ fontSize: 13, color: "#9aa0ac" }}>
              {data?.latest ? `Último escaneo ${timeAgo(data.latest.at)} · ${data.latest.durationMs}ms` : "Sin datos todavía"}
              {lastFetch ? ` · refrescado ${lastFetch}` : ""}
              {loading ? " · actualizando…" : ""}
            </div>
          </div>
        </div>

        {/* Incidentes abiertos */}
        {data?.incidents && data.incidents.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Incidentes abiertos</h2>
            {data.incidents.map((inc) => (
              <div key={inc.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 8, background: "#181b22", border: `1px solid ${COLORS[inc.severity]}55`, marginBottom: 8 }}>
                <div>
                  <span style={{ color: COLORS[inc.severity], fontWeight: 700 }}>{inc.key}</span>
                  <span style={{ color: "#9aa0ac", marginLeft: 10, fontSize: 13 }}>{inc.detail}</span>
                </div>
                <span style={{ fontSize: 12, color: "#6b7280" }}>desde {timeAgo(inc.openedAt)}</span>
              </div>
            ))}
          </section>
        )}

        {/* Checks */}
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Comprobaciones</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {(data?.latest?.checks ?? []).map((c) => (
              <div key={c.name} style={{ background: "#181b22", border: "1px solid #262a33", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[c.ok ? "ok" : c.severity] }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#9aa0ac" }}>
                  {c.latencyMs != null ? `${c.latencyMs}ms` : "—"}
                  {c.detail ? ` · ${c.detail}` : ""}
                </div>
              </div>
            ))}
            {!data?.latest && <p style={{ color: "#6b7280" }}>Esperando primer escaneo…</p>}
          </div>
        </section>

        {/* Remediaciones del último run */}
        {data?.latest?.remediations && data.latest.remediations.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Auto-reparaciones (último escaneo)</h2>
            {data.latest.remediations.map((r, i) => (
              <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#152017", border: "1px solid #1f7a2e55", marginBottom: 6, fontSize: 13, color: "#bbf7d0" }}>
                🔧 {r}
              </div>
            ))}
          </section>
        )}

        {/* History sparkline */}
        {data?.history && data.history.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Histórico (últimos {data.history.length} escaneos)</h2>
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 40 }}>
              {data.history.slice().reverse().map((h, i) => (
                <div
                  key={i}
                  title={`${new Date(h.at).toLocaleString("es-ES")} · ${h.status}${h.failing.length ? ` · ${h.failing.join(",")}` : ""}`}
                  style={{ flex: 1, minWidth: 2, height: "100%", background: COLORS[h.status], opacity: h.status === "ok" ? 0.5 : 1, borderRadius: 1 }}
                />
              ))}
            </div>
          </section>
        )}

        <p style={{ marginTop: 32, fontSize: 11, color: "#4b5563", textAlign: "center" }}>
          Auto-refresco cada 20s · acciones de auto-reparación limitadas a operaciones seguras e idempotentes.
        </p>
      </div>
    </div>
  );
}

// useSearchParams() exige una frontera de Suspense para el prerender (CSR bailout).
export default function MonitorPage() {
  return (
    <Suspense fallback={null}>
      <MonitorPageInner />
    </Suspense>
  );
}

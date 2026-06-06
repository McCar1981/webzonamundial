"use client";

// Dashboard del bar (FASE 1). Panel del dueño para crear/gestionar su porra:
// resumen de métricas, QR + descarga de materiales, premios y personalización.
// Estilo corporativo ZonaMundial (azul marino + dorado). Solo iconos SVG.

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  Trophy, Users, QrCode, Gift, Palette, BarChart3, Tv, ExternalLink, Copy, Check,
  Download, Plus, Trash2, Eye, Loader2, Rocket, CreditCard, MapPin, Printer, FileSpreadsheet, Lock,
} from "lucide-react";
import { themeList } from "@/lib/bars/themes";
import { planList, getPlan, type BarPlan } from "@/lib/bars/plans";
import type { BarRow, QrSource, BarPrize, BarStats, BarPayment } from "@/lib/bars/store";

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825";
const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#94A3B8", DIM = "#64748B", GREEN = "#22c55e";
const BORDER = "1px solid rgba(255,255,255,0.08)";

interface Props {
  initialBar: BarRow | null;
  initialStats: BarStats | null;
  initialQr: QrSource | null;
  initialSources: QrSource[];
  initialPrizes: BarPrize[];
  initialPayment: BarPayment | null;
  origin: string;
}

export default function BarDashboard({ initialBar, initialStats, initialQr, initialSources, initialPrizes, initialPayment, origin }: Props) {
  const [bar, setBar] = useState<BarRow | null>(initialBar);
  const [stats] = useState<BarStats | null>(initialStats);
  const [qr] = useState<QrSource | null>(initialQr);
  const [sources, setSources] = useState<QrSource[]>(initialSources);
  const [prizes, setPrizes] = useState<BarPrize[]>(initialPrizes);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => { if (flash) { const id = setTimeout(() => setFlash(null), 3000); return () => clearTimeout(id); } }, [flash]);

  // Feedback de retorno desde Stripe (?purchase=success / ?canceled=1).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchase") === "success") setFlash("Pago confirmado. Tu plan está activo.");
    else if (params.get("canceled") === "1") setFlash("Has cancelado el pago. Puedes intentarlo cuando quieras.");
    if (params.has("purchase") || params.has("canceled") || params.has("session_id")) {
      window.history.replaceState({}, "", "/bar-dashboard");
    }
  }, []);

  if (!bar) return <CreateBar onCreated={setBar} />;

  const hasActivePlan = !!initialPayment && initialPayment.status === "active" && !initialPayment.refunded_at;
  const plan = getPlan(bar.plan_id);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#E2E8F0" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 16px 64px" }}>
        <header style={{ marginBottom: 20 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: GOLD, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            <Trophy size={14} /> Panel del bar
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: "6px 0 0" }}>{bar.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, color: MID, fontSize: 13 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: bar.status === "published" ? GREEN : DIM }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: bar.status === "published" ? GREEN : DIM }} />
              {bar.status === "published" ? "Publicado" : "Borrador"}
            </span>
            <a href={`/b/${bar.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: GOLD2, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              Ver página pública <ExternalLink size={12} />
            </a>
          </div>
        </header>

        <PlanSection bar={bar} payment={initialPayment} hasActivePlan={hasActivePlan} onFlash={setFlash} />
        <Resumen stats={stats} bar={bar} origin={origin} onFlash={setFlash} />
        <QrSection bar={bar} qr={qr} origin={origin} onFlash={setFlash} />
        <ZonesSection bar={bar} plan={plan} sources={sources} setSources={setSources} origin={origin} onFlash={setFlash} />
        <MaterialsSection bar={bar} plan={plan} onFlash={setFlash} />
        <Prizes bar={bar} prizes={prizes} setPrizes={setPrizes} onFlash={setFlash} />
        <Personalization bar={bar} setBar={setBar} onFlash={setFlash} />
      </div>

      {flash && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: BG2, border: `1px solid ${GOLD}`, color: GOLD2, borderRadius: 12, padding: "11px 18px", fontWeight: 700, fontSize: 13.5, zIndex: 50, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
          {flash}
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 18 }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800, margin: "0 0 10px" }}>
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function Resumen({ stats, bar, origin, onFlash }: { stats: BarStats | null; bar: BarRow; origin: string; onFlash: (s: string) => void }) {
  const cards = [
    { label: "Participantes", value: stats?.participants ?? 0, icon: <Users size={16} color={GOLD2} /> },
    { label: "Escaneos QR", value: stats?.scans ?? 0, icon: <QrCode size={16} color={GOLD2} /> },
    { label: "Predicciones", value: stats?.predictions ?? 0, icon: <Trophy size={16} color={GOLD2} /> },
  ];
  return (
    <Section icon={<BarChart3 size={17} color={GOLD} />} title="Resumen">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 12 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: BG2, border: BORDER, borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: DIM, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.icon} {c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={`/b/${bar.slug}/tv`} target="_blank" rel="noopener noreferrer" style={qa()}><Tv size={14} /> Abrir pantalla TV</a>
        <a href={`/b/${bar.slug}/ranking`} target="_blank" rel="noopener noreferrer" style={qa()}><Trophy size={14} /> Ver ranking</a>
        <button onClick={() => { void navigator.clipboard.writeText(`${origin}/b/${bar.slug}`); onFlash("Enlace copiado"); }} style={{ ...qa(), cursor: "pointer" }}><Copy size={14} /> Copiar enlace</button>
      </div>
    </Section>
  );
}

function qa(): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", gap: 6, background: BG2, border: BORDER, color: "#E2E8F0", borderRadius: 10, fontWeight: 700, fontSize: 13, padding: "8px 12px", textDecoration: "none" };
}

function PlanSection({ bar, payment, hasActivePlan, onFlash }: { bar: BarRow; payment: BarPayment | null; hasActivePlan: boolean; onFlash: (s: string) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const currentPlan = getPlan(bar.plan_id);

  async function buy(planId: string) {
    setBusy(planId);
    try {
      const r = await fetch("/api/bars/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan_id: planId }),
      });
      const data = await r.json();
      if (r.ok && data.url) { window.location.href = data.url; return; }
      if (r.status === 401) { window.location.href = "/login?next=/bar-dashboard"; return; }
      onFlash(data.error || "No pudimos iniciar el pago.");
    } catch {
      onFlash("Error de red. Inténtalo de nuevo.");
    }
    setBusy(null);
  }

  if (hasActivePlan && payment) {
    return (
      <Section icon={<CreditCard size={17} color={GOLD} />} title="Tu plan">
        <div style={{ background: BG2, border: `1px solid ${GOLD}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{currentPlan.name}</div>
            <div style={{ color: MID, fontSize: 12.5, marginTop: 2 }}>
              Activo · {(payment.amount / 100).toFixed(0)} {payment.currency.toUpperCase()} · pago único
            </div>
          </div>
          {payment.receipt_url && (
            <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" style={{ ...qa(), cursor: "pointer" }}>
              <Download size={14} /> Recibo
            </a>
          )}
        </div>
      </Section>
    );
  }

  return (
    <Section icon={<CreditCard size={17} color={GOLD} />} title="Activa tu plan">
      <p style={{ color: MID, fontSize: 13, margin: "0 0 12px" }}>
        Tu porra está en borrador. Elige un plan para publicarla y compartir tu QR. Pago único para todo el Mundial.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
        {planList().map((plan) => (
          <div key={plan.id} style={{ background: BG2, border: plan.highlight ? `1px solid ${GOLD}` : BORDER, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 900, fontSize: 15 }}>{plan.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "6px 0 2px" }}>
              <span style={{ fontSize: 24, fontWeight: 900 }}>{plan.priceEur} €</span>
              <span style={{ color: DIM, fontSize: 12 }}>/ Mundial</span>
            </div>
            <div style={{ color: DIM, fontSize: 11, marginBottom: 10 }}>{plan.priceUsd} USD · LATAM y USA</div>
            <button
              onClick={() => void buy(plan.id)}
              disabled={!!busy}
              style={{
                marginTop: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                border: "none", cursor: busy ? "default" : "pointer", borderRadius: 10, fontWeight: 800, fontSize: 13, padding: "9px 12px",
                background: plan.highlight ? `linear-gradient(135deg, ${GOLD}, ${GOLD2})` : "rgba(255,255,255,0.06)",
                color: plan.highlight ? "#1A1208" : "#E2E8F0", opacity: busy && busy !== plan.id ? 0.5 : 1,
              }}
            >
              {busy === plan.id ? <Loader2 size={14} className="spin" /> : <CreditCard size={14} />} Elegir
            </button>
          </div>
        ))}
      </div>
      <p style={{ color: DIM, fontSize: 11.5, marginTop: 10 }}>
        Pago seguro con Stripe. La moneda se ajusta según tu país.{" "}
        <a href="/bares/precios" target="_blank" rel="noopener noreferrer" style={{ color: GOLD2 }}>Ver comparativa de planes</a>.
      </p>
    </Section>
  );
}

function QrSection({ bar, qr, origin, onFlash }: { bar: BarRow; qr: QrSource | null; origin: string; onFlash: (s: string) => void }) {
  const [png, setPng] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const target = qr ? `${origin}/r/${qr.code}` : `${origin}/b/${bar.slug}`;
  const shortUrl = target.replace(/^https?:\/\//, "");

  useEffect(() => {
    void QRCode.toDataURL(target, { width: 360, margin: 1, color: { dark: "#0A0A0A", light: "#FFFFFF" }, errorCorrectionLevel: "M" }).then(setPng);
  }, [target]);

  const download = useCallback(async (fmt: "png" | "svg") => {
    const data = fmt === "png"
      ? await QRCode.toDataURL(target, { width: 1024, margin: 2, errorCorrectionLevel: "M" })
      : `data:image/svg+xml;utf8,${encodeURIComponent(await QRCode.toString(target, { type: "svg", margin: 2 }))}`;
    const a = document.createElement("a");
    a.href = data; a.download = `qr-${bar.slug}.${fmt}`; a.click();
    onFlash(`QR ${fmt.toUpperCase()} descargado`);
  }, [target, bar.slug, onFlash]);

  return (
    <Section icon={<QrCode size={17} color={GOLD} />} title="QR y materiales">
      <div style={{ background: BG2, border: BORDER, borderRadius: 14, padding: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 8, width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {png ? <img src={png} alt="QR de la porra" style={{ width: "100%", height: "100%" }} /> : <Loader2 size={24} className="spin" color="#0A0A0A" />}
        </div>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <div style={{ color: MID, fontSize: 13, marginBottom: 4 }}>Coloca este QR en barra, mesas y TV. Cada escaneo se cuenta para tus estadísticas.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <code style={{ background: BG3, border: BORDER, borderRadius: 8, padding: "6px 9px", fontSize: 12.5, color: GOLD2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{shortUrl}</code>
            <button onClick={() => { void navigator.clipboard.writeText(target); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ ...qa(), cursor: "pointer", padding: "6px 9px" }}>
              {copied ? <Check size={14} color={GREEN} /> : <Copy size={14} />}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => void download("png")} style={{ ...qa(), cursor: "pointer" }}><Download size={14} /> PNG</button>
            <button onClick={() => void download("svg")} style={{ ...qa(), cursor: "pointer" }}><Download size={14} /> SVG</button>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── QR por zonas (multi-QR, gating por plan.maxQrSources) ───────────────────
function ZonesSection({ bar, plan, sources, setSources, origin, onFlash }: { bar: BarRow; plan: BarPlan; sources: QrSource[]; setSources: (s: QrSource[]) => void; origin: string; onFlash: (s: string) => void }) {
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const max = plan.maxQrSources;
  // Solo zonas extra (la principal se gestiona arriba en "QR y materiales").
  const zones = sources.filter((s) => s.source_type !== "main");
  const used = sources.length; // principal + zonas cuentan para el límite del plan
  const canAdd = used < max;

  const add = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/bars/qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceType: "zona", label }) });
      const j = await res.json();
      if (res.ok && j.qr) { setSources([...sources, j.qr]); setLabel(""); onFlash("Zona añadida"); }
      else onFlash(j.message || "No se pudo crear la zona");
    } catch { onFlash("Error de red"); } finally { setBusy(false); }
  }, [label, sources, setSources, onFlash]);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/bars/qr?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) { setSources(sources.filter((s) => s.id !== id)); onFlash("Zona eliminada"); }
    else onFlash("No se pudo eliminar");
  }, [sources, setSources, onFlash]);

  const downloadPng = useCallback(async (code: string, slug: string) => {
    const data = await QRCode.toDataURL(`${origin}/r/${code}`, { width: 1024, margin: 2, errorCorrectionLevel: "M" });
    const a = document.createElement("a");
    a.href = data; a.download = `qr-${bar.slug}-${slug}.png`; a.click();
  }, [origin, bar.slug]);

  if (max <= 1) {
    return (
      <Section icon={<MapPin size={17} color={GOLD} />} title="QR por zonas">
        <div style={{ background: BG2, border: BORDER, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 10, color: MID, fontSize: 13.5 }}>
          <Lock size={16} color={DIM} />
          <span>Crea QR distintos para barra, terraza o salón y mide qué zona llena más tu bar.{" "}
            <a href="/bares/precios" target="_blank" rel="noopener noreferrer" style={{ color: GOLD2 }}>Disponible en Mundial Completo y Bar Pro</a>.
          </span>
        </div>
      </Section>
    );
  }

  return (
    <Section icon={<MapPin size={17} color={GOLD} />} title="QR por zonas">
      <p style={{ color: MID, fontSize: 13, margin: "0 0 10px" }}>
        Genera un QR por zona para saber desde dónde entran tus clientes. Usadas {used} de {max}.
      </p>
      {zones.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {zones.map((z) => (
            <div key={z.id} style={{ display: "flex", alignItems: "center", gap: 10, background: BG2, border: BORDER, borderRadius: 12, padding: "10px 14px" }}>
              <MapPin size={15} color={GOLD2} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{z.label ?? "Zona"}</div>
                <code style={{ color: DIM, fontSize: 11.5 }}>{`${origin}/r/${z.code}`.replace(/^https?:\/\//, "")}</code>
              </div>
              <button onClick={() => void downloadPng(z.code, (z.label ?? "zona").toLowerCase().replace(/[^a-z0-9]+/g, "-"))} style={{ ...qa(), cursor: "pointer", padding: "6px 9px" }} title="Descargar QR PNG"><Download size={14} /></button>
              <a href={`/b/${bar.slug}/cartel?code=${encodeURIComponent(z.code)}`} target="_blank" rel="noopener noreferrer" style={{ ...qa(), padding: "6px 9px" }} title="Cartel de la zona"><Printer size={14} /></a>
              <button onClick={() => void remove(z.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: DIM, padding: 4 }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
      {canAdd ? (
        <div style={{ background: BG2, border: BORDER, borderRadius: 14, padding: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nombre de la zona (Barra, Terraza, Salón…)" style={{ ...inp(), flex: "1 1 200px" }} />
          <button onClick={() => void add()} disabled={busy} style={{ ...btn(), opacity: busy ? 0.6 : 1 }}>
            {busy ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} Añadir zona
          </button>
        </div>
      ) : (
        <div style={{ color: DIM, fontSize: 12.5 }}>Has alcanzado el máximo de QR de tu plan.</div>
      )}
    </Section>
  );
}

// ─── Materiales premium: cartel imprimible + exportar participantes ───────────
function MaterialsSection({ bar, plan, onFlash }: { bar: BarRow; plan: BarPlan; onFlash: (s: string) => void }) {
  const [exporting, setExporting] = useState(false);

  const exportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/bars/export");
      if (!res.ok) { const j = await res.json().catch(() => ({})); onFlash(j.message || "No se pudo exportar"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `ranking-${bar.slug}.csv`; a.click();
      URL.revokeObjectURL(url);
      onFlash("Ranking exportado");
    } catch { onFlash("Error de red"); } finally { setExporting(false); }
  }, [bar.slug, onFlash]);

  return (
    <Section icon={<FileSpreadsheet size={17} color={GOLD} />} title="Materiales premium">
      <div style={{ background: BG2, border: BORDER, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Cartel imprimible */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <div style={{ fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><Printer size={15} color={GOLD2} /> Cartel A4 para imprimir</div>
            <div style={{ color: MID, fontSize: 12.5, marginTop: 2 }}>QR grande, premio y claim listos para colgar en el local.</div>
          </div>
          {plan.premiumMaterials ? (
            <a href={`/b/${bar.slug}/cartel`} target="_blank" rel="noopener noreferrer" style={{ ...btn(), textDecoration: "none" }}><Printer size={15} /> Abrir cartel</a>
          ) : (
            <a href="/bares/precios" target="_blank" rel="noopener noreferrer" style={{ ...qa(), color: DIM }}><Lock size={14} /> Plan superior</a>
          )}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

        {/* Exportar participantes */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <div style={{ fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><FileSpreadsheet size={15} color={GOLD2} /> Exportar clasificación (CSV)</div>
            <div style={{ color: MID, fontSize: 12.5, marginTop: 2 }}>Descarga posiciones y puntos. Sin datos personales sensibles.</div>
          </div>
          {plan.exportParticipants ? (
            <button onClick={() => void exportCsv()} disabled={exporting} style={{ ...btn(), opacity: exporting ? 0.6 : 1 }}>
              {exporting ? <Loader2 size={15} className="spin" /> : <Download size={15} />} Exportar CSV
            </button>
          ) : (
            <a href="/bares/precios" target="_blank" rel="noopener noreferrer" style={{ ...qa(), color: DIM }}><Lock size={14} /> Plan superior</a>
          )}
        </div>
      </div>
    </Section>
  );
}

function Prizes({ bar, prizes, setPrizes, onFlash }: { bar: BarRow; prizes: BarPrize[]; setPrizes: (p: BarPrize[]) => void; onFlash: (s: string) => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const add = useCallback(async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/bars/prizes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description: desc, prizeType: "principal" }) });
      const j = await res.json();
      if (res.ok && j.prize) { setPrizes([...prizes, j.prize]); setTitle(""); setDesc(""); onFlash("Premio creado"); }
      else onFlash("No se pudo crear el premio");
    } finally { setBusy(false); }
  }, [title, desc, prizes, setPrizes, onFlash]);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/bars/prizes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) { setPrizes(prizes.filter((p) => p.id !== id)); onFlash("Premio eliminado"); }
  }, [prizes, setPrizes, onFlash]);

  return (
    <Section icon={<Gift size={17} color={GOLD} />} title="Premios">
      {prizes.length === 0 ? (
        <div style={{ background: BG2, border: BORDER, borderRadius: 14, padding: 16, color: MID, fontSize: 14, marginBottom: 12 }}>
          Añade un premio para motivar a tus clientes.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {prizes.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: BG2, border: BORDER, borderRadius: 12, padding: "10px 14px" }}>
              <Gift size={15} color={GOLD2} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.title}</div>
                {p.description && <div style={{ color: MID, fontSize: 12.5 }}>{p.description}</div>}
              </div>
              <span style={{ fontSize: 11, color: DIM, textTransform: "uppercase" }}>{p.prize_type}</span>
              <button onClick={() => void remove(p.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: DIM, padding: 4 }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
      <div style={{ background: BG2, border: BORDER, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del premio (p. ej. Cena para 2)" style={inp()} />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción (opcional)" style={inp()} />
        <button onClick={() => void add()} disabled={busy || !title.trim()} style={{ ...btn(), opacity: busy || !title.trim() ? 0.6 : 1 }}>
          <Plus size={15} /> Añadir premio
        </button>
      </div>
    </Section>
  );
}

function Personalization({ bar, setBar, onFlash }: { bar: BarRow; setBar: (b: BarRow) => void; onFlash: (s: string) => void }) {
  const [form, setForm] = useState({
    name: bar.name, city: bar.city ?? "", welcome_message: bar.welcome_message ?? "",
    cta_label: bar.cta_label, description: bar.description ?? "", instagram: bar.instagram ?? "",
    address: bar.address ?? "", theme_id: bar.theme_id, logo_url: bar.logo_url ?? "", cover_url: bar.cover_url ?? "",
  });
  const [busy, setBusy] = useState(false);
  const themes = useMemo(() => themeList(), []);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = useCallback(async (extra?: Partial<BarRow>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/bars", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, ...extra }) });
      const j = await res.json();
      if (res.ok && j.bar) { setBar(j.bar); onFlash("Cambios guardados"); }
      else onFlash("No se pudo guardar");
    } finally { setBusy(false); }
  }, [form, setBar, onFlash]);

  return (
    <Section icon={<Palette size={17} color={GOLD} />} title="Personalización">
      <div style={{ background: BG2, border: BORDER, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <Field label="Nombre del bar"><input value={form.name} onChange={(e) => set("name", e.target.value)} style={inp()} /></Field>
        <Field label="Ciudad"><input value={form.city} onChange={(e) => set("city", e.target.value)} style={inp()} /></Field>
        <Field label="Mensaje de bienvenida"><textarea value={form.welcome_message} onChange={(e) => set("welcome_message", e.target.value)} rows={2} style={{ ...inp(), resize: "vertical" }} /></Field>
        <Field label="Texto del botón principal"><input value={form.cta_label} onChange={(e) => set("cta_label", e.target.value)} style={inp()} /></Field>
        <Field label="Instagram (sin @)"><input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} style={inp()} /></Field>
        <Field label="Dirección"><input value={form.address} onChange={(e) => set("address", e.target.value)} style={inp()} /></Field>
        <Field label="URL del logo"><input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://…" style={inp()} /></Field>
        <Field label="URL de la portada"><input value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://…" style={inp()} /></Field>
        <Field label="Tema visual">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8 }}>
            {themes.map((th) => (
              <button key={th.id} onClick={() => set("theme_id", th.id)} style={{
                cursor: "pointer", textAlign: "left", borderRadius: 10, padding: "8px 10px",
                border: form.theme_id === th.id ? `2px solid ${GOLD}` : BORDER, background: th.bg, color: th.text,
              }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: th.primary }} />
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: th.secondary }} />
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700 }}>{th.name}</div>
              </button>
            ))}
          </div>
        </Field>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <button onClick={() => void save()} disabled={busy} style={{ ...btn(), opacity: busy ? 0.6 : 1 }}>
            {busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Guardar cambios
          </button>
          {bar.status !== "published" ? (
            <button onClick={() => void save({ status: "published" })} disabled={busy} style={{ ...btn(true), opacity: busy ? 0.6 : 1 }}>
              <Rocket size={15} /> Publicar porra
            </button>
          ) : (
            <button onClick={() => void save({ status: "paused" })} disabled={busy} style={{ ...qa(), cursor: "pointer" }}>
              <Eye size={15} /> Pausar
            </button>
          )}
        </div>
      </div>
    </Section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", color: MID, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}

function inp(): React.CSSProperties {
  return { width: "100%", boxSizing: "border-box", background: BG3, border: BORDER, borderRadius: 9, color: "#E2E8F0", fontSize: 14, padding: "9px 11px", outline: "none" };
}
function btn(primary = false): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
    background: primary ? `linear-gradient(135deg,${GOLD},${GOLD2})` : BG3, color: primary ? "#1a1206" : "#E2E8F0",
    border: BORDER, borderRadius: 10, fontWeight: 800, fontSize: 14, padding: "10px 14px" };
}

// ─── Crear bar (cuando el dueño aún no tiene uno) ─────────────────────────────
function CreateBar({ onCreated }: { onCreated: (b: BarRow) => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = useCallback(async () => {
    if (!name.trim()) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/bars", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, city }) });
      const j = await res.json();
      if (res.ok && j.bar) onCreated(j.bar);
      else setErr(j.message || "No se pudo crear el bar");
    } catch { setErr("Error de red"); } finally { setBusy(false); }
  }, [name, city, onCreated]);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 440, background: BG2, border: BORDER, borderRadius: 18, padding: 24 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: GOLD, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
          <Trophy size={14} /> Porras Digitales para Bares
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "8px 0 4px" }}>Crea la porra de tu bar</h1>
        <p style={{ color: MID, fontSize: 14, margin: "0 0 18px" }}>En un minuto tendrás tu página, tu QR y tu ranking listos para los clientes.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del bar" style={inp()} />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad (opcional)" style={inp()} />
          {err && <div style={{ color: "#f87171", fontSize: 13 }}>{err}</div>}
          <button onClick={() => void create()} disabled={busy || !name.trim()} style={{ ...btn(true), opacity: busy || !name.trim() ? 0.6 : 1 }}>
            {busy ? <Loader2 size={16} className="spin" /> : <Rocket size={16} />} Crear mi porra
          </button>
        </div>
        <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.5, marginTop: 16 }}>
          Dinámica gratuita de predicciones. No implica apuestas. Los premios los gestiona el establecimiento.
        </p>
      </div>
    </div>
  );
}

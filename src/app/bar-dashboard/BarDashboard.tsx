"use client";

// Dashboard del bar (FASE 1) — "Centro de control de tu peña".
// Panel del dueño para configurar, activar, publicar y promocionar su peña.
// Reorganizado en 2 columnas (desktop) con card de estado, checklist de
// activación y siguiente paso recomendado. Mobile-first. Solo iconos SVG.
//
// IMPORTANTE: este archivo es SOLO UX/UI. No toca pagos/Stripe/webhook ni el
// gating de publicación (sigue validándose en el servidor: PATCH /api/bars
// rechaza publicar sin plan activo).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Trophy, Users, QrCode, Gift, Palette, BarChart3, Tv, ExternalLink, Copy, Check,
  Download, Plus, Trash2, Eye, Loader2, Rocket, CreditCard, MapPin, Printer, FileSpreadsheet, Lock,
  Upload, ImageIcon, CheckCircle2, Circle, ArrowRight, Sparkles, HelpCircle, Share2,
} from "lucide-react";
import { themeList } from "@/lib/bars/themes";
import { planList, getPlan, type BarPlan } from "@/lib/bars/plans";
import type { BarRow, QrSource, BarPrize, BarStats, BarPayment } from "@/lib/bars/store";

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825";
const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#94A3B8", DIM = "#64748B", GREEN = "#22c55e", RED = "#f87171";
const BORDER = "1px solid rgba(255,255,255,0.08)";

// Descripciones comerciales (UI). Las FEATURES reales salen de plans.ts para no
// prometer funciones no implementadas.
const PLAN_TAGLINE: Record<string, string> = {
  arranque: "Para bares que quieren lanzar una peña sencilla y rápida.",
  completo: "Todo lo necesario para activar la peña en barra, mesas, redes y pantalla TV.",
  pro: "Para bares grandes, pubs deportivos o locales con mucha afluencia.",
};

type CardState = "draft" | "planActive" | "published" | "suspended";

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
  const [publishing, setPublishing] = useState(false);

  useEffect(() => { if (flash) { const id = setTimeout(() => setFlash(null), 3000); return () => clearTimeout(id); } }, [flash]);

  // Feedback de retorno desde Stripe (?purchase=success / ?canceled=1).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchase") === "success") setFlash("Pago procesado. Verificando activación… refresca en unos segundos.");
    else if (params.get("canceled") === "1") setFlash("Has cancelado el pago. Puedes intentarlo cuando quieras.");
    if (params.has("purchase") || params.has("canceled") || params.has("session_id")) {
      window.history.replaceState({}, "", "/bar-dashboard");
    }
  }, []);

  const publish = useCallback(async () => {
    setPublishing(true);
    try {
      const res = await fetch("/api/bars", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "published" }) });
      const j = await res.json();
      if (res.ok && j.bar) { setBar(j.bar); setFlash("¡Peña publicada! Tu QR ya está activo."); }
      else setFlash(j.message || j.error || "No se pudo publicar la peña.");
    } catch { setFlash("Error de red. Inténtalo de nuevo."); }
    finally { setPublishing(false); }
  }, []);

  if (!bar) return <CreateBar onCreated={setBar} />;

  const hasActivePlan = !!initialPayment && initialPayment.status === "active" && !initialPayment.refunded_at;
  const plan = getPlan(bar.plan_id);
  const isPublished = bar.status === "published";
  const isPaused = bar.status === "paused";
  const isRefunded = !!initialPayment && !!initialPayment.refunded_at;

  const cardState: CardState = !hasActivePlan
    ? (isRefunded ? "suspended" : "draft")
    : isPublished ? "published" : "planActive";

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const goPlans = () => scrollTo("bd-planes");
  const goPrizes = () => scrollTo("bd-premios");

  const hasPrize = prizes.length > 0;
  const hasBarData = !!(bar.city || bar.logo_url || bar.description || bar.welcome_message);
  const checklist = [
    { label: "Datos del bar", done: hasBarData },
    { label: "Premio", done: hasPrize },
    { label: "Plan activo", done: hasActivePlan },
    { label: "Publicación", done: isPublished },
    { label: "QR", done: !!qr },
    { label: "Kit", done: hasActivePlan },
    { label: "Pantalla TV", done: isPublished && hasActivePlan },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#E2E8F0" }}>
      {/* UX-only: ocultar publicidad y banners en el panel B2B + layout responsive */}
      <style>{`
        .zm-pub-lat { display: none !important; }
        .google-auto-placed, ins.adsbygoogle { display: none !important; }
        .bd-grid { display: grid; grid-template-columns: 1fr; gap: 18px; align-items: start; }
        .bd-main { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
        .bd-side { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        @media (min-width: 980px) {
          .bd-grid { grid-template-columns: minmax(0,1fr) 340px; }
          .bd-main { grid-column: 1; grid-row: 1; }
          .bd-side { grid-column: 2; grid-row: 1; position: sticky; top: 80px; }
        }
      `}</style>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 64px" }}>
        <DashHeader bar={bar} state={cardState} hasActivePlan={hasActivePlan} isPaused={isPaused} isRefunded={isRefunded} />

        <div style={{ marginBottom: 18 }}>
          <StatusCard state={cardState} bar={bar} publishing={publishing} onPublish={() => void publish()} onPlans={goPlans} />
        </div>

        <div className="bd-grid">
          <aside className="bd-side">
            <ChecklistCard items={checklist} />
            <NextStepCard
              state={cardState} hasPrize={hasPrize} publishing={publishing}
              onPublish={() => void publish()} onPlans={goPlans} onPrizes={goPrizes} bar={bar}
            />
            <QuickHelpCard bar={bar} origin={origin} onFlash={setFlash} />
          </aside>

          <div className="bd-main">
            {!hasActivePlan && (
              <div id="bd-planes">
                <PlanSection bar={bar} payment={initialPayment} hasActivePlan={hasActivePlan} onFlash={setFlash} />
              </div>
            )}
            {hasActivePlan && (
              <PlanSection bar={bar} payment={initialPayment} hasActivePlan={hasActivePlan} onFlash={setFlash} />
            )}
            <KitSection hasActivePlan={hasActivePlan} />
            <Resumen stats={stats} bar={bar} origin={origin} onFlash={setFlash} hasActivePlan={hasActivePlan} isPublished={isPublished} />
            <QrSection bar={bar} qr={qr} origin={origin} onFlash={setFlash} hasActivePlan={hasActivePlan} />
            <ZonesSection bar={bar} plan={plan} sources={sources} setSources={setSources} origin={origin} onFlash={setFlash} />
            <MaterialsSection bar={bar} plan={plan} onFlash={setFlash} />
            <div id="bd-premios">
              <Prizes bar={bar} prizes={prizes} setPrizes={setPrizes} onFlash={setFlash} />
            </div>
            <Personalization bar={bar} setBar={setBar} hasActivePlan={hasActivePlan} onFlash={setFlash} />
          </div>
        </div>
      </div>

      {flash && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: BG2, border: `1px solid ${GOLD}`, color: GOLD2, borderRadius: 12, padding: "11px 18px", fontWeight: 700, fontSize: 13.5, zIndex: 50, boxShadow: "0 8px 30px rgba(0,0,0,0.5)", maxWidth: "90vw", textAlign: "center" }}>
          {flash}
        </div>
      )}
    </div>
  );
}

// ─── Header: "Centro de control de tu peña" ─────────────────────────────────
function DashHeader({ bar, state, hasActivePlan, isPaused, isRefunded }: { bar: BarRow; state: CardState; hasActivePlan: boolean; isPaused: boolean; isRefunded: boolean }) {
  const badge = statusBadge(bar.status, hasActivePlan, isPaused, isRefunded);
  return (
    <header style={{ marginBottom: 18 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: GOLD, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
        <Trophy size={14} /> Peña del bar
      </div>
      <h1 style={{ fontSize: 27, fontWeight: 900, margin: "8px 0 2px", lineHeight: 1.1 }}>Centro de control de tu peña</h1>
      <p style={{ color: MID, fontSize: 14.5, margin: "0 0 12px", maxWidth: 620, lineHeight: 1.5 }}>
        Configura, activa y comparte la peña del Mundial de tu bar desde aquí.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 800, fontSize: 15 }}>{bar.name}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: badge.bg, color: badge.color, border: `1px solid ${badge.color}33`, borderRadius: 999, padding: "4px 11px", fontSize: 12.5, fontWeight: 800 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: badge.color }} /> {badge.text}
        </span>
        <a href={`/b/${bar.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: GOLD2, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700 }}>
          {state === "published" ? "Ver página pública" : "Ver vista previa"} <ExternalLink size={13} />
        </a>
      </div>
    </header>
  );
}

function statusBadge(status: string, hasActivePlan: boolean, isPaused: boolean, isRefunded: boolean): { text: string; color: string; bg: string } {
  if (status === "published" && hasActivePlan) return { text: "Publicado", color: GREEN, bg: "rgba(34,197,94,0.12)" };
  if (isPaused) return { text: "Suspendido", color: MID, bg: "rgba(148,163,184,0.12)" };
  if (isRefunded) return { text: "Suspendido", color: RED, bg: "rgba(248,113,113,0.12)" };
  if (hasActivePlan) return { text: "Plan activo", color: GOLD, bg: "rgba(201,168,76,0.14)" };
  if (status === "pending_payment") return { text: "Pendiente de pago", color: GOLD, bg: "rgba(201,168,76,0.14)" };
  return { text: "Borrador", color: DIM, bg: "rgba(100,116,139,0.12)" };
}

// ─── Card principal: estado de activación ────────────────────────────────────
function StatusCard({ state, bar, publishing, onPublish, onPlans }: { state: CardState; bar: BarRow; publishing: boolean; onPublish: () => void; onPlans: () => void }) {
  const cfg: Record<CardState, { eyebrow: string; title: string; text: string; primary: ActionCfg; secondary?: ActionCfg }> = {
    draft: {
      eyebrow: "Estado de tu peña", title: "Tu peña está en borrador",
      text: "Activa un plan para publicar tu peña, activar el QR y empezar a recibir participantes.",
      primary: { label: "Activar plan", icon: <CreditCard size={16} />, onClick: onPlans },
      secondary: { label: "Ver vista previa", icon: <Eye size={15} />, href: `/b/${bar.slug}` },
    },
    planActive: {
      eyebrow: "Estado de tu peña", title: "Tu plan está activo",
      text: "Publica tu peña para activar el QR y empezar a recibir participantes.",
      primary: { label: "Publicar peña", icon: <Rocket size={16} />, onClick: onPublish, busy: publishing },
      secondary: { label: "Abrir kit de activación", icon: <Sparkles size={15} />, href: "/bar-dashboard/kit" },
    },
    published: {
      eyebrow: "Estado de tu peña", title: "Peña publicada",
      text: "Tu QR ya está activo. Comparte tus carteles y abre la pantalla TV durante los partidos.",
      primary: { label: "Abrir pantalla TV", icon: <Tv size={16} />, href: `/b/${bar.slug}/tv` },
      secondary: { label: "Descargar kit", icon: <Download size={15} />, href: "/bar-dashboard/kit" },
    },
    suspended: {
      eyebrow: "Estado de tu peña", title: "Tu plan ya no está activo",
      text: "Para volver a publicar tu peña, activa un nuevo plan.",
      primary: { label: "Activar plan", icon: <CreditCard size={16} />, onClick: onPlans },
    },
  };
  const c = cfg[state];
  return (
    <div style={{
      background: "linear-gradient(160deg, rgba(201,168,76,0.12), rgba(15,29,50,0.65) 55%)",
      border: `1px solid ${GOLD}66`, borderRadius: 20, padding: "22px 22px 20px",
      boxShadow: "0 14px 50px -20px rgba(201,168,76,0.35)",
    }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: GOLD, fontWeight: 800, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 1 }}>
        <Sparkles size={14} /> {c.eyebrow}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 900, margin: "8px 0 0", lineHeight: 1.15 }}>{c.title}</h2>
      <p style={{ color: "#cbd5e1", fontSize: 14.5, margin: "7px 0 16px", maxWidth: 560, lineHeight: 1.55 }}>{c.text}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Action cfg={c.primary} primary />
        {c.secondary && <Action cfg={c.secondary} />}
      </div>
    </div>
  );
}

interface ActionCfg { label: string; icon?: React.ReactNode; href?: string; onClick?: () => void; busy?: boolean }
function Action({ cfg, primary }: { cfg: ActionCfg; primary?: boolean }) {
  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: cfg.busy ? "default" : "pointer",
    border: primary ? "none" : BORDER, textDecoration: "none", borderRadius: 12, fontWeight: 800, fontSize: 14, padding: "11px 18px",
    background: primary ? `linear-gradient(135deg, ${GOLD}, ${GOLD2})` : "rgba(255,255,255,0.05)",
    color: primary ? "#1A1208" : "#E2E8F0", opacity: cfg.busy ? 0.7 : 1, whiteSpace: "nowrap",
  };
  const inner = <>{cfg.busy ? <Loader2 size={16} className="spin" /> : cfg.icon} {cfg.label}</>;
  if (cfg.href) return <a href={cfg.href} target="_blank" rel="noopener noreferrer" style={style}>{inner}</a>;
  return <button type="button" onClick={cfg.onClick} disabled={cfg.busy} style={style}>{inner}</button>;
}

// ─── Checklist de activación ─────────────────────────────────────────────────
function ChecklistCard({ items }: { items: { label: string; done: boolean }[] }) {
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <div style={{ background: BG2, border: BORDER, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14.5, marginBottom: 4 }}>
        <CheckCircle2 size={16} color={GOLD} /> Checklist para lanzar tu peña
      </div>
      <div style={{ color: MID, fontSize: 12.5, marginBottom: 10 }}>{done} de {items.length} completado</div>
      <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`, transition: "width .4s" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: it.done ? "#E2E8F0" : MID }}>
            {it.done ? <CheckCircle2 size={17} color={GOLD} /> : <Circle size={17} color={DIM} />}
            <span style={{ textDecoration: it.done ? "none" : "none" }}>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Siguiente paso recomendado ──────────────────────────────────────────────
function NextStepCard({ state, hasPrize, publishing, onPublish, onPlans, onPrizes, bar }: { state: CardState; hasPrize: boolean; publishing: boolean; onPublish: () => void; onPlans: () => void; onPrizes: () => void; bar: BarRow }) {
  let text: string; let action: ActionCfg;
  if (!hasPrize) {
    text = "Añade un premio para motivar a tus clientes a participar.";
    action = { label: "Añadir premio", icon: <Gift size={15} />, onClick: onPrizes };
  } else if (state === "draft" || state === "suspended") {
    text = "Activa un plan para publicar tu peña.";
    action = { label: "Activar plan", icon: <CreditCard size={15} />, onClick: onPlans };
  } else if (state === "planActive") {
    text = "Publica tu peña para empezar a recibir participantes.";
    action = { label: "Publicar peña", icon: <Rocket size={15} />, onClick: onPublish, busy: publishing };
  } else {
    text = "Comparte tu QR y abre la pantalla TV durante los partidos.";
    action = { label: "Abrir pantalla TV", icon: <Tv size={15} />, href: `/b/${bar.slug}/tv` };
  }
  return (
    <div style={{ background: "linear-gradient(180deg, rgba(201,168,76,0.10), rgba(15,29,50,0.5))", border: `1px solid ${GOLD}44`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14.5, marginBottom: 6 }}>
        <ArrowRight size={16} color={GOLD} /> Siguiente paso
      </div>
      <p style={{ color: "#cbd5e1", fontSize: 13.5, margin: "0 0 12px", lineHeight: 1.5 }}>{text}</p>
      <Action cfg={action} primary />
    </div>
  );
}

// ─── Ayuda rápida + enlace público ───────────────────────────────────────────
function QuickHelpCard({ bar, origin, onFlash }: { bar: BarRow; origin: string; onFlash: (s: string) => void }) {
  const url = `${origin}/b/${bar.slug}`;
  const short = url.replace(/^https?:\/\//, "");
  return (
    <div style={{ background: BG2, border: BORDER, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14.5, marginBottom: 8 }}>
        <HelpCircle size={16} color={GOLD} /> Ayuda rápida
      </div>
      <div style={{ color: MID, fontSize: 12.5, marginBottom: 6 }}>Enlace de tu peña</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <code style={{ background: BG3, border: BORDER, borderRadius: 8, padding: "6px 9px", fontSize: 12, color: GOLD2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{short}</code>
        <button onClick={() => { void navigator.clipboard.writeText(url); onFlash("Enlace copiado"); }} style={{ ...qa(), cursor: "pointer", padding: "6px 9px" }} title="Copiar enlace"><Copy size={14} /></button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <a href="/bares/precios" target="_blank" rel="noopener noreferrer" style={helpLink()}>Ver comparativa de planes <ExternalLink size={12} /></a>
        <a href="/bar-dashboard/kit" style={helpLink()}>Abrir kit de activación <ArrowRight size={12} /></a>
        <a href={`/b/${bar.slug}/ranking`} target="_blank" rel="noopener noreferrer" style={helpLink()}>Ver ranking del bar <ExternalLink size={12} /></a>
      </div>
    </div>
  );
}

function helpLink(): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", gap: 5, color: GOLD2, textDecoration: "none", fontSize: 13, fontWeight: 700 };
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800, margin: "0 0 10px" }}>
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Kit de activación (con valor visual + gating por plan) ───────────────────
function KitSection({ hasActivePlan }: { hasActivePlan: boolean }) {
  const items = [
    { icon: <QrCode size={18} color={GOLD2} />, label: "QR" },
    { icon: <Printer size={18} color={GOLD2} />, label: "Cartel" },
    { icon: <ImageIcon size={18} color={GOLD2} />, label: "Mesa" },
    { icon: <Share2 size={18} color={GOLD2} />, label: "Story" },
    { icon: <Tv size={18} color={GOLD2} />, label: "TV" },
  ];
  return (
    <section>
      <div style={{ background: "linear-gradient(180deg, rgba(201,168,76,0.10), rgba(15,29,50,0.6))", border: `1px solid ${GOLD}4d`, borderRadius: 18, padding: 18 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: GOLD, fontWeight: 800, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 1 }}>
          <Sparkles size={14} /> Kit de activación
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 900, margin: "6px 0 0" }}>
          {hasActivePlan ? "Tu kit de activación está listo" : "Kit preparado"}
        </h2>
        <p style={{ color: MID, fontSize: 13.5, margin: "5px 0 14px", maxWidth: 480, lineHeight: 1.5 }}>
          {hasActivePlan
            ? "Incluido en tu plan: descarga tus carteles, compártelos en redes y abre la pantalla TV para empezar a recibir participantes."
            : "Incluido en todos los planes: carteles, QR y materiales para redes listos para descargar."}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {items.map((it) => (
            <div key={it.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: 64, padding: "10px 6px", background: BG3, border: BORDER, borderRadius: 12, opacity: hasActivePlan ? 1 : 0.6 }}>
              {it.icon}
              <span style={{ fontSize: 11, color: MID, fontWeight: 700 }}>{it.label}</span>
            </div>
          ))}
        </div>
        {hasActivePlan && (
          <a href="/bar-dashboard/kit" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#1A1208", fontWeight: 800, fontSize: 14, padding: "11px 18px", borderRadius: 999, textDecoration: "none" }}>
            <Sparkles size={16} /> Abrir kit de activación
          </a>
        )}

        {/* Póster impreso opcional: el kit digital es gratis; quien quiera el cartel
            impreso y enviado a su local paga un recargo de 8€ (envío incluido). */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: BORDER, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 800, fontSize: 13.5 }}>
              <Printer size={16} color={GOLD2} /> ¿Lo quieres impreso?
            </div>
            <p style={{ color: MID, fontSize: 12.5, margin: "4px 0 0", lineHeight: 1.5 }}>
              Te enviamos el póster impreso a tu local por <strong style={{ color: "#E2E8F0" }}>8&nbsp;€</strong> (envío incluido).
            </p>
          </div>
          <a
            href="mailto:gol@zonamundial.app?subject=Quiero%20el%20p%C3%B3ster%20impreso%20(8%E2%82%AC)&body=Hola%2C%20quiero%20recibir%20el%20p%C3%B3ster%20de%20mi%20porra%20impreso%20por%208%E2%82%AC%20(env%C3%ADo%20incluido).%20Mi%20bar%20es%3A%20"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.06)", color: "#E2E8F0", border: BORDER, fontWeight: 800, fontSize: 13.5, padding: "10px 16px", borderRadius: 999, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            <Printer size={15} /> Pedir impreso · 8€
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Resumen / métricas (con microcopy si está en 0) ──────────────────────────
function Resumen({ stats, bar, origin, onFlash, hasActivePlan, isPublished }: { stats: BarStats | null; bar: BarRow; origin: string; onFlash: (s: string) => void; hasActivePlan: boolean; isPublished: boolean }) {
  const cards = [
    { label: "Participantes", value: stats?.participants ?? 0, icon: <Users size={16} color={GOLD2} />, help: "Aparecerán cuando los clientes se unan." },
    { label: "Escaneos QR", value: stats?.scans ?? 0, icon: <QrCode size={16} color={GOLD2} />, help: "Coloca el QR en barra, mesas o TV." },
    { label: "Predicciones", value: stats?.predictions ?? 0, icon: <Trophy size={16} color={GOLD2} />, help: "Se activarán cuando publiques la peña." },
  ];
  return (
    <Section icon={<BarChart3 size={17} color={GOLD} />} title="Resumen">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 12 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: BG2, border: BORDER, borderRadius: 14, padding: "13px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: DIM, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.icon} {c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>{c.value}</div>
            {c.value === 0 && <div style={{ color: DIM, fontSize: 11.5, marginTop: 4, lineHeight: 1.4 }}>{c.help}</div>}
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

// ─── Planes (tarjetas con qué incluye cada plan) ──────────────────────────────
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
      <p style={{ color: MID, fontSize: 13.5, margin: "0 0 14px", lineHeight: 1.5 }}>
        Elige un plan para publicar tu peña, activar el QR y usarla durante todo el Mundial. Pago único.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {planList().map((plan) => (
          <div key={plan.id} style={{
            position: "relative", background: BG2,
            border: plan.highlight ? `1.5px solid ${GOLD}` : BORDER, borderRadius: 16, padding: 16,
            display: "flex", flexDirection: "column",
            boxShadow: plan.highlight ? "0 12px 40px -18px rgba(201,168,76,0.5)" : "none",
          }}>
            {plan.highlight && (
              <span style={{ position: "absolute", top: -11, left: 16, background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#1A1208", fontWeight: 900, fontSize: 11, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Recomendado
              </span>
            )}
            <div style={{ fontWeight: 900, fontSize: 16 }}>{plan.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "6px 0 2px" }}>
              <span style={{ fontSize: 26, fontWeight: 900 }}>{plan.priceEur} €</span>
              <span style={{ color: DIM, fontSize: 12 }}>/ Mundial</span>
            </div>
            <div style={{ color: DIM, fontSize: 11, marginBottom: 10 }}>{plan.priceUsd} USD · LATAM y USA</div>
            <p style={{ color: MID, fontSize: 12.5, margin: "0 0 12px", lineHeight: 1.45 }}>{PLAN_TAGLINE[plan.id] ?? plan.tagline}</p>
            <ul style={{ listStyle: "none", margin: "0 0 14px", padding: 0, display: "flex", flexDirection: "column", gap: 7 }}>
              {plan.features.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.4 }}>
                  <Check size={14} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => void buy(plan.id)}
              disabled={!!busy}
              style={{
                marginTop: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                border: "none", cursor: busy ? "default" : "pointer", borderRadius: 11, fontWeight: 800, fontSize: 13.5, padding: "11px 14px",
                background: plan.highlight ? `linear-gradient(135deg, ${GOLD}, ${GOLD2})` : "rgba(255,255,255,0.06)",
                color: plan.highlight ? "#1A1208" : "#E2E8F0", opacity: busy && busy !== plan.id ? 0.5 : 1,
              }}
            >
              {busy === plan.id ? <Loader2 size={14} className="spin" /> : <CreditCard size={14} />} Elegir plan
            </button>
          </div>
        ))}
      </div>
      <p style={{ color: DIM, fontSize: 11.5, marginTop: 12 }}>
        Pago seguro con Stripe. La moneda se ajusta según tu país.{" "}
        <a href="/bares/precios" target="_blank" rel="noopener noreferrer" style={{ color: GOLD2 }}>Ver comparativa de planes</a>.
      </p>
    </Section>
  );
}

// ─── QR oficial ──────────────────────────────────────────────────────────────
function QrSection({ bar, qr, origin, onFlash, hasActivePlan }: { bar: BarRow; qr: QrSource | null; origin: string; onFlash: (s: string) => void; hasActivePlan: boolean }) {
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
    <Section icon={<QrCode size={17} color={GOLD} />} title="QR oficial de tu peña">
      <div style={{ background: BG2, border: BORDER, borderRadius: 14, padding: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 8, width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {png ? <img src={png} alt="QR de la peña" style={{ width: "100%", height: "100%", opacity: hasActivePlan ? 1 : 0.5 }} /> : <Loader2 size={24} className="spin" color="#0A0A0A" />}
          {!hasActivePlan && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.35)", borderRadius: 12 }}>
              <Lock size={28} color="#0A0A0A" />
            </div>
          )}
        </div>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <div style={{ color: MID, fontSize: 13, marginBottom: 4, lineHeight: 1.5 }}>
            Colócalo en la barra, mesas, puerta del local o pantalla TV. Cada escaneo se contará en tus estadísticas.
          </div>
          {!hasActivePlan && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(201,168,76,0.10)", border: `1px solid ${GOLD}44`, borderRadius: 10, padding: "8px 11px", color: GOLD2, fontSize: 12.5, marginBottom: 10, lineHeight: 1.4 }}>
              <Lock size={14} style={{ flexShrink: 0 }} /> Tu QR está preparado, pero se activará cuando contrates un plan.
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <code style={{ background: BG3, border: BORDER, borderRadius: 8, padding: "6px 9px", fontSize: 12.5, color: GOLD2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{shortUrl}</code>
            <button onClick={() => { void navigator.clipboard.writeText(target); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ ...qa(), cursor: "pointer", padding: "6px 9px" }}>
              {copied ? <Check size={14} color={GREEN} /> : <Copy size={14} />}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => void download("png")} style={{ ...qa(), cursor: "pointer" }}><Download size={14} /> Descargar QR (PNG)</button>
            <button onClick={() => void download("svg")} style={{ ...qa(), cursor: "pointer" }}><Download size={14} /> SVG</button>
            <a href={`/b/${bar.slug}/tv`} target="_blank" rel="noopener noreferrer" style={qa()}><Tv size={14} /> Pantalla TV</a>
            <a href="/bar-dashboard/kit" style={qa()}><Sparkles size={14} /> Kit</a>
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
  // Solo zonas extra (la principal se gestiona arriba en "QR oficial").
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

function Personalization({ bar, setBar, hasActivePlan, onFlash }: { bar: BarRow; setBar: (b: BarRow) => void; hasActivePlan: boolean; onFlash: (s: string) => void }) {
  const [form, setForm] = useState({
    name: bar.name, city: bar.city ?? "", welcome_message: bar.welcome_message ?? "",
    cta_label: bar.cta_label, description: bar.description ?? "", instagram: bar.instagram ?? "",
    address: bar.address ?? "", theme_id: bar.theme_id, logo_url: bar.logo_url ?? "", cover_url: bar.cover_url ?? "",
    entry_fee_note: bar.entry_fee_note ?? "",
  });
  const [busy, setBusy] = useState(false);
  const themes = useMemo(() => themeList(), []);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onImage = useCallback((b: BarRow) => {
    setBar(b);
    setForm((f) => ({ ...f, logo_url: b.logo_url ?? "", cover_url: b.cover_url ?? "" }));
  }, [setBar]);

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
        <Field label="Inscripción (opcional)">
          <textarea
            value={form.entry_fee_note}
            onChange={(e) => set("entry_fee_note", e.target.value)}
            rows={2}
            placeholder="Ej.: Participación 3 € que se abonan en barra. El premio: jamón + camiseta."
            style={{ ...inp(), resize: "vertical" }}
          />
          <p style={{ fontSize: 11.5, color: DIM, margin: "6px 2px 0", lineHeight: 1.5 }}>
            Si tu local cobra una cuota para participar, descríbela aquí. La cobras y la gestionas tú
            directamente (en barra/efectivo): ZonaMundial no procesa ningún pago. Déjalo vacío si tu peña es gratuita.
          </p>
        </Field>
        <Field label="Instagram (sin @)"><input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} style={inp()} /></Field>
        <Field label="Dirección"><input value={form.address} onChange={(e) => set("address", e.target.value)} style={inp()} /></Field>
        <Field label="Logo del bar"><ImageUpload kind="logo" url={form.logo_url} onChange={onImage} onFlash={onFlash} /></Field>
        <Field label="Portada del bar"><ImageUpload kind="cover" url={form.cover_url} onChange={onImage} onFlash={onFlash} /></Field>
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
            hasActivePlan ? (
              <button onClick={() => void save({ status: "published" })} disabled={busy} style={{ ...btn(true), opacity: busy ? 0.6 : 1 }}>
                <Rocket size={15} /> Publicar peña
              </button>
            ) : (
              <button onClick={() => onFlash("Activa tu plan para publicar tu peña.")} style={{ ...qa(), cursor: "pointer", color: DIM }}>
                <Lock size={14} /> Activa tu plan para publicar
              </button>
            )
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

function ImageUpload({ kind, url, onChange, onFlash }: { kind: "logo" | "cover"; url: string; onChange: (b: BarRow) => void; onFlash: (s: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const noun = kind === "cover" ? "portada" : "logo";
  const isCover = kind === "cover";

  const upload = useCallback(async (file: File) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/bars/logo?kind=${kind}`, { method: "POST", body: fd });
      const j = await res.json();
      if (res.ok && j.bar) { onChange(j.bar); onFlash(`${isCover ? "Portada actualizada" : "Logo actualizado"}`); }
      else onFlash(j.error || `No se pudo subir la ${noun}`);
    } catch { onFlash(`Error de red al subir la ${noun}`); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  }, [kind, isCover, noun, onChange, onFlash]);

  const remove = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/bars/logo?kind=${kind}`, { method: "DELETE" });
      const j = await res.json();
      if (res.ok && j.bar) { onChange(j.bar); onFlash(`${isCover ? "Portada eliminada" : "Logo eliminado"}`); }
      else onFlash(j.error || "No se pudo eliminar");
    } catch { onFlash("Error de red"); }
    finally { setBusy(false); }
  }, [kind, isCover, onChange, onFlash]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{
        width: isCover ? 128 : 72, height: 72, borderRadius: 12, flexShrink: 0, border: BORDER, background: BG3,
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}>
        {url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={url} alt={`${noun} del bar`} style={{ width: "100%", height: "100%", objectFit: isCover ? "cover" : "contain" }} />
          : <ImageIcon size={26} color={DIM} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input
          ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
          style={{ display: "none" }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} style={{ ...btn(), opacity: busy ? 0.6 : 1 }}>
            {busy ? <Loader2 size={15} className="spin" /> : <Upload size={15} />} {url ? `Cambiar ${noun}` : `Subir ${noun}`}
          </button>
          {url && (
            <button type="button" onClick={() => void remove()} disabled={busy} style={{ ...qa(), cursor: "pointer", color: DIM }}>
              <Trash2 size={14} /> Quitar
            </button>
          )}
        </div>
        <span style={{ color: DIM, fontSize: 11.5 }}>PNG, JPG, WEBP o SVG · máx. 2 MB</span>
      </div>
    </div>
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
      <style>{`.zm-pub-lat { display: none !important; } .google-auto-placed, ins.adsbygoogle { display: none !important; }`}</style>
      <div style={{ width: "100%", maxWidth: 440, background: BG2, border: BORDER, borderRadius: 18, padding: 24 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: GOLD, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
          <Trophy size={14} /> Peñas Digitales para Bares
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "8px 0 4px" }}>Crea la peña de tu bar</h1>
        <p style={{ color: MID, fontSize: 14, margin: "0 0 18px" }}>En un minuto tendrás tu página, tu QR y tu ranking listos para los clientes.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del bar" style={inp()} />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad (opcional)" style={inp()} />
          {err && <div style={{ color: "#f87171", fontSize: 13 }}>{err}</div>}
          <button onClick={() => void create()} disabled={busy || !name.trim()} style={{ ...btn(true), opacity: busy || !name.trim() ? 0.6 : 1 }}>
            {busy ? <Loader2 size={16} className="spin" /> : <Rocket size={16} />} Crear mi peña
          </button>
        </div>
        <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.5, marginTop: 16 }}>
          Dinámica gratuita de predicciones. No implica apuestas. Los premios los gestiona el establecimiento.
        </p>
      </div>
    </div>
  );
}

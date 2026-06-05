// src/app/app/modo-carrera/jugar/MissionsView.tsx
// Pilar 4 — Misiones dinámicas. Lista las misiones por estado, muestra barra de
// progreso y permite reclamar la recompensa al completarlas. La misión de
// entrenamiento diaria se avanza con un botón ("Entrenar"); el resto se
// completan jugando partidos (motor de partidos, fase posterior). SVG-only.

"use client";

import { useState } from "react";
import { BG2, BG3, GOLD, GOLD2, GREEN, MID, DIM } from "./fx";
import { MissionIcon, CheckIcon, StarIcon } from "./icons";
import { missionKey } from "@/lib/modo-carrera/missions";
import type { CareerState, Mission, MissionKind } from "@/lib/modo-carrera/types";

const KIND_LABEL: Record<MissionKind, string> = {
  diaria: "Diaria",
  semanal: "Semanal",
  torneo: "Torneo",
  flash: "Flash",
};
const KIND_COLOR: Record<MissionKind, string> = {
  diaria: "#3b82f6",
  semanal: "#a855f7",
  torneo: GOLD,
  flash: "#ef4444",
};

function timeLeft(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expira pronto";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function MissionsView({
  career,
  onAdvance,
  onClaim,
}: {
  career: CareerState;
  onAdvance: (id: string) => void;
  onClaim: (id: string) => void;
}) {
  const [toast, setToast] = useState<{ xp: number; rep: number; key: number } | null>(null);

  const active = career.missions.filter((m) => m.status === "activa");
  const ready = career.missions.filter((m) => m.status === "completada");
  const done = career.missions.filter((m) => m.status === "reclamada" || m.status === "fallida");

  const claim = (m: Mission) => {
    onClaim(m.id);
    setToast({ xp: m.rewardXp, rep: m.rewardReputation, key: Date.now() });
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
      <style>{`
        @keyframes mcReward { 0%{transform:translateY(10px);opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{transform:translateY(-28px);opacity:0} }
        @keyframes mcCardGlow { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 100%{box-shadow:0 0 0 6px rgba(34,197,94,0)} }
        .mc-ready { animation: mcCardGlow 1.8s ease-out infinite; }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>Misiones</h2>
        <p style={{ fontSize: 13, color: MID, marginTop: 4 }}>
          Completa retos para ganar XP y reputación. Se renuevan cada día y semana.
        </p>
      </div>

      {toast && (
        <div
          key={toast.key}
          style={{
            position: "fixed",
            top: 90,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            display: "flex",
            gap: 14,
            padding: "10px 18px",
            borderRadius: 999,
            background: "rgba(11,24,37,0.96)",
            border: `1px solid ${GOLD}`,
            animation: "mcReward 1.8s ease forwards",
          }}
        >
          <span style={{ color: GOLD2, fontWeight: 900 }}>+{toast.xp} XP</span>
          <span style={{ color: GREEN, fontWeight: 900 }}>+{toast.rep} REP</span>
        </div>
      )}

      {ready.length > 0 && (
        <Section title="Listas para reclamar">
          {ready.map((m) => (
            <MissionCard key={m.id} m={m} onAdvance={onAdvance} onClaim={() => claim(m)} ready />
          ))}
        </Section>
      )}

      <Section title="Activas">
        {active.length === 0 ? (
          <EmptyState />
        ) : (
          active.map((m) => <MissionCard key={m.id} m={m} onAdvance={onAdvance} onClaim={() => claim(m)} />)
        )}
      </Section>

      {done.length > 0 && (
        <Section title="Historial">
          {done.map((m) => (
            <MissionCard key={m.id} m={m} onAdvance={onAdvance} onClaim={() => claim(m)} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>{children}</div>
    </div>
  );
}

function MissionCard({
  m,
  onAdvance,
  onClaim,
  ready = false,
}: {
  m: Mission;
  onAdvance: (id: string) => void;
  onClaim: () => void;
  ready?: boolean;
}) {
  const color = KIND_COLOR[m.kind];
  const pct = Math.min(100, Math.round((m.progress / Math.max(1, m.target)) * 100));
  const expired = m.status === "fallida";
  const claimed = m.status === "reclamada";
  const isTraining = missionKey(m) === "entreno_diario";
  const tl = m.status === "activa" ? timeLeft(m.expiresAt) : null;

  return (
    <div
      className={ready ? "mc-ready" : undefined}
      style={{
        padding: 16,
        borderRadius: 14,
        background: BG2,
        border: `1px solid ${ready ? GREEN : expired || claimed ? "rgba(255,255,255,0.05)" : `${color}33`}`,
        opacity: expired || claimed ? 0.55 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color, display: "inline-flex" }}><MissionIcon kind={m.kind} size={20} /></span>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color, border: `1px solid ${color}55`, borderRadius: 999, padding: "2px 8px" }}>
          {KIND_LABEL[m.kind]}
        </span>
        {tl && <span style={{ marginLeft: "auto", fontSize: 11, color: DIM }}>{tl}</span>}
      </div>

      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{m.title}</div>
        <div style={{ fontSize: 12.5, color: MID, marginTop: 2, lineHeight: 1.45 }}>{m.description}</div>
      </div>

      {/* Progreso */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: DIM, marginBottom: 4 }}>
          <span>{m.progress}/{m.target}</span>
          <span style={{ color: GOLD2 }}>+{m.rewardXp} XP · +{m.rewardReputation} REP</span>
        </div>
        <div style={{ height: 7, borderRadius: 4, background: BG3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: ready ? GREEN : `linear-gradient(90deg,${color},${GOLD2})`, transition: "width .4s ease" }} />
        </div>
      </div>

      {/* Acción */}
      {m.status === "completada" ? (
        <button type="button" onClick={onClaim} style={btn(GREEN, "#06210f")}>
          <CheckIcon size={16} /> Reclamar recompensa
        </button>
      ) : claimed ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: GREEN }}>
          <StarIcon size={15} /> Recompensa reclamada
        </div>
      ) : expired ? (
        <div style={{ fontSize: 13, fontWeight: 700, color: DIM }}>Expirada</div>
      ) : isTraining ? (
        <button type="button" onClick={() => onAdvance(m.id)} style={btn(GOLD, "#0B1825")}>
          Entrenar hoy
        </button>
      ) : (
        <div style={{ fontSize: 12, color: DIM, fontStyle: "italic" }}>Se completa jugando partidos</div>
      )}
    </div>
  );
}

function btn(bg: string, fg: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "9px 14px",
    borderRadius: 10,
    border: "none",
    background: bg,
    color: fg,
    fontWeight: 800,
    fontSize: 13.5,
    cursor: "pointer",
  };
}

function EmptyState() {
  return (
    <div style={{ gridColumn: "1 / -1", padding: "40px 20px", textAlign: "center", borderRadius: 14, background: BG2, border: "1px dashed rgba(255,255,255,0.08)" }}>
      <div style={{ color: MID, fontWeight: 700, fontSize: 15 }}>No hay misiones activas</div>
      <div style={{ color: DIM, fontSize: 13, marginTop: 6 }}>Vuelve mañana para nuevos retos.</div>
    </div>
  );
}

// src/app/app/modo-carrera/jugar/HubView.tsx
// Hub central del Modo Carrera (dashboard). Muestra la Ficha DT, la progresión
// (overall, XP, moral), un resumen de cada pilar y accesos. Los pilares pesados
// (misiones, habilidades, reputación, narrativa, legado) se renderizan vacíos
// con su estado "próximamente / sin datos" hasta sus fases.

"use client";

import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM } from "./fx";
import FichaDT from "./FichaDT";
import { rankForOverall, SKILL_BRANCHES } from "@/lib/modo-carrera/constants";
import type { CareerState } from "@/lib/modo-carrera/types";
import { SELECCIONES } from "@/data/selecciones";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div data-hub-card style={{ padding: 20, borderRadius: 16, background: BG2, border: "1px solid rgba(255,255,255,0.05)" }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, marginBottom: 14 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function HubView({ career }: { career: CareerState }) {
  const { progression: pr, reputation, missions, legacy } = career;
  const rank = rankForOverall(pr.overall);
  const nation = SELECCIONES.find((s) => s.slug === career.identity.nationSlug);
  const xpPct = Math.min(100, Math.round((pr.xp / Math.max(1, pr.xpToNext)) * 100));
  const activeMissions = missions.filter((m) => m.status === "activa");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "start" }}>
      {/* Carta DT */}
      <div data-hub-ficha style={{ display: "flex", justifyContent: "center" }}>
        <FichaDT identity={career.identity} progression={pr} />
      </div>

      {/* Panel derecho */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Progresión */}
        <Card title="Progresión">
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 40, fontWeight: 900, color: "#fff" }}>{pr.overall}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: rank.color }}>{rank.name}</span>
            <span style={{ marginLeft: "auto", fontSize: 13, color: DIM }}>Temporada {pr.season}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: DIM, marginBottom: 4 }}>
            <span>XP al siguiente nivel</span>
            <span>{pr.xp} / {pr.xpToNext}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: BG3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${xpPct}%`, background: `linear-gradient(90deg,${GOLD},${GOLD2})`, borderRadius: 4 }} />
          </div>
        </Card>

        {/* Próximo hito (placeholder hasta motor de partidos) */}
        <Card title="Próximo hito">
          <div style={{ color: MID, fontSize: 14, lineHeight: 1.6 }}>
            {nation ? (
              <>Dirigiendo a <strong style={{ color: "#fff" }}>{nation.nombre}</strong>. El calendario de partidos llegará en la próxima fase.</>
            ) : (
              "Configura tu selección para ver tu próximo partido."
            )}
          </div>
        </Card>

        {/* Misiones */}
        <Card title="Misiones activas">
          {activeMissions.length === 0 ? (
            <div style={{ color: DIM, fontSize: 14 }}>No hay misiones activas. Vuelve pronto para nuevos retos.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeMissions.slice(0, 4).map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span>{m.title}</span>
                  <span style={{ color: DIM }}>{m.progress}/{m.target}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Habilidades (resumen) */}
        <Card title="Árbol de habilidades">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
            {SKILL_BRANCHES.map((b) => (
              <div key={b.id} style={{ padding: 12, borderRadius: 10, background: BG3 }}>
                <div style={{ fontSize: 12, color: b.accent, fontWeight: 700 }}>{b.name}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{career.skills.levels[b.id]}/5</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: DIM }}>Puntos disponibles: <strong style={{ color: GOLD }}>{career.skills.points}</strong></div>
        </Card>

        {/* Legado (resumen) */}
        <Card title="Legado">
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 14 }}>
            <span style={{ color: MID }}>Trofeos: <strong style={{ color: "#fff" }}>{legacy.trophies.length}</strong></span>
            <span style={{ color: MID }}>Partidos: <strong style={{ color: "#fff" }}>{legacy.records.matchesPlayed}</strong></span>
            <span style={{ color: MID }}>Victorias: <strong style={{ color: "#fff" }}>{legacy.records.wins}</strong></span>
            <span style={{ color: MID }}>Reputación: <strong style={{ color: GOLD }}>{reputation.total}</strong></span>
          </div>
        </Card>
      </div>
    </div>
  );
}

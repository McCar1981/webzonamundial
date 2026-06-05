// src/app/app/modo-carrera/jugar/HubView.tsx
// Hub central del Modo Carrera (dashboard). Muestra la Ficha DT, la progresión
// (overall, XP, moral), un resumen de cada pilar y accesos. Los pilares pesados
// (misiones, habilidades, reputación, narrativa, legado) se renderizan vacíos
// con su estado "próximamente / sin datos" hasta sus fases.

"use client";

import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, flagUrl } from "./fx";
import FichaDT from "./FichaDT";
import { rankForOverall, SKILL_BRANCHES } from "@/lib/modo-carrera/constants";
import { DEMAND_LABEL, VERDICT_LABEL, jobAtRisk } from "@/lib/modo-carrera/board";
import type { CareerState } from "@/lib/modo-carrera/types";
import { SELECCIONES } from "@/data/selecciones";

function confColor(n: number): string {
  if (n >= 60) return "#22c55e";
  if (n >= 25) return GOLD;
  return "#ef4444";
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div data-hub-card style={{ padding: 20, borderRadius: 16, background: BG2, border: "1px solid rgba(255,255,255,0.05)" }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, marginBottom: 14 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function HubView({ career }: { career: CareerState }) {
  const { progression: pr, reputation, missions, legacy, board } = career;
  const rank = rankForOverall(pr.overall);
  const nation = SELECCIONES.find((s) => s.slug === career.identity.nationSlug);
  const xpPct = Math.min(100, Math.round((pr.xp / Math.max(1, pr.xpToNext)) * 100));
  const activeMissions = missions.filter((m) => m.status === "activa");
  const season = career.season;
  const nextMatch = season && !season.finished ? season.fixtures[season.cursor] ?? null : null;
  const nextOpp = nextMatch ? SELECCIONES.find((s) => s.slug === nextMatch.opponentSlug) : undefined;

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

        {/* Junta directiva / federación (objetivo + confianza) */}
        <Card title="Junta directiva">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: DIM, textTransform: "uppercase", letterSpacing: 0.6 }}>Objetivo de temporada</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{DEMAND_LABEL[board.objective]}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: confColor(board.confidence) }}>{VERDICT_LABEL[board.lastVerdict]}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: DIM, marginBottom: 4 }}>
            <span>Confianza de la federación</span>
            <span style={{ color: confColor(board.confidence), fontWeight: 700 }}>{board.confidence}/100</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: BG3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${board.confidence}%`, background: confColor(board.confidence), borderRadius: 4 }} />
          </div>
          {jobAtRisk(board) && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444", fontWeight: 700 }}>
              Tu puesto peligra: necesitas resultados ya.
            </div>
          )}
        </Card>

        {/* Próximo partido (motor de temporada) */}
        <Card title="Próximo partido">
          {nextMatch ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
                {nextMatch.label}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 800, color: "#fff" }}>
                {nextOpp && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={flagUrl(nextOpp.flagCode)} alt="" style={{ width: 26, height: 18, objectFit: "cover", borderRadius: 3 }} />
                )}
                <span>{nextOpp?.nombre ?? nextMatch.opponentSlug}</span>
                <span style={{ fontSize: 12, color: DIM, fontWeight: 600 }}>{nextMatch.home ? "(Local)" : "(Visitante)"}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: MID }}>Ve a la pestaña Temporada para disputarlo.</div>
            </div>
          ) : season?.finished ? (
            <div style={{ color: MID, fontSize: 14, lineHeight: 1.6 }}>
              {season.stage === "campeon" ? "¡Eres campeón del mundo!" : "Temporada finalizada."} Inicia una nueva temporada desde la pestaña Temporada.
            </div>
          ) : (
            <div style={{ color: MID, fontSize: 14, lineHeight: 1.6 }}>
              {nation ? (
                <>Dirigiendo a <strong style={{ color: "#fff" }}>{nation.nombre}</strong>. Comienza tu temporada desde la pestaña <strong style={{ color: GOLD }}>Temporada</strong>.</>
              ) : (
                "Configura tu selección para ver tu próximo partido."
              )}
            </div>
          )}
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

"use client";

// Ficha de jugador y comparador. Muestra uno o dos jugadores en columnas con
// todas sus métricas (precio y tendencia, forma, titularidad, estado, ruta
// proyectada de su selección y estadísticas). Se usa desde el Mercado.

import { getTeamRun, STAGE_LABEL } from "@/lib/fantasy/tournament";
import type { FantasyPlayer, PlayerStatus } from "@/lib/fantasy/types";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, money, marketValueLabel, flagUrl, POS_LABEL, POS_COLOR } from "./fx";

const STATUS_LABEL: Record<PlayerStatus, { label: string; color: string }> = {
  apto: { label: "Apto", color: GREEN },
  duda: { label: "Duda", color: "#fbbf24" },
  lesionado: { label: "Lesionado", color: RED },
  sancionado: { label: "Sancionado", color: "#fb923c" },
};

interface Props {
  players: FantasyPlayer[]; // 1 (ficha) o 2 (comparador)
  onClose: () => void;
}

// Métricas comparables: valor + si "más es mejor" (para resaltar al ganador).
const METRICS: { key: string; label: string; get: (p: FantasyPlayer) => number; fmt: (p: FantasyPlayer) => string; higher: boolean }[] = [
  { key: "price", label: "Precio", get: (p) => p.price, fmt: (p) => money(p.price), higher: false },
  { key: "points", label: "Puntos totales", get: (p) => p.totalPoints, fmt: (p) => String(p.totalPoints), higher: true },
  { key: "avg", label: "Media por jornada", get: (p) => p.avgPoints, fmt: (p) => String(p.avgPoints), higher: true },
  { key: "form", label: "Forma", get: (p) => p.form, fmt: (p) => `${p.form}/10`, higher: true },
  { key: "startProb", label: "Prob. titular", get: (p) => p.startProb, fmt: (p) => `${p.startProb}%`, higher: true },
  { key: "ownership", label: "Propiedad", get: (p) => p.ownership, fmt: (p) => `${p.ownership}%`, higher: true },
  { key: "mult", label: "Multiplicador", get: (p) => p.next.tier.multiplier, fmt: (p) => `×${p.next.tier.multiplier}`, higher: true },
  { key: "goals", label: "Goles", get: (p) => p.stats.goals, fmt: (p) => String(p.stats.goals), higher: true },
  { key: "assists", label: "Asistencias", get: (p) => p.stats.assists, fmt: (p) => String(p.stats.assists), higher: true },
  { key: "minutes", label: "Minutos", get: (p) => p.stats.minutes, fmt: (p) => String(p.stats.minutes), higher: true },
  { key: "cs", label: "Porterías a cero", get: (p) => p.stats.cleanSheets, fmt: (p) => String(p.stats.cleanSheets), higher: true },
];

export default function PlayerModal({ players, onClose }: Props) {
  const compare = players.length > 1;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.66)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: compare ? 560 : 380, maxHeight: "90vh", overflowY: "auto", background: BG, border: `1px solid ${GOLD}44`, borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>{compare ? "⚖️ Comparador" : "Ficha de jugador"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MID, fontSize: 20, fontWeight: 800, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Identidad */}
        <div style={{ display: "grid", gridTemplateColumns: compare ? "1fr 1fr" : "1fr", gap: 12, padding: 16 }}>
          {players.map((p) => {
            const run = getTeamRun(p.teamSlug);
            const st = STATUS_LABEL[p.status];
            return (
              <div key={p.id} style={{ background: BG2, borderRadius: 14, padding: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={flagUrl(p.flag)} alt={p.teamName} style={{ width: 40, height: 27, borderRadius: 4, objectFit: "cover", border: `1px solid ${p.color}` }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: MID, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.teamName} · {p.club}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, color: POS_COLOR[p.pos], background: `${POS_COLOR[p.pos]}1e`, borderRadius: 6, padding: "3px 7px" }}>{POS_LABEL[p.pos]}</span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, fontSize: 11 }}>
                  <span style={{ fontWeight: 800, color: p.next.tier.color }}>{p.next.tier.emoji} {p.next.tier.label} ×{p.next.tier.multiplier}</span>
                  <span style={{ color: DIM }}>vs {p.next.opponentName}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, fontSize: 11 }}>
                  <span style={{ fontWeight: 800, color: st.color }}>● {st.label}</span>
                  {run && <span style={{ fontWeight: 800, color: run.stageRound >= 3 ? GOLD2 : DIM }}>{run.stageRound === 6 ? "🏆" : "🗺️"} {STAGE_LABEL[run.stage]}</span>}
                </div>
                {p.marketValue != null && (
                  <div style={{ marginTop: 8, fontSize: 11, color: DIM }}>
                    Valor de mercado <b style={{ color: "#fff" }}>{marketValueLabel(p.marketValue)}</b> <span style={{ color: MID }}>· Transfermarkt</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Métricas */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ background: BG2, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            {METRICS.map((m, i) => {
              // En comparación, resalta al "ganador" de cada métrica.
              let winner = -1;
              if (compare) {
                const a = m.get(players[0]);
                const b = m.get(players[1]);
                if (a !== b) winner = (m.higher ? a > b : a < b) ? 0 : 1;
              }
              return (
                <div key={m.key} style={{ display: "grid", gridTemplateColumns: compare ? "1fr auto 1fr" : "1fr auto", alignItems: "center", gap: 10, padding: "9px 14px", background: i % 2 ? "transparent" : BG3 }}>
                  {compare ? (
                    <>
                      <span style={{ textAlign: "right", fontSize: 13, fontWeight: winner === 0 ? 900 : 700, color: winner === 0 ? GREEN : "#fff" }}>{m.fmt(players[0])}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center", minWidth: 96 }}>{m.label}</span>
                      <span style={{ textAlign: "left", fontSize: 13, fontWeight: winner === 1 ? 900 : 700, color: winner === 1 ? GREEN : "#fff" }}>{m.fmt(players[1])}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: GOLD2 }}>{m.fmt(players[0])}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

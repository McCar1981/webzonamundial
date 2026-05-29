"use client";

// Ficha de jugador y comparador. Muestra uno o dos jugadores en columnas con
// todas sus métricas (precio y tendencia, forma, titularidad, estado, ruta
// proyectada de su selección y estadísticas). Se usa desde el Mercado.

import { getTeamRun, STAGE_LABEL } from "@/lib/fantasy/tournament";
import { getPlayerSeasonStats, type PlayerFixture } from "@/lib/fantasy/player-stats";
import type { FantasyPlayer, PlayerStatus } from "@/lib/fantasy/types";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, money, marketValueLabel, flagUrl, kitUrl, POS_LABEL, POS_COLOR } from "./fx";

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
                {/* Camiseta (no usamos fotos por protección de marca). */}
                {!compare && (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                    <img
                      src={kitUrl(p.teamSlug)}
                      alt={`Camiseta ${p.teamName}`}
                      style={{ width: 96, height: 96, objectFit: "contain", filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.5))" }}
                    />
                  </div>
                )}
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

        {/* Análisis por partido — solo en ficha individual */}
        {!compare && <PlayerAnalysis player={players[0]} />}
      </div>
    </div>
  );
}

// Fecha corta "dd/mm" y hora local "hh:mm".
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function shortTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Bloque de análisis: próximos partidos (CALENDARIO real) + desglose por partido
// con puntos fantasy y métricas clave. Sustituye al "data-indices" gigante de la
// referencia: se calcula en el cliente bajo demanda al abrir la ficha.
function PlayerAnalysis({ player }: { player: FantasyPlayer }) {
  const data = getPlayerSeasonStats(player);
  const next5 = data.upcoming.slice(0, 5);
  const maxPts = Math.max(4, ...data.fixtures.map((f) => Math.abs(f.points)));
  const t = data.totals;
  const projected = data.played.length === 0;

  return (
    <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Resumen del torneo */}
      <div>
        <div style={secTitle}>📊 {projected ? "Proyección Mundial 2026" : "Mundial 2026"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {[
            ["Pts", t.puntos],
            ["Media", t.media],
            ["Goles", t.goles],
            ["Asist.", t.asistencias],
          ].map(([label, val]) => (
            <div key={String(label)} style={{ background: BG2, borderRadius: 10, padding: "9px 6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: GOLD2, fontVariantNumeric: "tabular-nums" }}>{val}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 0.5 }}>{String(label)}</div>
            </div>
          ))}
        </div>
        {projected && <div style={{ fontSize: 10, color: DIM, marginTop: 5 }}>Cifras proyectadas hasta el pitido inicial · {t.partidos} partidos estimados</div>}
      </div>

      {/* Próximos partidos (calendario real) */}
      {next5.length > 0 && (
        <div>
          <div style={secTitle}>📅 Próximos partidos</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {next5.map((f) => (
              <FixtureRow key={f.matchId} f={f} />
            ))}
          </div>
        </div>
      )}

      {/* Desglose por partido: barra de puntos + métricas clave */}
      <div>
        <div style={secTitle}>📈 {projected ? "Puntos proyectados por partido" : "Puntos por partido"}</div>
        <div style={{ background: BG2, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {data.fixtures.map((f) => (
            <div key={f.matchId} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: DIM, width: 42 }}>{f.jornada ? `J${f.jornada}` : f.stageLabel.slice(0, 3)}</span>
              <img src={flagUrl(f.opponentFlag)} alt="" style={{ width: 18, height: 12, borderRadius: 2, objectFit: "cover", opacity: f.projected ? 0.5 : 1 }} />
              <div style={{ flex: 1, height: 16, background: BG3, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                <div style={{ height: "100%", width: `${(Math.max(0, f.points) / maxPts) * 100}%`, background: f.points >= 0 ? `linear-gradient(90deg,${GOLD},${GOLD2})` : RED, transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: f.points >= 0 ? "#fff" : RED, width: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{f.points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de métricas acumuladas */}
      <div>
        <div style={secTitle}>🔬 Métricas {projected ? "(proyección)" : ""}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
          {[
            ["T. a puerta", t.tirosPuerta],
            ["Pases clave", t.pasesClave],
            ["Regates", t.regatesExito],
            ["Entradas", t.tackles],
            ["Paradas", t.paradas],
            ["Amarillas", t.amarillas],
          ].map(([label, val]) => (
            <div key={String(label)} style={{ background: BG2, borderRadius: 8, padding: "7px 8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: DIM }}>{String(label)}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{val}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: DIM, marginTop: 6 }}>Datos del torneo · se actualizarán con los partidos reales desde el 11 jun.</div>
      </div>
    </div>
  );
}

function FixtureRow({ f }: { f: PlayerFixture }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: BG2, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)", padding: "8px 10px" }}>
      <div style={{ textAlign: "center", width: 40 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: GOLD2 }}>{shortDate(f.date)}</div>
        <div style={{ fontSize: 9, color: DIM }}>{f.jornada ? `J${f.jornada}` : "KO"}</div>
      </div>
      <img src={flagUrl(f.opponentFlag)} alt="" style={{ width: 26, height: 18, borderRadius: 3, objectFit: "cover", opacity: f.projected ? 0.5 : 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {f.home ? "vs " : "@ "}{f.opponentName}
        </div>
        <div style={{ fontSize: 10, color: DIM }}>{f.projected ? f.stageLabel : `${f.venue ?? ""} · ${shortTime(f.date)}`}</div>
      </div>
    </div>
  );
}

const secTitle: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 };

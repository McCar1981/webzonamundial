// src/components/bracket/CosmicBracket.tsx
// Vista Supernova: anillos concéntricos, una fase por anillo. Equipos como
// puntos en el anillo exterior; al avanzar de fase, los ganadores migran
// hacia el centro hasta llegar al trofeo.

"use client";

import { useMemo, useState, useCallback } from "react";
import { BRACKET_TEAMS, GROUPS, TEAM_BY_ID, type BracketTeam } from "@/lib/bracket/teams";
import { groupStandings, isGroupComplete } from "@/lib/bracket/engine";
import { PHASES, type BracketMatch, type BracketState, type PhaseId } from "@/lib/bracket/types";
import styles from "./CosmicBracket.module.css";

interface Props {
  state: BracketState;
  onOpenMatch: (matchId: string) => void;
}

// Convierte (slot, total) -> ángulo en grados (0=arriba, sentido horario).
function angleOf(slotIdx: number, slotTotal: number): number {
  return (slotIdx / slotTotal) * 360 - 90;
}
function polar(r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
}

interface TooltipState {
  team: BracketTeam | null;
  x: number;
  y: number;
  visible: boolean;
}

export default function CosmicBracket({ state, onOpenMatch }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>({ team: null, x: 0, y: 0, visible: false });
  const champion = state.champion ? TEAM_BY_ID[state.champion] : null;
  const currentPhase = PHASES[state.currentPhaseIdx] ?? PHASES[0];

  // Pre-calcular standings de cada grupo (para colorear ganadores/eliminados)
  const standingsMap = useMemo(() => {
    const m: Record<number, ReturnType<typeof groupStandings>> = {};
    for (let g = 0; g < 12; g++) {
      m[g] = isGroupComplete(state, g) ? groupStandings(state, g) : [];
    }
    return m;
  }, [state]);

  const showTooltip = useCallback((team: BracketTeam | null, e: React.MouseEvent) => {
    if (!team) return;
    setTooltip({ team, x: e.clientX, y: e.clientY, visible: true });
  }, []);
  const moveTooltip = useCallback((e: React.MouseEvent) => {
    setTooltip((t) => (t.visible ? { ...t, x: e.clientX, y: e.clientY } : t));
  }, []);
  const hideTooltip = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.stage}>
        <svg
          className={styles.svg}
          viewBox="-600 -600 1200 1200"
          role="img"
          aria-label="Bracket cósmico Mundial 2026"
        >
          <defs>
            <radialGradient id="bbGradGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(253,230,138,1)" />
              <stop offset="100%" stopColor="rgba(201,168,76,0)" />
            </radialGradient>
          </defs>

          {/* Anillos concéntricos */}
          <g>
            {PHASES.map((p, idx) => (
              <circle
                key={p.id}
                cx={0}
                cy={0}
                r={p.radius}
                className={`${styles.ring} ${idx <= state.currentPhaseIdx ? styles.ringActive : ""}`}
              />
            ))}
          </g>

          {/* Etiquetas de fase en cada anillo */}
          <g>
            {PHASES.filter((p) => p.id !== "FINAL" && p.id !== "THIRD").map((p, idx) => (
              <text
                key={p.id}
                x={0}
                y={-(p.radius) - 16}
                className={styles.phaseLabel}
                textAnchor="middle"
                fillOpacity={idx === state.currentPhaseIdx ? "1" : "0.45"}
              >
                {`// ${p.short}`}
              </text>
            ))}
          </g>

          {/* Líneas de energía (de cada pick knockout hacia el siguiente anillo) */}
          <g>
            {Object.values(state.picks).map((pick) => {
              const m = state.matches.find((mm) => mm.id === pick.matchId);
              if (!m || m.phase === "GROUP") return null;
              const phase = PHASES.find((p) => p.id === m.phase);
              const phaseIdx = PHASES.findIndex((p) => p.id === m.phase);
              if (!phase) return null;
              const next = PHASES[phaseIdx + 1] ?? phase;
              const deg =
                m.phase === "FINAL"
                  ? -90
                  : m.phase === "THIRD"
                  ? 90
                  : angleOf(m.slotIdx, m.slotTotal);
              const p1 = polar(phase.radius, deg);
              const p2 = polar(next.radius + 6, deg);
              return (
                <line
                  key={pick.matchId}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  className={styles.energyLine}
                />
              );
            })}
          </g>

          {/* Nodos de la fase de grupos */}
          <g>
            {GROUPS.map((g, gi) => {
              const groupCenterDeg = (gi / 12) * 360 - 90 + 360 / 12 / 2;
              const teams = BRACKET_TEAMS.filter((t) => t.group === g);
              const groupRadius = PHASES[0].radius;
              const std = standingsMap[gi];

              return (
                <g key={`group-${g}`}>
                  {/* Etiqueta del grupo */}
                  <text
                    x={polar(groupRadius + 50, groupCenterDeg).x}
                    y={polar(groupRadius + 50, groupCenterDeg).y}
                    className={styles.groupLabel}
                  >
                    {`Grupo ${g}`}
                  </text>

                  {/* 4 puntos por equipo */}
                  {teams.map((team, ti) => {
                    const arc = 22;
                    const deg = groupCenterDeg - arc / 2 + (arc * (ti / 3));
                    const p = polar(groupRadius, deg);
                    let status: "armed" | "winner" | "eliminated" = "armed";
                    if (std.length > 0) {
                      const rank = std.findIndex((s) => s.team.id === team.id);
                      if (rank === 3) status = "eliminated";
                      else if (rank <= 1) status = "winner";
                    }
                    return (
                      <g
                        key={team.id}
                        className={styles.node}
                        data-status={status}
                        transform={`translate(${p.x},${p.y})`}
                        onMouseEnter={(e) => showTooltip(team, e)}
                        onMouseMove={moveTooltip}
                        onMouseLeave={hideTooltip}
                      >
                        {status === "winner" && (
                          <circle cx={0} cy={0} r={14} fill="url(#bbGradGlow)" opacity={0.6} />
                        )}
                        <circle
                          cx={0}
                          cy={0}
                          r={9}
                          fill={status === "winner" ? "#FDE68A" : status === "eliminated" ? "#1A2434" : "#0F1F30"}
                          stroke={status === "winner" ? "#FDE68A" : "rgba(201,168,76,0.45)"}
                          strokeWidth={status === "winner" ? 1.5 : 1}
                        />
                        <circle cx={0} cy={0} r={5} fill={team.color} opacity={status === "eliminated" ? 0.4 : 1} />
                      </g>
                    );
                  })}

                  {/* 6 puntos de partido del grupo */}
                  {state.matches
                    .filter((m) => m.phase === "GROUP" && m.groupIdx === gi)
                    .map((m, mi) => {
                      const arc = 22;
                      const deg = groupCenterDeg - arc / 2 + arc * (mi / 5);
                      const p = polar(groupRadius - 28, deg);
                      const picked = state.picks[m.id];
                      const interactable = state.currentPhaseIdx === 0;
                      return (
                        <g
                          key={m.id}
                          className={styles.node}
                          data-status={picked ? "winner" : "armed"}
                          data-disabled={!interactable}
                          transform={`translate(${p.x},${p.y})`}
                          onClick={() => interactable && onOpenMatch(m.id)}
                          role="button"
                          aria-label={`Predecir partido ${m.id}`}
                        >
                          {picked && (
                            <circle cx={0} cy={0} r={8} fill="url(#bbGradGlow)" opacity={0.5} />
                          )}
                          <circle
                            cx={0}
                            cy={0}
                            r={picked ? 4.5 : 3.5}
                            fill={picked ? "#FDE68A" : "transparent"}
                            stroke={picked ? "#FDE68A" : "rgba(201,168,76,0.55)"}
                            strokeWidth={1}
                            strokeDasharray={picked ? "" : "2 2"}
                          />
                        </g>
                      );
                    })}
                </g>
              );
            })}
          </g>

          {/* Nodos de fases knockout */}
          <g>
            {(["R32", "R16", "QF", "SF", "THIRD", "FINAL"] as PhaseId[]).map((phaseId) => {
              const phase = PHASES.find((p) => p.id === phaseId);
              if (!phase) return null;
              const matches = state.matches.filter((m) => m.phase === phaseId).sort((a, b) => a.slotIdx - b.slotIdx);
              const phaseIdx = PHASES.findIndex((p) => p.id === phaseId);

              return matches.map((m) => {
                const deg =
                  phaseId === "FINAL" ? -90 : phaseId === "THIRD" ? 90 : angleOf(m.slotIdx, m.slotTotal);
                const p = polar(phase.radius, deg);
                const picked = state.picks[m.id];
                const ready = m.a !== null && m.b !== null;
                const teamA = m.a ? TEAM_BY_ID[m.a] : null;
                const teamB = m.b ? TEAM_BY_ID[m.b] : null;
                const interactable = state.currentPhaseIdx === phaseIdx && ready;
                const isWinnerA = picked && teamA && picked.winner === teamA.id;
                const isWinnerB = picked && teamB && picked.winner === teamB.id;

                return (
                  <g
                    key={m.id}
                    className={`${styles.node} ${ready && !picked && interactable ? styles.nodeReady : ""}`}
                    data-status={picked ? "winner" : "armed"}
                    data-disabled={!interactable && !picked}
                    transform={`translate(${p.x},${p.y})`}
                    onClick={() => (interactable || picked) && onOpenMatch(m.id)}
                    role="button"
                    aria-label={`Predecir ${phase.short}`}
                  >
                    {picked && (
                      <circle cx={0} cy={0} r={18} fill="url(#bbGradGlow)" opacity={0.7} />
                    )}
                    {/* Equipo A (izquierda) */}
                    {teamA ? (
                      <circle
                        cx={-7}
                        cy={0}
                        r={isWinnerA ? 8 : 6}
                        fill={teamA.color}
                        stroke={isWinnerA ? "#FDE68A" : "rgba(255,255,255,0.18)"}
                        strokeWidth={isWinnerA ? 1.5 : 1}
                        opacity={picked && !isWinnerA ? 0.25 : 1}
                        onMouseEnter={(e) => showTooltip(teamA, e)}
                        onMouseMove={moveTooltip}
                        onMouseLeave={hideTooltip}
                      />
                    ) : (
                      <circle cx={-7} cy={0} r={6} fill="#0F1F30" stroke="rgba(201,168,76,0.20)" strokeDasharray="2 2" />
                    )}
                    {/* Equipo B (derecha) */}
                    {teamB ? (
                      <circle
                        cx={7}
                        cy={0}
                        r={isWinnerB ? 8 : 6}
                        fill={teamB.color}
                        stroke={isWinnerB ? "#FDE68A" : "rgba(255,255,255,0.18)"}
                        strokeWidth={isWinnerB ? 1.5 : 1}
                        opacity={picked && !isWinnerB ? 0.25 : 1}
                        onMouseEnter={(e) => showTooltip(teamB, e)}
                        onMouseMove={moveTooltip}
                        onMouseLeave={hideTooltip}
                      />
                    ) : (
                      <circle cx={7} cy={0} r={6} fill="#0F1F30" stroke="rgba(201,168,76,0.20)" strokeDasharray="2 2" />
                    )}
                    {teamA && teamB && (
                      <line x1={-1} y1={-3} x2={1} y2={3} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
                    )}
                  </g>
                );
              });
            })}
          </g>
        </svg>

        {/* Trofeo central */}
        <div className={styles.core} aria-hidden>
          <div className={styles.coreHalo} />
          <div className={styles.coreHalo2} />
          <div className={styles.coreTrophy}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
              <path d="M5 4H3v3a3 3 0 0 0 3 3M19 4h2v3a3 3 0 0 1-3 3" />
            </svg>
          </div>
        </div>

        {/* Etiqueta del trofeo */}
        <div className={styles.coreLabel}>
          <div className={styles.coreLabelEyebrow}>// CAMPEÓN PREDICHO</div>
          <div className={styles.coreLabelName}>{champion ? champion.name : "—"}</div>
          <div className={styles.coreLabelSub}>mundial 2026 · final</div>
        </div>

        {/* Pill de fase actual + leyenda */}
        <div className={styles.phasePillWrap}>
          <div className={styles.phasePill}>
            <span className={styles.phasePillDot} />
            <div className={styles.phasePillText}>
              <small>// FASE ACTUAL</small>
              <b>{currentPhase.name}</b>
            </div>
          </div>
          <div className={styles.legend}>
            <b>Cómo jugar</b>
            <br />
            Haz clic en cualquier <code>nodo brillante</code> del anillo activo para predecir un partido. Cuando completes una fase, el siguiente anillo se ilumina y los ganadores avanzan hacia el centro.
          </div>
        </div>

        {/* Tooltip */}
        {tooltip.team && (
          <div
            style={{
              position: "fixed",
              left: Math.min(window.innerWidth - 200, tooltip.x + 14),
              top: Math.min(window.innerHeight - 120, tooltip.y + 14),
              opacity: tooltip.visible ? 1 : 0,
              pointerEvents: "none",
              zIndex: 60,
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(11,24,37,0.95)",
              border: "1px solid var(--bb-border)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
              minWidth: 180,
              fontSize: 12,
              transition: "opacity 200ms",
              fontFamily: "Outfit, system-ui, sans-serif",
              color: "#fff",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 24, height: 16, borderRadius: 3, overflow: "hidden", background: "#1A2434" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://flagcdn.com/${tooltip.team.iso}.svg`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </span>
              {tooltip.team.name}
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "#94A3B8" }}>
              Confederación: <b style={{ color: "#fff" }}>{tooltip.team.confed}</b>
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "#94A3B8" }}>
              Grupo: <b style={{ color: "#fff" }}>{tooltip.team.group}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// src/app/app/modo-carrera/jugar/SkillTreeView.tsx
// Pilar 3 — Árbol de habilidades. 4 ramas × 5 nodos. Gastar puntos sube la rama
// (engine.unlockSkill) e ilumina el siguiente nodo. Nodos: desbloqueado (color
// de rama), disponible (pulso, si hay puntos) o bloqueado (candado). SVG-only.

"use client";

import { useState } from "react";
import { BG2, BG3, GOLD, GOLD2, MID, DIM } from "./fx";
import { LockIcon, CheckIcon } from "./icons";
import { SKILL_BRANCHES, MAX_SKILL_LEVEL } from "@/lib/modo-carrera/constants";
import { canUnlockSkill } from "@/lib/modo-carrera/engine";
import type { CareerState, SkillBranch } from "@/lib/modo-carrera/types";

export default function SkillTreeView({
  career,
  onUnlock,
}: {
  career: CareerState;
  onUnlock: (branch: SkillBranch) => void;
}) {
  const points = career.skills.points;
  const [shake, setShake] = useState<SkillBranch | null>(null);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        @keyframes mcNodePop { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
        @keyframes mcNodePulse { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.55)} 50%{box-shadow:0 0 0 8px rgba(201,168,76,0)} }
        @keyframes mcShakeX { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .mc-node-avail { animation: mcNodePulse 1.6s ease-out infinite; cursor: pointer; }
        .mc-branch-shake { animation: mcShakeX .35s ease; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>Árbol de habilidades</h2>
          <p style={{ fontSize: 13, color: MID, marginTop: 4 }}>
            Gasta puntos para potenciar a tu DT. Ganas puntos al subir de nivel.
          </p>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 999,
            background: points > 0 ? "rgba(201,168,76,0.14)" : BG3,
            border: `1px solid ${points > 0 ? GOLD : "rgba(255,255,255,0.08)"}`,
          }}
        >
          <span style={{ fontSize: 12, color: DIM, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800 }}>Puntos</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: points > 0 ? GOLD2 : MID }}>{points}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
        {SKILL_BRANCHES.map((branch) => {
          const level = career.skills.levels[branch.id];
          const maxed = level >= MAX_SKILL_LEVEL;
          const canUp = canUnlockSkill(career, branch.id);

          return (
            <div
              key={branch.id}
              className={shake === branch.id ? "mc-branch-shake" : undefined}
              style={{ padding: 18, borderRadius: 16, background: BG2, border: `1px solid ${branch.accent}33` }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: branch.accent }}>{branch.name}</h3>
                <span style={{ fontSize: 13, fontWeight: 800, color: MID }}>{level}/{MAX_SKILL_LEVEL}</span>
              </div>
              <p style={{ fontSize: 12, color: DIM, lineHeight: 1.5, minHeight: 34 }}>{branch.description}</p>

              {/* Nodos verticales con línea conectora */}
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 0 }}>
                {branch.levels.map((label, i) => {
                  const nodeNum = i + 1;
                  const unlocked = level >= nodeNum;
                  const available = !unlocked && nodeNum === level + 1 && canUp;
                  const color = unlocked ? branch.accent : available ? GOLD : "rgba(255,255,255,0.18)";

                  return (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <button
                          type="button"
                          className={available ? "mc-node-avail" : undefined}
                          aria-label={`${branch.name} nivel ${nodeNum}: ${label}`}
                          disabled={!available}
                          onClick={() => {
                            if (available) onUnlock(branch.id);
                            else if (!unlocked) {
                              setShake(branch.id);
                              setTimeout(() => setShake(null), 360);
                            }
                          }}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            border: `2px solid ${color}`,
                            background: unlocked ? branch.accent : available ? "rgba(201,168,76,0.12)" : BG3,
                            color: unlocked ? "#0a0906" : available ? GOLD2 : MID,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                            fontSize: 13,
                            cursor: available ? "pointer" : "default",
                            flexShrink: 0,
                            animation: unlocked ? "mcNodePop .35s ease both" : undefined,
                          }}
                        >
                          {unlocked ? <CheckIcon size={16} /> : available ? nodeNum : <LockIcon size={14} />}
                        </button>
                        {nodeNum < branch.levels.length && (
                          <span style={{ width: 2, height: 14, background: level > nodeNum ? branch.accent : "rgba(255,255,255,0.12)" }} />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: unlocked ? 700 : 600,
                          color: unlocked ? "#fff" : available ? GOLD2 : DIM,
                          paddingBottom: nodeNum < branch.levels.length ? 14 : 0,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {maxed && (
                <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, fontWeight: 800, color: branch.accent }}>
                  Rama dominada
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

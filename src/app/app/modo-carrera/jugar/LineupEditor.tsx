// src/app/app/modo-carrera/jugar/LineupEditor.tsx
//
// EDITOR DE FORMACIÓN Y ALINEACIÓN (decisión real del DT). El DT elige el dibujo
// (4-4-2, 4-3-3, 5-3-2…) y arma el once titular de entre los 26 convocados. La
// calidad del once y el sesgo del dibujo impactan de verdad el rendimiento del
// equipo en el partido (ver src/lib/modo-carrera/lineup.ts → squadBonus). SVG, sin
// emojis.

"use client";

import { useMemo, useState } from "react";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED } from "./fx";
import { useModalA11y } from "./useModalA11y";
import { type RosterPlayer } from "@/data/fantasy-rosters";
import type { FantasyPos } from "@/lib/fantasy/types";
import type { CareerState } from "@/lib/modo-carrera/types";
import {
  FORMATIONS,
  formationById,
  slotsFor,
  defaultLineup,
  resolveLineup,
  xiRating,
  bestXI,
  playerRating,
  lineupValid,
  availableRoster,
  type Formation,
} from "@/lib/modo-carrera/lineup";

const POS_ORDER: FantasyPos[] = ["GK", "DEF", "MID", "FWD"];
const POS_LABEL: Record<FantasyPos, string> = { GK: "Portería", DEF: "Defensa", MID: "Medio", FWD: "Ataque" };

function ratingColor(r: number): string {
  if (r >= 85) return GOLD2;
  if (r >= 78) return GREEN;
  if (r >= 70) return MID;
  return DIM;
}

export default function LineupEditor({
  career,
  onSave,
  onClose,
}: {
  career: CareerState;
  onSave: (formation: string, lineup: string[]) => void;
  onClose: () => void;
}) {
  // Solo jugadores DISPONIBLES: los lesionados/sancionados con partidos pendientes
  // no pueden ser convocados al once.
  const roster = useMemo<RosterPlayer[]>(() => availableRoster(career), [career]);

  const [formationId, setFormationId] = useState<string>(career.squad?.formation ?? "4-4-2");
  const formation: Formation = formationById(formationId);

  // Once inicial: el guardado (si es válido) o el mejor once del dibujo actual.
  const [picked, setPicked] = useState<string[]>(() => {
    const saved = career.squad?.lineup ?? [];
    return lineupValid(saved, roster, formation) ? saved : defaultLineup(roster, formation);
  });

  const slots = slotsFor(formation);
  const pickedPlayers = resolveLineup(picked, roster);
  const countByPos: Record<FantasyPos, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of pickedPlayers) countByPos[p.pos]++;

  const valid = lineupValid(picked, roster, formation);
  const rating = xiRating(pickedPlayers);
  const best = xiRating(bestXI(roster, formation));
  const ratingPct = Math.round((rating / 99) * 100);

  const changeFormation = (id: string) => {
    setFormationId(id);
    // Re-autocompletar con el mejor once del nuevo dibujo (evita estados inválidos).
    setPicked(defaultLineup(roster, formationById(id)));
  };

  const togglePlayer = (p: RosterPlayer) => {
    if (picked.includes(p.name)) {
      setPicked((prev) => prev.filter((n) => n !== p.name));
      return;
    }
    if (countByPos[p.pos] >= slots[p.pos]) return; // línea llena: no se puede añadir
    setPicked((prev) => [...prev, p.name]);
  };

  const autoBest = () => setPicked(defaultLineup(roster, formation));

  const dialogRef = useModalA11y<HTMLDivElement>(onClose);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{
        outline: "none",
        position: "fixed",
        inset: 0,
        zIndex: 110,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.94)",
        padding: 14,
        animation: "mcBannerIn .25s ease both",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 560,
          maxHeight: "94vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
          padding: 20,
          borderRadius: 18,
          background: BG2,
          border: `1px solid ${GOLD}`,
          boxShadow: "0 24px 70px rgba(0,0,0,0.65)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: GOLD }}>
            Formación y alineación
          </div>
          <div style={{ fontSize: 12, color: MID, marginTop: 3 }}>
            Elige el dibujo y tu once. Impacta el rendimiento real del equipo.
          </div>
        </div>

        {/* Dibujos */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
          {FORMATIONS.map((f) => {
            const active = f.id === formationId;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => changeFormation(f.id)}
                style={{
                  flex: "1 0 auto",
                  padding: "8px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 800,
                  background: active ? "rgba(201,168,76,0.16)" : BG3,
                  color: active ? GOLD2 : "#fff",
                  border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.07)"}`,
                }}
              >
                {f.name}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 11.5, color: DIM, fontStyle: "italic", marginBottom: 14 }}>{formation.hint}</div>

        {/* Calidad del once */}
        <div style={{ padding: "12px 14px", borderRadius: 12, background: BG3, border: `1px solid ${valid ? GOLD + "44" : RED + "55"}`, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: GOLD }}>
              Valoración del once
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: ratingColor(rating) }}>
              {rating ? rating.toFixed(0) : "--"}
              <span style={{ fontSize: 11, fontWeight: 700, color: DIM }}> / {best.toFixed(0)} máx</span>
            </span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ width: `${ratingPct}%`, height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`, transition: "width .3s" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8, fontSize: 11, fontWeight: 700 }}>
            {POS_ORDER.map((pos) => (
              <span key={pos} style={{ color: countByPos[pos] === slots[pos] ? GREEN : MID }}>
                {pos} {countByPos[pos]}/{slots[pos]}
              </span>
            ))}
          </div>
        </div>

        {/* Roster por posición */}
        {POS_ORDER.map((pos) => {
          const list = roster
            .filter((p) => p.pos === pos)
            .sort((a, b) => playerRating(b) - playerRating(a));
          if (!list.length) return null;
          return (
            <div key={pos} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>
                {POS_LABEL[pos]} <span style={{ color: DIM }}>· {countByPos[pos]}/{slots[pos]}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {list.map((p) => {
                  const on = picked.includes(p.name);
                  const full = !on && countByPos[p.pos] >= slots[p.pos];
                  const r = playerRating(p);
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => togglePlayer(p)}
                      disabled={full}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textAlign: "left",
                        padding: "8px 11px",
                        borderRadius: 10,
                        cursor: full ? "not-allowed" : "pointer",
                        opacity: full ? 0.4 : 1,
                        background: on ? "rgba(201,168,76,0.14)" : BG3,
                        border: `1px solid ${on ? GOLD : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <span style={{ width: 30, fontSize: 14, fontWeight: 900, color: ratingColor(r), textAlign: "center" }}>{r}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        <span style={{ display: "block", fontSize: 10.5, color: DIM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.club}</span>
                      </span>
                      <span
                        aria-hidden
                        style={{
                          width: 20,
                          height: 20,
                          flexShrink: 0,
                          borderRadius: 6,
                          border: `1.5px solid ${on ? GOLD : "rgba(255,255,255,0.2)"}`,
                          background: on ? GOLD : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {on && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke={BG2} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Acciones */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, position: "sticky", bottom: 0, paddingTop: 6, background: `linear-gradient(180deg, ${BG2}00, ${BG2} 40%)` }}>
          <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
          <button type="button" onClick={autoBest} style={btnGhost}>Mejor 11</button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSave(formationId, picked)}
            style={{ ...btnGold, opacity: valid ? 1 : 0.45, cursor: valid ? "pointer" : "not-allowed" }}
          >
            {valid ? "Guardar once" : `Faltan ${11 - pickedPlayers.length}`}
          </button>
        </div>
      </div>
    </div>
  );
}

const btnGold: React.CSSProperties = {
  flex: 1.4,
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
  color: "#000000",
  fontWeight: 900,
  fontSize: 13.5,
  cursor: "pointer",
  boxShadow: "0 10px 28px rgba(201,168,76,0.3)",
};

const btnGhost: React.CSSProperties = {
  flex: 1,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "transparent",
  color: MID,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

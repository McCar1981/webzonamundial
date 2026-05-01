// src/components/bracket/MatchModal.tsx
// Modal compartido por las dos vistas. Permite elegir ganador + marcador.
// En fase de grupos se permiten empates; en knockouts forzamos diferencia.

"use client";

import { useEffect, useState } from "react";
import { TEAM_BY_ID } from "@/lib/bracket/teams";
import { PHASE_BY_ID, type BracketMatch } from "@/lib/bracket/types";
import styles from "./bracket.module.css";

interface Props {
  match: BracketMatch | null;
  initialPick?: { winner: string | null; scoreA: number; scoreB: number } | null;
  onClose: () => void;
  onConfirm: (data: { winner: string | null; scoreA: number; scoreB: number }) => void;
}

const MAX_GOALS = 9;

export default function MatchModal({ match, initialPick, onClose, onConfirm }: Props) {
  const open = match !== null;
  const [picked, setPicked] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  // Sincroniza estado al abrir
  useEffect(() => {
    if (!match) return;
    setPicked(initialPick?.winner ?? null);
    setScoreA(initialPick?.scoreA ?? 0);
    setScoreB(initialPick?.scoreB ?? 0);
  }, [match, initialPick]);

  // Auto-elige ganador desde el marcador en knockouts
  useEffect(() => {
    if (!match || match.phase === "GROUP") return;
    if (scoreA > scoreB) setPicked(match.a);
    else if (scoreB > scoreA) setPicked(match.b);
  }, [scoreA, scoreB, match]);

  // Esc para cerrar, Enter para confirmar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && picked) handleConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, picked, scoreA, scoreB]);

  if (!match || !match.a || !match.b) {
    return <div className={styles.modalShroud} data-open={false} />;
  }

  const teamA = TEAM_BY_ID[match.a];
  const teamB = TEAM_BY_ID[match.b];
  const phase = PHASE_BY_ID[match.phase];
  const isGroup = match.phase === "GROUP";

  const adjust = (side: "a" | "b", delta: number) => {
    if (side === "a") setScoreA((s) => Math.max(0, Math.min(MAX_GOALS, s + delta)));
    else setScoreB((s) => Math.max(0, Math.min(MAX_GOALS, s + delta)));
  };

  const handleConfirm = () => {
    if (!picked && !isGroup) return;
    let sa = scoreA;
    let sb = scoreB;
    // En knockouts no permitimos empate: si están iguales, sumamos 1 al ganador
    if (!isGroup && sa === sb && picked) {
      if (picked === match.a) sa += 1;
      else sb += 1;
    }
    // En fase de grupos, si hay empate "sin ganador" registramos winner=null
    let winner = picked;
    if (isGroup && sa === sb) winner = null;
    else if (isGroup && sa > sb) winner = match.a;
    else if (isGroup && sb > sa) winner = match.b;
    onConfirm({ winner, scoreA: sa, scoreB: sb });
  };

  const flagSrc = (iso: string) => `https://flagcdn.com/${iso}.svg`;
  const confirmDisabled = isGroup ? false : !picked;

  return (
    <div
      className={styles.modalShroud}
      data-open={open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bracket-modal-title"
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <span className={styles.modalPhaseTag}>// {phase.short}</span>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className={styles.modalVs} id="bracket-modal-title">
          <button
            type="button"
            className={styles.teamCol}
            data-picked={picked === teamA.id}
            onClick={() => setPicked(teamA.id)}
            aria-pressed={picked === teamA.id}
          >
            <div className={styles.teamFlag}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flagSrc(teamA.iso)} alt={teamA.name} />
            </div>
            <div className={styles.teamName}>{teamA.name}</div>
            <div className={styles.teamMeta}>Grupo {teamA.group}</div>
          </button>

          <div className={styles.vsMark}>
            <span>VS</span>
            <span>PICK ONE</span>
          </div>

          <button
            type="button"
            className={styles.teamCol}
            data-picked={picked === teamB.id}
            onClick={() => setPicked(teamB.id)}
            aria-pressed={picked === teamB.id}
          >
            <div className={styles.teamFlag}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flagSrc(teamB.iso)} alt={teamB.name} />
            </div>
            <div className={styles.teamName}>{teamB.name}</div>
            <div className={styles.teamMeta}>Grupo {teamB.group}</div>
          </button>
        </div>

        <div className={styles.modalScore}>
          <div className={styles.scoreCol}>
            <button
              type="button"
              className={styles.scoreBtn}
              onClick={() => adjust("a", -1)}
              disabled={scoreA <= 0}
              aria-label={`Reducir goles ${teamA.name}`}
            >
              −
            </button>
            <span className={styles.scoreNum} aria-live="polite">{scoreA}</span>
            <button
              type="button"
              className={styles.scoreBtn}
              onClick={() => adjust("a", 1)}
              disabled={scoreA >= MAX_GOALS}
              aria-label={`Aumentar goles ${teamA.name}`}
            >
              +
            </button>
          </div>
          <span className={styles.modalDivider}>:</span>
          <div className={styles.scoreCol}>
            <button
              type="button"
              className={styles.scoreBtn}
              onClick={() => adjust("b", -1)}
              disabled={scoreB <= 0}
              aria-label={`Reducir goles ${teamB.name}`}
            >
              −
            </button>
            <span className={styles.scoreNum} aria-live="polite">{scoreB}</span>
            <button
              type="button"
              className={styles.scoreBtn}
              onClick={() => adjust("b", 1)}
              disabled={scoreB >= MAX_GOALS}
              aria-label={`Aumentar goles ${teamB.name}`}
            >
              +
            </button>
          </div>
        </div>

        <p className={styles.modalTip}>
          {isGroup
            ? "Empates permitidos en fase de grupos"
            : "Empate ⇒ ganador por penales (elige país)"}
        </p>

        <div className={styles.modalActions}>
          <button type="button" className={styles.btn} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGold}`}
            onClick={handleConfirm}
            disabled={confirmDisabled}
          >
            Confirmar predicción ⏎
          </button>
        </div>
      </div>
    </div>
  );
}

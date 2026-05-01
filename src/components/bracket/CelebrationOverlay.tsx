// src/components/bracket/CelebrationOverlay.tsx
// Overlay final cuando el usuario predice al campeón. Muestra trofeo + share.

"use client";

import { TEAM_BY_ID } from "@/lib/bracket/teams";
import type { BracketState } from "@/lib/bracket/types";
import styles from "./bracket.module.css";

interface Props {
  state: BracketState;
  show: boolean;
  onEdit: () => void;
  onShare: () => void;
}

export default function CelebrationOverlay({ state, show, onEdit, onShare }: Props) {
  if (!state.champion) return null;
  const team = TEAM_BY_ID[state.champion];
  if (!team) return null;
  const totalGoals = Object.values(state.picks).reduce((s, p) => s + p.scoreA + p.scoreB, 0);

  return (
    <div className={styles.celebration} data-show={show}>
      <div className={styles.celebCard}>
        <div className={styles.celebTrophy}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
            <path d="M5 4H3v3a3 3 0 0 0 3 3M19 4h2v3a3 3 0 0 1-3 3" />
          </svg>
        </div>
        <div className={styles.celebEyebrow}>// MUNDIAL 2026 · BRACKET SELLADO</div>
        <h2 className={styles.celebTitle}>
          Tu Mundial<br />
          <span>está completo.</span>
        </h2>
        <div className={styles.celebChampion}>
          <div className={styles.celebFlag}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://flagcdn.com/${team.iso}.svg`} alt={team.name} />
          </div>
          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--bb-gold-2)", letterSpacing: "0.2em" }}>
              CAMPEÓN
            </div>
            <div className={styles.celebChampionName}>{team.name}</div>
          </div>
        </div>
        <div className={styles.celebStats}>
          <div>
            <b>104</b>
            <small>partidos</small>
          </div>
          <div>
            <b>{totalGoals}</b>
            <small>goles predichos</small>
          </div>
          <div>
            <b>v1.0</b>
            <small>predicción única</small>
          </div>
        </div>
        <div className={styles.celebActions}>
          <button type="button" className={styles.btn} onClick={onEdit}>
            Revisar bracket
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnGold}`} onClick={onShare}>
            Compartir mi Mundial
          </button>
        </div>
      </div>
    </div>
  );
}

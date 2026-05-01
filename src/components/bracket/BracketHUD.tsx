// src/components/bracket/BracketHUD.tsx
// HUD superior con brand, progress bar, toggle de vista y acciones (undo/reset).

"use client";

import styles from "./bracket.module.css";
import { TOTAL_MATCHES } from "@/lib/bracket/types";
import type { BracketState } from "@/lib/bracket/types";

export type BracketView = "classic" | "cosmic";

interface Props {
  state: BracketState;
  view: BracketView;
  onViewChange: (v: BracketView) => void;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
}

export default function BracketHUD({
  state,
  view,
  onViewChange,
  canUndo,
  onUndo,
  onReset,
}: Props) {
  const done = Object.keys(state.picks).length;
  const pct = Math.round((done / TOTAL_MATCHES) * 100);

  return (
    <div className={styles.hud}>
      <div className={styles.hudBrand}>
        <div className={styles.hudMark} aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
            <path d="M5 4H3v3a3 3 0 0 0 3 3M19 4h2v3a3 3 0 0 1-3 3" />
          </svg>
        </div>
        <div>
          <div className={styles.hudTitle}>
            Bracket Challenge<span> · 2026</span>
          </div>
          <div className={styles.hudEyebrow}>// predice tu mundial</div>
        </div>
      </div>

      <div className={styles.hudProgress}>
        <div className={styles.hudProgressRow}>
          <span>
            <b>{done}</b> de {TOTAL_MATCHES} partidos
          </span>
          <span style={{ fontFamily: "JetBrains Mono, monospace", color: "rgba(255,255,255,0.45)" }}>
            {pct}%
          </span>
        </div>
        <div className={styles.hudProgressBar}>
          <div className={styles.hudProgressFill} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={styles.hudActions}>
        <div className={styles.viewToggle} role="tablist" aria-label="Cambiar vista">
          <button
            type="button"
            data-active={view === "classic"}
            onClick={() => onViewChange("classic")}
            role="tab"
            aria-selected={view === "classic"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="6" height="16" rx="1" />
              <rect x="15" y="4" width="6" height="16" rx="1" />
              <path d="M9 12h6" />
            </svg>
            Clásica
          </button>
          <button
            type="button"
            data-active={view === "cosmic"}
            onClick={() => onViewChange("cosmic")}
            role="tab"
            aria-selected={view === "cosmic"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="11" />
            </svg>
            Cósmica
          </button>
        </div>

        <button
          type="button"
          className={styles.btn}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Deshacer última predicción"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H9" />
          </svg>
          Deshacer
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            if (done === 0) return;
            if (window.confirm("¿Empezar de nuevo? Se perderán todas las predicciones.")) {
              onReset();
            }
          }}
          disabled={done === 0}
          aria-label="Reiniciar bracket"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset
        </button>
      </div>
    </div>
  );
}

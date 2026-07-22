"use client";

// Segmented control de la ficha (patrón MLB): "Temporada {año}" (contenido
// servidor: Club/Selección) vs "Carrera" (histórico, se monta y carga al abrir).

import { useState, type ReactNode } from "react";
import PlayerCareer from "./PlayerCareer";
import styles from "./ficha.module.css";

export default function FichaTabs({ playerId, season, children }: { playerId: number; season: number; children: ReactNode }) {
  const [tab, setTab] = useState<"temp" | "career">("temp");
  return (
    <div style={{ marginTop: 22 }}>
      <div className={styles.tabs}>
        <button type="button" aria-pressed={tab === "temp"} onClick={() => setTab("temp")} className={tab === "temp" ? `${styles.tab} ${styles.tabOn}` : styles.tab}>
          Temporada {season}
        </button>
        <button type="button" aria-pressed={tab === "career"} onClick={() => setTab("career")} className={tab === "career" ? `${styles.tab} ${styles.tabOn}` : styles.tab}>
          Carrera
        </button>
      </div>
      {tab === "temp" ? children : <PlayerCareer playerId={playerId} />}
    </div>
  );
}

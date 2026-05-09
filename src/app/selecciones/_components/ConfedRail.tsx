// ConfedRail — un riel horizontal de scroll-snap por confederación.
// Header sticky con swatch color, big-num plazas, nav-btns prev/next.

"use client";

import { useMemo, useRef } from "react";
import { SELECCIONES, type Seleccion } from "@/data/selecciones";
import { CONFEDS, type ConfedKey } from "./confed-config";
import TeamCard from "./TeamCard";
import styles from "../selecciones.module.css";

interface ConfedRailProps {
  confKey: ConfedKey;
  labels: {
    grupo: string;
    mundiales: string;
    mejor: string;
    badgeHost: string;
    badgeDebut: string;
    plazasLabel: string;
    teamsLabel: string;
    prev: string;
    next: string;
    fullEs: string;
    fullEn: string;
  };
  locale: "es" | "en";
}

export default function ConfedRail({ confKey, labels, locale }: ConfedRailProps) {
  const cf = CONFEDS[confKey];
  const railRef = useRef<HTMLDivElement>(null);

  const teams = useMemo<Seleccion[]>(() => {
    return (SELECCIONES as Seleccion[])
      .filter((s) => s.confederacion === confKey)
      .slice()
      .sort((a, b) => (a.rankingFIFA ?? 999) - (b.rankingFIFA ?? 999));
  }, [confKey]);

  const scroll = (dir: number) => {
    if (railRef.current) {
      railRef.current.scrollBy({ left: dir * 320, behavior: "smooth" });
    }
  };

  return (
    <div className={styles.confedRow} style={{ ["--c" as string]: cf.color } as React.CSSProperties}>
      <div className={styles.confedHead}>
        <div className={styles.confedHeadLeft}>
          <span className={styles.confedSwatch} />
          <h3>{cf.name}</h3>
          <span className={styles.confedFull}>{locale === "en" ? cf.fullEn : cf.full}</span>
        </div>
        <div className={styles.confedHeadRight}>
          <span>
            <span className={styles.bigNum}>{cf.plazas}</span>
            {labels.plazasLabel}
          </span>
          <span>
            {teams.length} {labels.teamsLabel}
          </span>
          <div className={styles.navBtns}>
            <button type="button" onClick={() => scroll(-1)} aria-label={labels.prev}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label={labels.next}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.scrollRail} ref={railRef}>
        {teams.map((s) => (
          <TeamCard
            key={s.slug}
            team={s}
            labels={{
              grupo: labels.grupo,
              mundiales: labels.mundiales,
              mejor: labels.mejor,
              badgeHost: labels.badgeHost,
              badgeDebut: labels.badgeDebut,
            }}
          />
        ))}
      </div>
    </div>
  );
}

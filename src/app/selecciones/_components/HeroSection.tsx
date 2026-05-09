// HeroSection — eyebrow + título giant + deck + WorldMap + 4 stats.

"use client";

import Link from "next/link";
import WorldMap from "./WorldMap";
import type { ConfedKey } from "./confed-config";
import styles from "../selecciones.module.css";

interface HeroSectionProps {
  filter: ConfedKey | null;
  onFilter: (c: ConfedKey | null) => void;
  labels: {
    breadcrumbHome: string;
    breadcrumbCurrent: string;
    eyebrow: string;
    eyebrowHosts: string;
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    deckBefore: string;
    deckTeams: string;
    deckMid: string;
    deckMatches: string;
    deckSep1: string;
    deckVenues: string;
    deckSep2: string;
    deckHosts: string;
    deckAfter: string;
    statSelecciones: string;
    statGrupos: string;
    statConfederaciones: string;
    statPartidos: string;
    mapFifaWc: string;
    mapHostsBadge: string;
    mapCoords: string;
    mapTeamsBadge: string;
    mapTooltipFifa: string;
    mapTooltipGrupo: string;
    mapTooltipMundiales: string;
    mapTooltipMejor: string;
  };
}

export default function HeroSection({ filter, onFilter, labels }: HeroSectionProps) {
  return (
    <section className={`${styles.hero} ${styles.grain}`}>
      <div className={styles.heroBg} />
      <div className={styles.containerWide} style={{ position: "relative", zIndex: 2 }}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">{labels.breadcrumbHome}</Link>
          <span className={styles.arrow}>/</span>
          <span className={styles.crumbCurrent}>{labels.breadcrumbCurrent}</span>
        </nav>

        <div className={styles.heroTop}>
          <div>
            <div className={styles.heroEyebrow}>
              <span className={styles.dot} />
              <span>{labels.eyebrow}</span>
              <span className={styles.sep}>/</span>
              <span>{labels.eyebrowHosts}</span>
            </div>
            <h1 className={styles.heroTitle}>
              <span className={styles.nl}>{labels.titleLine1}</span>
              <span className={styles.nl}>
                <span className={styles.grad}>{labels.titleLine2}</span>
              </span>
              <span className={styles.nl}>{labels.titleLine3}</span>
            </h1>
            <p className={styles.heroDeck}>
              {labels.deckBefore} <strong>{labels.deckTeams}</strong> {labels.deckMid}{" "}
              <strong>{labels.deckMatches}</strong>
              {labels.deckSep1}
              <strong>{labels.deckVenues}</strong>
              {labels.deckSep2}
              <strong>{labels.deckHosts}</strong>
              {labels.deckAfter}
            </p>
          </div>

          <WorldMap
            filter={filter}
            onFilter={onFilter}
            labels={{
              fifaWc: labels.mapFifaWc,
              hostsBadge: labels.mapHostsBadge,
              coords: labels.mapCoords,
              teamsBadge: labels.mapTeamsBadge,
            }}
            tooltipLabels={{
              fifa: labels.mapTooltipFifa,
              grupo: labels.mapTooltipGrupo,
              mundiales: labels.mapTooltipMundiales,
              mejor: labels.mapTooltipMejor,
            }}
          />
        </div>

        <div className={styles.heroStats}>
          <div className={styles.cell}>
            <div className={styles.label}>{labels.statSelecciones}</div>
            <div className={`${styles.val} ${styles.valGold}`}>48</div>
          </div>
          <div className={styles.cell}>
            <div className={styles.label}>{labels.statGrupos}</div>
            <div className={styles.val}>12</div>
          </div>
          <div className={styles.cell}>
            <div className={styles.label}>{labels.statConfederaciones}</div>
            <div className={styles.val}>6</div>
          </div>
          <div className={styles.cell}>
            <div className={styles.label}>{labels.statPartidos}</div>
            <div className={styles.val}>104</div>
          </div>
        </div>
      </div>
    </section>
  );
}

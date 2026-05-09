// CurioGrid — 6 cards de curiosidades data-viz.
// Cada card: bigfig de plazas + headline + blurb + mini bar viz de las 6 confeds.

"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { CONFED_KEYS, CONFEDS, type ConfedKey } from "./confed-config";
import styles from "../selecciones.module.css";

interface CurioCopy {
  headline: string;
  blurb: string;
}

interface CurioGridProps {
  labels: {
    numTag: string;
    title: string;
    deck: string;
    plazasUnit: string;
  };
}

export default function CurioGrid({ labels }: CurioGridProps) {
  const { t } = useLanguage();
  const sT = t.selecciones;

  // Source de copy: t.selecciones.curiosidades.{KEY}
  const curiosidades: Record<ConfedKey, CurioCopy> = sT.curiosidades;

  const maxPlazas = Math.max(...CONFED_KEYS.map((k) => CONFEDS[k].plazasMain));

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.secHead}>
          <span className={styles.numTag}>{labels.numTag}</span>
          <div className={styles.titleBlock}>
            <h2>{labels.title}</h2>
            <p className={styles.deck}>{labels.deck}</p>
          </div>
        </div>

        <div className={styles.curioGrid}>
          {CONFED_KEYS.map((k) => {
            const cf = CONFEDS[k];
            const copy = curiosidades[k];
            return (
              <div
                key={k}
                className={styles.curioCard}
                style={{ ["--c" as string]: cf.color } as React.CSSProperties}
              >
                <div className={styles.curioConfRow}>
                  <span className={styles.curioConfNm}>{cf.name}</span>
                  <span className={styles.curioConfFull}>· {cf.full}</span>
                </div>
                <div className={styles.curioBigfig}>
                  {cf.plazasMain}
                  {cf.plazasPlus && <span className={styles.curioPlus}>+1</span>}
                  <span className={styles.curioUnit}>{labels.plazasUnit}</span>
                </div>
                <h4 className={styles.curioHead}>{copy.headline}</h4>
                <p className={styles.curioBlurb}>{copy.blurb}</p>
                <div className={styles.curioBars}>
                  {CONFED_KEYS.map((kk) => {
                    const v = CONFEDS[kk].plazasMain;
                    const h = (v / maxPlazas) * 100;
                    return (
                      <div
                        key={kk}
                        className={`${styles.curioBar} ${kk === k ? styles.curioBarActive : ""}`}
                        style={{ height: `${h}%` }}
                      >
                        <span className={styles.curioBarLbl}>{CONFEDS[kk].name.slice(0, 4)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

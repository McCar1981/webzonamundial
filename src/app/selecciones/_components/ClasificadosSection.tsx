// ClasificadosSection — números brutos por confederación.
// 6 celdas con bigfig de plazas, top accent color, barra horizontal de share.

"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { CONFED_KEYS, CONFEDS } from "./confed-config";
import styles from "../selecciones.module.css";

interface ClasificadosSectionProps {
  labels: {
    numTag: string;
    title: string;
    deck: string;
    rightMeta: string;
    plazasOf: string;
  };
}

export default function ClasificadosSection({ labels }: ClasificadosSectionProps) {
  const { locale } = useLanguage();
  const max = Math.max(...CONFED_KEYS.map((k) => CONFEDS[k].plazasMain));

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.secHead}>
          <span className={styles.numTag}>{labels.numTag}</span>
          <div className={styles.titleBlock}>
            <h2>{labels.title}</h2>
            <p className={styles.deck}>{labels.deck}</p>
          </div>
          <span className={styles.rightMeta}>{labels.rightMeta}</span>
        </div>

        <div className={styles.clasifBar}>
          {CONFED_KEYS.map((k) => {
            const cf = CONFEDS[k];
            const w = (cf.plazasMain / max) * 100;
            return (
              <div
                key={k}
                className={styles.clasifCell}
                style={{ ["--c" as string]: cf.color } as React.CSSProperties}
              >
                <div className={styles.clasifTop}>
                  {cf.name} · {locale === "en" ? cf.fullEn : cf.full}
                </div>
                <div className={styles.clasifBig}>
                  {cf.plazasMain}
                  {cf.plazasPlus && (
                    <span className={styles.clasifPlus} style={{ color: cf.color }}>
                      +1
                    </span>
                  )}
                </div>
                <div className={styles.clasifFull}>{labels.plazasOf}</div>
                <div className={styles.clasifBarFill} style={{ width: `${w}%` }} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

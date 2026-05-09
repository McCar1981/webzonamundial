// ConfedRailsSection — wrapper que renderiza los 6 carruseles.

"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { CONFED_KEYS } from "./confed-config";
import ConfedRail from "./ConfedRail";
import styles from "../selecciones.module.css";

interface ConfedRailsSectionProps {
  labels: {
    numTag: string;
    title: string;
    deck: string;
    rightMeta: string;
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
}

export default function ConfedRailsSection({ labels }: ConfedRailsSectionProps) {
  const { locale } = useLanguage();
  return (
    <section className={styles.section}>
      <div className={styles.containerWide}>
        <div className={styles.secHead}>
          <span className={styles.numTag}>{labels.numTag}</span>
          <div className={styles.titleBlock}>
            <h2>{labels.title}</h2>
            <p className={styles.deck}>{labels.deck}</p>
          </div>
          <span className={styles.rightMeta}>{labels.rightMeta}</span>
        </div>

        {CONFED_KEYS.map((k) => (
          <ConfedRail key={k} confKey={k} labels={labels} locale={locale} />
        ))}
      </div>
    </section>
  );
}

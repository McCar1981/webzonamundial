// DarkHorsesSection — 5 cards con numerador fantasma de fondo, blurb editorial.

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SELECCIONES, type Seleccion } from "@/data/selecciones";
import { CONFEDS } from "./confed-config";
import { DARK_HORSES, DARK_HORSE_WHY, isHost } from "./team-meta";
import styles from "../selecciones.module.css";

const FLAG = (code: string, sz: number) => `https://flagcdn.com/w${sz}/${code}.png`;

interface DarkHorsesSectionProps {
  labels: {
    numTag: string;
    title: string;
    deck: string;
    hostTag: string;
  };
}

export default function DarkHorsesSection({ labels }: DarkHorsesSectionProps) {
  const { locale } = useLanguage();
  const teams = useMemo<Seleccion[]>(() => {
    const all = SELECCIONES as Seleccion[];
    return (DARK_HORSES as readonly string[])
      .map((slug) => all.find((s) => s.slug === slug))
      .filter((s): s is Seleccion => Boolean(s));
  }, []);

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

        <div className={styles.darkhorseGrid}>
          {teams.map((s) => {
            const cf = CONFEDS[s.confederacion as keyof typeof CONFEDS] ?? CONFEDS.UEFA;
            const why = DARK_HORSE_WHY[s.slug];
            const whyText = why ? (locale === "en" ? why.en : why.es) : "";
            return (
              <Link
                key={s.slug}
                href={`/selecciones/${s.slug}`}
                className={styles.dhCard}
                data-rank={`#${s.rankingFIFA ?? "—"}`}
              >
                {isHost(s.slug) && <span className={styles.dhHostTag}>{labels.hostTag}</span>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.dhFlag} src={FLAG(s.flagCode ?? s.slug, 320)} alt="" loading="lazy" />
                <div className={styles.dhName}>{s.nombre}</div>
                <span
                  className={styles.dhConfPill}
                  style={{ background: cf.colorSoft, color: cf.color }}
                >
                  {s.confederacion} · #{s.rankingFIFA ?? "—"}
                </span>
                {whyText && <p className={styles.dhWhy}>{whyText}</p>}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

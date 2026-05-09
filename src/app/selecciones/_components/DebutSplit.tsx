// DebutSplit — sección split editorial 2-col.
// Izquierda: 4 debutantes absolutos. Derecha: 3 anfitriones.

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { SELECCIONES, type Seleccion } from "@/data/selecciones";
import { DEBUTANTES, HOSTS, isHost as isHostFn } from "./team-meta";
import styles from "../selecciones.module.css";

const FLAG = (code: string, sz: number) => `https://flagcdn.com/w${sz}/${code}.png`;

interface DebutSplitProps {
  labels: {
    numTag: string;
    title: string;
    deck: string;
    debutKicker: string;
    debutTitle: string;
    debutBlurb: string;
    debutTagEnd: string;
    debutPrefix: string;
    hostsKicker: string;
    hostsTitle: string;
    hostsBlurb: string;
    hostsPrefix: string;
    matchesUsa: string;
    matchesOther: string;
  };
}

export default function DebutSplit({ labels }: DebutSplitProps) {
  const debutTeams = useMemo<Seleccion[]>(() => {
    const all = SELECCIONES as Seleccion[];
    return (DEBUTANTES as readonly string[])
      .map((slug) => all.find((s) => s.slug === slug))
      .filter((s): s is Seleccion => Boolean(s))
      .sort((a, b) => (a.rankingFIFA ?? 999) - (b.rankingFIFA ?? 999));
  }, []);

  const hostTeams = useMemo<Seleccion[]>(() => {
    const all = SELECCIONES as Seleccion[];
    return (HOSTS as readonly string[])
      .map((slug) => all.find((s) => s.slug === slug))
      .filter((s): s is Seleccion => Boolean(s))
      .sort((a, b) => (a.rankingFIFA ?? 999) - (b.rankingFIFA ?? 999));
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

        <div className={styles.debutSplit}>
          {/* DEBUTANTES */}
          <div className={styles.debutSide}>
            <div className={styles.debutKicker}>{labels.debutKicker}</div>
            <h3>{labels.debutTitle}</h3>
            <p>{labels.debutBlurb}</p>
            <div className={styles.debutList}>
              {debutTeams.map((s, i) => (
                <Link key={s.slug} href={`/selecciones/${s.slug}`} className={styles.debutRow}>
                  <span className={styles.debutIdx}>
                    {labels.debutPrefix}·{String(i + 1).padStart(2, "0")}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.debutFlag} src={FLAG(s.flagCode ?? s.slug, 160)} alt="" loading="lazy" />
                  <div className={styles.debutNmBlock}>
                    <span className={styles.debutNm}>{s.nombre}</span>
                    <span className={styles.debutConf}>
                      {s.confederacion} · FIFA #{s.rankingFIFA ?? "—"}
                    </span>
                  </div>
                  <span className={styles.debutTagEnd}>{labels.debutTagEnd}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ANFITRIONES */}
          <div className={styles.debutSide}>
            <div className={`${styles.debutKicker} ${styles.debutKickerGold}`}>
              {labels.hostsKicker}
            </div>
            <h3>{labels.hostsTitle}</h3>
            <p>{labels.hostsBlurb}</p>
            <div className={styles.debutList}>
              {hostTeams.map((s, i) => (
                <Link key={s.slug} href={`/selecciones/${s.slug}`} className={styles.debutRow}>
                  <span className={styles.debutIdx}>
                    {labels.hostsPrefix}·{String(i + 1).padStart(2, "0")}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.debutFlag} src={FLAG(s.flagCode ?? s.slug, 160)} alt="" loading="lazy" />
                  <div className={styles.debutNmBlock}>
                    <span className={styles.debutNm}>{s.nombre}</span>
                    <span className={styles.debutConf}>
                      {s.confederacion} · FIFA #{s.rankingFIFA ?? "—"}
                    </span>
                  </div>
                  <span className={`${styles.debutTagEnd} ${styles.debutTagEndGold}`}>
                    {s.slug === "estados-unidos" ? labels.matchesUsa : labels.matchesOther}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// FavoritosSection — hero rotator con 7 favoritos. Crossfade 7s.
// Click en card pequeña → promueve a hero. Hover sobre grid → pausa.

"use client";

import { useEffect, useMemo, useState } from "react";
import { SELECCIONES, type Seleccion } from "@/data/selecciones";
import { getFavoritosOrdered } from "./team-meta";
import FavCard from "./FavCard";
import styles from "../selecciones.module.css";

interface FavoritosSectionProps {
  labels: {
    numTag: string;
    title: string;
    deck: string;
    rotatorPaused: string;
    rotatorLive: string;
    grupo: string;
    mundiales: string;
    mejor: string;
    powerIndex: string;
    twelveMonth: string;
  };
}

export default function FavoritosSection({ labels }: FavoritosSectionProps) {
  const ordered = useMemo<Seleccion[]>(
    () => getFavoritosOrdered(SELECCIONES as Seleccion[]),
    [],
  );

  const [heroSlug, setHeroSlug] = useState<string>(ordered[0]?.slug ?? "brasil");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || ordered.length === 0) return;
    const id = setInterval(() => {
      setHeroSlug((curr) => {
        const i = ordered.findIndex((s) => s.slug === curr);
        return ordered[(i + 1) % ordered.length].slug;
      });
    }, 7000);
    return () => clearInterval(id);
  }, [paused, ordered]);

  const heroTeam = ordered.find((s) => s.slug === heroSlug) ?? ordered[0];
  const others = ordered.filter((s) => s.slug !== heroSlug);

  if (!heroTeam) return null;

  const cardLabels = {
    grupo: labels.grupo,
    mundiales: labels.mundiales,
    mejor: labels.mejor,
    powerIndex: labels.powerIndex,
    twelveMonth: labels.twelveMonth,
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.secHead}>
          <span className={styles.numTag}>{labels.numTag}</span>
          <div className={styles.titleBlock}>
            <h2>{labels.title}</h2>
            <p className={styles.deck}>{labels.deck}</p>
          </div>
          <button
            type="button"
            className={styles.rotatorToggle}
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? labels.rotatorPaused : labels.rotatorLive}
          >
            <span
              className={`${styles.pdot} ${paused ? "" : styles.pdotLive}`}
              aria-hidden="true"
            />
            {paused ? labels.rotatorPaused : labels.rotatorLive}
          </button>
        </div>

        <div
          className={styles.favoritosGrid}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <FavCard key={heroSlug} team={heroTeam} isHero labels={cardLabels} />
          {others.map((s) => (
            <FavCard
              key={s.slug}
              team={s}
              labels={cardLabels}
              onClick={() => setHeroSlug(s.slug)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

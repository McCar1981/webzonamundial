"use client";

import { CSSProperties, useEffect, useRef } from "react";
import Link from "next/link";
import { CREADORES } from "@/data/creadores";
import styles from "./CommunityCreatorsSection.module.css";

/* ============== Icons ============== */

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconGroup = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14m-7-7 7 7-7 7" />
  </svg>
);

const IconBroadcast = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.48M20.49 4.51a10 10 0 0 1 0 14.13M3.51 19.14a10 10 0 0 1 0-14.14" />
  </svg>
);

const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconBars = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 20h4V10H3v10zm7 0h4V4h-4v16zm7 0h4v-7h-4v7z" />
  </svg>
);

const IconCommunity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="7" r="4" />
    <circle cx="17" cy="9" r="3" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M19 21v-2a3 3 0 0 0-2-2.82" />
  </svg>
);

/* ============== Data ============== */

const FEATURES = [
  {
    Icon: IconBroadcast,
    title: "Directos en vivo",
    desc: "Sigue transmisiones en vivo con tus creadores favoritos.",
  },
  {
    Icon: IconChat,
    title: "Reacciones reales",
    desc: "Vive cada jugada con reacciones auténticas y sin filtros.",
  },
  {
    Icon: IconBars,
    title: "Análisis experto",
    desc: "Estadísticas, tácticas y opiniones de quienes más saben.",
  },
  {
    Icon: IconCommunity,
    title: "Comunidad única",
    desc: "Conecta con millones de fanáticos que comparten tu pasión.",
  },
];

/* Floating sparks around section */
const SPARKS = [
  { left: "8%", dur: "14s", delay: "0s" },
  { left: "22%", dur: "18s", delay: "3s" },
  { left: "38%", dur: "16s", delay: "6s" },
  { left: "55%", dur: "20s", delay: "2s" },
  { left: "68%", dur: "15s", delay: "9s" },
  { left: "82%", dur: "17s", delay: "4s" },
  { left: "94%", dur: "13s", delay: "11s" },
];

/* ============== Main Component ============== */

export function CommunityCreatorsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  /* Track cursor for interactive glow */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty("--mx", `${x}%`);
        el.style.setProperty("--my", `${y}%`);
        raf = 0;
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} id="community-creators">
      {/* Background layers */}
      <div className={styles.cursorGlow} aria-hidden="true" />
      <div className={styles.sparks} aria-hidden="true">
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className={styles.spark}
            style={{
              left: s.left,
              bottom: "-20px",
              ["--dur" as string]: s.dur,
              ["--delay" as string]: s.delay,
            }}
          />
        ))}
      </div>

      <div className={styles.inner}>
        {/* ========== HERO (top block) ========== */}
        <div className={styles.hero}>
          <div className={styles.copyCol}>
            <div className={styles.pill}>
              <span className={styles.pillShield}>
                <IconShield />
              </span>
              Respaldado por los que realmente entienden de fútbol
            </div>

            <h2 className={styles.title}>
              +12.3M de seguidores. Una sola app.{" "}
              <em className={styles.titleAccent}>Tú eliges con quién vivirlo.</em>
            </h2>

            <p className={styles.desc}>
              Los creadores de contenido futbolístico más grandes del mundo están en ZonaMundial.
              Directos, reacciones, análisis y debates en tiempo real con quienes mejor entienden
              este deporte.
            </p>

            <div className={styles.infoBox}>
              <span className={styles.infoIconWrap}>
                <IconGroup />
              </span>
              <p className={styles.infoText}>
                Más de <span className={styles.infoHighlight}>12.3M de seguidores</span>{" "}
                concentrados en una sola comunidad.
                <br />
                Elige con quién vivirlo cada partido.
              </p>
            </div>

            <Link href="/creadores" className={styles.cta}>
              Ver todos los creadores
              <IconArrow />
            </Link>
          </div>

          {/* Right: ball image */}
          <div className={styles.ballCol}>
            <div className={styles.ballRays} aria-hidden="true" />
            <picture>
              <source
                srcSet="/img/community/ball-hero-mobile.webp"
                media="(max-width: 640px)"
                type="image/webp"
              />
              <source srcSet="/img/community/ball-hero.webp" type="image/webp" />
              <img
                className={styles.ballImg}
                src="/img/community/ball-hero.webp"
                alt="Balón oficial del Mundial 2026 sobre el césped"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
        </div>

        {/* ========== FEATURES STRIP ========== */}
        <div className={styles.features}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.feature}>
              <span className={styles.featureIcon}>
                <f.Icon />
              </span>
              <div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ========== CREATORS GRID ========== */}
        <div className={styles.creatorsHead}>
          <h2 className={styles.creatorsTitle}>Conoce a los creadores</h2>
          <p className={styles.creatorsSub}>
            {CREADORES.length} creadores oficiales. Elige tu favorito y vive el Mundial con su
            comunidad.
          </p>
        </div>

        <div className={styles.creatorsGrid}>
          {CREADORES.map((c) => {
            const style: CSSProperties = {
              ["--color" as string]: c.colorPrimario,
            };
            return (
              <Link
                key={c.slug}
                href={`/creadores#${c.slug}`}
                className={styles.creatorCard}
                style={style}
              >
                <div className={styles.avatarWrap}>
                  <img
                    className={styles.avatar}
                    src={c.imagen}
                    alt={`Creator ${c.nombre}`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3 className={styles.creatorName}>{c.nombre}</h3>
                <p className={styles.creatorHandle}>{c.handle}</p>
                <span className={styles.followerPill}>{c.seguidores}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

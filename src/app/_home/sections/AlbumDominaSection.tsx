"use client";

import { useEffect, useRef, ReactNode } from "react";
import styles from "./AlbumDominaSection.module.css";

/* =============== Icons =============== */

const IconStar = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l2.9 7.5L22 10l-5.5 5L18 22l-6-3.5L6 22l1.5-7L2 10l7.1-.5L12 2z" />
  </svg>
);

const IconCheck = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" fill="rgba(212, 168, 83, 0.12)" stroke="rgba(212, 168, 83, 0.6)" strokeWidth="1.2" />
    <path d="m8 12.5 3 3 5-6" />
  </svg>
);

const IconAlbumBooks = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4v16M8 4v16" />
    <rect x="3" y="4" width="6" height="16" rx="1" />
    <path d="M12 4v16M16 4v16" />
    <rect x="11" y="4" width="6" height="16" rx="1" />
    <path d="M20 6v14" />
    <path d="M19 6h3v14h-3" />
  </svg>
);

const IconBallGold = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="rgba(212, 168, 83, 0.15)" />
    <path d="M12 6.5 15.2 9 14 12.8h-4L8.8 9z" fill="currentColor" opacity="0.6" />
    <line x1="12" y1="6.5" x2="12" y2="3.5" />
    <line x1="15.2" y1="9" x2="18" y2="8" />
    <line x1="14" y1="12.8" x2="16.5" y2="16.5" />
    <line x1="10" y1="12.8" x2="7.5" y2="16.5" />
    <line x1="8.8" y1="9" x2="6" y2="8" />
  </svg>
);

const IconHandshake = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 17 7 13l-3 3 3 3 3-3" />
    <path d="m13 17 4-4 3 3-3 3-3-3" />
    <path d="m6 10 5-5 3 3" />
    <path d="m13 8 3-3 5 5-4 4" />
    <path d="M8 14h3" />
  </svg>
);

/* =============== Data =============== */

type Benefit = {
  n: string;
  Icon: () => ReactNode;
  title: string;
  items: string[];
};

const BENEFITS: Benefit[] = [
  {
    n: "01",
    Icon: IconAlbumBooks,
    title: "48 selecciones. Un solo álbum.",
    items: [
      "Desde las potencias hasta los debutantes.",
      "Cada cromo cuenta una historia.",
      "Colecciónalos todas.",
    ],
  },
  {
    n: "02",
    Icon: IconBallGold,
    title: "Oro puro por ver partidos",
    items: [
      "No pagues. Gánalos.",
      "Ediciones exclusivas que solo sueltan partidos épicos y desafíos cumplidos.",
    ],
  },
  {
    n: "03",
    Icon: IconHandshake,
    title: "Tradea como un profesional",
    items: [
      "¿Repetidos? Perfecto.",
      "Cambia con amigos o negocia con la comunidad. El álbum se completa ganando.",
    ],
  },
];

/* Floating gold sparks */
const SPARKS = [
  { left: "6%", dur: "14s", delay: "0s" },
  { left: "18%", dur: "18s", delay: "3s" },
  { left: "32%", dur: "16s", delay: "6s" },
  { left: "46%", dur: "20s", delay: "2s" },
  { left: "60%", dur: "15s", delay: "9s" },
  { left: "74%", dur: "17s", delay: "4s" },
  { left: "88%", dur: "13s", delay: "11s" },
];

/* =============== Component =============== */

export function AlbumDominaSection() {
  const sectionRef = useRef<HTMLElement>(null);

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
    <section ref={sectionRef} className={styles.section} id="album-domina">
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
        {/* HERO */}
        <div className={styles.hero}>
          <div className={styles.imageWrap}>
            <img
              className={styles.heroImg}
              src="/img/album/album-hero.webp"
              alt="Álbum dorado del Mundial 2026 con cromos de selecciones"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className={styles.copyCol}>
            <h2 className={styles.title}>
              Completa el <em className={styles.titleGold}>Álbum.</em>
              <br />
              Domina el <em className={styles.titleGold}>Mundial.</em>
            </h2>

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerStars}>
                <IconStar />
                <IconStar />
                <IconStar />
              </span>
              <span className={styles.dividerLine} />
            </div>

            <p className={styles.eyebrow}>Cromos de oro de las 48 selecciones.</p>
            <p className={styles.desc}>
              Ediciones que solo desbloquean los que realmente viven el torneo.
              <br />Y un mercado P2P para que nadie te frene.
            </p>
          </div>
        </div>

        {/* BENEFITS */}
        <div className={styles.benefits}>
          {BENEFITS.map((b) => (
            <div key={b.n} className={styles.card} data-num={b.n}>
              <div className={styles.cardIconWrap}>
                <b.Icon />
              </div>
              <h3 className={styles.cardTitle}>{b.title}</h3>
              <ul className={styles.cardList}>
                {b.items.map((it) => (
                  <li key={it}>
                    <span className={styles.checkIcon}>
                      <IconCheck />
                    </span>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

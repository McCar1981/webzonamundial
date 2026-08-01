"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSections } from "@/i18n/home-sections";
import styles from "./StatsHowSection.module.css";
import {
  IconStatBall,
  IconStatStadium,
  IconStatWhistle,
  IconStatGroup,
  IconStatFlag,
  IconStatPuzzle,
  IconStepChoose,
  IconStepPlay,
  IconStepWin,
} from "./StatsHowIcons";

/* =================== DATA =================== */

/* Icon order matches translation labels/steps indices */
// Cifras del catálogo real (src/data/competitions.ts), no del Mundial:
// 21 competiciones = 15 ligas domésticas + 6 copas continentales, repartidas en
// 13 países de 2 continentes. Módulos = los 10 del grid de la home.
const STAT_ICONS = [
  { Icon: IconStatBall, num: "21", key: "competiciones" as const },
  { Icon: IconStatStadium, num: "15", key: "ligas" as const },
  { Icon: IconStatWhistle, num: "6", key: "copas" as const },
  { Icon: IconStatGroup, num: "13", key: "paises" as const },
  { Icon: IconStatFlag, num: "2", key: "continentes" as const },
  { Icon: IconStatPuzzle, num: "10", key: "modulos" as const },
];

const STEP_ICONS = [IconStepChoose, IconStepPlay, IconStepWin] as const;

/* =================== COMPONENT =================== */

/* Particles spread across the section */
const PARTICLES = [
  { left: "6%", dur: "14s", delay: "0s" },
  { left: "18%", dur: "18s", delay: "3s" },
  { left: "32%", dur: "16s", delay: "6s" },
  { left: "45%", dur: "20s", delay: "2s" },
  { left: "58%", dur: "15s", delay: "9s" },
  { left: "71%", dur: "17s", delay: "4s" },
  { left: "84%", dur: "13s", delay: "11s" },
  { left: "94%", dur: "19s", delay: "7s" },
];

/* Twinkling stars */
const TWINKLES = [
  { left: "10%", top: "12%", dur: "3s", delay: "0s" },
  { left: "24%", top: "28%", dur: "4s", delay: "1s" },
  { left: "38%", top: "8%", dur: "3.5s", delay: "2s" },
  { left: "52%", top: "18%", dur: "3s", delay: "0.5s" },
  { left: "66%", top: "10%", dur: "4.2s", delay: "1.8s" },
  { left: "80%", top: "22%", dur: "3.6s", delay: "3s" },
  { left: "92%", top: "14%", dur: "4s", delay: "0.8s" },
  { left: "15%", top: "78%", dur: "3s", delay: "2.5s" },
  { left: "45%", top: "84%", dur: "4s", delay: "1.2s" },
  { left: "75%", top: "80%", dur: "3.8s", delay: "3.4s" },
];

export function StatsHowSection() {
  const stepsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { locale } = useLanguage();
  const t = homeSections[locale].statsHow;

  /* Track cursor to feed the interactive glow */
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

  /* Track scroll position on mobile steps slider to update active dot */
  useEffect(() => {
    const el = stepsRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const children = Array.from(el.children).filter(
          (c): c is HTMLElement => c instanceof HTMLElement
        );
        const scrollMid = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        children.forEach((child, i) => {
          const mid = child.offsetLeft + child.offsetWidth / 2;
          const d = Math.abs(mid - scrollMid);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        setActive(best);
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = useCallback((i: number) => {
    const el = stepsRef.current;
    if (!el) return;
    const children = Array.from(el.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement
    );
    const target = children[i];
    if (!target) return;
    el.scrollTo({
      left: target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} id="stats-how">
      {/* Interactive cursor glow */}
      <div className={styles.cursorGlow} aria-hidden="true" />
      {/* Floating particles */}
      <div className={styles.particles} aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={`p-${i}`}
            className={styles.particle}
            style={{
              left: p.left,
              bottom: "-20px",
              ["--dur" as string]: p.dur,
              ["--delay" as string]: p.delay,
            }}
          />
        ))}
        {TWINKLES.map((t, i) => (
          <span
            key={`t-${i}`}
            className={styles.twinkle}
            style={{
              left: t.left,
              top: t.top,
              ["--dur" as string]: t.dur,
              ["--delay" as string]: t.delay,
            }}
          />
        ))}
        <span className={styles.shimmer} />
      </div>

      <div className={styles.inner}>
        {/* ========== Block 1: Stats ========== */}
        <div className={styles.statsHead}>
          <h2 className={styles.statsTitle}>
            {t.title} <em className={styles.statsTitleGold}>{t.titleGold}</em>
          </h2>
          <p className={styles.statsSub}>{t.subtitle}</p>
        </div>

        <div className={styles.statsGrid}>
          {STAT_ICONS.map((s) => (
            <div key={s.key} className={styles.statCard}>
              <div className={styles.statIconWrap}>
                <s.Icon size={72} />
              </div>
              <div className={styles.statNum}>{s.num}</div>
              <div className={styles.statLabel}>{t.statLabels[s.key]}</div>
            </div>
          ))}
        </div>

        <div className={styles.divider} aria-hidden="true" />

        {/* ========== Block 2: How it works ========== */}
        <div className={styles.howHead}>
          <span className={styles.pill}>{t.howPill}</span>
          <h2 className={styles.howTitle}>{t.howTitle}</h2>
          <p className={styles.howSub}>{t.howSub}</p>
        </div>

        <div className={styles.steps} ref={stepsRef}>
          {t.steps.map((s, i) => {
            const Icon = STEP_ICONS[i];
            const n = String(i + 1).padStart(2, "0");
            return (
              <div key={n} className={styles.step}>
                <div className={styles.stepIconWrap}>
                  <Icon size={120} />
                  <span className={styles.stepBadge}>{n}</span>
                </div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Dots only visible in mobile (CSS-controlled) */}
        <div className={styles.sliderDots} role="tablist" aria-label={t.stepsA11y}>
          {t.steps.map((s, i) => {
            const n = String(i + 1).padStart(2, "0");
            return (
              <button
                key={n}
                type="button"
                role="tab"
                aria-selected={active === i}
                aria-label={`${t.stepsA11y} ${n} · ${s.title}`}
                onClick={() => goTo(i)}
                className={`${styles.sliderDot} ${active === i ? styles.sliderDotActive : ""}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

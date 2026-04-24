"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const STATS = [
  { Icon: IconStatBall, num: "48", label: "Selecciones" },
  { Icon: IconStatStadium, num: "16", label: "Sedes" },
  { Icon: IconStatWhistle, num: "104", label: "Partidos" },
  { Icon: IconStatGroup, num: "12", label: "Grupos" },
  { Icon: IconStatFlag, num: "3", label: "Países" },
  { Icon: IconStatPuzzle, num: "12", label: "Módulos" },
];

const STEPS = [
  {
    n: "01",
    Icon: IconStepChoose,
    title: "Selecciona a tu creador",
    desc: "Eliges tu selección, descubre datos, fixture del Mundial 2026.",
  },
  {
    n: "02",
    Icon: IconStepPlay,
    title: "Juega y predice",
    desc: "Entra en predicciones, fantasy, trivia y ligas privadas con tus amigos.",
  },
  {
    n: "03",
    Icon: IconStepWin,
    title: "Vive y gana",
    desc: "Sigue los partidos en streaming con creadores y gana premios reales.",
  },
];

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
            48 selecciones. 16 sedes. 104 partidos. 1 ganador:{" "}
            <em className={styles.statsTitleGold}>tú.</em>
          </h2>
          <p className={styles.statsSub}>
            Todo lo que necesitas para vivir el Mundial 2026 como nunca antes.
          </p>
        </div>

        <div className={styles.statsGrid}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statIconWrap}>
                <s.Icon size={72} />
              </div>
              <div className={styles.statNum}>{s.num}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.divider} aria-hidden="true" />

        {/* ========== Block 2: ¿Cómo funciona? ========== */}
        <div className={styles.howHead}>
          <span className={styles.pill}>ASÍ DE FÁCIL</span>
          <h2 className={styles.howTitle}>¿Cómo funciona?</h2>
          <p className={styles.howSub}>
            Tres pasos y ya estás dentro. Sin complicaciones, sin letra pequeña.
          </p>
        </div>

        <div className={styles.steps} ref={stepsRef}>
          {STEPS.map((s) => (
            <div key={s.n} className={styles.step}>
              <div className={styles.stepIconWrap}>
                <s.Icon size={120} />
                <span className={styles.stepBadge}>{s.n}</span>
              </div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Dots only visible in mobile (CSS-controlled) */}
        <div className={styles.sliderDots} role="tablist" aria-label="Pasos">
          {STEPS.map((s, i) => (
            <button
              key={s.n}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Paso ${s.n} · ${s.title}`}
              onClick={() => goTo(i)}
              className={`${styles.sliderDot} ${active === i ? styles.sliderDotActive : ""}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

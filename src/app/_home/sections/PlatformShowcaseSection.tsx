"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
  MouseEvent,
} from "react";
import styles from "./PlatformShowcaseSection.module.css";

/* =================== HOOKS =================== */

/**
 * Counter: animates 0 → target with easeOutCubic when visible.
 * Returns ref (attach to the DOM node that triggers observation) + formatted value + raw integer.
 */
function useCounter(
  target: number,
  opts: { duration?: number; prefix?: string; suffix?: string } = {}
) {
  const { duration = 1400, prefix = "", suffix = "" } = opts;
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  const formatted = `${prefix}${value.toLocaleString("es-ES")}${suffix}`;
  return { ref, value: formatted, raw: value };
}

/** Tilt 3D */
function usePlatformTilt(max = 6) {
  const ref = useRef<HTMLDivElement>(null);
  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1000px) rotateX(${-y * max}deg) rotateY(${
        x * max
      }deg) translateZ(0)`;
    },
    [max]
  );
  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = "";
  }, []);
  return { ref, onMouseMove, onMouseLeave };
}

/** Phone combined mouse + scroll parallax */
function usePhoneParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ mx: 0, my: 0, sy: 0 });

  const apply = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { mx, my, sy } = state.current;
    el.style.transform =
      `perspective(1600px) ` +
      `rotateX(${-my * 6 + sy * 4}deg) ` +
      `rotateY(${mx * 10 - 8}deg) ` +
      `translateY(${sy * -20}px) ` +
      `translateZ(0)`;
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      state.current.mx = (e.clientX - r.left) / r.width - 0.5;
      state.current.my = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      apply();
    },
    [apply]
  );

  const onMouseLeave = useCallback(() => {
    state.current.mx = 0;
    state.current.my = 0;
    apply();
  }, [apply]);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const viewport = window.innerHeight;
      const t = (center - viewport / 2) / viewport;
      state.current.sy = Math.max(-0.5, Math.min(0.5, t));
      apply();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [apply]);

  return { ref, onMouseMove, onMouseLeave };
}

/** Intersection trigger */
function useOnScreen(threshold = 0.25) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

/* =================== ICONS =================== */

const IconShield = () => (
  <svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ps-shield-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F5D07A" />
        <stop offset="45%" stopColor="#D4A853" />
        <stop offset="100%" stopColor="#8B6A2E" />
      </linearGradient>
      <linearGradient id="ps-shield-shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.35)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
    </defs>
    <path d="M8 6 L56 6 L56 48 L32 60 L8 48 Z" fill="url(#ps-shield-g)" stroke="#6B4E1A" strokeWidth="1.2" />
    <path d="M8 6 L2 0 L8 14 Z" fill="#8B6A2E" />
    <path d="M56 6 L62 0 L56 14 Z" fill="#8B6A2E" />
    <rect x="12" y="12" width="40" height="32" rx="2" fill="#0E1028" stroke="#D4A853" strokeWidth="0.8" />
    <path d="M8 6 L56 6 L56 20 L8 20 Z" fill="url(#ps-shield-shine)" opacity="0.5" />
    <text
      x="32"
      y="33"
      textAnchor="middle"
      fontFamily="var(--zm-font-display), Syne, sans-serif"
      fontWeight="800"
      fontSize="18"
      fill="#D4A853"
      letterSpacing="-0.02em"
    >
      48
    </text>
    <circle cx="32" cy="52" r="5" fill="none" stroke="#D4A853" strokeWidth="1" />
    <path d="M27 52 H37 M32 47 Q35 52 32 57 Q29 52 32 47" stroke="#D4A853" strokeWidth="0.8" fill="none" />
  </svg>
);

const IconBall = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ps-ball-g" cx="38%" cy="32%" r="72%">
        <stop offset="0%" stopColor="#FFF1B8" />
        <stop offset="35%" stopColor="#F5D07A" />
        <stop offset="75%" stopColor="#D4A853" />
        <stop offset="100%" stopColor="#6B4E1A" />
      </radialGradient>
      <radialGradient id="ps-ball-glow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="rgba(212,168,83,0.5)" />
        <stop offset="100%" stopColor="rgba(212,168,83,0)" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#ps-ball-glow)" />
    <circle cx="32" cy="32" r="25" fill="url(#ps-ball-g)" stroke="#6B4E1A" strokeWidth="0.8" />
    <path
      d="M32 18.5 L41.5 25.4 L37.9 36.6 L26.1 36.6 L22.5 25.4 Z"
      fill="#0A0A14"
      stroke="#8B6A2E"
      strokeWidth="0.6"
    />
    <line x1="32" y1="18.5" x2="32" y2="8" stroke="#8B6A2E" strokeWidth="0.8" />
    <line x1="41.5" y1="25.4" x2="52" y2="22" stroke="#8B6A2E" strokeWidth="0.8" />
    <line x1="37.9" y1="36.6" x2="46" y2="50" stroke="#8B6A2E" strokeWidth="0.8" />
    <line x1="26.1" y1="36.6" x2="18" y2="50" stroke="#8B6A2E" strokeWidth="0.8" />
    <line x1="22.5" y1="25.4" x2="12" y2="22" stroke="#8B6A2E" strokeWidth="0.8" />
    <path
      d="M32 7 L35.5 9 L35.5 13 L32 15 L28.5 13 L28.5 9 Z"
      fill="#0A0A14"
      opacity="0.85"
      stroke="#8B6A2E"
      strokeWidth="0.4"
    />
    <path
      d="M51 21 L52.5 24 L50 27 L47 26 L46.5 23 L49 20 Z"
      fill="#0A0A14"
      opacity="0.85"
      stroke="#8B6A2E"
      strokeWidth="0.4"
    />
    <path
      d="M46 50 L49 48.5 L50 45 L47 44 L44 46 L44 49 Z"
      fill="#0A0A14"
      opacity="0.85"
      stroke="#8B6A2E"
      strokeWidth="0.4"
    />
    <path
      d="M18 50 L15 48.5 L14 45 L17 44 L20 46 L20 49 Z"
      fill="#0A0A14"
      opacity="0.85"
      stroke="#8B6A2E"
      strokeWidth="0.4"
    />
    <path
      d="M13 21 L11.5 24 L14 27 L17 26 L17.5 23 L15 20 Z"
      fill="#0A0A14"
      opacity="0.85"
      stroke="#8B6A2E"
      strokeWidth="0.4"
    />
    <ellipse cx="23" cy="22" rx="5" ry="2.5" fill="#fff" opacity="0.35" transform="rotate(-30 23 22)" />
  </svg>
);

const IconTrophy = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ps-trophy-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F7DE90" />
        <stop offset="50%" stopColor="#D4A853" />
        <stop offset="100%" stopColor="#8B6A2E" />
      </linearGradient>
    </defs>
    <path
      d="M14 14 Q6 14 6 22 Q6 30 16 30"
      fill="none"
      stroke="url(#ps-trophy-g)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M50 14 Q58 14 58 22 Q58 30 48 30"
      fill="none"
      stroke="url(#ps-trophy-g)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M14 10 L50 10 L48 30 Q48 38 32 40 Q16 38 16 30 Z"
      fill="url(#ps-trophy-g)"
      stroke="#6B4E1A"
      strokeWidth="1"
    />
    <path
      d="M32 18 L34.3 23.5 L40 24.2 L35.8 28 L37 33.8 L32 30.8 L27 33.8 L28.2 28 L24 24.2 L29.7 23.5 Z"
      fill="#0E1028"
      stroke="#F7DE90"
      strokeWidth="0.6"
    />
    <rect x="29" y="40" width="6" height="8" fill="#8B6A2E" />
    <rect x="22" y="48" width="20" height="4" rx="1" fill="url(#ps-trophy-g)" stroke="#6B4E1A" strokeWidth="0.8" />
    <rect x="20" y="52" width="24" height="4" rx="1" fill="#8B6A2E" stroke="#6B4E1A" strokeWidth="0.8" />
    <path d="M18 14 L20 14 L22 28 L20 30 Z" fill="#fff" opacity="0.3" />
  </svg>
);

const IconUsers = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconCalendar = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconStadium = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12c0-3 4.5-5 10-5s10 2 10 5-4.5 5-10 5S2 15 2 12z" />
    <path d="M5 14v4M19 14v4M12 7V4M9 18h6" />
  </svg>
);
const IconGlobe = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
  </svg>
);

/* =================== STAT CARD =================== */

function StatCard({
  icon,
  num,
  label,
  desc,
  target,
  suffix,
}: {
  icon: ReactNode;
  num?: string;
  label: string;
  desc: string;
  target: number;
  suffix?: string;
}) {
  const tilt = usePlatformTilt(6);
  const counter = useCounter(target, { suffix });
  return (
    <div
      ref={tilt.ref}
      className={styles.statCard}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <div className={styles.statIcon}>{icon}</div>
      <div>
        <p ref={counter.ref} className={styles.statNum}>
          {num ?? counter.value}
        </p>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statDesc}>{desc}</p>
      </div>
    </div>
  );
}

/* =================== BAR STAT =================== */

function BarStat({
  icon,
  target,
  label,
  suffix = "",
  prefix = "",
  displayFormatter,
}: {
  icon: ReactNode;
  target: number;
  label: string;
  suffix?: string;
  prefix?: string;
  displayFormatter?: (raw: number) => string;
}) {
  const counter = useCounter(target, { prefix, suffix });
  const shown = displayFormatter ? displayFormatter(counter.raw) : counter.value;
  return (
    <div className={styles.barStat}>
      <div className={styles.barIcon}>{icon}</div>
      <div>
        <p ref={counter.ref} className={styles.barNum}>
          {shown}
        </p>
        <p className={styles.barLabel}>{label}</p>
      </div>
    </div>
  );
}

/* =================== PHONE =================== */

const PHONE_SCREENS = ["/img/platform/app-fantasy-spain.webp"];

function Phone() {
  const parallax = usePhoneParallax();
  const [idx, setIdx] = useState(0);
  const total = PHONE_SCREENS.length;

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 4000);
    return () => clearInterval(t);
  }, [total]);

  return (
    <div
      ref={parallax.ref}
      className={styles.phone}
      onMouseMove={parallax.onMouseMove}
      onMouseLeave={parallax.onMouseLeave}
    >
      <div className={styles.screen}>
        <img src={PHONE_SCREENS[idx]} alt="App ZonaMundial" loading="lazy" decoding="async" />
        <div className={styles.cursorGlow} />
      </div>
      {total > 1 && (
        <div className={styles.dots}>
          {PHONE_SCREENS.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`}
              onClick={() => setIdx(i)}
              aria-label={`Pantalla ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =================== MAIN SECTION =================== */

export function PlatformShowcaseSection() {
  const [sectionRef, visible] = useOnScreen(0.2);

  return (
    <section
      ref={sectionRef as unknown as React.RefObject<HTMLElement>}
      className={`${styles.platform} ${visible ? styles.platformVisible : ""}`}
      id="plataforma"
    >
      <div className={styles.inner}>
        <div className={styles.stage}>
          {/* Left: text */}
          <div className={styles.text}>
            <div className={styles.eyebrow}>
              ¿POR QUÉ ZONAMUNDIAL? PORQUE EL RESTO SE QUEDA CORTO.
            </div>
            <h2 className={styles.title}>
              La plataforma que
              <br />
              el Mundial 2026
              <br />
              <em className={styles.titleEm}>merece,</em> no la que
              <br />
              necesita.
            </h2>
            <p className={styles.para}>
              En ZonaMundial no hacemos lo mínimo. Hacemos lo máximo. Predicciones, fantasy,
              trivia, streaming, IA coach y una comunidad de millones. Todo en un solo lugar.
              Todo gratis.
            </p>
            <p className={styles.highlight}>
              Sin anuncios intrusivos. <span>Sin letra pequeña.</span> Solo fútbol puro.
            </p>
          </div>

          {/* Right: phone */}
          <div className={styles.phoneCol}>
            <div className={styles.rings}>
              <span />
              <span />
              <span />
            </div>
            <Phone />
          </div>

          {/* Decorative connectors */}
          <svg
            className={styles.connectors}
            viewBox="0 0 1200 700"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 880 560 Q 700 680, 300 820" />
            <path d="M 880 580 Q 800 760, 600 860" />
            <path d="M 880 600 Q 900 760, 1000 860" />
          </svg>
        </div>

        {/* 3 big stat cards */}
        <div className={styles.cards}>
          <StatCard
            icon={<IconShield />}
            num="48"
            label="Selecciones"
            desc="Datos, plantillas y estadísticas de todos los equipos clasificados al Mundial."
            target={48}
          />
          <StatCard
            icon={<IconBall />}
            num="100%"
            label="Fútbol puro"
            desc="Sin ruido, sin distracciones. Solo el Mundial y todo lo que lo rodea."
            target={100}
            suffix="%"
          />
          <StatCard
            icon={<IconTrophy />}
            num="Todo en 1"
            label="Una sola plataforma"
            desc="Fantasy, predicciones, trivia, streaming, IA y mucho más, siempre a mano."
            target={1}
          />
        </div>

        {/* Slim bar */}
        <div className={styles.bar}>
          <BarStat
            icon={<IconUsers />}
            target={2500000}
            label="Usuarios registrados"
            displayFormatter={(v) => `+${(v / 1000000).toFixed(1)}M`}
          />
          <BarStat icon={<IconCalendar />} target={104} label="Partidos" />
          <BarStat icon={<IconStadium />} target={16} label="Sedes" />
          <BarStat icon={<IconGlobe />} target={3} label="Países anfitriones" />
        </div>
      </div>
    </section>
  );
}

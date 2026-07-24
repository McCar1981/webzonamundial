"use client";

import Link from "next/link";
import { ReactNode, CSSProperties } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSections } from "@/i18n/home-sections";
import styles from "./ModulesGridSection.module.css";

/* ============== SVG ICONS (line style, matches mockup) ============== */

const IconSoccer = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.15" />
  </svg>
);

const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const IconTrophy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4a2 2 0 0 0 0 4h3M17 6h3a2 2 0 0 1 0 4h-3" />
  </svg>
);

const IconBot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="7" width="16" height="12" rx="3" />
    <path d="M12 3v4M8 13h.01M16 13h.01M9 17h6" />
  </svg>
);

const IconVideo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="6" width="14" height="12" rx="2" />
    <path d="m21 8-4 3.5L21 15V8z" fill="currentColor" opacity="0.25" />
  </svg>
);

const IconShieldBolt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2 4 5v7c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5l-8-3z" />
    <path d="M13 9l-4 5h3l-1 4 4-5h-3l1-4z" fill="currentColor" />
  </svg>
);

const IconShirt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 6l4-3h8l4 3-3 4-2-1v11H9V9L7 10 4 6z" />
  </svg>
);

const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconBars = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 21V11M9 21V3M15 21v-6M21 21V8" />
  </svg>
);

const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconTimer = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2M9 2h6" />
  </svg>
);

const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"
      fill="currentColor"
      fillOpacity="0.2"
    />
  </svg>
);

const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14m-7-7 7 7-7 7" />
  </svg>
);

/* ============== MODULES META (order matches i18n `items` array) ============== */

type ModuleMeta = {
  href: string;
  color: string;
  bg: string;
  icon: ReactNode;
};

function buildModulesMeta(iconImgClass: string): ModuleMeta[] {
  return [
    {
      href: "/app/matchcenter",
      color: "#F5D07A",
      bg: "/img/modules-grid/match-center.webp",
      icon: (
        <img
          src="/img/modules-grid-icons/soccer-ball.webp"
          alt=""
          className={iconImgClass}
          aria-hidden="true"
        />
      ),
    },
    { href: "/app/predicciones", color: "#EF4444", bg: "/img/modules-grid/predicciones.webp", icon: <IconTarget /> },
    { href: "/app/fantasy", color: "#3B82F6", bg: "/img/modules-grid/fantasy.webp", icon: <IconTrophy /> },
    { href: "/app/ia-coach", color: "#22C55E", bg: "/img/modules-grid/ia-coach.webp", icon: <IconBot /> },
    // PIVOTE LIGAS (jul-2026): Streaming y Modo Carrera quitados del grid (features del Mundial retiradas).
    // { href: "/app/streaming", color: "#F59E0B", bg: "/img/modules-grid/streaming.webp", icon: <IconVideo /> },
    { href: "/app/trivia", color: "#A855F7", bg: "/img/modules-grid/trivia-diaria.webp", icon: <IconShieldBolt /> },
    // { href: "/app/modo-carrera", color: "#EC4899", bg: "/img/modules-grid/modo-carrera.webp", icon: <IconShirt /> },
    { href: "/app/ligas", color: "#14B8A6", bg: "/img/modules-grid/ligas-privadas.webp", icon: <IconUsers /> },
    { href: "/app/rankings", color: "#EAB308", bg: "/img/modules-grid/rankings.webp", icon: <IconBars /> },
    { href: "/app/chat", color: "#38BDF8", bg: "/img/modules-grid/chat-vivo.webp", icon: <IconChat /> },
    { href: "/app/micro", color: "#F43F5E", bg: "/img/modules-grid/micro.webp", icon: <IconTimer /> },
    { href: "/app/stories", color: "#8B5CF6", bg: "/img/modules-grid/trivias-historicas.webp", icon: <IconStar /> },
  ];
}

/* ============== SECTION ============== */

export function ModulesGridSection() {
  const { locale } = useLanguage();
  const t = homeSections[locale].modulesGrid;
  const meta = buildModulesMeta(styles.iconImg);

  return (
    <section className={styles.section} id="modulos-grid">
      {/* Ambient background scene: desktop & mobile variants provided as image */}
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.pill}>{t.pill}</span>
          <h2 className={styles.title}>
            {t.title1}
            <br />
            {t.title2} <em className={styles.titleEm}>{t.titleGold}</em>
          </h2>
          <p className={styles.sub}>
            {t.sub}{" "}
            <span className={styles.subAccent}>{t.subAccent}</span>
          </p>
        </div>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerLabel}>{t.divider}</span>
          <span className={styles.dividerLine} />
        </div>

        <div className={styles.grid}>
          {t.items.map((item, i) => {
            const m = meta[i];
            const style = {
              "--c": m.color,
              "--bg": `url('${m.bg}')`,
            } as CSSProperties;
            return (
              <Link
                key={item.title}
                href={m.href}
                className={styles.card}
                style={style}
                aria-label={item.title}
              >
                <div className={styles.cardBody}>
                  <span className={styles.iconWrap}>{m.icon}</span>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardDesc}>{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className={styles.foot}>
          <Link href="/la-app" className={styles.exploreCta}>
            {t.ctaExplore}
            <IconArrow />
          </Link>
          {/* Golden sparkles for perspective below the CTA */}
          <div className={styles.sparkles} aria-hidden="true">
            {[
              { l: "10%", t: "30%", d: "0s" },
              { l: "22%", t: "60%", d: "0.5s" },
              { l: "35%", t: "20%", d: "1s" },
              { l: "48%", t: "70%", d: "1.5s" },
              { l: "58%", t: "30%", d: "0.8s" },
              { l: "72%", t: "55%", d: "2s" },
              { l: "85%", t: "25%", d: "1.2s" },
              { l: "92%", t: "65%", d: "0.3s" },
            ].map((s, i) => (
              <span
                key={i}
                className={styles.sparkleDot}
                style={{ left: s.l, top: s.t, animationDelay: s.d }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

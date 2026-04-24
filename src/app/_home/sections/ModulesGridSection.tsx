"use client";

import Link from "next/link";
import { ReactNode, CSSProperties } from "react";
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

/* ============== MODULES DATA ============== */

type Module = {
  href: string;
  title: string;
  desc: string;
  color: string;
  bg: string;
  icon: ReactNode;
};

const MODULES: Module[] = [
  {
    href: "/app/matchcenter",
    title: "Match Center",
    desc: "104 partidos en vivo con stats, alineaciones y eventos minuto a minuto.",
    color: "#F5D07A",
    bg: "/img/modules-grid/match-center.webp",
    icon: <IconSoccer />,
  },
  {
    href: "/app/predicciones",
    title: "Predicciones",
    desc: "8 tipos: resultado exacto, goleador, tarjetas, corners, MVP y más.",
    color: "#EF4444",
    bg: "/img/modules-grid/predicciones.webp",
    icon: <IconTarget />,
  },
  {
    href: "/app/fantasy",
    title: "Fantasy",
    desc: "Arma tu 11 ideal con presupuesto limitado. Puntos reales, ranking global.",
    color: "#3B82F6",
    bg: "/img/modules-grid/fantasy.webp",
    icon: <IconTrophy />,
  },
  {
    href: "/app/ia-coach",
    title: "IA Coach",
    desc: "Analista personal con inteligencia artificial: tácticas y recomendaciones.",
    color: "#22C55E",
    bg: "/img/modules-grid/ia-coach.webp",
    icon: <IconBot />,
  },
  {
    href: "/app/streaming",
    title: "Zona Streaming",
    desc: "Directos con creadores durante los partidos. Reacciones en vivo.",
    color: "#F59E0B",
    bg: "/img/modules-grid/streaming.webp",
    icon: <IconVideo />,
  },
  {
    href: "/app/trivia",
    title: "Trivia Diaria",
    desc: "Preguntas diarias de fútbol — gana puntos extra y escala posiciones.",
    color: "#A855F7",
    bg: "/img/modules-grid/trivia-diaria.webp",
    icon: <IconShieldBolt />,
  },
  {
    href: "/app/modo-carrera",
    title: "Modo Carrera",
    desc: "Dirige una selección durante todo el torneo como DT virtual.",
    color: "#EC4899",
    bg: "/img/modules-grid/modo-carrera.webp",
    icon: <IconShirt />,
  },
  {
    href: "/app/ligas",
    title: "Ligas Privadas",
    desc: "Crea ligas con amigos, compañeros o tu comunidad favorita.",
    color: "#14B8A6",
    bg: "/img/modules-grid/ligas-privadas.webp",
    icon: <IconUsers />,
  },
  {
    href: "/app/rankings",
    title: "Rankings",
    desc: "Global, por país, por creador — demuestra quién sabe más de fútbol.",
    color: "#EAB308",
    bg: "/img/modules-grid/rankings.webp",
    icon: <IconBars />,
  },
  {
    href: "/app/chat",
    title: "Chat en Vivo",
    desc: "Chat en tiempo real con tu liga durante cada partido.",
    color: "#38BDF8",
    bg: "/img/modules-grid/chat-vivo.webp",
    icon: <IconChat />,
  },
  {
    href: "/app/micro",
    title: "Micro-predicciones",
    desc: "Predicciones en directo: próximo gol, corner, tarjeta, cambio.",
    color: "#F43F5E",
    bg: "/img/modules-grid/micro.webp",
    icon: <IconTimer />,
  },
  {
    href: "/app/stories",
    title: "Trivias Históricas",
    desc: "Revive y compite con las mejores preguntas de Mundiales pasados.",
    color: "#8B5CF6",
    bg: "/img/modules-grid/trivias-historicas.webp",
    icon: <IconStar />,
  },
];

/* ============== SECTION ============== */

export function ModulesGridSection() {
  return (
    <section className={styles.section} id="modulos-grid">
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.pill}>12 formas de ganar. Elige la tuya.</span>
          <h2 className={styles.title}>
            Todo lo que necesitas para<br />
            no <em className={styles.titleEm}>quedarte fuera</em>
          </h2>
          <p className={styles.sub}>
            Doce módulos diseñados para dominar cada minuto del Mundial 2026. Desde predicciones
            en tiempo real hasta tu propio fantasy, pasando por trivias históricas y un coach de
            inteligencia artificial.{" "}
            <span className={styles.subAccent}>
              Todo en un solo lugar. Todo gratis. Todo para ganar.
            </span>
          </p>
        </div>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerLabel}>Módulos</span>
          <span className={styles.dividerLine} />
        </div>

        <div className={styles.grid}>
          {MODULES.map((m) => {
            const style = {
              "--c": m.color,
              "--bg": `url('${m.bg}')`,
            } as CSSProperties;
            return (
              <Link
                key={m.title}
                href={m.href}
                className={styles.card}
                style={style}
                aria-label={m.title}
              >
                <div className={styles.cardBody}>
                  <span className={styles.iconWrap}>{m.icon}</span>
                  <h3 className={styles.cardTitle}>{m.title}</h3>
                  <p className={styles.cardDesc}>{m.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className={styles.foot}>
          <Link href="/la-app" className={styles.exploreCta}>
            Explorar todos los módulos
            <IconArrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

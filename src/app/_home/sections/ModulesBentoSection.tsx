"use client";

import { useCallback, useRef, MouseEvent } from "react";
import Link from "next/link";
import styles from "./ModulesBentoSection.module.css";

/* ---------- Icons ---------- */
function ArrowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ---------- 3D tilt hook (subtle, 2026 style) ---------- */
function useTilt(max = 5) {
  const ref = useRef<HTMLElement>(null);
  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1200px) rotateX(${-y * max}deg) rotateY(${
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

/* ---------- Shared card wrapper ---------- */
type CardWrapperProps = {
  className: string;
  tiltMax?: number;
  children: React.ReactNode;
  href?: string;
  ariaLabel?: string;
};
function TiltArticle({ className, tiltMax = 5, children }: CardWrapperProps) {
  const tilt = useTilt(tiltMax);
  return (
    <article
      ref={tilt.ref as unknown as React.RefObject<HTMLElement>}
      className={`${styles.card} ${className}`}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {children}
    </article>
  );
}

/* ---------- PREDICTIONS (hero card) ---------- */
function PredictionsCard() {
  return (
    <TiltArticle className={styles.cardPredictions} tiltMax={3}>
      <div className={styles.cardImageWrap}>
        <img
          className={styles.cardImage}
          src="/img/modules/stadium-night.webp"
          alt="Estadio iluminado del Mundial 2026"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className={styles.body}>
        <span className={styles.tag}>Copa del Mundo 2026 · EE.UU. · México · Canadá</span>
        <h3 className={styles.cardTitle}>
          El Mundial 2026
          <br />
          te necesita, <em className={styles.cardPredictionsTitleEm}>no dejes que otro lo viva por ti</em>
        </h3>
        <div className={styles.bottom}>
          <div>
            <span className={styles.label}>Predicciones</span>
            <p className={styles.tagline}>
              Predice cada resultado y compite con tu creador favorito
            </p>
          </div>
          <Link
            href="/app/predicciones"
            className={styles.cta}
            aria-label="Ir a Predicciones"
          >
            <ArrowIcon size={18} />
          </Link>
        </div>
      </div>
    </TiltArticle>
  );
}

/* ---------- FANTASY ---------- */
function FantasyCard() {
  return (
    <TiltArticle className={styles.cardFantasy}>
      <div className={styles.cardImageWrap}>
        <img
          className={styles.cardImage}
          src="/img/modules/fantasy-433.webp"
          alt="Alineación Fantasy 4-3-3"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className={styles.body}>
        <div className={styles.headRow}>
          <span className={styles.tag}>Fantasy</span>
          <span className={styles.formation}>4-3-3</span>
        </div>
        <div className={styles.bottom}>
          <p className={styles.tagline} style={{ maxWidth: "85%" }}>
            Arma tu equipo ideal y sube en el ranking
          </p>
          <Link href="/app/fantasy" className={styles.cta} aria-label="Ir a Fantasy">
            <ArrowIcon size={18} />
          </Link>
        </div>
      </div>
    </TiltArticle>
  );
}

/* ---------- TRIVIA ---------- */
function TriviaCard() {
  return (
    <TiltArticle className={styles.cardTrivia}>
      <div className={styles.cardImageWrap}>
        <img
          className={styles.cardImage}
          src="/img/modules/trophy-gold.webp"
          alt="Trofeo dorado del Mundial"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className={styles.body}>
        <span className={styles.tag}>Trivia</span>
        <h3 className={styles.cardTitle}>
          ¿Quién marcó el gol de la mano de Dios en el Mundial de 1986?
        </h3>
        <div className={styles.bottom}>
          <div>
            <p className={styles.cardText} style={{ color: "rgba(255,255,255,0.85)" }}>
              ¿Cuánto sabes de fútbol?
              <br />
              <strong style={{ color: "var(--zm-brand-gold, #D4A853)" }}>Demuéstralo</strong>
            </p>
          </div>
          <Link href="/app/trivia" className={styles.cta} aria-label="Ir a Trivia">
            <ArrowIcon size={18} />
          </Link>
        </div>
      </div>
    </TiltArticle>
  );
}

/* ---------- AI COACH ---------- */
function AICoachCard() {
  return (
    <TiltArticle className={styles.cardAi}>
      <div className={styles.cardImageWrap}>
        <img
          className={styles.cardImage}
          src="/img/modules/ai-orb.webp"
          alt="IA Coach holográfico"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className={styles.body}>
        <div className={styles.headRow}>
          <span className={styles.tag}>IA Coach</span>
          <span className={styles.aiBadge}>Ventaja anfitrión</span>
        </div>
        <h3 className={styles.cardTitle}>Tu asistente inteligente para cada partido</h3>
        <ul className={styles.aiFeatures}>
          <li>Análisis en tiempo real</li>
          <li>Recomendaciones personalizadas</li>
          <li>Estrategias ganadoras</li>
        </ul>
        <div className={styles.bottom} style={{ paddingTop: 6 }}>
          <span />
          <Link href="/app/ia-coach" className={styles.cta} aria-label="Ir a IA Coach">
            <ArrowIcon size={18} />
          </Link>
        </div>
      </div>
    </TiltArticle>
  );
}

/* ---------- STREAMING ---------- */
function StreamingCard() {
  return (
    <TiltArticle className={styles.cardStreaming}>
      <div className={styles.cardImageWrap}>
        <img
          className={styles.cardImage}
          src="/img/modules/streaming-live.webp"
          alt="Streaming en vivo con creadores"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className={styles.body}>
        <div className={styles.headRow}>
          <span className={`${styles.tag} ${styles.tagLive}`}>En vivo</span>
          <span className={styles.viewers}>
            <EyeIcon /> 2.4K
          </span>
        </div>
        <h3 className={styles.cardTitle}>Vive los partidos con tus creadores en directo</h3>
        <div className={styles.chat}>
          <div className={styles.chatMsg}>
            <b>MessiFan2023</b> ¡Vamos España! 🇪🇸
          </div>
          <div className={styles.chatMsg}>
            <b>FutbolTotal</b> Golazo 🔥🔥🔥
          </div>
          <div className={styles.chatMsg}>
            <b>ZonaMundial</b> Increíble partido!
          </div>
        </div>
        <div className={styles.bottom} style={{ paddingTop: 8 }}>
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--zm-font-mono, ui-monospace, SFMono-Regular, monospace)",
              letterSpacing: "0.1em",
            }}
          >
            CHAT · REACCIONES · PREMIOS
          </span>
          <Link href="/app/streaming" className={styles.cta} aria-label="Ir a Streaming">
            <ArrowIcon size={18} />
          </Link>
        </div>
      </div>
    </TiltArticle>
  );
}

/* ---------- SECTION EXPORT ---------- */
const BENTO_SPARKS = [
  { left: "8%", dur: "14s", delay: "0s" },
  { left: "22%", dur: "18s", delay: "3s" },
  { left: "38%", dur: "16s", delay: "6s" },
  { left: "55%", dur: "19s", delay: "2s" },
  { left: "72%", dur: "15s", delay: "9s" },
  { left: "88%", dur: "17s", delay: "5s" },
];

export function ModulesBentoSection() {
  return (
    <section className={styles.modules} id="modulos">
      <div className={styles.bentoSparks} aria-hidden="true">
        {BENTO_SPARKS.map((s, i) => (
          <span
            key={i}
            className={styles.bentoSpark}
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
        <div className={styles.head}>
          <span className={styles.pill}>
            Esto no es una app. Es un arma cargada de fútbol.
          </span>
          <h2 className={styles.title}>
            Todo lo que necesitas, <em className={styles.titleEm}>en un solo lugar</em>
          </h2>
          <p className={styles.sub}>
            Predicciones, fantasy, IA Coach, trivia y streaming — diseñado para el fanático que
            no se pierde nada.
          </p>
        </div>

        <div className={styles.bento}>
          <PredictionsCard />
          <FantasyCard />
          <TriviaCard />
          <AICoachCard />
          <StreamingCard />
        </div>

        <div className={styles.foot}>
          <Link href="/la-app" className={styles.explore}>
            Explorar todos los módulos
            <ArrowIcon size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

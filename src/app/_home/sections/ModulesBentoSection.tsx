"use client";

import { useCallback, useRef, MouseEvent } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSections } from "@/i18n/home-sections";
import styles from "./ModulesBentoSection.module.css";

type BentoT = ReturnType<typeof getBentoT>;
function getBentoT(locale: "es" | "en") {
  return homeSections[locale].modulesBento;
}

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

/* ---------- 3D tilt hook ---------- */
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

type CardWrapperProps = {
  className: string;
  tiltMax?: number;
  children: React.ReactNode;
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

/* ---------- PREDICTIONS ---------- */
function PredictionsCard({ t }: { t: BentoT }) {
  return (
    <TiltArticle className={styles.cardPredictions} tiltMax={3}>
      <div className={styles.cardImageWrap}>
        <img
          className={styles.cardImage}
          src="/img/modules/stadium-night.webp"
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className={styles.body}>
        <span className={styles.tag}>{t.tags.wc}</span>
        <h3 className={styles.cardTitle}>
          {t.predictions.title1}
          <br />
          {t.predictions.title2}{" "}
          <em className={styles.cardPredictionsTitleEm}>{t.predictions.title3}</em>
        </h3>
        <div className={styles.bottom}>
          <div>
            <span className={styles.label}>{t.predictions.label}</span>
            <p className={styles.tagline}>{t.predictions.tagline}</p>
          </div>
          <Link href="/app/predicciones" className={styles.cta} aria-label={t.predictions.label}>
            <ArrowIcon size={18} />
          </Link>
        </div>
      </div>
    </TiltArticle>
  );
}

/* ---------- FANTASY ---------- */
function FantasyCard({ t }: { t: BentoT }) {
  return (
    <TiltArticle className={styles.cardFantasy}>
      <div className={styles.cardImageWrap}>
        <img className={styles.cardImage} src="/img/modules/fantasy-433.webp" alt="" loading="lazy" decoding="async" />
      </div>
      <div className={styles.body}>
        <div className={styles.headRow}>
          <span className={styles.tag}>{t.tags.fantasy}</span>
          <span className={styles.formation}>{t.fantasy.formation}</span>
        </div>
        <div className={styles.bottom}>
          <p className={styles.tagline} style={{ maxWidth: "85%" }}>
            {t.fantasy.tagline}
          </p>
          <Link href="/app/fantasy" className={styles.cta} aria-label={t.tags.fantasy}>
            <ArrowIcon size={18} />
          </Link>
        </div>
      </div>
    </TiltArticle>
  );
}

/* ---------- TRIVIA ---------- */
function TriviaCard({ t }: { t: BentoT }) {
  return (
    <TiltArticle className={styles.cardTrivia}>
      <div className={styles.cardImageWrap}>
        <img className={styles.cardImage} src="/img/modules/trophy-gold.webp" alt="" loading="lazy" decoding="async" />
      </div>
      <div className={styles.body}>
        <span className={styles.tag}>{t.tags.trivia}</span>
        <h3 className={styles.cardTitle}>{t.trivia.title}</h3>
        <div className={styles.bottom}>
          <div>
            <p className={styles.cardText} style={{ color: "rgba(255,255,255,0.85)" }}>
              {t.trivia.text1}
              <br />
              <strong style={{ color: "var(--zm-brand-gold, #D4A853)" }}>{t.trivia.text2}</strong>
            </p>
          </div>
          <Link href="/app/trivia" className={styles.cta} aria-label={t.tags.trivia}>
            <ArrowIcon size={18} />
          </Link>
        </div>
      </div>
    </TiltArticle>
  );
}

/* ---------- AI COACH ---------- */
function AICoachCard({ t }: { t: BentoT }) {
  return (
    <TiltArticle className={styles.cardAi}>
      <div className={styles.cardImageWrap}>
        <img className={styles.cardImage} src="/img/modules/ai-orb.webp" alt="" loading="lazy" decoding="async" />
      </div>
      <div className={styles.body}>
        <div className={styles.headRow}>
          <span className={styles.tag}>{t.tags.ai}</span>
          <span className={styles.aiBadge}>{t.tags.aiBadge}</span>
        </div>
        <h3 className={styles.cardTitle}>{t.ai.title}</h3>
        <ul className={styles.aiFeatures}>
          {t.ai.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <div className={styles.bottom} style={{ paddingTop: 6 }}>
          <span />
          <Link href="/app/ia-coach" className={styles.cta} aria-label={t.tags.ai}>
            <ArrowIcon size={18} />
          </Link>
        </div>
      </div>
    </TiltArticle>
  );
}

/* ---------- STREAMING ---------- */
function StreamingCard({ t }: { t: BentoT }) {
  return (
    <TiltArticle className={styles.cardStreaming}>
      <div className={styles.cardImageWrap}>
        <img className={styles.cardImage} src="/img/modules/streaming-live.webp" alt="" loading="lazy" decoding="async" />
      </div>
      <div className={styles.body}>
        <div className={styles.headRow}>
          <span className={`${styles.tag} ${styles.tagLive}`}>{t.tags.liveTag}</span>
          <span className={styles.viewers}>
            <EyeIcon /> {t.streaming.viewers}
          </span>
        </div>
        <h3 className={styles.cardTitle}>{t.streaming.title}</h3>
        <div className={styles.chat}>
          {t.streaming.chat.map((c, i) => (
            <div key={i} className={styles.chatMsg}>
              <b>{c.user}</b> {c.msg}
            </div>
          ))}
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
            {t.streaming.footer}
          </span>
          <Link href="/app/streaming" className={styles.cta} aria-label={t.streaming.title}>
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
  const { locale } = useLanguage();
  const t = getBentoT(locale);

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
          <span className={styles.pill}>{t.pill}</span>
          <h2 className={styles.title}>
            {t.title1} <em className={styles.titleEm}>{t.titleGold}</em>
          </h2>
          <p className={styles.sub}>{t.sub}</p>
        </div>

        <div className={styles.bento}>
          <PredictionsCard t={t} />
          <FantasyCard t={t} />
          <TriviaCard t={t} />
          <AICoachCard t={t} />
          {/* PIVOTE LIGAS (jul-2026): StreamingCard quitada (feature del Mundial). */}
        </div>

        <div className={styles.foot}>
          <Link href="/la-app" className={styles.explore}>
            {t.ctaExplore}
            <ArrowIcon size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

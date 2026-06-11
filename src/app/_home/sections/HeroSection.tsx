"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CREADORES } from "@/data/creadores";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSections } from "@/i18n/home-sections";
import { MatchCenterBanner } from "./MatchCenterBanner";
import styles from "./HeroSection.module.css";

type Props = {
  heroRef: RefObject<HTMLDivElement | null>;
  titleRef: RefObject<HTMLHeadingElement | null>;
  h: any;
  cd: { d: number; h: number; m: number; s: number };
  IMGS: Record<string, string>;
};

type Variant = "juega" | "ia" | "fantasy";

/* ---------- Inline SVG icons (pixel-perfect with handoff) ---------- */
const ICON_PATHS: Record<string, string> = {
  soccer: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 6l4 3 4-3M6 10l2 5M16 15l2-5M9 19l3-4 3 4",
  trophy: "M7 4h10v4a5 5 0 0 1-10 0V4zM5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3M12 13v4M8 21h8M10 17h4",
  bot: "M12 3v3M6 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM9 13h.01M15 13h.01M9 17h6",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  target: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  zap: "M13 2L3 14h8l-1 8 10-12h-8l1-8z",
  arrow: "M5 12h14m-7-7 7 7-7 7",
  play: "M5 3l14 9-14 9V3z",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
  shield: "M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 1 1 10 0v4",
  flame:
    "M8.5 14.5A2.5 2.5 0 0 0 11 17c1.5 0 2.5-1 2.5-2.5 0-1.5-2-2.5-3.5-6 0 0-3 3-3 6.5A4 4 0 0 0 12 22a4 4 0 0 0 4-4c0-3-3-7-4-10-1 3-3.5 5.5-3.5 7z",
  check: "M20 6L9 17l-5-5",
};

function Icon({ name, size = 18 }: { name: keyof typeof ICON_PATHS; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name] || ICON_PATHS.soccer} />
    </svg>
  );
}

type HeroT = (typeof homeSections)["es"]["hero"] | (typeof homeSections)["en"]["hero"];

/* ---------- Variants for headlines (single variant renderer) ---------- */
function HeadlineVariant({ variant, t }: { variant: Variant; t: HeroT }) {
  if (variant === "ia") {
    return (
      <h1 className={styles.zmH1}>
        <span className={styles.zmH1Line}>{t.headlines.ia.l1}</span>
        <span className={`${styles.zmH1Line} ${styles.zmH1Gold}`}>{t.headlines.ia.l2}</span>
        <span
          className={styles.zmH1Line}
          style={{
            fontSize: "0.55em",
            color: "rgba(255,255,255,0.6)",
            fontWeight: 500,
            marginTop: 12,
          }}
        >
          {t.headlines.ia.l3a} <em className={styles.zmH1Em}>{t.headlines.ia.em}</em>{" "}
          {t.headlines.ia.l3b}
        </span>
      </h1>
    );
  }
  if (variant === "fantasy") {
    return (
      <h1 className={styles.zmH1}>
        <span className={styles.zmH1Line}>{t.headlines.fantasy.l1}</span>
        <span className={`${styles.zmH1Line} ${styles.zmH1Gold}`}>{t.headlines.fantasy.l2}</span>
        <span className={styles.zmH1Line}>{t.headlines.fantasy.l3}</span>
      </h1>
    );
  }
  return (
    <h1 className={styles.zmH1}>
      <span className={styles.zmH1Line}>{t.headlines.juega.l1}</span>
      <span className={styles.zmH1Line}>
        <span className={styles.zmH1Strike}>{t.headlines.juega.l2}</span>
      </span>
      <span className={`${styles.zmH1Line} ${styles.zmH1Gold}`}>{t.headlines.juega.l3}</span>
    </h1>
  );
}

/* All variants are rendered simultaneously in the same grid cell so the
   wrapper always sizes to the tallest. Only the active one is opaque. */
const ALL_VARIANTS: Variant[] = ["juega", "ia", "fantasy"];

function Headline({ variant, t }: { variant: Variant; t: HeroT }) {
  return (
    <>
      {ALL_VARIANTS.map((v) => {
        const active = v === variant;
        return (
          <div
            key={v}
            className={active ? styles.zmH1VariantActive : styles.zmH1VariantInactive}
            aria-hidden={active ? undefined : true}
          >
            <HeadlineVariant variant={v} t={t} />
          </div>
        );
      })}
    </>
  );
}

/* ---------- HERO LEFT ---------- */
function HeroLeft({
  cd,
  variant,
  showCountdown,
}: {
  cd: Props["cd"];
  variant: Variant;
  showCountdown: boolean;
}) {
  const { locale } = useLanguage();
  const t = homeSections[locale].hero;
  const countdownLabel = homeSections[locale].countdownLabel;
  const countdownLive = homeSections[locale].countdownLive;
  const dd = cd.d;
  const hh = String(cd.h).padStart(2, "0");
  const mm = String(cd.m).padStart(2, "0");
  // El torneo ya arrancó: el contador a "0d 00h 00m" parecía roto. En su
  // lugar mostramos el estado en vivo.
  const kickedOff = cd.d === 0 && cd.h === 0 && cd.m === 0 && cd.s === 0;

  // Real creators avatars (first 5, ordered per data file)
  const creatorAvatars = CREADORES.slice(0, 5).map((c) => ({
    nombre: c.nombre,
    imagen: c.imagen,
  }));

  return (
    <div className={styles.zmLeft}>
      {showCountdown && (
        <div className={styles.zmCountdown}>
          <span className={styles.zmLiveDot} />
          {countdownLabel}
          <span className={styles.zmTimer}>
            {kickedOff ? (
              <b>{countdownLive}</b>
            ) : (
              <>
                <b>{dd}</b>d <b>{hh}</b>h <b>{mm}</b>m
              </>
            )}
          </span>
        </div>
      )}

      <div className={styles.zmH1Wrap}>
        <Headline variant={variant} t={t} />
      </div>

      <p className={styles.zmSub}>
        {t.sub.before} <b>{t.sub.bold1}</b>
        {t.sub.middle} <span className={styles.zmChip}>{t.sub.chip}</span> {t.sub.afterChip}{" "}
        <b>{t.sub.bold2}</b> {t.sub.end}
      </p>

      <div className={styles.zmPillars}>
        <div className={styles.zmPillar}>
          <div className={styles.zmPillarIc}>
            <Icon name="zap" size={16} />
          </div>
          <div className={styles.zmPillarN}>
            104<small>×</small>
          </div>
          <div className={styles.zmPillarL}>
            {t.pillars.matches.label1}
            <br />
            {t.pillars.matches.label2}
          </div>
        </div>
        <div className={styles.zmPillar}>
          <div className={styles.zmPillarIc}>
            <Icon name="bot" size={16} />
          </div>
          <div className={styles.zmPillarN}>24/7</div>
          <div className={styles.zmPillarL}>
            {t.pillars.ai.label1}
            <br />
            {t.pillars.ai.label2}
          </div>
        </div>
        <div className={styles.zmPillar}>
          <div className={styles.zmPillarIc}>
            <Icon name="trophy" size={16} />
          </div>
          {/* Sin claims de premios en metálico: "€250k en premios" junto a
              compras de comodines encaja en la definición de gambling de
              Google/Ley 13-2011 y era causa probable de rechazo AdSense. */}
          <div className={styles.zmPillarN}>0 €</div>
          <div className={styles.zmPillarL}>
            {t.pillars.prizes.label1}
            <br />
            {t.pillars.prizes.label2}
          </div>
        </div>
      </div>

      <div className={styles.zmCtas}>
        <Link href="/registro" className={styles.zmCtaPrimary}>
          {t.ctaPrimary}
          <span className={styles.zmCtaPrimaryArrow}>
            <Icon name="arrow" size={14} />
          </span>
        </Link>
        <Link href="/la-app" className={styles.zmCtaGhost}>
          <span className={styles.zmCtaGhostPlay}>
            <Icon name="play" size={10} />
          </span>
          {t.ctaGhost}
        </Link>
      </div>

      <div className={styles.zmCtaNote}>
        <Icon name="lock" size={14} />
        {t.ctaNote.before} <b>{t.ctaNote.bold}</b> {t.ctaNote.after}
      </div>

      <div className={styles.zmProof}>
        <div className={styles.zmProofAvatars}>
          {creatorAvatars.map((a, ix) => (
            <div key={ix} className={styles.zmProofAvatar} title={a.nombre}>
              <img
                src={a.imagen}
                alt={`${t.proof.avatarAlt} ${a.nombre}`}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
        <div className={styles.zmProofText}>
          <b>{t.proof.boldCount}</b> {t.proof.afterBold}
          <br />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{t.proof.sub}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- HERO RIGHT (phone stage) ---------- */
/* La “jugada” en bucle: cada BEAT_MS le toca el turno a una chip (directo →
   predicción → ranking → coach), para que el stage se sienta un partido en
   marcha y no solo la primera card. Con prefers-reduced-motion no hay turnos. */
const PLAY_BEATS = 4;
const BEAT_MS = 4000;

function HeroRight() {
  const { locale } = useLanguage();
  const t = homeSections[locale].hero;
  const [beat, setBeat] = useState(0);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setMotionOk(false);
      return;
    }
    const id = setInterval(() => setBeat((b) => (b + 1) % PLAY_BEATS), BEAT_MS);
    return () => clearInterval(id);
  }, []);

  const turn = (i: number) => (motionOk && beat === i ? ` ${styles.zmChipTurn}` : "");
  const on = (i: number) => motionOk && beat === i;

  return (
    <div className={styles.zmRight}>
      <div className={styles.zmPhoneStage}>
        <div className={styles.zmSpotlight} />
        <div className={styles.zmPhoneGlow} />

        <div className={styles.zmPhone}>
          <picture>
            <source srcSet="/img/hero/app-phone.webp" type="image/webp" />
            <img
              src="/img/hero/app-phone.webp"
              alt={t.phoneAlt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>

        <div className={`${styles.zmChipCard} ${styles.zmChipLive}${turn(0)}`}>
          <div className={styles.zmChipIc}>
            <Icon name="flame" size={14} />
          </div>
          <div>
            <div className={styles.zmChipSub}>{t.chips.liveLabel}</div>
            <div className={styles.zmChipVal}>
              <span className={styles.zmPulseDotRed} />
              MEX 1 – 0 RSA
            </div>
          </div>
        </div>

        <div className={`${styles.zmChipCard} ${styles.zmChipScore}${turn(1)}`}>
          {/* Pick validado: aparece solo durante su turno */}
          <span
            className={`${styles.zmChipCheck}${on(1) ? ` ${styles.zmChipCheckOn}` : ""}`}
            aria-hidden="true"
          >
            <Icon name="check" size={11} />
          </span>
          <div className={styles.zmChipIc}>
            <Icon name="target" size={14} />
          </div>
          <div>
            <div className={styles.zmChipMain}>{t.chips.prediction}</div>
            <div className={styles.zmChipSub}>{t.chips.predictionSub}</div>
          </div>
        </div>

        <div className={`${styles.zmChipCard} ${styles.zmChipPoints}${turn(2)}`}>
          <div className={styles.zmChipIc}>
            <Icon name="trophy" size={14} />
          </div>
          <div>
            <div className={styles.zmChipSub}>{t.chips.ranking}</div>
            <div className={`${styles.zmChipVal}${on(2) ? ` ${styles.zmScoreBump}` : ""}`}>
              1.847{" "}
              <small
                className={on(2) ? styles.zmDeltaPop : undefined}
                style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}
              >
                ▲ 24
              </small>
            </div>
          </div>
        </div>

        <div className={`${styles.zmChipCard} ${styles.zmChipAi}${turn(3)}`}>
          <div className={styles.zmChipIc}>
            <Icon name="bot" size={14} />
          </div>
          <div>
            <div className={styles.zmChipMain}>
              {t.chips.coachSuggests}
              {/* El coach “escribe” durante su turno */}
              <span
                className={`${styles.zmTypingDots}${on(3) ? ` ${styles.zmTypingDotsOn}` : ""}`}
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className={styles.zmChipSub}>{t.chips.coachSwap}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Slider Dots (bottom center of hero) ---------- */
function SliderDots({
  variants,
  current,
  onSelect,
  paused,
  setPaused,
}: {
  variants: Variant[];
  current: Variant;
  onSelect: (v: Variant) => void;
  paused: boolean;
  setPaused: (b: boolean) => void;
}) {
  const { locale } = useLanguage();
  const t = homeSections[locale].hero.slider;
  return (
    <div className={styles.zmSliderDots} role="tablist" aria-label={t.a11yLabel}>
      {variants.map((v) => {
        const active = v === current;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={t.labels[v]}
            className={`${styles.zmSliderDot} ${active ? styles.zmSliderDotActive : ""}`}
            onClick={() => onSelect(v)}
          >
            <span className={styles.zmSliderDotFill} />
            <span className={styles.zmSliderDotLabel}>{t.labels[v]}</span>
          </button>
        );
      })}
      <button
        type="button"
        className={styles.zmSliderPauseBtn}
        onClick={() => setPaused(!paused)}
        aria-label={paused ? t.play : t.pause}
        aria-pressed={paused}
      >
        {paused ? (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        )}
      </button>
    </div>
  );
}

/* ---------- STATS BAR (bottom of hero) ---------- */
function StatsBar() {
  const { locale } = useLanguage();
  const t = homeSections[locale].hero.stats;
  const stats: Array<{ ic: keyof typeof ICON_PATHS; n: string; l: string }> = [
    // Cifra real y coherente con el bloque "8.642 aficionados ya están en la
    // lista". El "+2.5M usuarios activos" anterior era falso y contradecía
    // esa cifra en la misma pantalla (hallazgo de la auditoría AdSense).
    { ic: "users", n: "+8.6k", l: t.users },
    { ic: "shield", n: "16", l: t.venues },
    { ic: "globe", n: "48", l: t.teams },
    { ic: "target", n: "12", l: t.groups },
    { ic: "soccer", n: "100%", l: t.purity },
  ];
  return (
    <div className={styles.zmStats}>
      <div className={styles.zmStatsInner}>
        {stats.map((s, i) => (
          <div key={i} className={styles.zmStat}>
            <span className={styles.zmStatIc}>
              <Icon name={s.ic} size={16} />
            </span>
            <b>{s.n}</b>
            <span className={styles.zmStatL}>{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- MAIN EXPORT ---------- */
const VARIANTS: Variant[] = ["juega", "ia", "fantasy"];
const AUTO_ROTATE_MS = 5000;

export function HeroSection({ heroRef, titleRef, cd }: Props) {
  const { locale } = useLanguage();
  const tHero = homeSections[locale].hero;
  const [variant, setVariant] = useState<Variant>("juega");
  const [paused, setPaused] = useState(false);
  const [showCountdown] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-rotate every AUTO_ROTATE_MS. Pause on hover or when user toggles.
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setVariant((curr) => {
        const idx = VARIANTS.indexOf(curr);
        return VARIANTS[(idx + 1) % VARIANTS.length];
      });
    }, AUTO_ROTATE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  // Respect reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setPaused(true);
  }, []);

  return (
    <section
      ref={heroRef}
      className={styles.zmPage}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.zmStadiumPhoto}>
        <picture>
          <source srcSet="/img/hero/stadium.webp" type="image/webp" />
          <img
            src="/img/hero/stadium.webp"
            alt={tHero.stadiumAlt}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>
      <div className={styles.zmGrid} />
      <div className={styles.zmGrain} />

      <div className={styles.zmHero}>
        <div ref={titleRef as unknown as RefObject<HTMLDivElement>} style={{ display: "contents" }}>
          <HeroLeft cd={cd} variant={variant} showCountdown={showCountdown} />
          <HeroRight />
        </div>
      </div>

      <SliderDots
        variants={VARIANTS}
        current={variant}
        onSelect={(v) => {
          setVariant(v);
          setPaused(true);
        }}
        paused={paused}
        setPaused={setPaused}
      />

      <StatsBar />

      {/* Banner del Match Center: SIEMPRE muestra un partido (regla fija en
          /api/match-center/featured). Cierra el hero como tira en directo. */}
      <MatchCenterBanner />
    </section>
  );
}

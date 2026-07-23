"use client";

import { RefObject } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSections } from "@/i18n/home-sections";
import { MatchCenterBanner } from "./MatchCenterBanner";
import { LigaLiveBanner } from "./LigaLiveBanner";
import HeroBreakingTicker from "./HeroBreakingTicker";
import styles from "./HeroSection.module.css";

type Props = {
  heroRef: RefObject<HTMLDivElement | null>;
  titleRef: RefObject<HTMLHeadingElement | null>;
  h: any;
  cd: { d: number; h: number; m: number; s: number };
  IMGS: Record<string, string>;
  /** Modo Ligas (post-final del Mundial): el hero vende Zona de Ligas. */
  post?: boolean;
};

/* ---------- Inline SVG icons ---------- */
const ICON_PATHS: Record<string, string> = {
  soccer: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 6l4 3 4-3M6 10l2 5M16 15l2-5M9 19l3-4 3 4",
  trophy: "M7 4h10v4a5 5 0 0 1-10 0V4zM5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3M12 13v4M8 21h8M10 17h4",
  bot: "M12 3v3M6 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM9 13h.01M15 13h.01M9 17h6",
  target: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  zap: "M13 2L3 14h8l-1 8 10-12h-8l1-8z",
  arrow: "M5 12h14m-7-7 7 7-7 7",
  play: "M5 3l14 9-14 9V3z",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
  shield: "M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 1 1 10 0v4",
};

function Icon({ name, size = 18 }: { name: keyof typeof ICON_PATHS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[name] || ICON_PATHS.soccer} />
    </svg>
  );
}

/* Literales de `as const` ensanchados a string: el modo Ligas sobreescribe copy. */
type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };
type HeroT = DeepString<(typeof homeSections)["es"]["hero"]>;

function heroCopy(locale: keyof typeof homeSections, post: boolean): HeroT {
  const base: HeroT = homeSections[locale].hero;
  if (!post) return base;
  const lz = homeSections[locale].heroLigas;
  return {
    ...base,
    headlines: { ...base.headlines, juega: { ...base.headlines.juega, l1: lz.headlines.juegaL1 } },
    sub: lz.sub,
    ctaGhost: lz.ctaGhost,
  };
}

/* ---------- HERO LEFT (contenido editorial) ---------- */
function HeroLeft({
  cd,
  titleRef,
  post,
}: {
  cd: Props["cd"];
  titleRef: Props["titleRef"];
  post: boolean;
}) {
  const { locale } = useLanguage();
  const t = heroCopy(locale, post);
  const lz = homeSections[locale].heroLigas;
  const countdownLabel = homeSections[locale].countdownLabel;
  const countdownLive = homeSections[locale].countdownLive;
  const dd = cd.d;
  const hh = String(cd.h).padStart(2, "0");
  const mm = String(cd.m).padStart(2, "0");
  const kickedOff = cd.d === 0 && cd.h === 0 && cd.m === 0 && cd.s === 0;

  return (
    <div className={styles.zmLeft}>
      {/* Eyebrow: pill de temporada (Ligas) o countdown del torneo (Mundial). */}
      {post ? (
        <div className={styles.zmCountdown}>
          <span className={styles.zmLiveDot} />
          {lz.pill}
        </div>
      ) : (
        <div className={styles.zmCountdown}>
          <span className={styles.zmLiveDot} />
          {countdownLabel}
          <span className={styles.zmTimer}>
            {kickedOff ? <b>{countdownLive}</b> : (<><b>{dd}</b>d <b>{hh}</b>h <b>{mm}</b>m</>)}
          </span>
        </div>
      )}

      {/* Titular editorial único (antes: 3 variantes rotando). "no se mira" tachado
          en oro → "Se juega." es el corazón del posicionamiento. */}
      <h1 className={styles.zmH1} ref={titleRef}>
        <span className={styles.zmH1Line}>{t.headlines.juega.l1}</span>
        <span className={styles.zmH1Line}>
          <span className={styles.zmH1Strike}>{t.headlines.juega.l2}</span>
        </span>
        <span className={`${styles.zmH1Line} ${styles.zmH1Gold}`}>{t.headlines.juega.l3}</span>
      </h1>

      <p className={styles.zmSub}>
        {t.sub.before} <b>{t.sub.bold1}</b>
        {t.sub.middle} <span className={styles.zmChip}>{t.sub.chip}</span> {t.sub.afterChip}{" "}
        <b>{t.sub.bold2}</b> {t.sub.end}
      </p>

      <div className={styles.zmPillars}>
        <div className={styles.zmPillar}>
          <div className={styles.zmPillarIc}><Icon name="zap" size={16} /></div>
          <div className={styles.zmPillarN}>{post ? lz.pillarMatches.n : <>104<small>×</small></>}</div>
          <div className={styles.zmPillarL}>
            {post ? lz.pillarMatches.label1 : t.pillars.matches.label1}<br />
            {post ? lz.pillarMatches.label2 : t.pillars.matches.label2}
          </div>
        </div>
        <div className={styles.zmPillar}>
          <div className={styles.zmPillarIc}><Icon name="bot" size={16} /></div>
          <div className={styles.zmPillarN}>24/7</div>
          <div className={styles.zmPillarL}>{t.pillars.ai.label1}<br />{t.pillars.ai.label2}</div>
        </div>
        <div className={styles.zmPillar}>
          <div className={styles.zmPillarIc}><Icon name="trophy" size={16} /></div>
          <div className={styles.zmPillarN}>0 €</div>
          <div className={styles.zmPillarL}>{t.pillars.prizes.label1}<br />{t.pillars.prizes.label2}</div>
        </div>
      </div>

      <div className={styles.zmCtas}>
        <Link href="/registro" className={styles.zmCtaPrimary}>
          {t.ctaPrimary}
          <span className={styles.zmCtaPrimaryArrow}><Icon name="arrow" size={14} /></span>
        </Link>
        <Link href={post ? "/ligas" : "/la-app"} className={styles.zmCtaGhost}>
          <span className={styles.zmCtaGhostPlay}><Icon name="play" size={10} /></span>
          {t.ctaGhost}
        </Link>
      </div>

      <div className={styles.zmCtaNote}>
        <Icon name="lock" size={14} />
        {t.ctaNote.before} <b>{t.ctaNote.bold}</b> {t.ctaNote.after}
      </div>

      <div className={styles.zmProof}>
        <div className={styles.zmProofText}>
          <b>{t.proof.boldCount}</b> {t.proof.afterBold}<br />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{t.proof.sub}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- STATS BAR ---------- */
function StatsBar({ post }: { post: boolean }) {
  const { locale } = useLanguage();
  const t = homeSections[locale].hero.stats;
  const tl = homeSections[locale].heroLigas.stats;
  const stats: Array<{ ic: keyof typeof ICON_PATHS; n: string; l: string }> = post
    ? [
        { ic: "shield", n: "19", l: tl.ligas },
        { ic: "globe", n: "365", l: tl.dias },
        { ic: "target", n: "0", l: tl.apuestas },
        { ic: "soccer", n: "100%", l: tl.purity },
      ]
    : [
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
            <span className={styles.zmStatIc}><Icon name={s.ic} size={16} /></span>
            <b>{s.n}</b>
            <span className={styles.zmStatL}>{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- MAIN EXPORT ---------- */
export function HeroSection({ heroRef, titleRef, cd, post = false }: Props) {
  return (
    <section ref={heroRef} className={styles.zmPage}>
      <div className={styles.zmGlow} />
      <div className={styles.zmNet} />
      <div className={styles.zmGrain} />

      {/* Cinta "Última hora" del club/liga del usuario. Se auto-oculta si no hay
          sesión o nada personal (los invitados no la ven). */}
      <div style={{ position: "relative", zIndex: 2, marginBottom: 18 }}>
        <HeroBreakingTicker />
      </div>

      <div className={styles.zmHero}>
        <HeroLeft cd={cd} titleRef={titleRef} post={post} />

        {/* Objeto protagonista: el MARCADOR en vivo real (antes: el teléfono).
            Mundial → partido destacado; Ligas → partido del catálogo (o CTA). */}
        <div className={styles.zmBoard}>
          {post ? <LigaLiveBanner /> : <MatchCenterBanner />}
        </div>
      </div>

      <StatsBar post={post} />
    </section>
  );
}

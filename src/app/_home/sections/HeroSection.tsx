"use client";

import { RefObject, useState } from "react";
import Link from "next/link";
import { CREADORES } from "@/data/creadores";
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

/* ---------- Variants for headlines ---------- */
function Headline({ variant }: { variant: Variant }) {
  if (variant === "ia") {
    return (
      <h1 className={styles.zmH1}>
        <span className={styles.zmH1Line}>Predice. Compite.</span>
        <span className={`${styles.zmH1Line} ${styles.zmH1Gold}`}>Gana.</span>
        <span
          className={styles.zmH1Line}
          style={{
            fontSize: "0.55em",
            color: "rgba(255,255,255,0.6)",
            fontWeight: 500,
            marginTop: 12,
          }}
        >
          Con <em className={styles.zmH1Em}>IA Coach</em> de tu lado.
        </span>
      </h1>
    );
  }
  if (variant === "fantasy") {
    return (
      <h1 className={styles.zmH1}>
        <span className={styles.zmH1Line}>Arma tu</span>
        <span className={`${styles.zmH1Line} ${styles.zmH1Gold}`}>selección ideal</span>
        <span className={styles.zmH1Line}>y reta al mundo.</span>
      </h1>
    );
  }
  // juega (default)
  return (
    <h1 className={styles.zmH1}>
      <span className={styles.zmH1Line}>El Mundial</span>
      <span className={styles.zmH1Line}>
        <span className={styles.zmH1Strike}>no se mira.</span>
      </span>
      <span className={`${styles.zmH1Line} ${styles.zmH1Gold}`}>Se juega.</span>
    </h1>
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
  const dd = cd.d;
  const hh = String(cd.h).padStart(2, "0");
  const mm = String(cd.m).padStart(2, "0");

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
          Copa del Mundo · EE.UU · México · Canadá
          <span className={styles.zmTimer}>
            <b>{dd}</b>d <b>{hh}</b>h <b>{mm}</b>m
          </span>
        </div>
      )}

      <Headline variant={variant} />

      <p className={styles.zmSub}>
        Predice en tiempo real, compite en <b>ligas privadas</b>, crea tu fantasy y juega con{" "}
        <span className={styles.zmChip}>IA Coach</span> durante los <b>104 partidos</b> del Mundial
        2026.
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
            Partidos
            <br />
            en directo
          </div>
        </div>
        <div className={styles.zmPillar}>
          <div className={styles.zmPillarIc}>
            <Icon name="bot" size={16} />
          </div>
          <div className={styles.zmPillarN}>24/7</div>
          <div className={styles.zmPillarL}>
            IA Coach
            <br />
            personal
          </div>
        </div>
        <div className={styles.zmPillar}>
          <div className={styles.zmPillarIc}>
            <Icon name="trophy" size={16} />
          </div>
          <div className={styles.zmPillarN}>€250k</div>
          <div className={styles.zmPillarL}>
            En premios
            <br />y exclusivos
          </div>
        </div>
      </div>

      <div className={styles.zmCtas}>
        <Link href="/registro" className={styles.zmCtaPrimary}>
          Pre-regístrate gratis
          <span className={styles.zmCtaPrimaryArrow}>
            <Icon name="arrow" size={14} />
          </span>
        </Link>
        <Link href="/la-app" className={styles.zmCtaGhost}>
          <span className={styles.zmCtaGhostPlay}>
            <Icon name="play" size={10} />
          </span>
          Ver cómo funciona
        </Link>
      </div>

      <div className={styles.zmCtaNote}>
        <Icon name="lock" size={14} />
        Sin tarjeta · <b>Acceso anticipado</b> al Founders Pass
      </div>

      <div className={styles.zmProof}>
        <div className={styles.zmProofAvatars}>
          {creatorAvatars.map((a, ix) => (
            <div key={ix} className={styles.zmProofAvatar} title={a.nombre}>
              <img
                src={a.imagen}
                alt={`Creator ${a.nombre}`}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
        <div className={styles.zmProofText}>
          <b>12.400+ aficionados</b> ya están en la lista
          <br />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            Se añaden ~180 cada día
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- HERO RIGHT (phone stage) ---------- */
function HeroRight() {
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
              alt="Pantalla de la app ZonaMundial"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>

        <div className={`${styles.zmChipCard} ${styles.zmChipLive}`}>
          <div className={styles.zmChipIc}>
            <Icon name="flame" size={14} />
          </div>
          <div>
            <div className={styles.zmChipSub}>En vivo ahora</div>
            <div className={styles.zmChipVal}>
              <span className={styles.zmPulseDotRed} />
              MEX 1 – 0 RSA
            </div>
          </div>
        </div>

        <div className={`${styles.zmChipCard} ${styles.zmChipScore}`}>
          <div className={styles.zmChipIc}>
            <Icon name="target" size={14} />
          </div>
          <div>
            <div className={styles.zmChipMain}>Tu predicción</div>
            <div className={styles.zmChipSub}>+47 puntos · gol min. 23</div>
          </div>
        </div>

        <div className={`${styles.zmChipCard} ${styles.zmChipPoints}`}>
          <div className={styles.zmChipIc}>
            <Icon name="trophy" size={14} />
          </div>
          <div>
            <div className={styles.zmChipSub}>Ranking liga</div>
            <div className={styles.zmChipVal}>
              1.847{" "}
              <small style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>▲ 24</small>
            </div>
          </div>
        </div>

        <div className={`${styles.zmChipCard} ${styles.zmChipAi}`}>
          <div className={styles.zmChipIc}>
            <Icon name="bot" size={14} />
          </div>
          <div>
            <div className={styles.zmChipMain}>IA Coach sugiere</div>
            <div className={styles.zmChipSub}>Cambia a Mbappé (+12%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Tweaks panel (floating, togglable) ---------- */
function TweaksPanel({
  variant,
  setVariant,
  showCountdown,
  setShowCountdown,
}: {
  variant: Variant;
  setVariant: (v: Variant) => void;
  showCountdown: boolean;
  setShowCountdown: (b: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button
        type="button"
        className={styles.zmTweaksToggleBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar tweaks" : "Abrir tweaks"}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      <div className={`${styles.zmTweaks} ${open ? styles.zmTweaksOpen : ""}`}>
        <h4>Tweaks</h4>
        <div className={styles.zmTweakRow}>
          <label>Titular</label>
          <div className={styles.zmTweakOpts}>
            <button
              type="button"
              className={variant === "juega" ? styles.zmTweakOn : ""}
              onClick={() => setVariant("juega")}
            >
              Juega
            </button>
            <button
              type="button"
              className={variant === "ia" ? styles.zmTweakOn : ""}
              onClick={() => setVariant("ia")}
            >
              IA
            </button>
            <button
              type="button"
              className={variant === "fantasy" ? styles.zmTweakOn : ""}
              onClick={() => setVariant("fantasy")}
            >
              Fantasy
            </button>
          </div>
        </div>
        <div className={styles.zmTweakRow}>
          <label className={styles.zmTweakToggle}>
            <span>Countdown al Mundial</span>
            <input
              type="checkbox"
              checked={showCountdown}
              onChange={(e) => setShowCountdown(e.target.checked)}
            />
          </label>
        </div>
      </div>
    </>
  );
}

/* ---------- STATS BAR (bottom of hero) ---------- */
function StatsBar() {
  const stats: Array<{ ic: keyof typeof ICON_PATHS; n: string; l: string }> = [
    { ic: "users", n: "+2.5M", l: "Usuarios activos" },
    { ic: "shield", n: "16", l: "Sedes oficiales" },
    { ic: "globe", n: "48", l: "Selecciones" },
    { ic: "target", n: "12", l: "Grupos" },
    { ic: "soccer", n: "100%", l: "Fútbol puro" },
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
export function HeroSection({ heroRef, titleRef, cd }: Props) {
  const [variant, setVariant] = useState<Variant>("juega");
  const [showCountdown, setShowCountdown] = useState(true);

  return (
    <section ref={heroRef} className={styles.zmPage}>
      <div className={styles.zmStadiumPhoto}>
        <picture>
          <source srcSet="/img/hero/stadium.webp" type="image/webp" />
          <img
            src="/img/hero/stadium.webp"
            alt=""
            role="presentation"
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

      <StatsBar />

      <TweaksPanel
        variant={variant}
        setVariant={setVariant}
        showCountdown={showCountdown}
        setShowCountdown={setShowCountdown}
      />
    </section>
  );
}

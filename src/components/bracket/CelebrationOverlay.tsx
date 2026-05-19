// src/components/bracket/CelebrationOverlay.tsx
//
// Victory Screen — escena final del Mundial 2026.
//
// FILOSOFÍA DE DIRECCIÓN DE ARTE:
//   85% oscuro / 15% color emocional.
//   El color del team ACENTÚA, NO domina.
//   La atmósfera (humo, luces ambientales, depth) ES el contenido.
//   El texto está al servicio de la escena, no al revés.
//
// REFERENCIAS:
//   UEFA Champions League intros · FIFA World Cup graphics
//   Apple TV Sports · EA Sports FC reveal trailers.
//   NO gaming UI, NO esports, NO dribbble.

"use client";

import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TEAM_BY_ID } from "@/lib/bracket/teams";
import { buildTeamTheme } from "@/lib/bracket/team-theme";
import type { BracketState } from "@/lib/bracket/types";

interface Props {
  state: BracketState;
  show: boolean;
  onEdit: () => void;
  onShare: () => void;
}

const STADIUM_BG_DESKTOP = "/img/bracket-celebration/stadium-celebration.webp";
const STADIUM_BG_MOBILE =
  "/img/bracket-celebration/stadium-celebration-mobile.webp";
const SUBTITLES = [
  "Predijiste la historia.",
  "104 partidos. Un solo campeón.",
  "Tu Mundial quedó sellado.",
];

export default function CelebrationOverlay({
  state,
  show,
  onEdit,
  onShare,
}: Props) {
  const team = state.champion ? TEAM_BY_ID[state.champion] : null;

  const theme = useMemo(
    () => (team ? buildTeamTheme(team) : null),
    [team],
  );

  const totalGoals = useMemo(
    () =>
      Object.values(state.picks).reduce(
        (s, p) => s + p.scoreA + p.scoreB,
        0,
      ),
    [state.picks],
  );

  const subtitle = useMemo(
    () => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)],
    [],
  );

  if (!team || !theme) return null;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          aria-modal="true"
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            overflow: "auto",
            display: "grid",
            gridTemplateColumns: "1fr",
            background: "#04060c",
          }}
        >
          <SceneLayers theme={theme} />

          {/* Composición asimétrica: contenido un poco a la izquierda en desktop,
              respira con generoso espacio. */}
          <div
            style={{
              position: "relative",
              zIndex: 30,
              width: "100%",
              minHeight: "100vh",
              padding: "clamp(20px, 4vw, 64px) clamp(20px, 5vw, 80px)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.18 } },
              }}
              style={{
                width: "100%",
                maxWidth: 640,
                marginLeft: "max(0px, calc((100vw - 1280px) / 2))",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                textAlign: "left",
                gap: "clamp(22px, 3vw, 30px)",
              }}
              className="zm-celeb-content"
            >
              {/* Eyebrow */}
              <FadeUp>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 14,
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                    fontSize: 10,
                    letterSpacing: "0.42em",
                    color: "rgba(255,255,255,0.65)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  <Bar />
                  <span>Mundial 2026 · Final · Bracket Sellado</span>
                </div>
              </FadeUp>

              {/* Title */}
              <FadeUp delay={0.08}>
                <h2
                  style={{
                    margin: 0,
                    fontFamily:
                      "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
                    fontSize: "clamp(44px, 8.5vw, 96px)",
                    fontWeight: 900,
                    letterSpacing: "-0.035em",
                    lineHeight: 0.92,
                    color: "#fff",
                    textTransform: "uppercase",
                    textShadow:
                      "0 4px 60px rgba(0,0,0,0.8), 0 0 120px rgba(0,0,0,0.5)",
                  }}
                >
                  Tu Mundial
                  <br />
                  <span
                    style={{
                      fontWeight: 200,
                      fontStyle: "italic",
                      letterSpacing: "-0.04em",
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    está
                  </span>{" "}
                  <span
                    style={{
                      background: `linear-gradient(165deg, #fff 0%, #fff 55%, ${theme.secondary} 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    completo.
                  </span>
                </h2>
              </FadeUp>

              {/* Subtitle */}
              <FadeUp delay={0.18}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(14px, 1.5vw, 17px)",
                    color: "rgba(255,255,255,0.55)",
                    fontWeight: 400,
                    letterSpacing: "0.01em",
                    lineHeight: 1.5,
                    maxWidth: 460,
                  }}
                >
                  {subtitle}
                </p>
              </FadeUp>

              {/* Champion strip — editorial, no card */}
              <FadeUp delay={0.28}>
                <ChampionStrip team={team} theme={theme} />
              </FadeUp>

              {/* Stats — typography editorial, sin card */}
              <FadeUp delay={0.36}>
                <Stats totalGoals={totalGoals} theme={theme} />
              </FadeUp>

              {/* CTAs */}
              <FadeUp delay={0.46}>
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    flexWrap: "wrap",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <PrimaryButton onClick={onShare} theme={theme}>
                    Compartir mi Mundial
                  </PrimaryButton>
                  <SecondaryButton onClick={onEdit}>
                    Revisar bracket
                  </SecondaryButton>
                </div>
              </FadeUp>
            </motion.div>

            {/* Trophy hero — posicionada a la derecha, asimétrica.
                En mobile: oculta (la escena del fondo es protagonista). */}
            <TrophyHero theme={theme} />
          </div>

          {/* CSS responsive helper */}
          <style>{`
            @media (max-width: 900px) {
              .zm-celeb-content { text-align: left; max-width: 100%; }
              .zm-celeb-trophy { display: none !important; }
            }
          `}</style>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE — 13 capas atmosféricas. Mayoría oscuras.
   ═══════════════════════════════════════════════════════════════════ */

function SceneLayers({
  theme,
}: {
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <>
      {/* z=1 STADIUM — más oscuro, más contraste, con ligero zoom */}
      <picture>
        <source
          media="(max-width: 720px) and (orientation: portrait)"
          srcSet={STADIUM_BG_MOBILE}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={STADIUM_BG_DESKTOP}
          alt=""
          decoding="async"
          loading="eager"
          fetchPriority="high"
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 35%",
            filter: "saturate(0.55) brightness(0.32) contrast(1.15)",
            zIndex: 1,
            transform: "scale(1.08)",
          }}
        />
      </picture>

      {/* z=2 atmospheric blue-black wash — domina la escena (85% dark) */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          background: `
            radial-gradient(ellipse 90% 70% at 50% 0%, rgba(8,16,32,0.55) 0%, transparent 60%),
            radial-gradient(ellipse 100% 60% at 50% 100%, rgba(0,0,0,0.92) 0%, transparent 65%),
            linear-gradient(180deg, rgba(4,6,12,0.6) 0%, rgba(4,6,12,0.35) 40%, rgba(4,6,12,0.7) 80%, rgba(0,0,0,1) 100%)
          `,
        }}
      />

      {/* z=3 stadium volumetric fog — niebla densa en la base, simula crowd haze */}
      <CrowdFog />

      {/* z=4 light beams — focos volumétricos descendentes desde el roof */}
      <LightBeams />

      {/* z=5 atmospheric depth fog (medio) — añade profundidad sin color del team */}
      <AtmosphericFog />

      {/* z=6 team color ACENTO — un solo glow muy localizado y sutil arriba-derecha */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        style={{
          position: "fixed",
          top: "12%",
          right: "8%",
          width: "min(700px, 65vw)",
          height: "min(700px, 65vw)",
          zIndex: 6,
          background: `radial-gradient(circle, ${theme.glowSoft} 0%, transparent 55%)`,
          filter: "blur(40px)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* z=7 depth particles back — distantes, lentas */}
      <DepthParticles count={22} layer="back" />

      {/* z=8 confetti — MÁS sutil, menos cantidad, blanco/dorado + acento team */}
      <ConfettiLayer
        colors={[
          "rgba(255,255,255,0.85)",
          "#FFE9A8",
          theme.primary,
        ]}
      />

      {/* z=9 depth particles front — bokeh blur, sensación de cámara */}
      <DepthParticles count={11} layer="front" />

      {/* z=10 flash bursts — fotógrafos del estadio (sutil, rare) */}
      <FlashBursts />

      {/* z=11 noise/film grain */}
      <NoiseTexture />

      {/* z=12 cinematic letterbox vignette */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 12,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 110% 100% at 50% 50%, transparent 45%, rgba(0,0,0,0.5) 88%, rgba(0,0,0,0.95) 100%),
            linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.45) 100%)
          `,
        }}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CROWD FOG — niebla densa de público, base del frame
   ═══════════════════════════════════════════════════════════════════ */

function CrowdFog() {
  const wisps = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: 5 + i * 18 + Math.random() * 8,
        size: 380 + Math.random() * 200,
        delay: Math.random() * 5,
        duration: 18 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 80,
      })),
    [],
  );
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        bottom: "-15%",
        left: 0,
        right: 0,
        height: "70%",
        zIndex: 3,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {wisps.map((w) => (
        <motion.div
          key={w.id}
          animate={{
            x: [0, w.drift, 0],
            y: [0, -20, 0],
            opacity: [0, 0.22, 0],
          }}
          transition={{
            duration: w.duration,
            delay: w.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: `${w.x}%`,
            bottom: "10%",
            width: w.size,
            height: w.size * 0.7,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(140,160,200,0.18) 0%, transparent 65%)",
            filter: "blur(50px)",
            mixBlendMode: "screen",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LIGHT BEAMS — focos del estadio (BLANCOS, no del color del team)
   ═══════════════════════════════════════════════════════════════════ */

function LightBeams() {
  const beams = useMemo(
    () => [
      { x: 18, width: 320, angle: -18, delay: 0, duration: 9, intensity: 0.18 },
      { x: 42, width: 380, angle: -6, delay: 1.4, duration: 11, intensity: 0.22 },
      { x: 68, width: 360, angle: 8, delay: 0.6, duration: 10, intensity: 0.2 },
      { x: 88, width: 300, angle: 22, delay: 2, duration: 9.5, intensity: 0.16 },
    ],
    [],
  );
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 4,
        pointerEvents: "none",
        overflow: "hidden",
        mixBlendMode: "screen",
      }}
    >
      {beams.map((b, i) => (
        <motion.div
          key={i}
          animate={{
            opacity: [0, b.intensity, b.intensity * 0.5, b.intensity],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            top: "-20%",
            left: `${b.x}%`,
            width: b.width,
            height: "140%",
            transformOrigin: "top center",
            transform: `translateX(-50%) rotate(${b.angle}deg)`,
            background:
              "linear-gradient(180deg, rgba(255,240,210,0.65) 0%, rgba(255,235,200,0.2) 30%, transparent 75%)",
            filter: "blur(36px)",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ATMOSPHERIC FOG — niebla mid-depth
   ═══════════════════════════════════════════════════════════════════ */

function AtmosphericFog() {
  const blobs = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        id: i,
        x: 15 + Math.random() * 70,
        y: 25 + Math.random() * 50,
        size: 400 + Math.random() * 200,
        delay: Math.random() * 6,
        duration: 22 + Math.random() * 10,
        drift: (Math.random() - 0.5) * 60,
      })),
    [],
  );
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {blobs.map((b) => (
        <motion.div
          key={b.id}
          animate={{
            x: [0, b.drift, 0],
            y: [0, -40, 0],
            opacity: [0, 0.08, 0],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: `${b.x}vw`,
            top: `${b.y}vh`,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(180,200,240,0.4) 0%, transparent 60%)",
            filter: "blur(70px)",
            mixBlendMode: "screen",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DEPTH PARTICLES — z-depth real
   ═══════════════════════════════════════════════════════════════════ */

function DepthParticles({
  count,
  layer,
}: {
  count: number;
  layer: "back" | "front";
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: layer === "back" ? 1.8 + Math.random() * 3 : 5 + Math.random() * 10,
        delay: Math.random() * 8,
        duration:
          layer === "back" ? 14 + Math.random() * 10 : 9 + Math.random() * 7,
        drift: (Math.random() - 0.5) * 30,
      })),
    [count, layer],
  );

  const blur = layer === "back" ? 0.5 : 5;
  const opacityMax = layer === "back" ? 0.6 : 0.4;
  const zIndex = layer === "back" ? 7 : 9;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: `${p.y}vh`, x: `${p.x}vw`, opacity: 0 }}
          animate={{
            y: [`${p.y}vh`, `${p.y - 30}vh`, `${p.y - 60}vh`],
            x: [`${p.x}vw`, `${p.x + p.drift / 4}vw`, `${p.x + p.drift / 2}vw`],
            opacity: [0, opacityMax, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background:
              layer === "back"
                ? "rgba(255,240,210,0.9)"
                : "radial-gradient(circle, rgba(255,240,210,0.5) 0%, transparent 70%)",
            filter: `blur(${blur}px)`,
            boxShadow:
              layer === "back"
                ? `0 0 ${p.size * 4}px rgba(255,235,200,0.45)`
                : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FLASH BURSTS — fotógrafos del estadio (sutiles, raros)
   ═══════════════════════════════════════════════════════════════════ */

function FlashBursts() {
  const flashes = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: 5 + Math.random() * 90,
        y: 35 + Math.random() * 30,
        delay: i * 3.5 + Math.random() * 5,
      })),
    [],
  );
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8,
        pointerEvents: "none",
        overflow: "hidden",
        mixBlendMode: "screen",
      }}
    >
      {flashes.map((f) => (
        <motion.div
          key={f.id}
          animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{
            duration: 0.4,
            delay: f.delay,
            repeat: Infinity,
            repeatDelay: 16 + Math.random() * 12,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            left: `${f.x}vw`,
            top: `${f.y}vh`,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, #fff 0%, rgba(255,255,255,0.6) 30%, transparent 70%)",
            filter: "blur(2px)",
            boxShadow: "0 0 28px rgba(255,255,255,0.8)",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONFETTI — más sutil, mayoría blanco/dorado, acento del team
   ═══════════════════════════════════════════════════════════════════ */

interface Piece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotate: number;
  size: number;
  color: string;
  shape: "rect" | "circle";
  drift: number;
}

function ConfettiLayer({ colors }: { colors: readonly string[] }) {
  const pieces = useMemo<Piece[]>(() => {
    const arr: Piece[] = [];
    // 28 piezas — menos cantidad, mejor sensación cinematográfica
    for (let i = 0; i < 28; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 7 + Math.random() * 6,
        rotate: Math.random() * 360,
        size: 4 + Math.random() * 7,
        color: colors[i % colors.length],
        shape: (["rect", "circle"] as const)[i % 2],
        drift: (Math.random() - 0.5) * 30,
      });
    }
    return arr;
  }, [colors]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "-15vh", x: `${p.x}vw`, rotate: p.rotate, opacity: 0 }}
          animate={{
            y: "115vh",
            x: `${p.x + p.drift}vw`,
            rotate: p.rotate + 540,
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
            opacity: {
              duration: p.duration,
              times: [0, 0.08, 0.85, 1],
              repeat: Infinity,
            },
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.shape === "rect" ? p.size * 0.4 : p.size,
            background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : 1,
            boxShadow: `0 0 8px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NOISE / FILM GRAIN
   ═══════════════════════════════════════════════════════════════════ */

function NoiseTexture() {
  const noiseDataUri = useMemo(() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.4 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>`;
    return `data:image/svg+xml;utf8,${svg}`;
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 11,
        pointerEvents: "none",
        backgroundImage: `url("${noiseDataUri}")`,
        backgroundSize: "180px 180px",
        opacity: 0.22,
        mixBlendMode: "overlay",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STAGGER REVEAL HELPER
   ═══════════════════════════════════════════════════════════════════ */

function FadeUp({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 36, filter: "blur(14px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: 1.0,
            ease: [0.16, 1, 0.3, 1],
            delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

function Bar() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 42,
        height: 1,
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TROPHY HERO — copa metálica cinematográfica
   Posicionada a la derecha (composición asimétrica)
   ═══════════════════════════════════════════════════════════════════ */

function TrophyHero({
  theme,
}: {
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <motion.div
      className="zm-celeb-trophy"
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      style={{
        position: "absolute",
        right: "min(8vw, 110px)",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 25,
        pointerEvents: "none",
        width: "min(440px, 38vw)",
        height: "min(440px, 38vw)",
      }}
    >
      {/* Ambient bloom enorme detrás (cálido neutro, no del team) */}
      <motion.div
        animate={{ opacity: [0.55, 0.85, 0.55], scale: [0.95, 1.1, 0.95] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        aria-hidden
        style={{
          position: "absolute",
          inset: "-30%",
          background:
            "radial-gradient(circle at center, rgba(255,225,170,0.4) 0%, rgba(255,200,140,0.18) 35%, transparent 65%)",
          filter: "blur(40px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Subtle team accent ring (15% color) */}
      <motion.div
        animate={{ opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, delay: 1 }}
        aria-hidden
        style={{
          position: "absolute",
          inset: "5%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.glowSoft} 0%, transparent 55%)`,
          filter: "blur(35px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Floating motion */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CinematicTrophy />
      </motion.div>
    </motion.div>
  );
}

/* Copa metálica con múltiples capas — silueta FIFA-esque */
function CinematicTrophy() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 200 280"
      fill="none"
      style={{
        filter:
          "drop-shadow(0 30px 60px rgba(0,0,0,0.75)) drop-shadow(0 0 40px rgba(255,210,140,0.35))",
      }}
      aria-hidden
    >
      <defs>
        {/* Gold body gradient — múltiples stops para parecer metálico */}
        <linearGradient id="cup-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff4d3" />
          <stop offset="12%" stopColor="#FFE9A8" />
          <stop offset="28%" stopColor="#D4A84C" />
          <stop offset="48%" stopColor="#8a6420" />
          <stop offset="62%" stopColor="#C9923E" />
          <stop offset="78%" stopColor="#FFD479" />
          <stop offset="100%" stopColor="#8a6420" />
        </linearGradient>

        {/* Edge rim highlight */}
        <linearGradient id="cup-rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#704818" />
          <stop offset="35%" stopColor="#fff4d3" />
          <stop offset="55%" stopColor="#fff" />
          <stop offset="75%" stopColor="#FFD479" />
          <stop offset="100%" stopColor="#5a3812" />
        </linearGradient>

        {/* Specular reflection — left side bright */}
        <linearGradient id="cup-spec" x1="0.2" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>

        {/* Inner shadow gradient — adds depth */}
        <linearGradient id="cup-shadow" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.3" />
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>

        {/* Base gold — más oscuro */}
        <linearGradient id="cup-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD479" />
          <stop offset="40%" stopColor="#a07520" />
          <stop offset="100%" stopColor="#3d2810" />
        </linearGradient>
      </defs>

      {/* Cup top globe — silueta FIFA-style ondulada */}
      <path
        d="M 60 60
           C 60 75, 65 88, 78 96
           L 78 130
           C 78 142, 86 150, 100 150
           C 114 150, 122 142, 122 130
           L 122 96
           C 135 88, 140 75, 140 60
           C 140 48, 135 40, 122 38
           L 78 38
           C 65 40, 60 48, 60 60 Z"
        fill="url(#cup-body)"
        stroke="#3d2810"
        strokeWidth="0.8"
      />

      {/* Globe specular highlight (left side) */}
      <path
        d="M 64 56
           C 64 72, 70 84, 80 92
           L 80 95
           C 73 86, 68 74, 68 60
           C 68 53, 70 47, 76 44
           Z"
        fill="url(#cup-spec)"
      />

      {/* Inner shadow contour */}
      <path
        d="M 78 96 L 78 130 C 78 142, 86 150, 100 150 C 114 150, 122 142, 122 130 L 122 96 Z"
        fill="url(#cup-shadow)"
        opacity="0.5"
      />

      {/* Rim band at the top */}
      <ellipse cx="100" cy="38" rx="22" ry="3.5" fill="url(#cup-rim)" />

      {/* Decorative band mid-cup */}
      <path
        d="M 78 110 Q 100 116, 122 110 L 122 116 Q 100 122, 78 116 Z"
        fill="#5a3812"
        opacity="0.55"
      />

      {/* Stem */}
      <path
        d="M 92 150
           L 92 178
           Q 92 184, 100 184
           Q 108 184, 108 178
           L 108 150 Z"
        fill="url(#cup-body)"
      />
      <rect x="93" y="152" width="3" height="30" fill="url(#cup-spec)" opacity="0.55" />

      {/* Base — multiple tiers like real FIFA trophy */}
      {/* Upper plate */}
      <path
        d="M 75 184 L 125 184 L 130 196 L 70 196 Z"
        fill="url(#cup-base)"
      />
      {/* Plate top highlight */}
      <path d="M 78 184 L 122 184 L 122 187 L 78 187 Z" fill="#FFE9A8" opacity="0.6" />

      {/* Middle ring */}
      <rect x="65" y="196" width="70" height="6" fill="#2a1a08" />
      <rect x="65" y="196" width="70" height="1.5" fill="#FFD479" opacity="0.7" />

      {/* Lower plate (wider) */}
      <path
        d="M 58 202 L 142 202 L 148 218 L 52 218 Z"
        fill="url(#cup-base)"
      />
      {/* Bottom plate highlight */}
      <path
        d="M 60 202 L 140 202 L 140 206 L 60 206 Z"
        fill="#FFE9A8"
        opacity="0.55"
      />

      {/* Engraving line decorative */}
      <line
        x1="68"
        y1="210"
        x2="132"
        y2="210"
        stroke="#2a1a08"
        strokeWidth="0.8"
        opacity="0.7"
      />

      {/* Base shadow */}
      <ellipse cx="100" cy="222" rx="55" ry="4" fill="#000" opacity="0.55" />

      {/* Final tiny specular flashes — adds CGI feel */}
      <circle cx="83" cy="48" r="2.5" fill="#fff" opacity="0.7" />
      <circle cx="78" cy="56" r="1.2" fill="#fff" opacity="0.4" />
      <circle cx="100" cy="187" r="1.5" fill="#fff" opacity="0.6" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CHAMPION STRIP — editorial, sin card
   ═══════════════════════════════════════════════════════════════════ */

function ChampionStrip({
  team,
  theme,
}: {
  team: { name: string; iso: string };
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        paddingTop: 6,
        paddingBottom: 6,
      }}
    >
      {/* Vertical accent line en color del team — 15% color, MUY tight */}
      <span
        aria-hidden
        style={{
          width: 3,
          alignSelf: "stretch",
          background: `linear-gradient(180deg, transparent, ${theme.primary}, transparent)`,
          boxShadow: `0 0 12px ${theme.glow}`,
          borderRadius: 2,
        }}
      />

      {/* Flag — pequeña, integrada */}
      <div
        style={{
          width: 52,
          height: 36,
          borderRadius: 3,
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: `
            0 6px 18px rgba(0,0,0,0.6),
            inset 0 0 0 1px rgba(255,255,255,0.12)
          `,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://flagcdn.com/${team.iso}.svg`}
          alt={team.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontSize: 9.5,
            letterSpacing: "0.38em",
            color: "rgba(255,255,255,0.5)",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Campeón Mundial
        </span>
        <span
          style={{
            fontFamily:
              "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
            fontSize: "clamp(26px, 3.6vw, 36px)",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {team.name}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATS — editorial inline, sin card
   ═══════════════════════════════════════════════════════════════════ */

function Stats({
  totalGoals,
}: {
  totalGoals: number;
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "clamp(28px, 4vw, 56px)",
        flexWrap: "wrap",
        alignItems: "flex-end",
        paddingTop: 8,
        borderTop: "1px solid rgba(255,255,255,0.08)",
        width: "100%",
        maxWidth: 480,
      }}
    >
      <StatItem value="104" label="Partidos" />
      <StatItem value={String(totalGoals)} label="Goles predichos" />
      <StatItem value="v1.0" label="Predicción única" />
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        paddingTop: 12,
      }}
    >
      <span
        style={{
          fontFamily:
            "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
          fontSize: "clamp(24px, 3vw, 30px)",
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontSize: 9,
          letterSpacing: "0.28em",
          color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRIMARY BUTTON — Campaign Launch Button
   6 capas físicas: base dark, inner highlight, reflection sweep,
   bottom glow, shadow spread, glass top reflection.
   ═══════════════════════════════════════════════════════════════════ */

function PrimaryButton({
  children,
  onClick,
  theme,
}: {
  children: React.ReactNode;
  onClick: () => void;
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* CAPA 5: shadow spread procedural (offset abajo, color cálido) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -14,
          top: -2,
          bottom: -22,
          borderRadius: 22,
          background: `radial-gradient(ellipse at 50% 60%, ${theme.glowSoft} 0%, transparent 65%)`,
          filter: "blur(20px)",
          opacity: 0.85,
          zIndex: 0,
        }}
      />
      {/* CAPA 4: bottom glow concentrado */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 3.6, ease: "easeInOut", repeat: Infinity }}
        style={{
          position: "absolute",
          left: "12%",
          right: "12%",
          bottom: -16,
          height: 24,
          background: `linear-gradient(180deg, ${theme.glow} 0%, transparent 100%)`,
          filter: "blur(14px)",
          zIndex: 0,
        }}
      />

      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.04, y: -3 }}
        whileTap={{ scale: 0.96, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          overflow: "hidden",
          border: "none",
          cursor: "pointer",
          padding: "20px 36px",
          borderRadius: 14,
          /* CAPA 1: base dark + 15% color */
          background: `
            linear-gradient(180deg, rgba(28,22,12,1) 0%, rgba(14,10,6,1) 100%)
          `,
          color: "#FFE9A8",
          fontFamily:
            "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          boxShadow: `
            0 28px 50px rgba(0,0,0,0.6),
            0 12px 24px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,230,180,0.35),
            inset 0 -2px 0 rgba(0,0,0,0.6),
            inset 0 0 0 1px rgba(255,210,140,0.18)
          `,
          zIndex: 1,
        }}
      >
        {/* CAPA 6: glass reflection top (curva sutil) */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 1,
            left: 1,
            right: 1,
            height: "48%",
            borderRadius: "13px 13px 50% 50% / 13px 13px 28px 28px",
            background:
              "linear-gradient(180deg, rgba(255,230,180,0.18) 0%, rgba(255,230,180,0.04) 50%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* CAPA 2: inner highlight color del team (sutil, 15%) */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 90% 50% at 50% 100%, ${theme.glowSoft} 0%, transparent 70%)`,
            opacity: 0.7,
            pointerEvents: "none",
          }}
        />

        {/* CAPA 3: reflection sweep */}
        <motion.span
          aria-hidden
          animate={{ x: ["-160%", "260%"] }}
          transition={{
            duration: 3.2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 2.2,
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "55%",
            height: "100%",
            background:
              "linear-gradient(110deg, transparent, rgba(255,235,200,0.4) 50%, transparent)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />

        {/* Edge inner stroke gold */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 2,
            borderRadius: 11,
            border: "1px solid rgba(255,225,170,0.12)",
            pointerEvents: "none",
          }}
        />

        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            zIndex: 2,
          }}
        >
          <ShareIcon />
          {children}
        </span>
      </motion.button>
    </div>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ borderColor: "rgba(255,255,255,0.45)", y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        border: "1px solid rgba(255,255,255,0.22)",
        cursor: "pointer",
        padding: "20px 28px",
        borderRadius: 14,
        background: "transparent",
        color: "rgba(255,255,255,0.85)",
        fontFamily:
          "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </motion.button>
  );
}

function ShareIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
    </svg>
  );
}

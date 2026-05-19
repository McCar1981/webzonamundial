// src/components/bracket/CelebrationOverlay.tsx
//
// Victory Screen — escena cinematográfica del Mundial 2026.
//
// NO es una UI sobre un fondo. Es una ESCENA construida en capas:
//
//   z=0   base oscuro
//   z=1   stadium image (filtrada, oscurecida)
//   z=2   atmospheric haze (gradient cálido)
//   z=3   spotlight gigante detrás del trofeo
//   z=4   light beams volumétricos descendentes
//   z=5   smoke/fog procedural
//   z=6   partículas lejanas (depth back)
//   z=7   confeti procedural (3 colores del team)
//   z=8   partículas cercanas (depth front)
//   z=9   bloom dorado alrededor del trofeo
//   z=10  noise/grain texture (sutil)
//   z=11  cinematic vignette frame
//   z=20  contenido (eyebrow, trofeo, título, card, stats, CTAs)
//
// Sistema temático dinámico — toda la luz/color se adapta al campeón.
//
// Inspiración: key visual oficial FIFA, Champions League broadcast,
// posters cinemáticos del Mundial. NO gamer, NO sci-fi.

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
  "Tú lo predijiste. Tú eres el DT.",
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
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          aria-modal="true"
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(16px, 4vw, 56px) clamp(16px, 4vw, 32px)",
            background: "#020308",
          }}
        >
          {/* ═════════════════════════════════════════════════════════════
              LAYER STACK — escena cinematográfica
              ═════════════════════════════════════════════════════════════ */}

          <SceneLayers theme={theme} />

          {/* ═════════════════════════════════════════════════════════════
              CONTENT
              ═════════════════════════════════════════════════════════════ */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.14 } },
            }}
            style={{
              position: "relative",
              zIndex: 20,
              width: "100%",
              maxWidth: 760,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "clamp(20px, 3.2vw, 32px)",
            }}
          >
            {/* Eyebrow */}
            <FadeUp>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  fontFamily: "JetBrains Mono, ui-monospace, monospace",
                  fontSize: 11,
                  letterSpacing: "0.36em",
                  color: theme.secondary,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  textShadow: `0 0 18px ${theme.glowSoft}`,
                }}
              >
                <Bar color={theme.secondary} />
                Mundial 2026 · Bracket sellado
                <Bar color={theme.secondary} />
              </div>
            </FadeUp>

            {/* Trophy */}
            <FadeUp delay={0.05}>
              <Trophy theme={theme} />
            </FadeUp>

            {/* Title */}
            <FadeUp delay={0.12}>
              <h2
                style={{
                  margin: 0,
                  fontFamily:
                    "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
                  fontSize: "clamp(40px, 8vw, 78px)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  lineHeight: 0.95,
                  color: "#fff",
                  textTransform: "uppercase",
                  textShadow:
                    "0 4px 40px rgba(0,0,0,0.7), 0 0 80px rgba(0,0,0,0.4)",
                }}
              >
                Tu Mundial
                <br />
                <span
                  style={{
                    background: `linear-gradient(135deg, ${theme.secondary} 0%, #fff 40%, ${theme.primary} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: `drop-shadow(0 0 28px ${theme.glow})`,
                  }}
                >
                  está completo.
                </span>
              </h2>
            </FadeUp>

            {/* Subtitle */}
            <FadeUp delay={0.18}>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(13px, 1.6vw, 16px)",
                  color: "rgba(255,255,255,0.72)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  letterSpacing: "0.04em",
                  textShadow: "0 2px 16px rgba(0,0,0,0.7)",
                  maxWidth: 480,
                }}
              >
                {subtitle}
              </p>
            </FadeUp>

            {/* Champion card */}
            <FadeUp delay={0.24}>
              <ChampionCard team={team} theme={theme} />
            </FadeUp>

            {/* Stats */}
            <FadeUp delay={0.3}>
              <Stats totalGoals={totalGoals} theme={theme} />
            </FadeUp>

            {/* CTAs */}
            <FadeUp delay={0.36}>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginTop: 4,
                  width: "100%",
                }}
              >
                <SecondaryButton onClick={onEdit}>
                  Revisar bracket
                </SecondaryButton>
                <PrimaryButton onClick={onShare} theme={theme}>
                  Compartir mi Mundial
                </PrimaryButton>
              </div>
            </FadeUp>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE LAYERS — la escena cinematográfica completa
   ═══════════════════════════════════════════════════════════════════ */

function SceneLayers({
  theme,
}: {
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <>
      {/* z=1: Stadium */}
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
            objectPosition: "center 30%",
            filter: "saturate(0.7) brightness(0.4) contrast(1.05)",
            zIndex: 1,
            transform: "scale(1.06)",
          }}
        />
      </picture>

      {/* z=2: Atmospheric haze + cinematic gradient */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          background: `
            radial-gradient(ellipse 75% 55% at 50% 38%, ${theme.glowSoft} 0%, transparent 70%),
            radial-gradient(ellipse 100% 60% at 50% 100%, rgba(0,0,0,0.85) 0%, transparent 70%),
            linear-gradient(180deg, rgba(2,3,8,0.75) 0%, rgba(2,3,8,0.55) 35%, rgba(2,3,8,0.75) 70%, rgba(0,0,0,0.95) 100%)
          `,
        }}
      />

      {/* z=3: Spotlight gigante detrás del trofeo */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, delay: 0.2, ease: "easeOut" }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3,
          background: `radial-gradient(ellipse 50% 70% at 50% 38%, ${theme.glow} 0%, transparent 55%)`,
          mixBlendMode: "screen",
          filter: "blur(4px)",
        }}
      />

      {/* z=4: Light beams volumétricos descendentes */}
      <LightBeams theme={theme} />

      {/* z=5: Smoke / volumetric fog */}
      <Smoke theme={theme} />

      {/* z=6: Partículas lejanas (depth back) */}
      <DepthParticles theme={theme} count={18} layer="back" />

      {/* z=7: Confeti procedural */}
      <ConfettiLayer colors={theme.confetti} />

      {/* z=8: Partículas cercanas (depth front, más grandes y borrosas) */}
      <DepthParticles theme={theme} count={9} layer="front" />

      {/* z=9: Bloom dorado alrededor del trofeo (sutil, encima) */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity }}
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          width: "min(600px, 80vw)",
          height: "min(600px, 80vw)",
          transform: "translate(-50%, -10%)",
          zIndex: 9,
          background: `radial-gradient(circle, ${theme.glowSoft} 0%, transparent 60%)`,
          filter: "blur(40px)",
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      {/* z=10: Noise / film grain */}
      <NoiseTexture />

      {/* z=11: Cinematic vignette frame */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 11,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 90%, rgba(0,0,0,0.85) 100%),
            linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.35) 100%)
          `,
        }}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LIGHT BEAMS — rayos volumétricos descendentes
   ═══════════════════════════════════════════════════════════════════ */

function LightBeams({ theme }: { theme: ReturnType<typeof buildTeamTheme> }) {
  // 3 rayos diagonales que caen desde arriba como focos de estadio.
  const beams = useMemo(
    () => [
      { x: 30, width: 280, angle: -12, delay: 0, duration: 7, intensity: 0.35 },
      { x: 50, width: 360, angle: 0, delay: 0.6, duration: 9, intensity: 0.5 },
      { x: 72, width: 260, angle: 14, delay: 1.2, duration: 8, intensity: 0.32 },
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
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, b.intensity, b.intensity * 0.6, b.intensity] }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            top: "-15%",
            left: `${b.x}%`,
            width: b.width,
            height: "130%",
            transformOrigin: "top center",
            transform: `translateX(-50%) rotate(${b.angle}deg)`,
            background: `linear-gradient(180deg, ${theme.glowSoft} 0%, ${theme.glowFaint} 35%, transparent 80%)`,
            filter: "blur(28px)",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SMOKE — niebla volumétrica que se mueve lento
   ═══════════════════════════════════════════════════════════════════ */

function Smoke({ theme }: { theme: ReturnType<typeof buildTeamTheme> }) {
  const blobs = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * 80,
        y: 40 + Math.random() * 50,
        size: 320 + Math.random() * 240,
        delay: Math.random() * 4,
        duration: 14 + Math.random() * 8,
        driftX: (Math.random() - 0.5) * 60,
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
            x: [0, b.driftX, 0],
            y: [0, -30, 0],
            opacity: [0.0, 0.12, 0.0],
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
            background: `radial-gradient(circle, ${theme.primary} 0%, transparent 60%)`,
            filter: "blur(60px)",
            mixBlendMode: "screen",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DEPTH PARTICLES — partículas con z-depth real
   ═══════════════════════════════════════════════════════════════════ */

function DepthParticles({
  theme,
  count,
  layer,
}: {
  theme: ReturnType<typeof buildTeamTheme>;
  count: number;
  layer: "back" | "front";
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size:
          layer === "back"
            ? 2 + Math.random() * 4
            : 5 + Math.random() * 9,
        delay: Math.random() * 6,
        duration: layer === "back" ? 10 + Math.random() * 8 : 7 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 40,
      })),
    [count, layer],
  );

  const blur = layer === "back" ? 1 : 4;
  const opacityMax = layer === "back" ? 0.7 : 0.55;
  const zIndex = layer === "back" ? 6 : 8;

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
            y: [`${p.y}vh`, `${p.y - 25}vh`, `${p.y - 50}vh`],
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
                ? theme.secondary
                : `radial-gradient(circle, ${theme.primary} 0%, transparent 70%)`,
            filter: `blur(${blur}px)`,
            boxShadow:
              layer === "back" ? `0 0 ${p.size * 3}px ${theme.glowSoft}` : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONFETTI procedural
   ═══════════════════════════════════════════════════════════════════ */

interface Piece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotate: number;
  size: number;
  color: string;
  shape: "rect" | "circle" | "tri";
  drift: number;
}

function ConfettiLayer({ colors }: { colors: readonly string[] }) {
  const pieces = useMemo<Piece[]>(() => {
    const arr: Piece[] = [];
    for (let i = 0; i < 42; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 6 + Math.random() * 5,
        rotate: Math.random() * 360,
        size: 5 + Math.random() * 9,
        color: colors[i % colors.length],
        shape: (["rect", "circle", "tri"] as const)[i % 3],
        drift: (Math.random() - 0.5) * 25,
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
        zIndex: 7,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "-12vh", x: `${p.x}vw`, rotate: p.rotate, opacity: 0 }}
          animate={{
            y: "112vh",
            x: `${p.x + p.drift}vw`,
            rotate: p.rotate + 720,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
            opacity: {
              duration: p.duration,
              times: [0, 0.05, 0.85, 1],
              repeat: Infinity,
            },
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.shape === "rect" ? p.size * 0.45 : p.size,
            background: p.shape === "tri" ? "transparent" : p.color,
            borderRadius: p.shape === "circle" ? "50%" : 1,
            borderLeft:
              p.shape === "tri"
                ? `${p.size / 2}px solid transparent`
                : undefined,
            borderRight:
              p.shape === "tri"
                ? `${p.size / 2}px solid transparent`
                : undefined,
            borderBottom:
              p.shape === "tri" ? `${p.size}px solid ${p.color}` : undefined,
            boxShadow: `0 0 12px ${p.color}80, 0 0 4px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NOISE TEXTURE — grano de película
   ═══════════════════════════════════════════════════════════════════ */

function NoiseTexture() {
  // SVG-based noise, encoded inline para no requerir asset extra.
  const noiseDataUri = useMemo(() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>`;
    return `data:image/svg+xml;utf8,${svg}`;
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        backgroundImage: `url("${noiseDataUri}")`,
        backgroundSize: "200px 200px",
        opacity: 0.18,
        mixBlendMode: "overlay",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STAGGER HELPER
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
        hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: 0.85,
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

function Bar({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 36,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: 0.7,
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TROPHY — copa volumétrica con bloom + breathing + float
   ═══════════════════════════════════════════════════════════════════ */

function Trophy({ theme }: { theme: ReturnType<typeof buildTeamTheme> }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
      style={{
        position: "relative",
        display: "inline-block",
        filter: `drop-shadow(0 22px 40px rgba(0,0,0,0.55))`,
      }}
    >
      {/* Bloom interno breathing */}
      <motion.div
        animate={{
          opacity: [0.5, 0.95, 0.5],
          scale: [0.92, 1.12, 0.92],
        }}
        transition={{ duration: 3.6, ease: "easeInOut", repeat: Infinity }}
        aria-hidden
        style={{
          position: "absolute",
          inset: -60,
          background: `radial-gradient(circle at center, ${theme.glow} 0%, ${theme.glowSoft} 30%, transparent 65%)`,
          filter: "blur(30px)",
          zIndex: 0,
          mixBlendMode: "screen",
        }}
      />

      {/* Halo dorado tight */}
      <motion.div
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
        transition={{
          duration: 4.2,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 0.4,
        }}
        aria-hidden
        style={{
          position: "absolute",
          inset: -18,
          background: `radial-gradient(circle at center, #FFE9A8 0%, ${theme.glowSoft} 40%, transparent 70%)`,
          filter: "blur(14px)",
          zIndex: 0,
          mixBlendMode: "screen",
        }}
      />

      {/* Trophy SVG */}
      <svg
        width="140"
        height="140"
        viewBox="0 0 96 96"
        fill="none"
        style={{ position: "relative", zIndex: 1 }}
        aria-hidden
      >
        <defs>
          <linearGradient id="trophy-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.secondary} />
            <stop offset="40%" stopColor={theme.primary} />
            <stop offset="55%" stopColor="#FFE9A8" />
            <stop offset="100%" stopColor={theme.secondary} />
          </linearGradient>
          <linearGradient id="trophy-shine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="trophy-spec" cx="40%" cy="30%" r="35%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M28 16h40v18c0 11-9 20-20 20s-20-9-20-20V16Z"
          fill="url(#trophy-grad)"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
        />
        <path
          d="M28 22h-8c0 8 4 14 12 14M68 22h8c0 8-4 14-12 14"
          stroke="url(#trophy-grad)"
          strokeWidth="3.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M28 16h40v18c0 11-9 20-20 20s-20-9-20-20V16Z"
          fill="url(#trophy-shine)"
        />
        <ellipse cx="38" cy="24" rx="10" ry="8" fill="url(#trophy-spec)" />
        <rect x="42" y="54" width="12" height="14" fill={theme.primary} />
        <rect
          x="32"
          y="68"
          width="32"
          height="6"
          rx="1.5"
          fill="url(#trophy-grad)"
        />
        <rect
          x="26"
          y="76"
          width="44"
          height="8"
          rx="2"
          fill="url(#trophy-grad)"
        />
        <rect
          x="38"
          y="79"
          width="20"
          height="2"
          rx="1"
          fill="rgba(0,0,0,0.3)"
        />
      </svg>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CHAMPION CARD — glassmorphism con borde glow
   ═══════════════════════════════════════════════════════════════════ */

function ChampionCard({
  team,
  theme,
}: {
  team: { name: string; iso: string };
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.012 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "18px 26px",
        background: "rgba(10,12,20,0.55)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: `1px solid ${theme.glow}`,
        borderRadius: 20,
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.16),
          inset 0 -1px 0 rgba(0,0,0,0.4),
          0 24px 60px rgba(0,0,0,0.55),
          0 0 80px ${theme.glowSoft}
        `,
        minWidth: 300,
        maxWidth: 480,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${theme.secondary}, transparent)`,
          opacity: 0.8,
        }}
      />

      {/* Flag with subtle frame */}
      <div
        style={{
          width: 64,
          height: 42,
          borderRadius: 5,
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: `
            0 6px 18px rgba(0,0,0,0.55),
            inset 0 0 0 1px rgba(255,255,255,0.12),
            0 0 24px ${theme.glowFaint}
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
          gap: 4,
          flex: 1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: "0.32em",
            color: theme.secondary,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Campeón
        </span>
        <span
          style={{
            fontFamily:
              "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
            fontSize: "clamp(24px, 3.6vw, 32px)",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.015em",
            lineHeight: 1.02,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {team.name}
        </span>
      </div>

      <CrownIcon color={theme.secondary} />
    </motion.div>
  );
}

function CrownIcon({ color }: { color: string }) {
  return (
    <svg
      width="34"
      height="30"
      viewBox="0 0 32 28"
      fill="none"
      style={{
        flexShrink: 0,
        filter: `drop-shadow(0 0 8px ${color}88)`,
      }}
      aria-hidden
    >
      <path
        d="M2 8l5 11h18l5-11-7 4-7-9-7 9-7-4Z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="2.5" cy="7" r="1.4" fill={color} />
      <circle cx="16" cy="2.5" r="1.4" fill={color} />
      <circle cx="29.5" cy="7" r="1.4" fill={color} />
      <rect x="6" y="22" width="20" height="2" rx="0.5" fill={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATS
   ═══════════════════════════════════════════════════════════════════ */

function Stats({
  totalGoals,
  theme,
}: {
  totalGoals: number;
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 8,
        width: "100%",
        maxWidth: 480,
        padding: "16px 20px",
        background: "rgba(10,12,20,0.45)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <StatCell
        value="104"
        label="Partidos"
        icon="ball"
        color={theme.secondary}
      />
      <StatCell
        value={String(totalGoals)}
        label="Goles predichos"
        icon="target"
        color={theme.primary}
      />
      <StatCell
        value="v1.0"
        label="Predicción única"
        icon="orb"
        color={theme.secondary}
      />
    </div>
  );
}

function StatCell({
  value,
  label,
  icon,
  color,
}: {
  value: string;
  label: string;
  icon: "ball" | "target" | "orb";
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        padding: "4px 2px",
      }}
    >
      <StatIcon variant={icon} color={color} />
      <span
        style={{
          fontFamily:
            "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
          fontSize: "clamp(22px, 3.4vw, 28px)",
          fontWeight: 900,
          color: "#fff",
          lineHeight: 1,
          letterSpacing: "-0.015em",
          textShadow: `0 0 18px ${color}40`,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontSize: 9,
          letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.55)",
          textTransform: "uppercase",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function StatIcon({
  variant,
  color,
}: {
  variant: "ball" | "target" | "orb";
  color: string;
}) {
  const common = {
    width: 18,
    height: 18,
    fill: "none",
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (variant === "ball") {
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v6m0 6v6m-9-9h6m6 0h6" />
      </svg>
    );
  }
  if (variant === "target") {
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...common} aria-hidden>
      <circle cx="12" cy="10" r="6.5" />
      <path d="M6 19h12" />
      <path d="M9 16l-1 3M15 16l1 3" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BUTTONS — CTA cinematográfico
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
    <div style={{ position: "relative" }}>
      {/* Glow procedural debajo */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity }}
        style={{
          position: "absolute",
          inset: -12,
          borderRadius: 18,
          background: `radial-gradient(ellipse at center, ${theme.glow} 0%, transparent 70%)`,
          filter: "blur(16px)",
          zIndex: 0,
        }}
      />
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.045, y: -2 }}
        whileTap={{ scale: 0.96, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          overflow: "hidden",
          border: "none",
          cursor: "pointer",
          padding: "18px 32px",
          borderRadius: 14,
          background: `linear-gradient(135deg, ${theme.primary} 0%, #FFE9A8 50%, ${theme.secondary} 100%)`,
          color: "#0a0a0a",
          fontFamily:
            "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          boxShadow: `
            0 22px 40px rgba(0,0,0,0.45),
            0 12px 24px ${theme.glow},
            inset 0 1px 0 rgba(255,255,255,0.55),
            inset 0 -2px 0 rgba(0,0,0,0.25),
            inset 0 0 0 1px rgba(255,255,255,0.25)
          `,
          zIndex: 1,
        }}
      >
        {/* Sweep light */}
        <motion.span
          aria-hidden
          animate={{ x: ["-140%", "240%"] }}
          transition={{
            duration: 2.8,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1.8,
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "60%",
            height: "100%",
            background:
              "linear-gradient(110deg, transparent, rgba(255,255,255,0.7) 50%, transparent)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
        {/* Edge highlight */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 1,
            left: 1,
            right: 1,
            height: "45%",
            borderRadius: "12px 12px 0 0",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.35), transparent)",
            pointerEvents: "none",
          }}
        />
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
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
      whileHover={{
        scale: 1.035,
        backgroundColor: "rgba(255,255,255,0.08)",
        y: -2,
      }}
      whileTap={{ scale: 0.96, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        border: "1px solid rgba(255,255,255,0.22)",
        cursor: "pointer",
        padding: "18px 28px",
        borderRadius: 14,
        background: "rgba(10,12,20,0.45)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        color: "#fff",
        fontFamily:
          "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        boxShadow:
          "0 12px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </motion.button>
  );
}

function ShareIcon() {
  return (
    <svg
      width="14"
      height="14"
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

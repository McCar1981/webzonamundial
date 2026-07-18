// src/components/bracket/CelebrationOverlay.tsx
//
// Victory Screen — replica del key visual de referencia.
//
// COMPOSICIÓN (de arriba abajo, centrada):
//   1. Logo ZonaMundial (top-left) + eyebrow "MUNDIAL 2026 · BRACKET SELLADO" (top-right)
//   2. Trofeo FIFA realista (hero, centrado, ocupa parte superior)
//   3. Titular brush "TU MUNDIAL / ESTÁ COMPLETO." (Anton)
//   4. Card "CAMPEÓN — [PAÍS]" con bandera + corona, borde dorado
//   5. Stats card (104 PARTIDOS · N GOLES PREDICHOS · v1.0)
//   6. CTAs: "REVISAR BRACKET" (outline) + "COMPARTIR MI MUNDIAL" (brush gold)
//   7. Sign-off script "Tú lo predijiste. Tú eres el DT." (Mr Dafoe)
//
// FONDO: estadio + confeti masivo dorado + glow del país detrás de la copa.
// El color del team es ACENTO; el dorado/blanco domina.

"use client";

import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TEAM_BY_ID } from "@/lib/bracket/teams";
import { buildTeamTheme } from "@/lib/bracket/team-theme";
import type { BracketState } from "@/lib/bracket/types";
import { anton, mrDafoe } from "./celebration-fonts";

interface Props {
  state: BracketState;
  show: boolean;
  onEdit: () => void;
  onShare: () => void;
}

const STADIUM_BG_DESKTOP = "/img/bracket-celebration/stadium-celebration.webp";
const STADIUM_BG_MOBILE =
  "/img/bracket-celebration/stadium-celebration-mobile.webp";
const TROPHY_IMG = "/img/bracket-celebration/trophy.webp";
const ZM_LOGO =
  "/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.webp";

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

  if (!team || !theme) return null;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          aria-modal="true"
          role="dialog"
          className={`${anton.variable} ${mrDafoe.variable}`}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            overflow: "auto",
            background: "#04060c",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "clamp(20px, 4vw, 56px) clamp(20px, 5vw, 80px)",
          }}
        >
          {/* ═════════ SCENE LAYERS ═════════ */}
          <SceneLayers theme={theme} />

          {/* ═════════ HEADER (logo izq + eyebrow der) ═════════ */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              zIndex: 30,
              width: "100%",
              maxWidth: 1280,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: "clamp(8px, 2vw, 20px)",
            }}
          >
            {/* Logo ZM */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #FFE9A8, #C9A84C)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(201,168,76,0.45)",
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ZM_LOGO}
                  alt="ZonaMundial"
                  width={32}
                  height={32}
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: "contain",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily:
                    "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.01em",
                }}
              >
                zona<span style={{ fontWeight: 500, opacity: 0.85 }}>mundial</span>
              </span>
            </div>

            {/* Eyebrow */}
            <div
              style={{
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
                fontSize: 10,
                letterSpacing: "0.4em",
                color: "rgba(255,235,180,0.7)",
                fontWeight: 600,
                textTransform: "uppercase",
                textAlign: "right",
                whiteSpace: "nowrap",
              }}
              className="zm-celeb-eyebrow"
            >
              {"// Mundial 2026 · Bracket Sellado"}
            </div>
          </motion.div>

          {/* ═════════ MAIN CONTENT (centrado) ═════════ */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.18, delayChildren: 0.4 } },
            }}
            style={{
              position: "relative",
              zIndex: 30,
              width: "100%",
              maxWidth: 880,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "clamp(18px, 2.5vw, 28px)",
              flex: 1,
              justifyContent: "center",
              paddingTop: "clamp(8px, 2vw, 16px)",
            }}
          >
            {/* TROFEO HERO */}
            <FadeUp>
              <TrophyHero theme={theme} />
            </FadeUp>

            {/* HEADLINE BRUSH */}
            <FadeUp delay={0.05}>
              <h2
                style={{
                  margin: 0,
                  fontFamily:
                    "var(--zm-font-anton, 'Anton', 'Bebas Neue', sans-serif)",
                  fontSize: "clamp(48px, 9vw, 108px)",
                  fontWeight: 400,
                  letterSpacing: "0.005em",
                  lineHeight: 0.9,
                  color: "#fff",
                  textTransform: "uppercase",
                  textShadow:
                    "0 4px 40px rgba(0,0,0,0.7), 0 0 80px rgba(0,0,0,0.4)",
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "#fff",
                  }}
                >
                  Tu Mundial
                </span>
                <span
                  style={{
                    display: "block",
                    background:
                      "linear-gradient(180deg, #FFF4D3 0%, #FFD479 35%, #C9923E 80%, #8a6420 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter:
                      "drop-shadow(0 6px 20px rgba(201,146,62,0.45)) drop-shadow(0 0 40px rgba(255,212,121,0.25))",
                  }}
                >
                  está completo.
                </span>
              </h2>
            </FadeUp>

            {/* CHAMPION CARD */}
            <FadeUp delay={0.12}>
              <ChampionCard team={team} theme={theme} />
            </FadeUp>

            {/* STATS CARD */}
            <FadeUp delay={0.2}>
              <StatsCard totalGoals={totalGoals} />
            </FadeUp>

            {/* CTAs */}
            <FadeUp delay={0.28}>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  maxWidth: 720,
                }}
              >
                <SecondaryButton onClick={onEdit} />
                <PrimaryButton onClick={onShare} />
              </div>
            </FadeUp>

            {/* SIGN-OFF */}
            <FadeUp delay={0.4}>
              <div
                style={{
                  display: "inline-block",
                  padding: "10px 0 4px",
                  fontFamily:
                    "var(--zm-font-dafoe, 'Mr Dafoe', 'Brush Script MT', cursive)",
                  fontSize: "clamp(20px, 2.4vw, 26px)",
                  color: "#FFE9A8",
                  letterSpacing: "0.01em",
                  borderBottom: "1px solid rgba(255,212,121,0.55)",
                  paddingBottom: 4,
                  lineHeight: 1.2,
                  textShadow: "0 0 18px rgba(255,212,121,0.35)",
                }}
              >
                Tú lo predijiste. Tú eres el DT.
              </div>
            </FadeUp>
          </motion.div>

          {/* Decorative gold border frame (interior) */}
          <div
            aria-hidden
            style={{
              position: "fixed",
              inset: "clamp(10px, 1.5vw, 22px)",
              borderRadius: "clamp(14px, 1.5vw, 22px)",
              border: "1px solid rgba(255,212,121,0.32)",
              pointerEvents: "none",
              zIndex: 25,
              boxShadow: "inset 0 0 60px rgba(0,0,0,0.4)",
            }}
          />

          <style>{`
            @media (max-width: 640px) {
              .zm-celeb-eyebrow {
                font-size: 8px !important;
                letter-spacing: 0.28em !important;
              }
            }
          `}</style>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE LAYERS — fondo atmosférico (sin dominar)
   ═══════════════════════════════════════════════════════════════════ */

function SceneLayers({
  theme,
}: {
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <>
      {/* z=1 STADIUM */}
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
            filter: "saturate(0.6) brightness(0.35) contrast(1.12)",
            zIndex: 1,
            transform: "scale(1.06)",
          }}
        />
      </picture>

      {/* z=2 dark wash with warm gold center (no team color dominante) */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          background: `
            radial-gradient(ellipse 70% 60% at 50% 30%, rgba(180,130,40,0.18) 0%, transparent 65%),
            radial-gradient(ellipse 100% 60% at 50% 100%, rgba(0,0,0,0.9) 0%, transparent 70%),
            linear-gradient(180deg, rgba(4,6,12,0.45) 0%, rgba(4,6,12,0.3) 35%, rgba(4,6,12,0.6) 75%, rgba(0,0,0,1) 100%)
          `,
        }}
      />

      {/* z=3 team color accent (sutil, detrás del trofeo) */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity }}
        style={{
          position: "fixed",
          top: "18%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(700px, 70vw)",
          height: "min(700px, 70vw)",
          zIndex: 3,
          background: `radial-gradient(circle, ${theme.glowSoft} 0%, transparent 55%)`,
          filter: "blur(45px)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* z=4 light beams */}
      <LightBeams />

      {/* z=5 confetti dorado masivo */}
      <ConfettiLayer />

      {/* z=6 noise grain */}
      <NoiseTexture />

      {/* z=7 cinematic vignette */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 7,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 110% 110% at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 92%, rgba(0,0,0,0.95) 100%)
          `,
        }}
      />
    </>
  );
}

function LightBeams() {
  const beams = useMemo(
    () => [
      { x: 22, width: 320, angle: -18, delay: 0, duration: 9, intensity: 0.22 },
      { x: 50, width: 400, angle: 0, delay: 1, duration: 10, intensity: 0.3 },
      { x: 78, width: 320, angle: 18, delay: 0.5, duration: 9.5, intensity: 0.22 },
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
            opacity: [b.intensity * 0.5, b.intensity, b.intensity * 0.5],
          }}
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
            background:
              "linear-gradient(180deg, rgba(255,240,210,0.6) 0%, rgba(255,225,170,0.2) 35%, transparent 75%)",
            filter: "blur(34px)",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONFETTI — dorado dominante (matching la referencia)
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

function ConfettiLayer() {
  const pieces = useMemo<Piece[]>(() => {
    // Paleta dorada: variaciones de gold + acentos blancos
    const colors = [
      "#FFE9A8",
      "#FFD479",
      "#C9A84C",
      "#FFF4D3",
      "#E8C76B",
      "rgba(255,255,255,0.92)",
      "#A87E2A",
      "#FFD479",
    ];
    const arr: Piece[] = [];
    for (let i = 0; i < 56; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 7,
        duration: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
        size: 5 + Math.random() * 10,
        color: colors[i % colors.length],
        shape: (["rect", "circle"] as const)[i % 2],
        drift: (Math.random() - 0.5) * 35,
      });
    }
    return arr;
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

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
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "-15vh", x: `${p.x}vw`, rotate: p.rotate, opacity: 0 }}
          animate={{
            y: "115vh",
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
            height: p.shape === "rect" ? p.size * 0.4 : p.size,
            background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : 1.5,
            boxShadow: `0 0 10px ${p.color}, 0 0 4px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NOISE
   ═══════════════════════════════════════════════════════════════════ */

function NoiseTexture() {
  const noiseDataUri = useMemo(() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>`;
    return `data:image/svg+xml;utf8,${svg}`;
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 6,
        pointerEvents: "none",
        backgroundImage: `url("${noiseDataUri}")`,
        backgroundSize: "180px 180px",
        opacity: 0.18,
        mixBlendMode: "overlay",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STAGGER REVEAL
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
        hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: 0.95,
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

/* ═══════════════════════════════════════════════════════════════════
   TROPHY HERO — imagen PNG real, centrada
   ═══════════════════════════════════════════════════════════════════ */

function TrophyHero({
  theme,
}: {
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "min(360px, 56vw)",
        height: "min(360px, 56vw)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Bloom dorado breathing */}
      <motion.div
        animate={{
          opacity: [0.55, 0.9, 0.55],
          scale: [0.95, 1.1, 0.95],
        }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
        aria-hidden
        style={{
          position: "absolute",
          inset: "-25%",
          background:
            "radial-gradient(circle at 50% 45%, rgba(255,228,166,0.45) 0%, rgba(201,168,76,0.2) 35%, transparent 65%)",
          filter: "blur(40px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Team accent halo (sutil) */}
      <motion.div
        animate={{ opacity: [0.25, 0.5, 0.25] }}
        transition={{
          duration: 6,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 1.2,
        }}
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

      {/* Trophy float */}
      <motion.img
        src={TROPHY_IMG}
        alt="Trofeo Mundial 2026"
        width={400}
        height={600}
        decoding="async"
        loading="eager"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        style={{
          position: "relative",
          maxWidth: "100%",
          maxHeight: "100%",
          width: "auto",
          height: "100%",
          objectFit: "contain",
          filter:
            "drop-shadow(0 30px 60px rgba(0,0,0,0.7)) drop-shadow(0 0 40px rgba(255,210,140,0.35)) drop-shadow(0 0 80px rgba(255,210,140,0.2))",
          zIndex: 1,
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CHAMPION CARD — borde dorado, bandera, corona
   ═══════════════════════════════════════════════════════════════════ */

function ChampionCard({
  team,
  theme,
}: {
  team: { name: string; iso: string };
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 680,
        padding: "20px 28px",
        background:
          "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(8,10,16,0.75) 100%)",
        border: "1px solid rgba(255,212,121,0.5)",
        borderRadius: 16,
        boxShadow: `
          0 24px 50px rgba(0,0,0,0.55),
          inset 0 1px 0 rgba(255,235,180,0.18),
          0 0 60px rgba(255,212,121,0.12),
          0 0 40px ${theme.glowFaint}
        `,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
      }}
    >
      {/* Top label */}
      <div
        style={{
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.4em",
          color: "#FFE9A8",
          fontWeight: 700,
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        Campeón
      </div>

      {/* Flag + name + crown row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        {/* Flag */}
        <div
          style={{
            width: 60,
            height: 42,
            borderRadius: 4,
            overflow: "hidden",
            flexShrink: 0,
            boxShadow: `
              0 6px 18px rgba(0,0,0,0.55),
              inset 0 0 0 1px rgba(255,255,255,0.15)
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

        {/* Name */}
        <h3
          style={{
            margin: 0,
            fontFamily:
              "var(--zm-font-anton, 'Anton', sans-serif)",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 400,
            letterSpacing: "0.02em",
            color: "#fff",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {team.name}
        </h3>

        {/* Crown */}
        <CrownIcon />
      </div>
    </div>
  );
}

function CrownIcon() {
  return (
    <svg
      width="42"
      height="34"
      viewBox="0 0 42 34"
      fill="none"
      style={{
        flexShrink: 0,
        filter: "drop-shadow(0 0 10px rgba(255,212,121,0.55))",
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id="crown-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="50%" stopColor="#FFD479" />
          <stop offset="100%" stopColor="#C9923E" />
        </linearGradient>
      </defs>
      <path
        d="M2 10 L9 24 L33 24 L40 10 L31 16 L21 4 L11 16 Z"
        fill="url(#crown-grad)"
        stroke="#A87E2A"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <circle cx="2.5" cy="9" r="1.6" fill="url(#crown-grad)" />
      <circle cx="21" cy="3" r="1.8" fill="url(#crown-grad)" />
      <circle cx="39.5" cy="9" r="1.6" fill="url(#crown-grad)" />
      <rect x="8" y="27" width="26" height="2.5" rx="0.5" fill="url(#crown-grad)" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATS CARD — 3 columnas con iconos y separadores
   ═══════════════════════════════════════════════════════════════════ */

function StatsCard({ totalGoals }: { totalGoals: number }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 680,
        padding: "18px 24px",
        background: "rgba(0,0,0,0.65)",
        border: "1px solid rgba(255,212,121,0.22)",
        borderRadius: 14,
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        boxShadow: "0 14px 36px rgba(0,0,0,0.4)",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr auto 1fr",
        alignItems: "center",
        gap: 8,
      }}
    >
      <StatItem icon="ball" value="104" label="Partidos" />
      <Divider />
      <StatItem icon="target" value={String(totalGoals)} label="Goles predichos" />
      <Divider />
      <StatItem icon="orb" value="v1.0" label="Predicción única" />
    </div>
  );
}

function Divider() {
  return (
    <span
      aria-hidden
      style={{
        width: 1,
        height: 32,
        background:
          "linear-gradient(180deg, transparent, rgba(255,212,121,0.35), transparent)",
        alignSelf: "center",
      }}
    />
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: "ball" | "target" | "orb";
  value: string;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: "center",
        padding: "4px 0",
      }}
    >
      <StatIcon variant={icon} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontFamily:
              "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
            fontSize: "clamp(20px, 2.6vw, 26px)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.01em",
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontSize: 9,
            letterSpacing: "0.24em",
            color: "rgba(255,235,180,0.55)",
            textTransform: "uppercase",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function StatIcon({ variant }: { variant: "ball" | "target" | "orb" }) {
  const common = {
    width: 22,
    height: 22,
    fill: "none",
    stroke: "#FFD479",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (variant === "ball") {
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3l3 5-3 4-3-4z M3 12l5 3 4-3-3-3z M21 12l-5 3-4-3 3-3z M12 21l-3-5 3-4 3 4z" />
      </svg>
    );
  }
  if (variant === "target") {
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="#FFD479" stroke="none" />
        <path d="M12 1v3M12 20v3M1 12h3M20 12h3" />
      </svg>
    );
  }
  // orb / crystal ball
  return (
    <svg viewBox="0 0 24 24" {...common} aria-hidden>
      <circle cx="12" cy="10" r="7" />
      <path d="M9 8c0-1.5 1.5-3 3-3" opacity="0.6" />
      <path d="M5 19h14" />
      <path d="M7 17l-1 3M17 17l1 3" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BUTTONS — primary brushstroke gold, secondary outline
   ═══════════════════════════════════════════════════════════════════ */

function PrimaryButton({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 380 }}>
      {/* Glow detrás */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
        style={{
          position: "absolute",
          inset: -16,
          borderRadius: 24,
          background:
            "radial-gradient(ellipse at center, rgba(255,212,121,0.55) 0%, transparent 70%)",
          filter: "blur(22px)",
          zIndex: 0,
        }}
      />

      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          overflow: "hidden",
          border: "none",
          cursor: "pointer",
          width: "100%",
          padding: "20px 28px",
          /* Brushstroke gold — gradient + radial blob + irregular shadow */
          background:
            "linear-gradient(120deg, #C9923E 0%, #FFD479 30%, #FFE9A8 50%, #FFD479 70%, #A87E2A 100%)",
          color: "#1a0f02",
          fontFamily:
            "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          /* Brushstroke shape — bordes irregulares */
          clipPath:
            "polygon(2% 35%, 6% 12%, 18% 5%, 38% 12%, 58% 4%, 78% 14%, 92% 6%, 98% 30%, 96% 60%, 99% 85%, 88% 96%, 64% 92%, 42% 98%, 22% 90%, 8% 96%, 1% 70%)",
          boxShadow: `
            0 18px 40px rgba(0,0,0,0.5),
            0 8px 20px rgba(201,146,62,0.45)
          `,
          zIndex: 1,
        }}
      >
        {/* Inner highlight */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "8%",
            left: "10%",
            right: "10%",
            height: "30%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
            pointerEvents: "none",
            filter: "blur(4px)",
            opacity: 0.7,
          }}
        />

        {/* Sweep light */}
        <motion.span
          aria-hidden
          animate={{ x: ["-130%", "230%"] }}
          transition={{
            duration: 2.8,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1.6,
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "55%",
            height: "100%",
            background:
              "linear-gradient(110deg, transparent, rgba(255,255,255,0.6) 50%, transparent)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />

        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            zIndex: 2,
          }}
        >
          <ShareIcon />
          Compartir mi Mundial
        </span>
      </motion.button>
    </div>
  );
}

function SecondaryButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ borderColor: "rgba(255,212,121,0.7)", y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "relative",
        flex: "1 1 240px",
        maxWidth: 320,
        padding: "20px 24px",
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,212,121,0.4)",
        borderRadius: 12,
        color: "#FFE9A8",
        fontFamily:
          "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "inset 0 1px 0 rgba(255,235,180,0.1)",
      }}
    >
      Revisar bracket
      <PlayIcon />
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
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
    </svg>
  );
}

function PlayIcon() {
  // Icono táctico tipo "X-O" de la referencia (tactic play)
  return (
    <svg
      width="22"
      height="18"
      viewBox="0 0 22 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="4" cy="14" r="2.2" />
      <path d="M14 4l4 4M14 8l4-4" />
      <path d="M5.5 12.5L14 6" strokeDasharray="2 2" />
    </svg>
  );
}

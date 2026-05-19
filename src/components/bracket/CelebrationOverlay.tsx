// src/components/bracket/CelebrationOverlay.tsx
//
// Victory Screen — overlay cinematográfico que aparece cuando el user
// completa su bracket y predice al campeón del Mundial 2026.
//
// Arquitectura:
//  - 1 solo fondo base (stadium-celebration.png/webp) en la carpeta
//    /public/img/bracket-celebration/.
//  - Todo el color cambia dinámicamente según el campeón predicho:
//    glow del trofeo, confeti, gradientes, borde del card. El sistema
//    procedural está en src/lib/bracket/team-theme.ts.
//  - Framer Motion para entradas secuenciales + interacciones.
//
// Inspiración: Apple Sports, Champions League, FIFA broadcast package.
// NO gamer, NO sci-fi, SÍ editorial deportivo premium.

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
  // Hooks ANTES de cualquier early return (rules of hooks).
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

  // Subtítulo aleatorio (estable mientras el overlay esté montado).
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
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
            padding: "clamp(16px, 4vw, 48px)",
          }}
        >
          {/* ─────────── BG layer 1: stadium image (responsive picture) ─────────── */}
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
                objectPosition: "center",
                filter: "saturate(0.9) brightness(0.55)",
              }}
            />
          </picture>

          {/* ─────────── BG layer 2: dark vignette + team-tinted glow ─────────── */}
          <div
            aria-hidden
            style={{
              position: "fixed",
              inset: 0,
              background: `
                radial-gradient(ellipse 80% 60% at 50% 35%, ${theme.glowSoft}, transparent 70%),
                radial-gradient(ellipse 60% 50% at 50% 110%, ${theme.glowFaint}, transparent 75%),
                linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.85) 100%)
              `,
            }}
          />

          {/* ─────────── BG layer 3: procedural confetti ─────────── */}
          <ConfettiLayer colors={theme.confetti} />

          {/* ─────────── BG layer 4: floating particles ─────────── */}
          <ParticlesLayer color={theme.primary} />

          {/* ─────────── CONTENT ─────────── */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 720,
              padding: "clamp(24px, 5vw, 48px) clamp(20px, 5vw, 40px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "clamp(18px, 3vw, 28px)",
            }}
          >
            {/* Eyebrow */}
            <FadeUp>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "JetBrains Mono, ui-monospace, monospace",
                  fontSize: 11,
                  letterSpacing: "0.32em",
                  color: theme.secondary,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  textShadow: "0 1px 12px rgba(0,0,0,0.6)",
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 1,
                    background: theme.secondary,
                    opacity: 0.5,
                  }}
                  aria-hidden
                />
                Mundial 2026 · Bracket sellado
                <span
                  style={{
                    width: 28,
                    height: 1,
                    background: theme.secondary,
                    opacity: 0.5,
                  }}
                  aria-hidden
                />
              </div>
            </FadeUp>

            {/* Trophy with breathing glow */}
            <FadeUp delay={0.05}>
              <Trophy glow={theme.glow} primary={theme.primary} secondary={theme.secondary} />
            </FadeUp>

            {/* Title */}
            <FadeUp delay={0.1}>
              <h2
                style={{
                  margin: 0,
                  fontFamily:
                    "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
                  fontSize: "clamp(36px, 7vw, 64px)",
                  fontWeight: 900,
                  letterSpacing: "-0.025em",
                  lineHeight: 0.98,
                  color: "#fff",
                  textShadow: "0 4px 32px rgba(0,0,0,0.6)",
                  textTransform: "uppercase",
                }}
              >
                Tu Mundial
                <br />
                <span
                  style={{
                    background: `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.primary} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  está completo.
                </span>
              </h2>
            </FadeUp>

            {/* Subtitle */}
            <FadeUp delay={0.15}>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(14px, 1.8vw, 17px)",
                  color: "rgba(255,255,255,0.78)",
                  fontWeight: 500,
                  fontStyle: "italic",
                  letterSpacing: "0.02em",
                  textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                }}
              >
                {subtitle}
              </p>
            </FadeUp>

            {/* Champion card — glassmorphism premium */}
            <FadeUp delay={0.2}>
              <ChampionCard team={team} theme={theme} />
            </FadeUp>

            {/* Stats */}
            <FadeUp delay={0.25}>
              <Stats
                totalGoals={totalGoals}
                primary={theme.primary}
                secondary={theme.secondary}
              />
            </FadeUp>

            {/* CTAs */}
            <FadeUp delay={0.3}>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginTop: 6,
                  width: "100%",
                }}
              >
                <SecondaryButton onClick={onEdit}>
                  Revisar bracket
                </SecondaryButton>
                <PrimaryButton
                  onClick={onShare}
                  primary={theme.primary}
                  secondary={theme.secondary}
                  glow={theme.glow}
                >
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

/* ============================================================
 * SUBCOMPONENTS
 * ============================================================ */

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
        hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: 0.7,
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

function Trophy({
  glow,
  primary,
  secondary,
}: {
  glow: string;
  primary: string;
  secondary: string;
}) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* Breathing glow */}
      <motion.div
        animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.95, 1.08, 0.95] }}
        transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity }}
        aria-hidden
        style={{
          position: "absolute",
          inset: -40,
          background: `radial-gradient(circle at center, ${glow}, transparent 65%)`,
          filter: "blur(20px)",
          zIndex: 0,
        }}
      />
      {/* Trophy SVG */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 96 96"
        fill="none"
        style={{ position: "relative", zIndex: 1 }}
        aria-hidden
      >
        <defs>
          <linearGradient id="trophy-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={secondary} />
            <stop offset="50%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </linearGradient>
          <linearGradient id="trophy-shine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Cup body */}
        <path
          d="M28 16h40v18c0 11-9 20-20 20s-20-9-20-20V16Z"
          fill="url(#trophy-grad)"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="1"
        />
        {/* Handles */}
        <path
          d="M28 22h-8c0 8 4 14 12 14M68 22h8c0 8-4 14-12 14"
          stroke="url(#trophy-grad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Shine */}
        <path
          d="M28 16h40v18c0 11-9 20-20 20s-20-9-20-20V16Z"
          fill="url(#trophy-shine)"
        />
        {/* Stem */}
        <rect x="42" y="54" width="12" height="14" fill={primary} />
        {/* Base */}
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
        {/* Plate detail */}
        <rect
          x="38"
          y="79"
          width="20"
          height="2"
          rx="1"
          fill="rgba(0,0,0,0.25)"
        />
      </svg>
    </motion.div>
  );
}

function ChampionCard({
  team,
  theme,
}: {
  team: { name: string; iso: string };
  theme: ReturnType<typeof buildTeamTheme>;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "16px 24px",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: `1px solid ${theme.glow}`,
        borderRadius: 18,
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.12),
          0 12px 40px rgba(0,0,0,0.45),
          0 0 60px ${theme.glowSoft}
        `,
        minWidth: 280,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle top accent line */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "12%",
          right: "12%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${theme.secondary}, transparent)`,
          opacity: 0.7,
        }}
      />

      {/* Flag */}
      <div
        style={{
          width: 56,
          height: 38,
          borderRadius: 4,
          overflow: "hidden",
          flexShrink: 0,
          boxShadow:
            "0 4px 14px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://flagcdn.com/${team.iso}.svg`}
          alt={team.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Text block */}
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
            letterSpacing: "0.28em",
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
            fontSize: "clamp(22px, 3.4vw, 28px)",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.01em",
            lineHeight: 1.05,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {team.name}
        </span>
      </div>

      {/* Crown */}
      <CrownIcon color={theme.secondary} />
    </motion.div>
  );
}

function CrownIcon({ color }: { color: string }) {
  return (
    <svg
      width="32"
      height="28"
      viewBox="0 0 32 28"
      fill="none"
      style={{ flexShrink: 0 }}
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

function Stats({
  totalGoals,
  primary,
  secondary,
}: {
  totalGoals: number;
  primary: string;
  secondary: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 8,
        width: "100%",
        maxWidth: 480,
        padding: "16px 18px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <StatCell value="104" label="Partidos" icon="ball" color={secondary} />
      <StatCell
        value={String(totalGoals)}
        label="Goles predichos"
        icon="target"
        color={primary}
      />
      <StatCell
        value="v1.0"
        label="Predicción única"
        icon="orb"
        color={secondary}
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
        gap: 4,
        padding: "4px 2px",
      }}
    >
      <StatIcon variant={icon} color={color} />
      <span
        style={{
          fontFamily:
            "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
          fontSize: "clamp(20px, 3vw, 26px)",
          fontWeight: 900,
          color: "#fff",
          lineHeight: 1,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontSize: 9,
          letterSpacing: "0.18em",
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
  // orb
  return (
    <svg viewBox="0 0 24 24" {...common} aria-hidden>
      <circle cx="12" cy="10" r="6.5" />
      <path d="M6 19h12" />
      <path d="M9 16l-1 3M15 16l1 3" />
    </svg>
  );
}

/* ============================================================
 * BUTTONS
 * ============================================================ */

function PrimaryButton({
  children,
  onClick,
  primary,
  secondary,
  glow,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary: string;
  secondary: string;
  glow: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "relative",
        overflow: "hidden",
        border: "none",
        cursor: "pointer",
        padding: "16px 28px",
        borderRadius: 12,
        background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        color: "#0a0a0a",
        fontFamily:
          "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
        fontSize: 14,
        fontWeight: 900,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        boxShadow: `
          0 12px 32px ${glow},
          inset 0 1px 0 rgba(255,255,255,0.4),
          inset 0 -2px 0 rgba(0,0,0,0.15)
        `,
      }}
    >
      {/* Sweep light */}
      <motion.span
        aria-hidden
        animate={{ x: ["-120%", "220%"] }}
        transition={{
          duration: 2.6,
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
            "linear-gradient(110deg, transparent, rgba(255,255,255,0.55) 50%, transparent)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <ShareIcon />
        {children}
      </span>
    </motion.button>
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
      whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.06)" }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        border: "1px solid rgba(255,255,255,0.18)",
        cursor: "pointer",
        padding: "16px 26px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        color: "#fff",
        fontFamily:
          "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.06em",
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
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
    </svg>
  );
}

/* ============================================================
 * BG EFFECTS — confetti + particles (procedural)
 * ============================================================ */

interface Piece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotate: number;
  size: number;
  color: string;
  shape: "rect" | "circle" | "tri";
}

function useConfettiPieces(colors: readonly string[], count: number): Piece[] {
  return useMemo(() => {
    const arr: Piece[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 5 + Math.random() * 4,
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 10,
        color: colors[i % colors.length],
        shape: (["rect", "circle", "tri"] as const)[i % 3],
      });
    }
    return arr;
  }, [colors, count]);
}

function ConfettiLayer({ colors }: { colors: readonly string[] }) {
  // 36 piezas — más que eso castiga el FPS en mobile.
  const pieces = useConfettiPieces(colors, 36);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
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
            rotate: p.rotate + 540,
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
            boxShadow: `0 0 8px ${p.color}55`,
          }}
        />
      ))}
    </div>
  );
}

function ParticlesLayer({ color }: { color: string }) {
  // Partículas grandes flotantes ambientales — solo 12, baja opacidad,
  // efecto humo dorado / niebla iluminada.
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: 50 + Math.random() * 50,
        size: 80 + Math.random() * 120,
        delay: Math.random() * 5,
        duration: 9 + Math.random() * 6,
      })),
    [],
  );
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: `${p.y}vh`, opacity: 0 }}
          animate={{
            y: [`${p.y}vh`, `${p.y - 30}vh`],
            opacity: [0, 0.18, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: `${p.x}vw`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            filter: "blur(20px)",
          }}
        />
      ))}
    </div>
  );
}

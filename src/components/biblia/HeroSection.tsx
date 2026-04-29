"use client";

// HeroSection — versión profesional, escalable a las 48 selecciones.
// Sin SCROLL animado. 2 stats. Tokens BIBLIA (#94a3b8, no #6a7a9a).
// Bandera con FlagFrame (efectos CSS uniformes para todas).

import Link from "next/link";
import type { NationalTeam } from "@/types/team";
import { BallIcon, TrophyIcon } from "./icons";
import FlagFrame from "./FlagFrame";

export default function HeroSection({ team }: { team: NationalTeam }) {
  const colors = team.flag?.colors ?? {
    primary: "#75AADB",
    secondary: "#FFFFFF",
    contrast_text: "#0F1D32",
  };

  const rank = team.fifa_ranking?.current;
  const appearances = team.history?.appearances_count_with_2026 ?? 0;
  const titles = team.history?.titles ?? 0;
  const titlesYears = team.history?.titles_years ?? [];
  const bestRank = team.fifa_ranking?.all_time_high?.rank ?? rank;

  const groupLetter = team.wc_2026?.group_2026?.letter?.toLowerCase();
  const groupHref = groupLetter ? `/grupos/grupo-${groupLetter}` : "/grupos";

  return (
    <section
      className="relative flex items-center"
      style={{
        minHeight: "min(720px, 80vh)",
        // Recorte solo horizontal (para que el fondo blureado no salga
        // por los lados), pero el div del FlagFrame tiene su propia caja
        // donde sí pueden expandirse las auras.
        overflow: "hidden",
      }}
    >
      {/* Fondo: bandera blureada + capas */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(https://flagcdn.com/w1280/${team.iso}.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(48px) saturate(1.4)",
          transform: "scale(1.18)",
          opacity: 0.28,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            rgba(6,11,20,0.72) 0%,
            rgba(6,11,20,0.9) 60%,
            rgba(6,11,20,1) 100%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 25% 25%,
            ${hexToRgba(colors.primary, 0.22)} 0%, transparent 55%)`,
        }}
      />

      {/* Contenido */}
      <div
        id="identidad"
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16"
      >
        {/* Breadcrumb */}
        <nav className="text-xs mb-6" aria-label="Breadcrumb">
          <ol className="flex gap-2 items-center">
            <li>
              <Link
                href="/selecciones"
                className="bb-focusable text-[var(--bb-text-muted)] hover:text-[var(--bb-gold)] transition-colors"
              >
                Selecciones
              </Link>
            </li>
            <li className="text-[var(--bb-text-dim)]" aria-hidden>
              ›
            </li>
            <li className="text-[var(--bb-gold)] font-medium" aria-current="page">
              {team.name_es}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.85fr] gap-10 lg:gap-12 items-center">
          {/* Columna izquierda */}
          <div>
            {/* Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Pill color={colors.primary}>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: colors.primary,
                    boxShadow: `0 0 8px ${colors.primary}`,
                  }}
                  aria-hidden
                />
                {team.confederation}
              </Pill>

              {rank ? (
                <Pill
                  color="#C9A84C"
                  ariaLabel={`Ranking FIFA actual: número ${rank}${
                    bestRank && bestRank !== rank
                      ? ` · Mejor histórico número ${bestRank}`
                      : ""
                  }`}
                >
                  FIFA #{rank}
                  {bestRank && bestRank < rank ? (
                    <span className="opacity-60 ml-1.5 font-normal">
                      · mejor #{bestRank}
                    </span>
                  ) : null}
                </Pill>
              ) : null}

              <Pill color="#4ade80">
                <CheckIcon />
                Clasificada · Mundial 2026
              </Pill>
            </div>

            {/* Nombre */}
            <h1
              className="font-black text-white leading-[0.95] tracking-tight mb-4"
              style={{
                fontSize: "clamp(56px, 10vw, 112px)",
                letterSpacing: "-0.035em",
              }}
            >
              {team.name_es}
            </h1>

            {/* Apodos */}
            {team.nicknames && team.nicknames.length > 0 ? (
              <p
                className="text-base sm:text-xl mb-8 font-medium"
                style={{ color: colors.primary }}
              >
                {team.nicknames.join(" · ")}
              </p>
            ) : null}

            {/* 2 Stats — solo Mundiales y Títulos (los más fuertes) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 max-w-md">
              <StatCard
                icon={<BallIcon className="w-7 h-7" />}
                value={appearances}
                label1="Mundiales"
                label2="disputados"
              />
              <StatCard
                icon={<TrophyIcon className="w-8 h-8" />}
                value={titles}
                label1={titles > 0 ? "Títulos" : "Mejor"}
                label2={
                  titles > 0
                    ? `(${titlesYears.join(", ")})`
                    : team.history?.best_result?.split(" ")[0] ?? "—"
                }
                accent={titles > 0}
              />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={groupHref}
                className="bb-focusable group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[#030712] font-bold text-sm transition-all bb-touch"
                style={{
                  background: "linear-gradient(135deg, #C9A84C, #E8D48B)",
                  boxShadow:
                    "0 0 0 1px rgba(232,212,139,0.55), 0 12px 30px -8px rgba(201,168,76,0.45)",
                }}
              >
                <span>Predice los partidos de {team.name_es}</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="#clasificacion"
                className="bb-focusable inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border text-white font-semibold text-sm transition-all bb-touch hover:bg-white/10"
                style={{
                  borderColor: "rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Ver camino al Mundial
              </Link>
            </div>
          </div>

          {/* Columna derecha — bandera con efectos.
              Padding generoso (p-8) para que las auras (-60px inset) y los
              sparkles tengan sitio donde expandirse sin quedar clipped por
              el overflow:hidden del <section>. */}
          <div className="p-6 sm:p-10">
            <FlagFrame
              iso={team.iso}
              colors={colors}
              alt={`Bandera de ${team.name_es}`}
              aspect="3 / 2"
            />

            {/* Federación bajo la bandera */}
            {team.federation ? (
              <div className="mt-5 flex items-center justify-between gap-4 text-xs">
                <span className="text-[var(--bb-text-soft)]">
                  <strong className="text-white font-bold">
                    {team.federation.abbreviation}
                  </strong>{" "}
                  ·{" "}
                  <span className="text-[var(--bb-text-muted)]">
                    {team.federation.name}
                  </span>
                </span>
                {team.federation.founded ? (
                  <span className="text-[var(--bb-text-dim)] whitespace-nowrap">
                    Fundada {team.federation.founded}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────── Pill ──────── */

function Pill({
  color,
  children,
  ariaLabel,
}: {
  color: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wider uppercase"
      style={{
        borderColor: hexToRgba(color, 0.45),
        background: hexToRgba(color, 0.08),
        color,
      }}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ──────── StatCard ──────── */

function StatCard({
  icon,
  value,
  label1,
  label2,
  accent,
}: {
  icon: React.ReactNode;
  value: string | number;
  label1: string;
  label2?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[140px]"
      style={{
        background: accent
          ? "linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.03))"
          : "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(11,24,37,0.6))",
        border: `1px solid ${accent ? "rgba(201,168,76,0.4)" : "var(--bb-border-subtle)"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`font-black leading-none text-4xl sm:text-5xl ${accent ? "text-[var(--bb-gold)]" : "text-white"}`}
        >
          {value}
        </span>
        <span
          className={accent ? "text-[var(--bb-gold-soft)]" : "text-[var(--bb-icon-blue)]"}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      <div className="mt-3">
        <div
          className={`text-[10px] uppercase tracking-[0.2em] font-bold ${accent ? "text-[var(--bb-gold)]" : "text-[var(--bb-text-soft)]"}`}
        >
          {label1}
        </div>
        {label2 ? (
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mt-0.5 text-[var(--bb-text-muted)]">
            {label2}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ──────── Helpers ──────── */

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(117,170,219,${alpha})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NationalTeam } from "@/types/team";
import { BallIcon, TrophyIcon, RankIcon } from "./icons";

/*
  HeroSection (BIBLIA Mundial 2026) — Diseño v2

  Hero pantalla completa con:
   - Fondo: bandera del país blureada + capas de gradient con sus colores
   - Pills refinadas (CONMEBOL con punto · FIFA #1 en cuadrado dorado ·
     CLASIFICADA con check verde)
   - Nombre gigante
   - Apodos en celeste claro
   - 3 stats con iconos:
       · Mundiales disputados (BallIcon, dorado)
       · Títulos ganados (TrophyIcon, **destacado con glow dorado** —
         es la card protagonista)
       · Mejor resultado + Mejor ranking FIFA (RankIcon)
   - 2 CTAs (Predice + Ver camino)
   - Bandera grande a la derecha con marco luminoso dorado
   - "AFA · Asociación del Fútbol Argentino · Fundada XXXX" debajo
   - Indicador SCROLL con icono mouse + scroll-wheel animado
*/

export default function HeroSection({ team }: { team: NationalTeam }) {
  const colors = team.flag?.colors ?? {
    primary: "#75AADB",
    secondary: "#FFFFFF",
    contrast_text: "#0F1D32",
  };

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const rank = team.fifa_ranking?.current;
  const appearances = team.history?.appearances_count_with_2026 ?? 0;
  const titles = team.history?.titles ?? 0;
  const titlesYears = team.history?.titles_years ?? [];
  const bestResult = team.history?.best_result ?? "—";

  // Stat 3: Mejor ranking FIFA. Si no viene un all_time_high, usamos
  // el current como referencia.
  const bestRank = team.fifa_ranking?.all_time_high?.rank ?? rank;

  const flagUrl = `https://flagcdn.com/w1280/${team.iso}.png`;
  const flagSm = `https://flagcdn.com/w320/${team.iso}.png`;

  const groupLetter = team.wc_2026?.group_2026?.letter?.toLowerCase();
  const groupHref = groupLetter ? `/grupos/grupo-${groupLetter}` : "/grupos";

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "min(900px, 95vh)" }}
    >
      {/* Fondo: bandera blureada + capas */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${flagUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(40px) saturate(1.4)",
          transform: "scale(1.15)",
          opacity: 0.3,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            rgba(6,11,20,0.7) 0%,
            rgba(6,11,20,0.88) 60%,
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
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.5) 50%, transparent 51%)",
          backgroundSize: "140px 100%",
        }}
      />

      {/* Contenido */}
      <div
        id="identidad"
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-20"
      >
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-6">
          <ol className="flex gap-2 items-center">
            <li>
              <Link
                href="/selecciones"
                className="hover:text-[#C9A84C] transition-colors"
              >
                Selecciones
              </Link>
            </li>
            <li className="text-gray-700">›</li>
            <li className="text-[#C9A84C] font-medium">{team.name_es}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12 items-center">
          {/* Columna izquierda */}
          <div>
            {/* Pills refinadas */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {/* CONMEBOL — outline azul con punto */}
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wider uppercase"
                style={{
                  borderColor: hexToRgba(colors.primary, 0.45),
                  background: hexToRgba(colors.primary, 0.08),
                  color: colors.primary,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: colors.primary,
                    boxShadow: `0 0 8px ${colors.primary}`,
                  }}
                />
                {team.confederation}
              </span>

              {/* FIFA #X — chip dorado tipo placa */}
              {rank ? (
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wider uppercase"
                  style={{
                    borderColor: "rgba(201,168,76,0.45)",
                    background: "rgba(201,168,76,0.06)",
                    color: "#C9A84C",
                  }}
                >
                  FIFA #{rank}
                </span>
              ) : null}

              {/* CLASIFICADA — verde con check */}
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wider uppercase"
                style={{
                  borderColor: "rgba(34,197,94,0.4)",
                  background: "rgba(34,197,94,0.08)",
                  color: "#4ade80",
                }}
              >
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
                Clasificada · Mundial 2026
              </span>
            </div>

            {/* Nombre gigante */}
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

            {/* Stats — 3 cards (Títulos destacada con glow) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 max-w-[640px]">
              <StatCard
                icon={<BallIcon className="w-7 h-7" />}
                value={appearances}
                label1="Mundiales"
                label2="Disputados"
              />
              <StatCard
                icon={<TrophyIcon className="w-8 h-8" />}
                value={titles}
                label1="Títulos"
                label2="Ganados"
                glow
              />
              <StatCard
                icon={<RankIcon className="w-7 h-7" />}
                value={
                  titlesYears.length > 0 ? "Campeón" : bestResult.split(" ")[0]
                }
                valueSize="sm"
                label1={titlesYears.length > 0 ? `(${titlesYears.join(", ")})` : "Mejor"}
                label2={`Mejor ranking FIFA: ${bestRank ?? "—"}º`}
                tall
              />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={groupHref}
                className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[#030712] font-bold text-sm transition-all"
                style={{
                  background: "linear-gradient(135deg, #C9A84C, #E8D48B)",
                  boxShadow:
                    "0 0 0 1px rgba(232,212,139,0.6), 0 12px 30px -8px rgba(201,168,76,0.55)",
                }}
              >
                <span className="relative z-10">
                  Predice los partidos de {team.name_es}
                </span>
                <svg
                  className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5"
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
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border text-white font-semibold text-sm transition-all"
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

          {/* Columna derecha — bandera con marco luminoso */}
          <div className="relative">
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                aspectRatio: "3 / 2",
                boxShadow: `
                  0 0 0 2px ${hexToRgba(colors.primary, 0.5)},
                  0 0 40px ${hexToRgba(colors.primary, 0.35)},
                  0 30px 80px -20px rgba(0,0,0,0.8)
                `,
              }}
            >
              {/* Borde luminoso dorado */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-3xl pointer-events-none z-10"
                style={{
                  boxShadow:
                    "inset 0 0 0 1px rgba(201,168,76,0.45), inset 0 0 40px rgba(201,168,76,0.08)",
                }}
              />
              <img
                src={flagSm}
                srcSet={`${flagSm} 320w, ${flagUrl} 1280w`}
                sizes="(max-width: 768px) 100vw, 50vw"
                alt={`Bandera de ${team.name_es}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay sutil */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, transparent 55%, ${hexToRgba(colors.primary, 0.1)} 100%)`,
                }}
              />
            </div>

            {/* Federación bajo la bandera */}
            {team.federation ? (
              <div className="mt-5 flex items-center justify-between gap-4 text-xs">
                <span className="text-gray-300">
                  <strong className="text-white font-bold">
                    {team.federation.abbreviation}
                  </strong>{" "}
                  ·{" "}
                  <span className="text-gray-400">
                    {team.federation.name}
                  </span>
                </span>
                {team.federation.founded ? (
                  <span className="text-gray-500 whitespace-nowrap">
                    Fundada {team.federation.founded}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Indicador SCROLL */}
      <div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 pointer-events-none"
        style={{ opacity: scrolled ? 0 : 0.6 }}
      >
        <div className="text-[10px] tracking-[5px] text-gray-400 mb-2 text-center font-semibold">
          SCROLL
        </div>
        <div
          className="w-6 h-10 border-2 rounded-full flex items-start justify-center pt-2 mx-auto"
          style={{ borderColor: "rgba(255,255,255,0.25)" }}
        >
          <div
            className="w-1 h-2 rounded-full"
            style={{
              background: colors.primary,
              animation: "scrollWheel 1.6s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes scrollWheel {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          80% {
            transform: translateY(8px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}

/* ────── StatCard ────── */

function StatCard({
  icon,
  value,
  label1,
  label2,
  glow,
  tall,
  valueSize = "md",
}: {
  icon: React.ReactNode;
  value: string | number;
  label1: string;
  label2?: string;
  glow?: boolean;
  tall?: boolean;
  valueSize?: "sm" | "md";
}) {
  return (
    <div
      className="relative rounded-2xl p-4 sm:p-5 min-h-[140px] flex flex-col justify-between"
      style={{
        background: glow
          ? "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.04))"
          : "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(11,24,37,0.6))",
        border: `1px solid ${glow ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: glow
          ? "0 0 32px rgba(201,168,76,0.18), inset 0 0 32px rgba(201,168,76,0.06)"
          : "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`font-black leading-none ${
            valueSize === "sm" ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"
          } ${glow ? "text-[#C9A84C]" : "text-white"}`}
          style={{
            textShadow: glow ? "0 0 24px rgba(201,168,76,0.5)" : undefined,
          }}
        >
          {value}
        </span>
        <span
          className={glow ? "text-[#E8D48B]" : "text-[#7CC0FF]"}
          aria-hidden
          style={{
            filter: glow
              ? "drop-shadow(0 0 8px rgba(201,168,76,0.5))"
              : "drop-shadow(0 0 6px rgba(124,192,255,0.3))",
          }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3">
        <div
          className={`uppercase tracking-[0.2em] font-bold ${
            tall ? "text-[9px]" : "text-[10px]"
          } ${glow ? "text-[#C9A84C]" : "text-gray-300"}`}
        >
          {label1}
        </div>
        {label2 ? (
          <div
            className={`uppercase tracking-[0.18em] font-semibold mt-0.5 ${
              tall ? "text-[9px]" : "text-[10px]"
            } text-gray-500`}
          >
            {label2}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ────── Helpers ────── */

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(117,170,219,${alpha})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

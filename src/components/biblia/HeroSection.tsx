"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NationalTeam } from "@/types/team";

/*
  HeroSection (BIBLIA Mundial 2026)

  Pantalla completa con la bandera del país (blur de fondo + acento
  con los colores oficiales de la selección), nombre, apodos, FIFA
  rank, confederación, estado de clasificación, 3 stats rápidas
  (Mundiales, Títulos, Mejor resultado) y CTA principal.

  El gradient de fondo se construye dinámicamente desde
  team.flag.colors → cada selección queda visualmente única.
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

  // FIFA rank con sufijo bonito (#1, #2, #3, ... #21)
  const rank = team.fifa_ranking?.current;

  // Stats clave: Mundiales, Títulos, Mejor resultado
  const appearances = team.history?.appearances_count_with_2026 ?? 0;
  const titles = team.history?.titles ?? 0;
  const bestResult = team.history?.best_result ?? "—";

  // Bandera (flagcdn)
  const flagUrl = `https://flagcdn.com/w1280/${team.iso}.png`;
  const flagSm = `https://flagcdn.com/w320/${team.iso}.png`;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        // Mínimo 90vh para que el hero ocupe pantalla completa en desktop
        minHeight: "min(880px, 95vh)",
      }}
    >
      {/* Fondo: bandera blureada + capa oscura + radial con color primario */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${flagUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(28px) saturate(1.3)",
          transform: "scale(1.1)",
          opacity: 0.35,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            rgba(6,11,20,0.65) 0%,
            rgba(6,11,20,0.85) 60%,
            rgba(6,11,20,1) 100%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%,
            ${hexToRgba(colors.primary, 0.25)} 0%,
            transparent 60%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 70% 80%,
            ${hexToRgba(colors.secondary, 0.12)} 0%,
            transparent 50%)`,
        }}
      />

      {/* Líneas verticales decorativas (mesh) */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.5) 50%, transparent 51%)",
          backgroundSize: "120px 100%",
        }}
      />

      {/* Contenido */}
      <div
        id="identidad"
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20"
      >
        {/* Breadcrumb sutil */}
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
            <li className="text-gray-700">/</li>
            <li className="text-[#C9A84C] font-medium">{team.name_es}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-center">
          {/* Columna texto */}
          <div>
            {/* Pills superiores */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wider uppercase"
                style={{
                  borderColor: hexToRgba(colors.primary, 0.4),
                  background: hexToRgba(colors.primary, 0.1),
                  color: colors.primary,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: colors.primary }}
                />
                {team.confederation}
              </span>
              {rank ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/5 text-xs font-bold text-[#C9A84C] tracking-wider uppercase">
                  FIFA #{rank}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/5 text-xs font-bold text-green-400 tracking-wider uppercase">
                Clasificada · Mundial 2026
              </span>
            </div>

            {/* Nombre grande */}
            <h1
              className="font-black text-white leading-[0.95] tracking-tight mb-4"
              style={{
                fontSize: "clamp(48px, 9vw, 96px)",
                letterSpacing: "-0.03em",
              }}
            >
              {team.name_es}
            </h1>

            {/* Apodos */}
            {team.nicknames && team.nicknames.length > 0 ? (
              <p
                className="text-lg sm:text-xl mb-6"
                style={{ color: colors.primary }}
              >
                {team.nicknames.join(" · ")}
              </p>
            ) : null}

            {/* Stats rápidas */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 max-w-md">
              <Stat label="Mundiales" value={appearances} />
              <Stat label="Títulos" value={titles} accent={titles > 0} />
              <Stat label="Mejor" value={bestResult} small />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/grupos/grupo-${team.wc_2026?.group_2026?.letter?.toLowerCase() ?? ""}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[#030712] font-bold text-sm transition-all hover:shadow-lg hover:shadow-[#C9A84C]/25"
                style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
              >
                Predice los partidos de {team.name_es}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="#clasificacion"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-semibold text-sm transition-all hover:bg-white/10"
              >
                Ver camino al Mundial
              </Link>
            </div>
          </div>

          {/* Columna bandera */}
          <div className="relative">
            <div
              className="relative rounded-3xl overflow-hidden border-2"
              style={{
                aspectRatio: "3 / 2",
                borderColor: hexToRgba(colors.primary, 0.3),
                boxShadow: `0 30px 80px -20px ${hexToRgba(colors.primary, 0.4)}`,
              }}
            >
              {/* Bandera */}
              <img
                src={flagSm}
                srcSet={`${flagSm} 320w, ${flagUrl} 1280w`}
                sizes="(max-width: 768px) 100vw, 50vw"
                alt={`Bandera de ${team.name_es}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay sutil para integración */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, transparent 50%, ${hexToRgba(colors.primary, 0.15)} 100%)`,
                }}
              />
            </div>

            {/* Federación bajo la bandera */}
            {team.federation ? (
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  <strong className="text-white">{team.federation.abbreviation}</strong>{" "}
                  · {team.federation.name}
                </span>
                <span className="text-gray-500">
                  Fundada {team.federation.founded}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 pointer-events-none"
        style={{ opacity: scrolled ? 0 : 0.5 }}
      >
        <div className="text-[10px] tracking-[4px] text-gray-500 mb-2 text-center">
          SCROLL
        </div>
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center pt-2 mx-auto">
          <div
            className="w-1 h-2 rounded-full animate-bounce"
            style={{ background: colors.primary }}
          />
        </div>
      </div>
    </section>
  );
}

/* ----- Helpers ----- */

function Stat({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-3 sm:p-4"
      style={{
        borderColor: accent ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)",
        background: accent ? "rgba(201,168,76,0.06)" : "rgba(15,23,42,0.5)",
      }}
    >
      <div
        className={`font-black ${accent ? "text-[#C9A84C]" : "text-white"} ${
          small ? "text-base sm:text-lg" : "text-2xl sm:text-3xl"
        } leading-tight`}
      >
        {value}
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 mt-1 font-semibold">
        {label}
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(117,170,219,${alpha})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

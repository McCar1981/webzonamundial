"use client";

import Image from "next/image";
import { PHASE_COLORS, flagUrl, GOLD, DIM, DARK } from "@/data/matches";
import type { Match } from "@/data/matches";

interface MatchCardProps {
  m: Match;
  onClick: () => void;
}

export function MatchCard({ m, onClick }: MatchCardProps) {
  const isImportant = m.p === "FINAL" || m.p === "Semifinal";
  const phaseColor = PHASE_COLORS[m.p] || GOLD;

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-[20px] border-2 border-white/5 bg-[#0F1D32] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:scale-[1.02] hover:border-[#c9a84c]/50 hover:shadow-[0_20px_60px_rgba(201,168,76,0.15),0_8px_24px_rgba(0,0,0,0.4)]"
    >
      {/* Fondo con gradiente según fase */}
      <div
        className="absolute inset-0 opacity-60 transition-opacity duration-400 group-hover:opacity-100"
        style={{
          background: isImportant
            ? "linear-gradient(135deg, rgba(201,168,76,0.12), transparent 60%)"
            : `linear-gradient(135deg, ${phaseColor}10, transparent 60%)`,
        }}
      />

      {/* Barra de color según fase arriba */}
      <div
        className="absolute left-0 right-0 top-0 h-[3px] transition-all duration-400 group-hover:scale-x-100 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${isImportant ? GOLD : phaseColor}, transparent)`,
          transform: "scaleX(0.3)",
          opacity: 0.6,
        }}
      />

      <div className="relative z-10 p-5">
        {/* Header con badges */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {m.g && (
              <span className="rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/15 px-2.5 py-1 text-[11px] font-black text-[#c9a84c]">
                GRUPO {m.g}
              </span>
            )}
            <span className="text-[11px] font-semibold text-[#6a7a9a]">J{m.j}</span>
            {!m.g && (
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
                style={{
                  color: phaseColor,
                  background: `${phaseColor}15`,
                }}
              >
                {m.p}
              </span>
            )}
          </div>
          <span className="rounded-lg bg-[#c9a84c]/10 px-3 py-1 text-sm font-extrabold tabular-nums text-[#c9a84c]">
            {m.t}
          </span>
        </div>

        {/* Equipos - Layout horizontal */}
        <div className="flex items-center justify-between gap-3">
          {/* Local */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="h-[46px] w-16 overflow-hidden rounded-[10px] border-2 border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:border-white/20 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              {m.hf && m.hf !== "tbd" ? (
                <Image
                  src={flagUrl(m.hf, 160)!}
                  alt=""
                  width={64}
                  height={46}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/5">
                  <span className="text-xl text-[#6a7a9a]">?</span>
                </div>
              )}
            </div>
            <span className="text-center text-sm font-bold text-[#d0d4de] transition-colors duration-300 group-hover:text-white">
              {m.h}
            </span>
          </div>

          {/* VS Badge */}
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border-2 border-white/[0.06] bg-white/[0.03] transition-all duration-300 group-hover:border-[#c9a84c]/40 group-hover:bg-gradient-to-br group-hover:from-[#c9a84c]/20 group-hover:to-[#c9a84c]/10 group-hover:shadow-[0_0_20px_rgba(201,168,76,0.2)]">
            <span className="text-xs font-black text-[#6a7a9a] transition-colors duration-300 group-hover:text-[#c9a84c]">
              VS
            </span>
          </div>

          {/* Visitante */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="h-[46px] w-16 overflow-hidden rounded-[10px] border-2 border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:border-white/20 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              {m.af && m.af !== "tbd" ? (
                <Image
                  src={flagUrl(m.af, 160)!}
                  alt=""
                  width={64}
                  height={46}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/5">
                  <span className="text-xl text-[#6a7a9a]">?</span>
                </div>
              )}
            </div>
            <span className="text-center text-sm font-bold text-[#d0d4de] transition-colors duration-300 group-hover:text-white">
              {m.a}
            </span>
          </div>
        </div>

        {/* Estadio */}
        <div className="mt-4 flex items-center justify-center gap-2 border-t border-white/5 pt-4">
          {m.vf && (
            <Image
              src={flagUrl(m.vf, 40)!}
              alt=""
              width={16}
              height={11}
              className="rounded-sm object-cover"
              unoptimized
            />
          )}
          <span className="text-xs text-[#4a5570] transition-colors duration-300 group-hover:text-[#8a94b0]">
            {m.vn}
          </span>
          <span className="text-white/10">•</span>
          <span className="text-xs text-[#6a7a9a]">{m.vc}</span>
        </div>
      </div>
    </div>
  );
}

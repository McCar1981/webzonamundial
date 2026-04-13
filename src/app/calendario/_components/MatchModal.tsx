"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/i18n/LanguageContext";
import { SvgIcon } from "@/components/icons";
import { MATCHES, PHASE_COLORS, flagUrl, fmtDate, GOLD, BG, BG2, BG3, MID, DIM } from "@/data/matches";
import type { Match } from "@/data/matches";

interface MatchModalProps {
  m: Match;
  onClose: () => void;
  onNav: (id: number) => void;
}

export function MatchModal({ m, onClose, onNav }: MatchModalProps) {
  const { t } = useLanguage();
  const cT = t.calendario;

  const sameDay = useMemo(() => MATCHES.filter((x) => x.d === m.d && x.i !== m.i).slice(0, 4), [m.d, m.i]);
  const groupM = useMemo(() => (m.g ? MATCHES.filter((x) => x.g === m.g && x.i !== m.i).slice(0, 3) : []), [m.g, m.i]);
  const idx = MATCHES.findIndex((x) => x.i === m.i);
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnim(true), 50);
    return () => {
      clearTimeout(t);
      setAnim(false);
    };
  }, [m.i]);

  const isFinal = m.p === "FINAL";
  const isSemifinal = m.p === "Semifinal";
  const phaseColor = PHASE_COLORS[m.p] || GOLD;

  const handleReminder = async () => {
    const text = `Recordatorio: ${m.h} vs ${m.a} - ${fmtDate(m.d)} ${m.t} en ${m.vn}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Recordatorio Mundial 2026", text });
        return;
      } catch {
        // fallback
      }
    }
    const subject = encodeURIComponent("Recordatorio Mundial 2026");
    const body = encodeURIComponent(text);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 transition-opacity duration-300"
      style={{
        background: "rgba(6,11,20,0.95)",
        backdropFilter: "blur(10px)",
        opacity: anim ? 1 : 0,
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-auto rounded-[28px] border-2 transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          maxHeight: "90vh",
          background: BG2,
          borderColor: isFinal ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)",
          boxShadow: isFinal ? "0 0 80px rgba(201,168,76,0.2)" : "0 20px 60px rgba(0,0,0,0.5)",
          transform: anim ? "scale(1) translateY(0)" : "scale(0.95) translateY(20px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con cierre */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5 sm:px-8">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[#c9a84c] transition-colors hover:bg-[#c9a84c]/10"
          >
            {cT.volver}
          </button>

          <button
            onClick={handleReminder}
            className="rounded-lg border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-3 py-2 text-xs font-bold text-[#c9a84c] transition-colors hover:bg-[#c9a84c]/20"
          >
            + Recordatorio
          </button>

          {(isFinal || isSemifinal) && (
            <span
              className={`rounded-lg px-4 py-2 text-xs font-extrabold ${
                isFinal
                  ? "bg-gradient-to-br from-[#c9a84c] to-[#e8d48b] text-[#060B14]"
                  : "border border-[#c9a84c]/30 bg-[#c9a84c]/15 text-[#c9a84c]"
              }`}
            >
              {isFinal ? "FINAL" : "SEMIFINAL"}
            </span>
          )}
        </div>

        <div className="p-6 sm:p-8">
          {/* Info del partido */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-4">
              {m.g && (
                <span className="rounded-[10px] border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-3.5 py-1.5 text-[13px] font-extrabold text-[#c9a84c]">
                  {cT.grupo} {m.g} • {cT.jornada} {m.j}
                </span>
              )}
              {!m.g && (
                <span
                  className="rounded-[10px] px-3.5 py-1.5 text-[13px] font-extrabold"
                  style={{ color: phaseColor, background: `${phaseColor}15` }}
                >
                  {m.p}
                </span>
              )}
            </div>

            <div className="mb-2 flex items-center justify-center gap-3">
              <span className="text-lg font-semibold text-[#8a94b0]">{fmtDate(m.d)}</span>
              <span className="text-white/20">|</span>
              <span className="rounded-[10px] bg-[#c9a84c]/10 px-4 py-1.5 text-xl font-extrabold text-[#c9a84c]">
                {m.t}
              </span>
            </div>
          </div>

          {/* Equipos */}
          <div
            className="mb-8 flex items-center justify-center gap-6 rounded-[20px] border border-[#c9a84c]/10 bg-gradient-to-br from-[#c9a84c]/5 to-transparent p-6 sm:gap-10 sm:p-8"
          >
            {/* Local */}
            <div className="flex-1 text-center">
              <div className="mx-auto mb-4 h-[70px] w-[100px] overflow-hidden rounded-2xl border-[3px] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                {m.hf && m.hf !== "tbd" ? (
                  <Image src={flagUrl(m.hf, 320)!} alt="" width={100} height={70} className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/5">
                    <span className="text-3xl text-[#6a7a9a]">?</span>
                  </div>
                )}
              </div>
              <h2 className="mb-1 text-xl font-black sm:text-2xl">{m.h}</h2>
              <span className="text-[13px] text-[#6a7a9a]">{cT.local}</span>
            </div>

            {/* VS */}
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border-2 border-[#c9a84c]/30 bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/10 shadow-[0_0_30px_rgba(201,168,76,0.2)]">
              <span className="text-lg font-black text-[#c9a84c]">VS</span>
            </div>

            {/* Visitante */}
            <div className="flex-1 text-center">
              <div className="mx-auto mb-4 h-[70px] w-[100px] overflow-hidden rounded-2xl border-[3px] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                {m.af && m.af !== "tbd" ? (
                  <Image src={flagUrl(m.af, 320)!} alt="" width={100} height={70} className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/5">
                    <span className="text-3xl text-[#6a7a9a]">?</span>
                  </div>
                )}
              </div>
              <h2 className="mb-1 text-xl font-black sm:text-2xl">{m.a}</h2>
              <span className="text-[13px] text-[#6a7a9a]">{cT.visitante}</span>
            </div>
          </div>

          {/* Estadio */}
          <div className="mb-8 flex items-center justify-center gap-3 rounded-2xl border border-white/5 bg-[#0B1825] px-6 py-4">
            <SvgIcon name="match center" size={24} />
            <div>
              <p className="text-base font-bold text-white">{m.vn}</p>
              <p className="text-sm text-[#8a94b0]">{m.vc}</p>
            </div>
          </div>

          {/* Acciones */}
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/app/predicciones"
              className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[#c9a84c]/20 bg-gradient-to-br from-[#c9a84c]/15 to-[#c9a84c]/5 p-4 text-center transition-all hover:opacity-90"
            >
              <SvgIcon name="predicciones" size={28} />
              <span className="font-bold text-white">{cT.predice}</span>
            </Link>
            <Link
              href="/selecciones"
              className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-white/8 bg-white/[0.03] p-4 text-center transition-all hover:bg-white/5"
            >
              <SvgIcon name="match center" size={28} />
              <span className="font-bold text-[#8a94b0]">{cT.equipos}</span>
            </Link>
            <Link
              href="/sedes"
              className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-white/8 bg-white/[0.03] p-4 text-center transition-all hover:bg-white/5"
            >
              <SvgIcon name="match center" size={28} />
              <span className="font-bold text-[#8a94b0]">{cT.sede}</span>
            </Link>
          </div>

          {/* Partidos del mismo grupo */}
          {groupM.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-4 text-base font-bold">
                <span className="text-[#c9a84c]">
                  {cT.masDeGrupo} {m.g}
                </span>
              </h3>
              <div className="flex flex-col gap-2">
                {groupM.map((x) => (
                  <div
                    key={x.i}
                    onClick={() => onNav(x.i)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.04] bg-[#0B1825] px-4 py-3 transition-all hover:border-[#c9a84c]/20 hover:bg-[#c9a84c]/[0.03]"
                  >
                    <span className="rounded-md bg-[#c9a84c]/10 px-2.5 py-1 text-[11px] font-extrabold text-[#c9a84c]">
                      J{x.j}
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      <span className="font-semibold">{x.h}</span>
                      <span className="text-[#4a5570]">vs</span>
                      <span className="font-semibold">{x.a}</span>
                    </div>
                    <span className="text-[13px] text-[#6a7a9a]">{x.t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="flex justify-between border-t border-white/[0.06] pt-6">
            {idx > 0 ? (
              <button
                onClick={() => onNav(MATCHES[idx - 1].i)}
                className="flex items-center gap-2 bg-transparent text-sm text-[#8a94b0] transition-colors hover:text-white"
              >
                ← {MATCHES[idx - 1].h} vs {MATCHES[idx - 1].a}
              </button>
            ) : (
              <span />
            )}
            {idx < MATCHES.length - 1 && (
              <button
                onClick={() => onNav(MATCHES[idx + 1].i)}
                className="flex items-center gap-2 bg-transparent text-sm text-[#8a94b0] transition-colors hover:text-white"
              >
                {MATCHES[idx + 1].h} vs {MATCHES[idx + 1].a} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

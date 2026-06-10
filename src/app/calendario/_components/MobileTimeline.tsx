"use client";

import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PHASE_COLORS, flagUrl, GOLD } from "@/data/matches";
import type { Match } from "@/data/matches";
import { groupByLocalDay, matchInstant, fmtTime, fmtDayShort } from "@/lib/calendario/time";
import { isFinished, isLive, type LiveMap } from "@/lib/calendario/live";

const LIVE_RED = "#ff6b57";

interface MobileTimelineProps {
  matches: Match[];
  onClick: (m: Match) => void;
  /** TZ del usuario: agrupa por SU día y muestra SU hora. */
  tz: string;
  live: LiveMap;
}

export function MobileTimeline({ matches, onClick, tz, live }: MobileTimelineProps) {
  const { t, locale } = useLanguage();
  const cT = t.calendario;

  const grouped = useMemo(() => groupByLocalDay(matches, tz), [matches, tz]);

  return (
    <div className="space-y-8 sm:hidden">
      {grouped.map((day) => (
        <div key={day.key} className="relative pl-6">
          {/* Línea vertical */}
          <div className="absolute bottom-0 left-[9px] top-8 w-px bg-gradient-to-b from-[#c9a84c]/40 to-transparent" />

          {/* Nodo de fecha */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-5 w-5 rounded-full border-4 border-[#060B14] bg-[#c9a84c] shadow-[0_0_12px_rgba(201,168,76,0.5)]" />
            <div>
              <span className="text-sm font-bold text-[#c9a84c]">
                {fmtDayShort(day.instant, tz, locale)}
              </span>
              <span className="ml-2 text-xs text-[#6a7a9a]">
                {day.matches.length}{" "}
                {day.matches.length === 1 ? cT.partido : cT.partidoPlural}
              </span>
            </div>
          </div>

          {/* Partidos del día */}
          <div className="space-y-3">
            {day.matches.map((m) => {
              const isImportant = m.p === "FINAL" || m.p === "Semifinal";
              const phaseColor = PHASE_COLORS[m.p] || GOLD;
              const snap = live[m.i];
              const playing = isLive(snap);
              const ended = isFinished(snap);
              const instant = matchInstant(m);
              const localTime = instant ? fmtTime(instant, tz) : m.t;
              return (
                <div
                  key={m.i}
                  onClick={() => onClick(m)}
                  className={`relative ml-2.5 cursor-pointer rounded-xl border p-4 transition-all active:scale-[0.98] ${
                    playing
                      ? "border-[#ff6b57]/40"
                      : isImportant
                        ? "border-[#c9a84c]/30"
                        : "border-white/5"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${isImportant ? "rgba(201,168,76,0.08)" : `${phaseColor}08`}, #0F1D32)`,
                  }}
                >
                  {/* Punto conector */}
                  <div className="absolute -left-[25px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[#060B14] bg-[#8a94b0]" />

                  <div className="mb-2 flex items-center justify-between">
                    {playing ? (
                      <span
                        className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold"
                        style={{ color: LIVE_RED, background: "rgba(255,107,87,0.12)" }}
                      >
                        <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ background: LIVE_RED }} />
                        {snap!.s === "HT" ? cT.descanso : `${cT.enVivo} ${snap!.el}'`}
                      </span>
                    ) : ended ? (
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold text-[#8a94b0]">
                        {snap!.s === "PEN" ? cT.penales : cT.finalizado}
                      </span>
                    ) : (
                      <span className="rounded bg-[#c9a84c]/10 px-2 py-0.5 text-[10px] font-bold text-[#c9a84c]">
                        {localTime}
                      </span>
                    )}
                    {m.g ? (
                      <span className="text-[10px] text-[#6a7a9a]">
                        {cT.grupo} {m.g}
                      </span>
                    ) : (
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide"
                        style={{ color: phaseColor, background: `${phaseColor}15` }}
                      >
                        {cT.phases[m.p] ?? m.p}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-1 items-center gap-2">
                      {m.hf && m.hf !== "tbd" ? (
                        <img src={flagUrl(m.hf, 40)!} alt="" width={24} height={16} className="h-4 w-6 rounded object-cover" />
                      ) : (
                        <div className="h-4 w-6 rounded bg-white/5" />
                      )}
                      <span className="truncate text-xs font-semibold text-white">{m.h}</span>
                    </div>
                    {playing || ended ? (
                      <span
                        className="text-xs font-black tabular-nums"
                        style={{ color: playing ? LIVE_RED : "#e8d48b" }}
                      >
                        {snap!.sc[0]}–{snap!.sc[1]}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-[#6a7a9a]">VS</span>
                    )}
                    <div className="flex flex-1 items-center justify-end gap-2">
                      <span className="truncate text-xs font-semibold text-white">{m.a}</span>
                      {m.af && m.af !== "tbd" ? (
                        <img src={flagUrl(m.af, 40)!} alt="" width={24} height={16} className="h-4 w-6 rounded object-cover" />
                      ) : (
                        <div className="h-4 w-6 rounded bg-white/5" />
                      )}
                    </div>
                  </div>

                  <div className="mt-2 truncate text-[10px] text-[#6a7a9a]">
                    {m.vn}
                    {m.vc ? ` • ${m.vc}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

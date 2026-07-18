"use client";

// MobileTimeline — vista móvil del calendario. v2 (UX torneo): filas densas
// tipo livescore (hora · equipos · marcador/fase) en lugar de tarjetas con
// aire; cada día expone id="day-m-<key>" para que la barra de días salte a él.

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

function FlagImg({ code }: { code: string }) {
  return code && code !== "tbd" ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl(code, 40)!}
      alt=""
      width={22}
      height={15}
      className="h-[15px] w-[22px] flex-shrink-0 rounded-[2px] object-cover"
    />
  ) : (
    <span className="flex h-[15px] w-[22px] flex-shrink-0 items-center justify-center rounded-[2px] bg-white/5 text-[9px] text-[#6e6552]">
      ?
    </span>
  );
}

export function MobileTimeline({ matches, onClick, tz, live }: MobileTimelineProps) {
  const { t, locale } = useLanguage();
  const cT = t.calendario;

  const grouped = useMemo(() => groupByLocalDay(matches, tz), [matches, tz]);

  return (
    <div className="space-y-6 sm:hidden">
      {grouped.map((day) => (
        <div
          key={day.key}
          id={`day-m-${day.key}`}
          data-daykey={day.key}
          style={{ scrollMarginTop: 64 }}
        >
          {/* Encabezado del día */}
          <div className="mb-2.5 flex items-baseline gap-2">
            <span className="rounded-md bg-[#c9a84c]/12 px-2 py-0.5 text-[12px] font-black text-[#c9a84c]">
              {fmtDayShort(day.instant, tz, locale)}
            </span>
            <span className="text-[11px] text-[#6e6552]">
              {day.matches.length}{" "}
              {day.matches.length === 1 ? cT.partido : cT.partidoPlural}
            </span>
          </div>

          {/* Filas del día */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0906]/60">
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
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onClick(m);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3 border-b border-white/[0.05] px-3 py-2.5 transition-colors last:border-b-0 active:bg-white/[0.05]"
                  style={{
                    background: playing
                      ? "linear-gradient(90deg, rgba(255,107,87,0.08), transparent 60%)"
                      : isImportant
                        ? "linear-gradient(90deg, rgba(201,168,76,0.08), transparent 60%)"
                        : undefined,
                    scrollMarginTop: 64,
                  }}
                >
                  {/* Columna hora / estado */}
                  <div className="flex w-11 flex-shrink-0 flex-col items-center">
                    {playing ? (
                      <>
                        <span className="text-[13px] font-black tabular-nums" style={{ color: LIVE_RED }}>
                          {snap!.s === "HT" ? "HT" : `${snap!.el}'`}
                        </span>
                        <span className="relative mt-0.5 flex h-1.5 w-1.5">
                          <span className="absolute h-full w-full animate-ping rounded-full opacity-75" style={{ background: LIVE_RED }} />
                          <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: LIVE_RED }} />
                        </span>
                      </>
                    ) : ended ? (
                      <>
                        <span className="text-[11px] font-black text-[#a69a82]">
                          {snap!.s === "PEN" ? cT.penales : cT.finalizado}
                        </span>
                        <span className="text-[9px] tabular-nums text-[#a69a82]">{localTime}</span>
                      </>
                    ) : (
                      <span className="text-[13px] font-black tabular-nums text-[#c9a84c]">
                        {localTime}
                      </span>
                    )}
                  </div>

                  {/* Equipos (dos líneas) */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <FlagImg code={m.hf} />
                      <span className="truncate text-[13px] font-bold text-white">{m.h}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FlagImg code={m.af} />
                      <span className="truncate text-[13px] font-bold text-white">{m.a}</span>
                    </div>
                  </div>

                  {/* Marcador o contexto */}
                  {playing || ended ? (
                    <div className="flex flex-shrink-0 flex-col items-center gap-1 pr-1">
                      <span
                        className="text-[14px] font-black leading-none tabular-nums"
                        style={{ color: playing ? LIVE_RED : "#e8d48b" }}
                      >
                        {snap!.sc[0]}
                      </span>
                      <span
                        className="text-[14px] font-black leading-none tabular-nums"
                        style={{ color: playing ? LIVE_RED : "#e8d48b" }}
                      >
                        {snap!.sc[1]}
                      </span>
                    </div>
                  ) : m.g ? (
                    <span className="flex-shrink-0 rounded-md bg-[#c9a84c]/10 px-1.5 py-0.5 text-[9px] font-extrabold text-[#c9a84c]">
                      {cT.grupo.toUpperCase()} {m.g}
                    </span>
                  ) : (
                    <span
                      className="max-w-[72px] flex-shrink-0 truncate rounded-md px-1.5 py-0.5 text-right text-[9px] font-extrabold uppercase tracking-wide"
                      style={{ color: phaseColor, background: `${phaseColor}15` }}
                    >
                      {cT.phases[m.p] ?? m.p}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

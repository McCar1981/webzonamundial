"use client";

// DayChips — la única barra sticky del calendario (~52px): chip HOY + carril
// de días deslizable + botón Filtros. Sustituye a la antigua barra sticky de
// filtros que en móvil se apilaba y devoraba un tercio de la pantalla.

import { useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const INTL_LOCALE: Record<string, string> = { es: "es-ES", en: "en-US" };

export interface DayChipData {
  key: string;
  instant: Date;
}

interface DayChipsProps {
  days: DayChipData[];
  activeKey: string | null;
  /** Día local de HOY si es día de torneo visible; null fuera del Mundial. */
  todayKey: string | null;
  tz: string;
  onDay: (key: string) => void;
  onOpenFilters: () => void;
  /** Nº de filtros activos (badge del botón Filtros). */
  filterCount: number;
}

export function DayChips({
  days,
  activeKey,
  todayKey,
  tz,
  onDay,
  onOpenFilters,
  filterCount,
}: DayChipsProps) {
  const { t, locale } = useLanguage();
  const cT = t.calendario;
  const railRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // El chip activo se mantiene a la vista dentro del carril (solo scroll
  // horizontal del propio carril, sin mover la página).
  useEffect(() => {
    if (!activeKey) return;
    const chip = chipRefs.current.get(activeKey);
    const rail = railRef.current;
    if (!chip || !rail) return;
    const target = chip.offsetLeft - rail.clientWidth / 2 + chip.clientWidth / 2;
    rail.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeKey]);

  const fmtChip = (instant: Date) => {
    const parts = new Intl.DateTimeFormat(INTL_LOCALE[locale] ?? locale, {
      timeZone: tz,
      weekday: "short",
      day: "numeric",
    }).formatToParts(instant);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return {
      wd: get("weekday").replace(".", "").slice(0, 2).toUpperCase(),
      day: get("day"),
    };
  };

  return (
    <div
      className="sticky top-0 z-30 -mx-6 mb-5 border-b border-white/5 px-3 backdrop-blur-md sm:px-4"
      style={{
        background: "linear-gradient(180deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.88) 100%)",
      }}
    >
      <div className="mx-auto flex h-[52px] max-w-6xl items-center gap-2">
        {todayKey && (
          <button
            onClick={() => onDay(todayKey)}
            className="flex-shrink-0 rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#e8d48b] px-3 py-1.5 text-[11px] font-black tracking-wide text-[#000000] transition-transform hover:scale-[1.04]"
          >
            {cT.hoy}
          </button>
        )}

        <div
          ref={railRef}
          className="flex flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {days.map((d) => {
            const { wd, day } = fmtChip(d.instant);
            const active = d.key === activeKey;
            const isToday = d.key === todayKey;
            return (
              <button
                key={d.key}
                ref={(el) => {
                  if (el) chipRefs.current.set(d.key, el);
                  else chipRefs.current.delete(d.key);
                }}
                onClick={() => onDay(d.key)}
                aria-current={active ? "date" : undefined}
                className={`flex w-10 flex-shrink-0 flex-col items-center rounded-lg border py-1 leading-none transition-colors ${
                  active
                    ? "border-[#c9a84c]/60 bg-[#c9a84c]/15"
                    : isToday
                      ? "border-[#c9a84c]/30 bg-transparent hover:bg-white/5"
                      : "border-transparent bg-transparent hover:bg-white/5"
                }`}
              >
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider ${
                    active ? "text-[#e8d48b]" : "text-[#6e6552]"
                  }`}
                >
                  {wd}
                </span>
                <span
                  className={`mt-0.5 text-[13px] font-black tabular-nums ${
                    active ? "text-[#c9a84c]" : isToday ? "text-[#e8d48b]" : "text-[#aab3c7]"
                  }`}
                >
                  {day}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenFilters}
          className={`relative flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors ${
            filterCount > 0
              ? "border-[#c9a84c]/50 bg-[#c9a84c]/10 text-[#c9a84c]"
              : "border-white/10 bg-white/[0.03] text-[#a69a82] hover:border-white/20 hover:text-white"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          {cT.filtros}
          {filterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#c9a84c] text-[9px] font-black text-[#000000]">
              {filterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

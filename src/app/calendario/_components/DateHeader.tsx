"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { fmtDayLong, fmtDayShort } from "@/lib/calendario/time";

interface DateHeaderProps {
  /** Instante del primer partido del día (la fecha se formatea en la TZ del usuario). */
  instant: Date;
  tz: string;
  count: number;
}

// Encabezado de día compacto (una línea). No es sticky: la barra de días
// DayChips ya da contexto permanente de dónde estás.
export function DateHeader({ instant, tz, count }: DateHeaderProps) {
  const { t, locale } = useLanguage();
  const cT = t.calendario;

  return (
    <div className="mb-3 flex items-baseline gap-3">
      <span className="rounded-lg border border-[#c9a84c]/20 bg-gradient-to-br from-[#c9a84c]/15 to-[#c9a84c]/5 px-3 py-1 text-[13px] font-black text-[#c9a84c]">
        {fmtDayShort(instant, tz, locale)}
      </span>
      <span className="text-[15px] font-semibold text-[#aab3c7]">
        {fmtDayLong(instant, tz, locale)}
      </span>
      <span className="text-[12px] text-[#6a7a9a]">
        · {count} {count === 1 ? cT.partido : cT.partidoPlural}
      </span>
    </div>
  );
}

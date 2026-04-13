"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { fmtDate, fmtShort } from "@/data/matches";
import { SvgIcon } from "@/components/icons";

interface DateHeaderProps {
  date: string;
  count: number;
}

export function DateHeader({ date, count }: DateHeaderProps) {
  const { t } = useLanguage();
  const cT = t.calendario;

  return (
    <div
      className="sticky top-0 z-10 mb-6 flex items-center gap-4 py-4"
      style={{
        background: `linear-gradient(180deg,#060B14 80%,transparent)`,
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-[#c9a84c]/30 bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 shadow-[0_0_20px_rgba(201,168,76,0.15)]"
      >
        <SvgIcon name="formato 2026" size={20} />
      </div>

      <div>
        <div className="flex items-center gap-3">
          <span className="rounded-[10px] border border-[#c9a84c]/20 bg-gradient-to-br from-[#c9a84c]/15 to-[#c9a84c]/5 px-4 py-1.5 text-sm font-black text-[#c9a84c]"
          >
            {fmtShort(date)}
          </span>
          <span className="text-base font-semibold text-[#8a94b0]">
            {fmtDate(date)}
          </span>
        </div>
        <span className="mt-1 block text-[13px] text-[#6a7a9a]">
          {count} {count === 1 ? cT.partido : cT.partidoPlural}
        </span>
      </div>
    </div>
  );
}

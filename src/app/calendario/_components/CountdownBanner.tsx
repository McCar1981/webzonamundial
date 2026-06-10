"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import useCountdown from "@/hooks/useCountdown";

export function CountdownBanner() {
  const { t } = useLanguage();
  const cT = t.calendario;
  const { d, h, m, s, done } = useCountdown();

  // Con el Mundial ya en marcha, la cuenta atrás deja paso a un banner vivo
  // (antes se quedaba congelada en 00 00 00 00 los 39 días del torneo).
  if (done) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#c9a84c]/30 bg-gradient-to-br from-[#1a1405] via-[#0f0c05] to-[#1a1405] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.15),transparent_50%)]" />
        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ff6b57]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b57] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#ff6b57]" />
            </span>
            {cT.enVivo}
          </span>
          <p className="text-2xl font-black text-white sm:text-3xl">{cT.enJuego}</p>
          <p className="max-w-md text-sm text-[#8a94b0]">{cT.enJuegoDesc}</p>
          <Link
            href="/app/matchcenter"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e8d48b] px-6 py-3 text-sm font-extrabold text-[#060B14] no-underline transition-transform hover:scale-[1.02]"
          >
            {cT.verDirecto}
          </Link>
        </div>
      </div>
    );
  }

  const items = [
    { value: d, label: cT.dias },
    { value: h, label: cT.horas },
    { value: m, label: cT.minutos },
    { value: s, label: cT.segundos },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#c9a84c]/30 bg-gradient-to-br from-[#1a1405] via-[#0f0c05] to-[#1a1405] p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.15),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(201,168,76,0.10),transparent_50%)]" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#e8d48b]">
          {cT.inauguracion}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex min-w-[5.5rem] flex-col items-center rounded-xl border border-[#c9a84c]/20 bg-gradient-to-b from-[#c9a84c]/10 to-transparent px-4 py-3 shadow-lg"
            >
              <span className="text-2xl font-black tabular-nums text-white sm:text-3xl">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a94b0]">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

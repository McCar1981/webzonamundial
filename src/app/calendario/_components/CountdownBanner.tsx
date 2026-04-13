"use client";

import useCountdown from "@/hooks/useCountdown";

export function CountdownBanner() {
  const { d, h, m, s } = useCountdown();

  const items = [
    { value: d, label: "Días" },
    { value: h, label: "Horas" },
    { value: m, label: "Minutos" },
    { value: s, label: "Segundos" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#c9a84c]/30 bg-gradient-to-br from-[#1a1405] via-[#0f0c05] to-[#1a1405] p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.15),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(201,168,76,0.10),transparent_50%)]" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#e8d48b]">
          Inauguración 11 de junio de 2026
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

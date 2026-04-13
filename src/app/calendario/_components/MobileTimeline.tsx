"use client";

import { useMemo } from "react";
import { PHASE_COLORS, fmtShort, flagUrl, GOLD } from "@/data/matches";
import type { Match } from "@/data/matches";

interface MobileTimelineProps {
  matches: Match[];
  onClick: (m: Match) => void;
}

export function MobileTimeline({ matches, onClick }: MobileTimelineProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>();
    matches.forEach((m) => {
      if (!map.has(m.d)) map.set(m.d, []);
      map.get(m.d)!.push(m);
    });
    return new Map([...map.entries()].sort());
  }, [matches]);

  return (
    <div className="space-y-8 sm:hidden">
      {[...grouped.entries()].map(([date, dayMatches]) => (
        <div key={date} className="relative pl-6">
          {/* Línea vertical */}
          <div className="absolute bottom-0 left-[9px] top-8 w-px bg-gradient-to-b from-[#c9a84c]/40 to-transparent" />

          {/* Nodo de fecha */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-5 w-5 rounded-full border-4 border-[#060B14] bg-[#c9a84c] shadow-[0_0_12px_rgba(201,168,76,0.5)]" />
            <div>
              <span className="text-sm font-bold text-[#c9a84c]">{fmtShort(date)}</span>
              <span className="ml-2 text-xs text-[#6a7a9a]">{dayMatches.length} partidos</span>
            </div>
          </div>

          {/* Partidos del día */}
          <div className="space-y-3">
            {dayMatches.map((m) => {
              const isImportant = m.p === "FINAL" || m.p === "Semifinal";
              const phaseColor = PHASE_COLORS[m.p] || GOLD;
              return (
                <div
                  key={m.i}
                  onClick={() => onClick(m)}
                  className={`relative ml-2.5 cursor-pointer rounded-xl border p-4 transition-all active:scale-[0.98] ${
                    isImportant ? "border-[#c9a84c]/30" : "border-white/5"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${isImportant ? "rgba(201,168,76,0.08)" : `${phaseColor}08`}, #0F1D32)`,
                  }}
                >
                  {/* Punto conector */}
                  <div className="absolute -left-[25px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[#060B14] bg-[#8a94b0]" />

                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded bg-[#c9a84c]/10 px-2 py-0.5 text-[10px] font-bold text-[#c9a84c]">
                      {m.t}
                    </span>
                    {m.g && <span className="text-[10px] text-[#6a7a9a]">Grupo {m.g}</span>}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-1 items-center gap-2">
                      {m.hf && m.hf !== "tbd" ? (
                        <img src={flagUrl(m.hf, 40)!} alt="" className="h-4 w-6 rounded object-cover" />
                      ) : (
                        <div className="h-4 w-6 rounded bg-white/5" />
                      )}
                      <span className="truncate text-xs font-semibold text-white">{m.h}</span>
                    </div>
                    <span className="text-[10px] font-black text-[#6a7a9a]">VS</span>
                    <div className="flex flex-1 items-center justify-end gap-2">
                      <span className="truncate text-xs font-semibold text-white">{m.a}</span>
                      {m.af && m.af !== "tbd" ? (
                        <img src={flagUrl(m.af, 40)!} alt="" className="h-4 w-6 rounded object-cover" />
                      ) : (
                        <div className="h-4 w-6 rounded bg-white/5" />
                      )}
                    </div>
                  </div>

                  <div className="mt-2 truncate text-[10px] text-[#6a7a9a]">
                    {m.vn} • {m.vc}
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

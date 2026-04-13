import { RefObject } from "react";
import { AnimatedCounter } from "../components/AnimatedCounter";

export function StatsSection({
  statsRef,
  h,
}: {
  statsRef: RefObject<HTMLDivElement | null>;
  h: any;
}) {
  return (
    <section id="stats-section" ref={statsRef} className="relative border-y border-white/5 bg-[#0B1825] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/5 via-transparent to-[#C9A84C]/5" />
      <div className="max-w-6xl mx-auto px-4 py-12 relative">
        <p className="text-center text-lg sm:text-xl font-black text-white mb-8 tracking-tight">
          {h.stats.headline
            .replace("{teams}", "48")
            .replace("{venues}", "16")
            .replace("{matches}", "104")}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
          <AnimatedCounter value={48} label={h.stats.teams} />
          <AnimatedCounter value={16} label={h.stats.venues} />
          <AnimatedCounter value={104} label={h.stats.matches} />
          <AnimatedCounter value={12} label={h.stats.groups} />
          <AnimatedCounter value={3} label={h.stats.countries} />
          <AnimatedCounter value={12} label={h.stats.modules} />
        </div>
      </div>
    </section>
  );
}

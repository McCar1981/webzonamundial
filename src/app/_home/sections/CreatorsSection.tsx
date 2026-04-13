import Link from "next/link";
import { RefObject } from "react";
import { BG3 } from "../constants";
import { CREATORS } from "../data";
import { LuxuryTextReveal } from "@/components/LuxuryTextReveal";

export function CreatorsSection({
  creatorsRef,
  h,
}: {
  creatorsRef: RefObject<HTMLDivElement | null>;
  h: any;
}) {
  return (
    <section ref={creatorsRef} className="py-24 px-4 relative" style={{ background: BG3 }}>
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-[#C9A84C]/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="inline-block px-5 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold tracking-wider uppercase mb-6">
            {h.creators.badge}
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            <LuxuryTextReveal>{h.creators.title}</LuxuryTextReveal>
          </h2>
          <p className="text-gray-300 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto mb-4">
            {h.creators.desc1}
          </p>
          <p className="text-gray-400 text-base max-w-2xl mx-auto mb-8">
            {h.creators.desc2Start}
            <span className="text-white font-semibold">{h.creators.desc2Bold}</span>
            {h.creators.desc2End}
          </p>
          <Link
            href="/creadores"
            className="inline-flex items-center gap-2 text-purple-300 text-sm font-semibold hover:text-purple-200 transition-colors border border-purple-500/30 hover:border-purple-400/50 px-5 py-2.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20"
          >
            {h.creators.cta}
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {CREATORS.map((c) => (
            <Link key={c.slug} href="/creadores" className="creator-card group">
              <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-[#0F1D32] to-[#0B1825] hover:border-[#C9A84C]/30 transition-all duration-300 text-center hover:shadow-[0_0_40px_rgba(201,168,76,0.15)]">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#C9A84C] via-[#E8D48B] to-[#C9A84C] p-[2px] group-hover:p-[3px] transition-all">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#0F1D32]">
                      <img
                        src={c.img}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-1 group-hover:text-[#C9A84C] transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs text-gray-400 mb-3">{c.handle}</p>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: c.color + "20", color: c.color }}
                >
                  {c.followers}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

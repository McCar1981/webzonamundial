import { RefObject } from "react";
import { CarouselRows } from "../components/CarouselRows";
import { LuxuryTextReveal } from "@/components/LuxuryTextReveal";
import { BG } from "../constants";
import { ModuleItem } from "../types";

export function FeaturesCarouselSection({
  featuresRef,
  cardsRef,
  modules,
  h,
}: {
  featuresRef: RefObject<HTMLDivElement | null>;
  cardsRef: RefObject<HTMLDivElement | null>;
  modules: ModuleItem[];
  h: any;
}) {
  const label1 = h.stats.modules === "Modules" ? "MODULES" : "MÓDULOS";
  const label2 = h.stats.modules === "Modules" ? "FEATURES" : "FUNCIONES";

  return (
    <section ref={featuresRef} className="py-24 relative overflow-hidden" style={{ background: BG }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C9A84C]/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header + texto */}
      <div ref={cardsRef} className="max-w-5xl mx-auto px-4 text-center mb-16 relative">
        <span className="inline-block px-5 py-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold tracking-wider uppercase mb-6">
          {h.features.badge}
        </span>
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
          <LuxuryTextReveal>{h.features.title}</LuxuryTextReveal>
        </h2>
        <p className="text-gray-300 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto">
          {h.features.desc1}{" "}
          <span className="text-[#C9A84C] font-semibold">{h.features.desc2}</span>
        </p>
      </div>

      <CarouselRows modules={modules} label1={label1} label2={label2} />
    </section>
  );
}

import { RefObject } from "react";
import Link from "next/link";
import { BG } from "../constants";
import { ShimmerCard } from "@/components/ShimmerCard";

export function AppScreenshotsSection({
  h,
  screenshotsRef,
}: {
  h: any;
  screenshotsRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <section ref={screenshotsRef} className="py-20 px-4 relative overflow-hidden" style={{ background: BG }}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C9A84C]/3 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-5 py-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold tracking-wider uppercase mb-4">
            {h.appScreenshots.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            {h.appScreenshots.title}
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">{h.appScreenshots.subtitle}</p>
        </div>

        {/* Grid de screenshots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Screenshot grande izquierda */}
          <ShimmerCard className="screenshot-card lg:row-span-2 relative rounded-3xl overflow-hidden border border-white/10 bg-[#0B1825] group hover:border-[#C9A84C]/30 transition-all duration-500 hover:-translate-y-1">
            <img
              src="/img/capturas/Captura de pantalla 2026-04-13 132229.png"
              alt={h.appScreenshots.screenshots.predicciones.label}
              className="w-full h-full object-cover min-h-[280px] lg:min-h-[420px] opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">
                {h.appScreenshots.screenshots.predicciones.label}
              </span>
              <p className="text-white font-bold text-lg mt-1">
                {h.appScreenshots.screenshots.predicciones.desc}
              </p>
            </div>
          </ShimmerCard>

          {/* Screenshot fantasy */}
          <ShimmerCard className="screenshot-card relative rounded-3xl overflow-hidden border border-white/10 bg-[#0B1825] group hover:border-[#C9A84C]/30 transition-all duration-500 hover:-translate-y-1">
            <img
              src="/img/zonamundial-images/imagenes/alineacion fantasy.jpeg"
              alt={h.appScreenshots.screenshots.fantasy.label}
              className="w-full h-48 sm:h-56 object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">
                {h.appScreenshots.screenshots.fantasy.label}
              </span>
              <p className="text-white font-bold mt-1">{h.appScreenshots.screenshots.fantasy.desc}</p>
            </div>
          </ShimmerCard>

          {/* Screenshot trivia */}
          <ShimmerCard className="screenshot-card relative rounded-3xl overflow-hidden border border-white/10 bg-[#0B1825] group hover:border-[#C9A84C]/30 transition-all duration-500 hover:-translate-y-1">
            <img
              src="/img/zonamundial-images/imagenes/pregunta trivia para portada.jpeg"
              alt={h.appScreenshots.screenshots.trivia.label}
              className="w-full h-48 sm:h-56 object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">
                {h.appScreenshots.screenshots.trivia.label}
              </span>
              <p className="text-white font-bold mt-1">{h.appScreenshots.screenshots.trivia.desc}</p>
            </div>
          </ShimmerCard>

          {/* Screenshot IA */}
          <ShimmerCard className="screenshot-card relative rounded-3xl overflow-hidden border border-white/10 bg-[#0B1825] group hover:border-[#C9A84C]/30 transition-all duration-500 hover:-translate-y-1">
            <img
              src="/img/zonamundial-images/imagenes/ia mundial.jpeg"
              alt={h.appScreenshots.screenshots.ia.label}
              className="w-full h-48 sm:h-56 object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">
                {h.appScreenshots.screenshots.ia.label}
              </span>
              <p className="text-white font-bold mt-1">{h.appScreenshots.screenshots.ia.desc}</p>
            </div>
          </ShimmerCard>

          {/* Screenshot streaming */}
          <ShimmerCard className="screenshot-card relative rounded-3xl overflow-hidden border border-white/10 bg-[#0B1825] group hover:border-[#C9A84C]/30 transition-all duration-500 hover:-translate-y-1">
            <img
              src="/img/zonamundial-images/imagenes/streaming zona mundial.jpeg"
              alt={h.appScreenshots.screenshots.streaming.label}
              className="w-full h-48 sm:h-56 object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">
                {h.appScreenshots.screenshots.streaming.label}
              </span>
              <p className="text-white font-bold mt-1">{h.appScreenshots.screenshots.streaming.desc}</p>
            </div>
          </ShimmerCard>
        </div>

        {/* CTA secundario */}
        <div className="text-center mt-10">
          <Link
            href="/la-app"
            className="inline-flex items-center gap-2 text-[#C9A84C] font-semibold hover:gap-3 transition-all duration-200"
          >
            {h.appScreenshots.exploreCta}
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

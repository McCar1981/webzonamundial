import { RefObject } from "react";
import Link from "next/link";
import { BG } from "../constants";
import { ICON_DESCUBRE } from "../data";
import { LuxuryTextReveal } from "@/components/LuxuryTextReveal";

export function ExploreSection({
  h,
  exploreRef,
}: {
  h: any;
  exploreRef: RefObject<HTMLDivElement | null>;
}) {
  const items = [
    { title: h.exploreSection.grupos.title, desc: h.exploreSection.grupos.desc, icon: ICON_DESCUBRE.grupos, color: "#3b82f6", href: "/grupos" },
    { title: h.exploreSection.selecciones.title, desc: h.exploreSection.selecciones.desc, icon: ICON_DESCUBRE.selecciones, color: "#22c55e", href: "/selecciones" },
    { title: h.exploreSection.creadores.title, desc: h.exploreSection.creadores.desc, icon: ICON_DESCUBRE.creadores, color: "#a855f7", href: "/creadores" },
    { title: h.exploreSection.historia.title, desc: h.exploreSection.historia.desc, icon: ICON_DESCUBRE.historia, color: "#f59e0b", href: "/historia" },
    { title: h.exploreSection.formato.title, desc: h.exploreSection.formato.desc, icon: ICON_DESCUBRE.formato, color: "#ef4444", href: "/formato" },
    { title: h.exploreSection.unete.title, desc: h.exploreSection.unete.desc, icon: ICON_DESCUBRE.unete, color: "#c9a84c", href: "/registro", featured: true },
  ];

  return (
    <section ref={exploreRef} className="py-24 px-4 relative" style={{ background: BG }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#C9A84C]/5 blur-[180px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <span className="inline-block px-5 py-2 rounded-full border border-[#C9A84C]/20 text-[#C9A84C] text-xs font-bold tracking-wider uppercase mb-6">
            {h.exploreSection.badge}
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            <LuxuryTextReveal>{h.exploreSection.title}</LuxuryTextReveal>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            {h.exploreSection.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {items.map((item, i) => (
            <Link
              key={item.title}
              href={item.href}
              className={`explore-card group p-6 sm:p-7 rounded-3xl border transition-all duration-500 hover:-translate-y-1 ${
                item.featured
                  ? "border-[#ff6b35]/30 bg-gradient-to-br from-[#ff6b35]/10 to-[#0F1D32] hover:border-[#ff6b35]/60"
                  : "border-white/5 bg-[#0F1D32] hover:border-[#C9A84C]/30"
              }`}
              style={{
                boxShadow: `0 0 0 0 transparent`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = item.featured
                  ? "0 20px 50px rgba(255,107,53,0.15)"
                  : `0 20px 50px ${item.color}15`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 transparent";
              }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110"
                    style={{ background: item.color + "15", borderColor: item.color + "30" }}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">{item.icon}</div>
                  </div>
                  <span
                    className="absolute -top-2 -left-2 w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center border"
                    style={{ background: item.color + "20", borderColor: item.color + "40", color: item.color }}
                  >
                    {i + 1}
                  </span>
                </div>
                <span className={`opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 ${item.featured ? "text-[#ff6b35]" : "text-[#C9A84C]"}`}>
                  →
                </span>
              </div>
              <h3 className={`text-xl font-bold text-white mb-2 transition-colors ${item.featured ? "group-hover:text-[#ff6b35]" : "group-hover:text-[#C9A84C]"}`}>
                {item.title}
              </h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

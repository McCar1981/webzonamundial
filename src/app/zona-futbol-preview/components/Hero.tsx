"use client";

import Link from "next/link";
import { ShimmerButton } from "@/components/ShimmerButton";
import { ParallaxImage } from "@/components/ParallaxImage";
import { FloatingElements } from "@/components/FloatingElements";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-40 px-3 sm:px-4" role="region" aria-label="Hero Zona Futbol">
      <div className="absolute inset-0 z-0">
        <ParallaxImage src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop" alt="Estadio" className="h-full" speed={0.25} />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(6,11,20,0.6)] via-[rgba(6,11,20,0.7)] to-[rgba(6,11,20,0.95)]" />
        <div className="absolute inset-0 opacity-30 mix-blend-screen">
          <FloatingElements />
        </div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-[#2952a3] via-transparent to-transparent opacity-20 blur-3xl" />
        <div className="absolute top-20 right-1/3 w-80 h-80 bg-gradient-radial from-[#D4AF37] via-transparent to-transparent opacity-15 blur-3xl" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto text-center">
        <div className="animate-fade-in animate-slide-up space-y-8">
          <div className="inline-block">
            <span className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.3em] drop-shadow-lg">Experiencia Global Premium</span>
          </div>

          <h1 className="font-black text-white leading-tight animate-slide-up tracking-tighter drop-shadow-xl" style={{fontSize: "clamp(48px, 8.5vw, 84px)", textShadow: "0 16px 40px rgba(0,0,0,0.4), 0 0 60px rgba(212,175,55,0.2)"}}>
            Zona Futbol{" "}
            <span className="bg-clip-text text-transparent animate-gradient-shift" style={{backgroundImage: "linear-gradient(135deg, #ffc266 0%, #D4AF37 40%, #ffd699 100%)", backgroundSize: "200% 200%", filter: "drop-shadow(0 0 30px rgba(212, 175, 55, 0.4))"}}>
              2026/2027
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#cbd5e1] max-w-2xl mx-auto leading-relaxed tracking-wide animate-slide-up" style={{textShadow: "0 2px 8px rgba(0,0,0,0.2)"}}>
            Fantasy, Duelos, Minijuegos, Rankings Globales & IA Coach 24/7. La plataforma más completa de futbol de liga. Juega cada jornada contra 100k+ jugadores del mundo.
          </p>

          <div className="pt-8 flex flex-col items-center justify-center gap-4 animate-slide-up">
            <ShimmerButton className="px-10 py-5 text-lg sm:text-xl font-bold shadow-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] hover:scale-110 transition-all duration-300 active:scale-95" href="/app">
              Regístrate Gratis
            </ShimmerButton>
            <Link href="#como-funciona" className="text-[#D4AF37] font-bold hover:text-[#ffc266] text-lg underline decoration-2 transition-all duration-300">
              Ver Cómo Funciona
            </Link>
          </div>

          <div className="pt-6">
            <span className="inline-block px-4 py-2 rounded-full text-xs font-black text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40">
              Plaza de Fundador Zona Futbol — Primera Temporada
            </span>
          </div>

          <div className="pt-6 flex items-center justify-center gap-3 text-sm text-[#94A3B8] animate-fade-in" style={{animationDelay: "0.6s"}}>
            <span>100% Seguro</span>
            <span className="text-[#D4AF37]">•</span>
            <span>Verificado</span>
            <span className="text-[#D4AF37]">•</span>
            <span>Premium UX</span>
          </div>
        </div>
      </div>
    </section>
  );
}

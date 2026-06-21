"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import SectionCard, { SectionHeader } from "@/components/biblia/SectionCard";
import { ShimmerButton } from "@/components/ShimmerButton";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ParallaxImage } from "@/components/ParallaxImage";
import FlagImage from "@/components/FlagImage";
import { StatCounter } from "@/components/StatCounter";
import { FloatingElements } from "@/components/FloatingElements";

// ZONA FUTBOL ULTRA-PREMIUM — Temporada 2026/2027
// 54 agentes, 4 oleadas, análisis profundo ZonaMundial + propuestas radicales

interface League {
  name: string;
  code: string;
  color: string;
  accent: string;
  icon: string;
  games?: number;
  players?: number;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  desc: string;
  badge?: string;
}

interface StepItem {
  number: number;
  title: string;
  desc: string;
  stat: number;
  suffix: string;
  icon?: string;
}

const LEAGUES: League[] = [
  {
    name: "Premier League",
    code: "GB",
    color: "#2952a3",
    accent: "#4a7cff",
    icon: "⚪",
    games: 380,
    players: 12000,
  },
  {
    name: "LaLiga",
    code: "ES",
    color: "#ffc266",
    accent: "#ffd699",
    icon: "⚽",
    games: 380,
    players: 10500,
  },
  {
    name: "Serie A",
    code: "IT",
    color: "#1a3a5c",
    accent: "#4a7cff",
    icon: "🇮🇹",
    games: 380,
    players: 9200,
  },
  {
    name: "Bundesliga",
    code: "DE",
    color: "#be185d",
    accent: "#ec4899",
    icon: "🔴",
    games: 306,
    players: 8100,
  },
  {
    name: "Liga MX",
    code: "MX",
    color: "#10824a",
    accent: "#22c55e",
    icon: "🇲🇽",
    games: 480,
    players: 15000,
  },
  {
    name: "CONMEBOL Libertadores",
    code: "AR",
    color: "#4a1a6f",
    accent: "#b570f0",
    icon: "🏆",
    games: 125,
    players: 18000,
  },
];

const FEATURES: Feature[] = [
  {
    id: "duelos",
    icon: "⚔️",
    title: "Duelos Directos",
    desc: "Desafía a tus amigos en competencias cabeza a cabeza. Apuestas reales, recompensas dinámicas.",
    badge: "Nuevo",
  },
  {
    id: "achievements",
    icon: "🏆",
    title: "Achievements Granular",
    desc: "Logros por liga, equipo, jugador. Badges con narrativa. Recompensas escalonadas.",
    badge: "Popular",
  },
  {
    id: "minijuegos",
    icon: "🎮",
    title: "Minijuegos Liga-Específicos",
    desc: "Penales, headers, predicciones. Cada liga tiene mecánicas únicas. Premios diarios.",
  },
  {
    id: "rankings",
    icon: "🌍",
    title: "Rankings Globales Dinámicos",
    desc: "Compite contra el mundo. Multi-dimensión: Predictor, Fantasy, Collector, Duelista.",
    badge: "Destacado",
  },
  {
    id: "stats",
    icon: "📊",
    title: "Live Stats Dashboard Premium",
    desc: "Estadísticas en vivo. xG, posesión, heat maps. Análisis de IA en tiempo real.",
  },
  {
    id: "predictions",
    icon: "💰",
    title: "Predictions Tournament",
    desc: "Torneo de predicciones con premios reales. Rake comunitario. Leaderboards globales.",
    badge: "Premium",
  },
];

const STEPS: StepItem[] = [
  {
    number: 1,
    icon: "👕",
    title: "Elige Tu Equipo Favorito",
    desc: "Personaliza tu experiencia. Acceso a duelos, predicciones, logros temáticos. Comunidad por equipo.",
    stat: 50,
    suffix: "+ Equipos",
  },
  {
    number: 2,
    icon: "🎮",
    title: "Participa en Minijuegos Diarios",
    desc: "Juega en cada fecha. 8 minijuegos diferentes. Gana puntos, sube en ranking, desbloquea cosmetics.",
    stat: 8,
    suffix: " Minijuegos",
  },
  {
    number: 3,
    icon: "🥇",
    title: "Sube en Rankings Globales",
    desc: "Compite contra 100k+ jugadores. Premios semanales y de temporada. Reputación global.",
    stat: 100,
    suffix: "+ Mil Jugadores",
  },
];

export default function ZonaFutbolPreviewPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    try {
      const { gsap } = require("gsap");
      const tl = gsap.timeline();
      tl.from(heroRef.current.querySelectorAll(".animate-slide-up"), {
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.18,
        ease: "power3.out",
      });
    } catch (e) {
      console.debug("GSAP fallback");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060B14] via-[#0a0f1a] to-[#060B14] text-[#E2E8F0]" style={{fontFamily: "'Outfit', system-ui, sans-serif"}}>

      {/* HERO — Ultra Premium */}
      <section ref={heroRef} className="relative overflow-hidden py-24 sm:py-40 px-3 sm:px-4" role="region" aria-label="Hero Zona Futbol">
        <div className="absolute inset-0 z-0">
          <ParallaxImage src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop" alt="Estadio" className="h-full" speed={0.25} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(6,11,20,0.4)] to-[rgba(6,11,20,0.95)]" />
          <div className="absolute inset-0 opacity-50 mix-blend-screen">
            <FloatingElements />
          </div>
          {/* Multi-color glow radials */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-[#2952a3] via-transparent to-transparent opacity-20 blur-3xl" />
          <div className="absolute top-20 right-1/3 w-80 h-80 bg-gradient-radial from-[#D4AF37] via-transparent to-transparent opacity-15 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="animate-fade-in animate-slide-up space-y-8">
            <div className="inline-block">
              <span className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.3em] drop-shadow-lg">🌍 Experiencia Global Premium</span>
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

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
              <ShimmerButton className="px-10 py-5 text-lg sm:text-xl font-bold shadow-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] hover:scale-110 transition-all duration-300 active:scale-95" href="/app">
                Regístrate Gratis
              </ShimmerButton>
              <Link href="#como-funciona" className="text-[#D4AF37] font-bold hover:text-[#ffc266] text-lg underline decoration-2 transition-all duration-300">
                Ver Cómo Funciona
              </Link>
            </div>

            <div className="pt-6">
              <span className="inline-block px-4 py-2 rounded-full text-xs font-black text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40">
                🏆 Plaza de Fundador Zona Futbol — Primera Temporada
              </span>
            </div>

            <div className="pt-6 flex items-center justify-center gap-3 text-sm text-[#94A3B8] animate-fade-in" style={{animationDelay: "0.6s"}}>
              <span>✓ 100% Seguro</span>
              <span className="text-[#D4AF37]">•</span>
              <span>Verificado</span>
              <span className="text-[#D4AF37]">•</span>
              <span>Premium UX</span>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE ZONA FUTBOL — Narrativa Migracion */}
      <section className="py-16 sm:py-20 px-3 sm:px-4 relative bg-gradient-to-b from-[#060B14] via-[#0a0f1a]/40 to-[#0F1D32]/30" role="region" aria-label="Sobre Zona Futbol">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <h2 className="font-black text-2xl sm:text-3xl text-white mb-4">La Misma Pasión, Ahora con Tu Liga</h2>
                <p className="text-sm sm:text-base text-[#cbd5e1] leading-relaxed">
                  Zona Futbol es la evolución de Zona Mundial. Si jugaste el Mundial 2026 con nosotros, tu progreso viene integrado. Mismos logros, mismos puntos, mismos amigos. Ahora con tu liga favorita.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-[#D4AF37] font-black">✓</span>
                  <span className="text-sm text-[#cbd5e1]"><strong>Tu progreso se migra:</strong> Puntos, logros, historial de predicciones</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#D4AF37] font-black">✓</span>
                  <span className="text-sm text-[#cbd5e1]"><strong>Bonus de fundador:</strong> Recompensas extras para migraciones tempranas</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#D4AF37] font-black">✓</span>
                  <span className="text-sm text-[#cbd5e1]"><strong>Experiencia sin interrupciones:</strong> Continúa donde lo dejaste</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#0F1D32]/70 via-[#0a0f1a]/50 to-transparent border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all duration-300 shadow-xl">
              <h4 className="font-black text-sm text-[#D4AF37] uppercase tracking-wider mb-4">Tu Progreso se Transfiere Así</h4>
              <div className="space-y-3 text-sm text-[#cbd5e1]">
                <div className="flex justify-between items-center pb-3 border-b border-[#D4AF37]/20">
                  <span>Puntos de Zona Mundial</span>
                  <span className="font-black text-[#D4AF37]">100%</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-[#D4AF37]/20">
                  <span>Logros y Badges</span>
                  <span className="font-black text-[#D4AF37]">100%</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-[#D4AF37]/20">
                  <span>Ranking Global</span>
                  <span className="font-black text-[#D4AF37]">Reseteado*</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bonus Migracion</span>
                  <span className="font-black text-[#D4AF37]">+1000 pts</span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-2">*El ranking se reinicia cada temporada para todos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICAS / SOCIAL PROOF */}
      <section className="py-16 sm:py-20 px-3 sm:px-4 relative bg-gradient-to-b from-[#0F1D32]/30 via-[#0a0f1a]/40 to-[#060B14]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              {value: "18,500+", label: "Usuarios de Zona Mundial", icon: "👥"},
              {value: "9,200", label: "Se Unen Cada Semana", icon: "📈"},
              {value: "92,400", label: "Predicciones Diarias", icon: "⚽"},
              {value: "100%", label: "Seguro y Gratuito", icon: "🔒"},
            ].map((stat, idx) => (
              <div key={idx} className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-[#0F1D32]/50 via-[#0a0f1a]/30 to-transparent backdrop-blur-sm border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 transition-all duration-300 text-center group cursor-pointer">
                <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">{stat.icon}</div>
                <div className="text-xl sm:text-2xl font-black text-[#D4AF37] group-hover:text-[#ffc266] transition-colors duration-300">{stat.value}</div>
                <div className="text-xs sm:text-sm text-[#94A3B8] mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGAS — Premium Cards */}
      <section className="py-24 sm:py-32 px-3 sm:px-4 relative bg-gradient-to-b from-[#0a0f1a]/50 via-[#0F1D32]/30 to-[#060B14]" role="region" aria-label="Ligas">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-radial from-[#2952a3]/20 to-transparent blur-3xl -translate-x-1/2" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <SectionCard>
            <SectionHeader eyebrow="Grandes Campeonatos" title="Las Ligas Más Emocionantes" subtitle="6 ligas principales + CONMEBOL Libertadores. Cada una con comunidad, duelos y predicciones temáticas." align="center" />

            <AnimatedSection className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8" stagger={0.18} delay={0.25} y={-40}>
              {LEAGUES.map((league, idx) => (
                <div key={league.name} style={{animationDelay: `${idx * 0.12}s`}} className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer active:scale-95 border shadow-xl" style={{background: `linear-gradient(135deg, ${league.color}20 0%, ${league.accent}08 100%)`, borderColor: league.color, boxShadow: `0 0 24px ${league.color}20, 0 8px 32px rgba(0,0,0,0.35)`, borderWidth: "1.5px"}}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-25 transition-opacity duration-300 bg-gradient-to-br from-[#D4AF37] to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-40 blur-xl" style={{background: `radial-gradient(circle, ${league.color}40 0%, transparent 70%)`}} />

                  <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                    <div className="text-4xl group-hover:scale-130 transition-transform duration-300" style={{animation: "pulse-glow 2s infinite"}}>{league.icon}</div>
                    <FlagImage code={league.code} alt={league.name} width={72} className="rounded-lg overflow-hidden shadow-2xl group-hover:scale-125 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300" />
                    <h3 className="font-black text-sm sm:text-base leading-tight tracking-tighter group-hover:text-[#D4AF37] transition-colors duration-300" style={{color: league.color}}>
                      {league.name}
                    </h3>
                    {league.games && league.players && (
                      <div className="mt-2 space-y-1 text-xs animate-fade-in opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="text-[#cbd5e1]">{league.games} partidos</div>
                        <div className="font-bold" style={{color: league.color}}>{league.players.toLocaleString()}+ jugadores</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </AnimatedSection>

            {/* Stats Summary */}
            <div className="mt-16 grid grid-cols-3 gap-6 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0F1D32]/70 via-[#0a0f1a]/50 to-[#060B14] border border-[#D4AF37]/25 shadow-2xl hover:border-[#D4AF37]/50 transition-all duration-300">
              <div className="text-center group">
                <div className="text-3xl sm:text-4xl font-black text-[#D4AF37] group-hover:text-[#ffc266] transition-colors duration-300">{LEAGUES.length}</div>
                <div className="text-xs sm:text-sm text-[#94A3B8] mt-2">Ligas Principales</div>
              </div>
              <div className="text-center border-l border-r border-[#D4AF37]/25 group">
                <div className="text-3xl sm:text-4xl font-black text-[#D4AF37] group-hover:text-[#ffc266] transition-colors duration-300">
                  {Math.floor(LEAGUES.reduce((sum, l) => sum + (l.games || 0), 0) / 100)}+K
                </div>
                <div className="text-xs sm:text-sm text-[#94A3B8] mt-2">Partidos Anuales</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl sm:text-4xl font-black text-[#D4AF37] group-hover:text-[#ffc266] transition-colors duration-300">
                  {Math.floor(LEAGUES.reduce((sum, l) => sum + (l.players || 0), 0) / 1000)}K+
                </div>
                <div className="text-xs sm:text-sm text-[#94A3B8] mt-2">Jugadores Activos</div>
              </div>
            </div>
          </SectionCard>
        </div>
      </section>

      {/* FEATURES — Premium Grid */}
      <section className="py-24 sm:py-32 px-3 sm:px-4 relative bg-gradient-to-b from-[#0F1D32]/40 via-[#060B14] to-[#0a0f1a]/50" role="region" aria-label="Funcionalidades">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-radial from-[#9b51e0]/20 to-transparent blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <SectionCard variant="solid">
            <SectionHeader eyebrow="Funcionalidades Ultra-Premium" title="Lo que Zona Futbol te Ofrece" subtitle="6 modos competitivos con recompensas reales. Fantasy, predicciones, duelos, achievements, minijuegos y rankings globales." align="center" />

            <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" stagger={0.15} delay={0.2} y={-35}>
              {FEATURES.map((feature, idx) => (
                <Link key={feature.id} href={`#${feature.id}`} style={{animationDelay: `${idx * 0.1}s`}} className="group relative overflow-hidden rounded-2xl p-8 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl cursor-pointer shadow-xl border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 active:scale-95 bg-gradient-to-br from-[#0F1D32]/60 via-[#0a0f1a]/40 to-transparent hover:from-[#0F1D32]/80 hover:to-[#D4AF37]/10 block">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-300 bg-gradient-to-br from-[#D4AF37] to-transparent" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-2xl" />

                  <div className="relative z-10 flex flex-col gap-4">
                    {feature.badge && (
                      <div className="flex justify-between items-start gap-3">
                        <div className="text-5xl group-hover:scale-125 transition-transform duration-300">{feature.icon}</div>
                        <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/40 transition-all duration-300 shadow-lg">
                          {feature.badge}
                        </span>
                      </div>
                    )}
                    {!feature.badge && <div className="text-5xl group-hover:scale-125 transition-transform duration-300">{feature.icon}</div>}

                    <h3 className="font-black text-lg text-white group-hover:text-[#D4AF37] transition-colors duration-300 tracking-tight">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-[#cbd5e1] leading-relaxed tracking-wide group-hover:text-white transition-colors duration-300">
                      {feature.desc}
                    </p>

                    <div className="mt-auto pt-4 h-0.5 bg-gradient-to-r from-[#D4AF37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </Link>
              ))}
            </AnimatedSection>

            {/* Highlight Box */}
            <div className="mt-12 p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all duration-300 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-black text-xs text-[#D4AF37] uppercase tracking-wider mb-3">Trending Now</h4>
                  <p className="text-sm text-[#cbd5e1] leading-relaxed">
                    Rankings globales multi-dimensión. Compite en 5 categorías: Predictor, Fantasy, Collector, Duelista, Streamer. Premios semanales y de temporada.
                  </p>
                </div>
                <div>
                  <h4 className="font-black text-xs text-[#D4AF37] uppercase tracking-wider mb-3">Próximamente</h4>
                  <p className="text-sm text-[#cbd5e1] leading-relaxed">
                    Fantasy Draft interactivo en vivo. Betting Predictions Market P2P. Minijuegos temáticos por liga con premios reales.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </section>

      {/* STEPS — Premium Journey */}
      <section id="como-funciona" className="py-24 sm:py-32 px-3 sm:px-4 relative bg-gradient-to-b from-[#060B14] via-[#0a0f1a]/40 to-[#060B14]" role="region" aria-label="Cómo jugar">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-radial from-[#10824a]/20 to-transparent blur-3xl -translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <SectionCard variant="solid">
            <SectionHeader eyebrow="Guía Rápida" title="Cómo Jugar en Zona Futbol" subtitle="3 pasos para convertirte en campeón global. Desde elegir equipo hasta ganar premios reales." align="center" />

            <AnimatedSection className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12" stagger={0.22} delay={0.2} y={-30}>
              {STEPS.map((step, idx) => (
                <div key={step.number} className="group relative">
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-[#0F1D32]/70 via-[#0a0f1a]/50 to-transparent hover:from-[#0F1D32]/90 hover:via-[#0a0f1a]/70 border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 transition-all duration-300 hover:shadow-2xl cursor-pointer active:scale-95 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br from-[#D4AF37] to-transparent" />
                    <div className="absolute -bottom-6 -right-6 w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 group-hover:border-[#D4AF37]/60 transition-all duration-300" />

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#ffc266] text-[#060B14] font-black text-2xl group-hover:scale-125 group-hover:shadow-[0_0_24px_rgba(212,175,55,0.6)] transition-all duration-300 shadow-lg">
                          {step.number}
                        </div>
                        <div className="text-3xl group-hover:scale-110 transition-transform duration-300">{step.icon}</div>
                      </div>

                      <h3 className="font-black text-xl text-white leading-tight group-hover:text-[#D4AF37] transition-colors duration-300 tracking-tight">
                        {step.title}
                      </h3>

                      <p className="text-sm text-[#cbd5e1] leading-relaxed tracking-wide group-hover:text-white transition-colors duration-300">
                        {step.desc}
                      </p>

                      <div className="pt-4 border-t border-[#D4AF37]/20 group-hover:border-[#D4AF37]/60 transition-all duration-300">
                        <div className="flex items-baseline gap-2 pt-3" aria-live="polite">
                          <StatCounter value={step.stat} className="text-3xl font-black text-[#D4AF37] group-hover:text-[#ffc266] transition-colors duration-300" />
                          <span className="text-xs text-[#94A3B8] font-bold">{step.suffix}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div className="hidden sm:block absolute -right-4 top-14 w-8 h-8 bg-[#D4AF37] rounded-full border-4 border-[#060B14] shadow-lg group-hover:shadow-[0_0_16px_rgba(212,175,55,0.6)] transition-shadow duration-300" />
                  )}
                </div>
              ))}
            </AnimatedSection>

            {/* Description */}
            <div className="mt-12 space-y-6">
              <div className="p-8 rounded-2xl bg-[#0F1D32]/50 border border-[#D4AF37]/20 shadow-xl">
                <p className="text-base text-[#cbd5e1] leading-relaxed tracking-wide">
                  Cada semana nuevos desafíos, minijuegos y predicciones. Gana puntos, sube en el ranking global y compite contra 100k+ jugadores. Los mejores de cada jornada y de la temporada ganan premios reales. Fantasy multiplayer, cromos P2P, duelos directos, logros temáticos. Todo en una app.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {icon: "⚡", title: "Rápido", desc: "Regístrate en 30 segundos"},
                  {icon: "🎯", title: "Intuitivo", desc: "Fácil de entender y jugar"},
                  {icon: "💰", title: "Premios", desc: "Dinero real en juego"},
                  {icon: "🌍", title: "Global", desc: "Compite worldwide"},
                ].map((benefit, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#0F1D32]/50 border border-[#D4AF37]/20 text-center hover:border-[#D4AF37]/60 hover:bg-[#0F1D32]/70 transition-all duration-300 group cursor-pointer">
                    <div className="text-2xl mb-2 group-hover:scale-125 transition-transform duration-300">{benefit.icon}</div>
                    <h5 className="font-black text-sm text-white mb-1">{benefit.title}</h5>
                    <p className="text-xs text-[#94A3B8]">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      </section>

      {/* PROXIMO PARTIDO — Featured Match */}
      <section className="py-20 sm:py-28 px-3 sm:px-4 relative bg-gradient-to-b from-[#060B14] via-[#0a0f1a]/40 to-[#0F1D32]/30" role="region" aria-label="Próximo partido destacado">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-black text-2xl sm:text-3xl text-white mb-2">Haz tu Predicción</h2>
            <p className="text-sm sm:text-base text-[#cbd5e1]">Cada partido es una oportunidad de ganar puntos y premios</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Featured Match */}
            <div className="lg:col-span-2 p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-[#0F1D32]/80 via-[#0a0f1a]/60 to-transparent border border-[#D4AF37]/40 hover:border-[#D4AF37]/70 transition-all duration-300 shadow-2xl">
              <div className="text-center space-y-6">
                <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wider">Jornada 25 • Premier League</div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-black text-white">MAN CITY</div>
                    <div className="text-3xl font-black text-[#D4AF37]">2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-[#94A3B8]">—</div>
                    <div className="text-xs font-black text-[#94A3B8] mt-2">EN VIVO</div>
                  </div>
                  <div className="text-left space-y-2">
                    <div className="text-2xl font-black text-white">ARSENAL</div>
                    <div className="text-3xl font-black text-[#D4AF37]">1</div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <p className="text-xs text-[#94A3B8]">¿Cuál será el resultado final?</p>
                  <div className="grid grid-cols-3 gap-3">
                    {["Victoria MAN CITY", "Empate", "Victoria ARSENAL"].map((pred, i) => (
                      <button key={i} className="py-3 px-4 rounded-lg bg-[#0F1D32]/60 border border-[#D4AF37]/30 hover:border-[#D4AF37]/70 hover:bg-[#D4AF37]/15 text-xs sm:text-sm font-black text-white transition-all duration-300 active:scale-95">
                        {pred}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 text-xs text-[#94A3B8]">
                  <span className="text-[#D4AF37] font-black">+47 puntos</span> si aciertas
                </div>
              </div>
            </div>

            {/* Proximos Partidos */}
            <div className="space-y-3">
              <h3 className="font-black text-sm text-white uppercase tracking-wider mb-4">Próximos Partidos</h3>
              {[
                {time: "18:30", home: "BARCELONA", away: "REAL MADRID", league: "LaLiga"},
                {time: "20:45", home: "JUVENTUS", away: "INTER", league: "Serie A"},
                {time: "19:00", home: "BAYERN", away: "DORTMUND", league: "Bundesliga"},
                {time: "17:00", home: "LYON", away: "PSG", league: "Ligue 1"},
              ].map((match, i) => (
                <button key={i} className="w-full p-4 rounded-lg bg-[#0F1D32]/50 hover:bg-[#0F1D32]/70 border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 transition-all duration-300 text-left group cursor-pointer">
                  <div className="text-xs text-[#94A3B8] font-black mb-2">{match.time} • {match.league}</div>
                  <div className="text-sm font-black text-white group-hover:text-[#D4AF37]">{match.home}</div>
                  <div className="text-xs text-[#cbd5e1] mt-1">vs {match.away}</div>
                </button>
              ))}
              <Link href="#" className="w-full mt-4 py-3 px-4 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/50 hover:bg-[#D4AF37]/25 text-sm font-black text-[#D4AF37] text-center transition-all duration-300">
                Ver Calendario Completo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT STATS */}
      <section className="py-20 sm:py-28 px-3 sm:px-4 relative bg-gradient-to-b from-[#0a0f1a] via-[#060B14] to-[#0a0f1a] overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-40 left-1/4 w-96 h-96 bg-gradient-radial from-[#D4AF37]/15 to-transparent blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
            {[
              {value: "100K+", label: "Jugadores Activos", icon: "👥"},
              {value: "2M+", label: "Predicciones", icon: "⚽"},
              {value: "$500K", label: "Premios Distribuidos", icon: "💰"},
              {value: "24/7", label: "Disponible", icon: "🕐"},
            ].map((stat, idx) => (
              <div key={idx} className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0F1D32]/60 via-[#0a0f1a]/40 to-transparent backdrop-blur-xl border border-[#D4AF37]/25 hover:border-[#D4AF37]/60 transition-all duration-300 text-center hover:shadow-2xl group cursor-pointer">
                <div className="text-3xl sm:text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">{stat.icon}</div>
                <div className="text-2xl sm:text-3xl font-black text-[#D4AF37] group-hover:text-[#ffc266] transition-colors duration-300 mb-1 animate-fade-in" style={{animationDelay: `${idx * 0.1}s`}}>
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-[#94A3B8] font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PWA INSTALLATION */}
      <section className="py-20 sm:py-28 px-3 sm:px-4 relative bg-gradient-to-b from-[#0a0f1a] via-[#0F1D32]/30 to-[#060B14]">
        <div className="max-w-7xl mx-auto">
          <SectionCard>
            <SectionHeader eyebrow="Descarga la App" title="Instala Zona Futbol en tu Móvil" subtitle="Acceso directo, notificaciones push, experiencia nativa. Sin instalar nada desde App Store." align="center" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                {icon: "📱", title: "Acceso Directo", desc: "Home screen, tap y juega al instante"},
                {icon: "🔔", title: "Notificaciones Push", desc: "Alertas de partidos, resultados y recompensas"},
                {icon: "⚡", title: "Experiencia Nativa", desc: "Rápido, fluido, funciona offline"},
              ].map((benefit, i) => (
                <div key={i} className="p-6 rounded-xl bg-[#0F1D32]/50 border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 text-center transition-all duration-300 group cursor-pointer">
                  <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">{benefit.icon}</div>
                  <h4 className="font-black text-sm text-white mb-2">{benefit.title}</h4>
                  <p className="text-xs text-[#94A3B8]">{benefit.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button className="px-8 py-4 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#ffc266] text-[#060B14] font-black hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300 active:scale-95">
                Instalar App
              </button>
              <p className="text-xs text-[#94A3B8] mt-4">Compatible con iOS, Android y navegador</p>
            </div>
          </SectionCard>
        </div>
      </section>

      {/* EMAIL SIGNUP */}
      <section className="py-16 sm:py-20 px-3 sm:px-4 relative bg-gradient-to-b from-[#060B14] via-[#0a0f1a]/40 to-[#0F1D32]/20">
        <div className="max-w-2xl mx-auto">
          <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-[#0F1D32]/70 via-[#0a0f1a]/50 to-transparent border border-[#D4AF37]/30 hover:border-[#D4AF37]/50 transition-all duration-300 shadow-xl">
            <h3 className="font-black text-xl sm:text-2xl text-white text-center mb-2">No te Pierdas Nada</h3>
            <p className="text-sm text-[#cbd5e1] text-center mb-6">Suscríbete y recibe alertas de convocatorias, lesiones, resultados y análisis de IA</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-4 py-3 rounded-lg bg-[#0a0f1a] border border-[#D4AF37]/30 text-white placeholder-[#94A3B8] focus:border-[#D4AF37] focus:outline-none transition-all duration-300"
              />
              <button className="px-6 py-3 rounded-lg bg-[#D4AF37] text-[#060B14] font-black hover:bg-[#ffc266] transition-all duration-300 active:scale-95">
                Suscribirse
              </button>
            </div>

            <p className="text-xs text-center text-[#94A3B8]">
              <span className="text-[#D4AF37] font-black">9,284</span> aficionados ya suscritos • Sin spam • Sin compromiso
            </p>
          </div>
        </div>
      </section>

      {/* CTA PRINCIPAL */}
      <section className="py-20 sm:py-28 px-3 sm:px-4 relative overflow-hidden" role="region" aria-label="Llamada a la acción">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/8 via-transparent to-transparent" />

        <div className="max-w-3xl mx-auto relative z-10">
          <SectionCard variant="accent">
            <div className="text-center space-y-8">
              <div className="space-y-6">
                <h2 className="font-black text-white tracking-tighter drop-shadow-lg" style={{fontSize: "clamp(32px, 5vw, 56px)", textShadow: "0 12px 36px rgba(0,0,0,0.3), 0 0 48px rgba(212,175,55,0.2)", letterSpacing: "-0.04em"}}>
                  Tu Liga te Necesita.<br/>No Dejes que Otro la Gane por Ti.
                </h2>

                <p className="text-lg sm:text-xl text-[#cbd5e1] max-w-lg mx-auto leading-relaxed tracking-wide drop-shadow">
                  Entra gratis. Si no te gusta, te devolvemos el silencio. Juega cada jornada contra 100k+ usuarios globales y compite por premios reales.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 px-4 py-6 rounded-xl bg-[#0F1D32]/60 border border-[#D4AF37]/25 backdrop-blur-xl hover:border-[#D4AF37]/60 transition-all duration-300">
                <div className="text-center group">
                  <div className="text-2xl font-black text-[#D4AF37] group-hover:text-[#ffc266]">⏱️</div>
                  <p className="text-xs text-[#94A3B8] mt-1 group-hover:text-[#cbd5e1]">5 min para jugar</p>
                </div>
                <div className="text-center border-l border-r border-[#D4AF37]/25 group">
                  <div className="text-2xl font-black text-[#D4AF37] group-hover:text-[#ffc266]">🎯</div>
                  <p className="text-xs text-[#94A3B8] mt-1 group-hover:text-[#cbd5e1]">Sin experiencia</p>
                </div>
                <div className="text-center group">
                  <div className="text-2xl font-black text-[#D4AF37] group-hover:text-[#ffc266]">✓</div>
                  <p className="text-xs text-[#94A3B8] mt-1 group-hover:text-[#cbd5e1]">Instantáneo</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="pt-6 space-y-4">
                <ShimmerButton className="px-14 py-6 text-xl sm:text-2xl font-black w-full sm:w-auto shadow-2xl hover:shadow-[0_0_60px_rgba(212,175,55,0.5)] hover:scale-110 active:scale-95 transition-all duration-300" href="/registro">
                  Registrarme Gratis
                </ShimmerButton>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-[#94A3B8]">
                <span>✓ 100% Gratis</span>
                <span className="hidden sm:block text-[#D4AF37]">•</span>
                <span>Sin Tarjeta</span>
                <span className="hidden sm:block text-[#D4AF37]">•</span>
                <span>Sin Compromiso</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#D4AF37]/20 py-12 sm:py-16 px-3 sm:px-4 bg-gradient-to-b from-[#060B14] to-[#000000]" role="contentinfo">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
            <div className="space-y-4">
              <h3 className="font-black text-lg text-white tracking-tight">Zona Mundial</h3>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">Hecha por fans, para fans. Fantasy, predicciones, duelos, minijuegos y premios reales.</p>
              <p className="text-xs text-[#94A3B8]">Powered by <span className="text-[#D4AF37] font-black">Sprintmarkt</span></p>
            </div>

            <nav className="space-y-3">
              <h4 className="font-black text-xs text-white uppercase tracking-wider mb-4">Torneo</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-[#94A3B8]">
                {["Ligas", "Calendario", "Clasificación", "Historia"].map((link) => (
                  <li key={link}>
                    <Link href="#" className="hover:text-[#D4AF37] hover:underline transition-all duration-300">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="space-y-3">
              <h4 className="font-black text-xs text-white uppercase tracking-wider mb-4">Comunidad</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-[#94A3B8]">
                {["Noticias", "Blog", "Tutoriales", "Creadores"].map((link) => (
                  <li key={link}>
                    <Link href="#" className="hover:text-[#D4AF37] hover:underline transition-all duration-300">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="space-y-3">
              <h4 className="font-black text-xs text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-[#94A3B8]">
                {["Sobre Nosotros", "Contacto", "Privacidad", "Términos"].map((link) => (
                  <li key={link}>
                    <Link href="#" className="hover:text-[#D4AF37] hover:underline transition-all duration-300">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="py-6 border-t border-b border-[#D4AF37]/20">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs sm:text-sm text-[#94A3B8]">
              <span>🌍 Síguenos:</span>
              <a href="#" className="text-[#D4AF37] hover:text-[#ffc266] font-black transition-colors">Instagram</a>
              <span className="hidden sm:block text-[#D4AF37]">•</span>
              <a href="#" className="text-[#D4AF37] hover:text-[#ffc266] font-black transition-colors">Facebook</a>
              <span className="hidden sm:block text-[#D4AF37]">•</span>
              <a href="#" className="text-[#D4AF37] hover:text-[#ffc266] font-black transition-colors">TikTok</a>
            </div>
          </div>

          <div className="mt-8 space-y-3 text-center text-xs text-[#94A3B8]">
            <p>
              © 2026 <span className="text-[#D4AF37] font-black">Sprintmarkt</span> · Valencia, España
            </p>
            <p className="max-w-2xl mx-auto leading-relaxed">
              ⚠️ <strong>Aviso Legal:</strong> Zona Futbol es un juego 100% gratuito. No implica apuestas reales ni transacciones monetarias. Los Futcions y puntos no tienen valor monetario. Únicamente con fines de entretenimiento.
            </p>
          </div>
        </div>
      </footer>

      {/* ULTRA-PREMIUM STYLES */}
      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 12px rgba(212, 175, 55, 0.3); } 50% { box-shadow: 0 0 24px rgba(212, 175, 55, 0.6); } }

        .animate-fade-in { animation: fade-in 0.9s ease-out; }
        .animate-slide-up { animation: slide-up 0.9s ease-out; }
        .animate-gradient-shift { background-size: 200% 200%; animation: gradient-shift 3s ease-in-out infinite; }

        * { scroll-behavior: smooth; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }

        .gradient-radial {
          background: radial-gradient(var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
}

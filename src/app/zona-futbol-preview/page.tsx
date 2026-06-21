"use client";

import Link from "next/link";
import { useRef } from "react";
import SectionCard, { SectionHeader } from "@/components/biblia/SectionCard";
import { ShimmerButton } from "@/components/ShimmerButton";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ParallaxImage } from "@/components/ParallaxImage";
import FlagImage from "@/components/FlagImage";
import { StatCounter } from "@/components/StatCounter";
import { FloatingElements } from "@/components/FloatingElements";

// ═══════════════════════════════════════════════════════════════════
// ZONE FUTBOL PREVIEW — Página principal de Zona Futbol 2026/2027
// ═══════════════════════════════════════════════════════════════════

interface League {
  name: string;
  code: string;
  color: string;
  accent: string;
  icon: string;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

interface StepItem {
  number: number;
  title: string;
  desc: string;
  stat: number;
  suffix: string;
}

// ═══════════════════════════════════════════════════════════════════
// DATOS
// ═══════════════════════════════════════════════════════════════════

const LEAGUES: League[] = [
  {
    name: "Premier League",
    code: "GB",
    color: "#3B71CA",
    accent: "#1F4788",
    icon: "⚪",
  },
  {
    name: "LaLiga",
    code: "ES",
    color: "#FFC400",
    accent: "#0F4F8F",
    icon: "⚽",
  },
  {
    name: "Serie A",
    code: "IT",
    color: "#003DA5",
    accent: "#1C1C1C",
    icon: "🇮🇹",
  },
  {
    name: "Bundesliga",
    code: "DE",
    color: "#DD0000",
    accent: "#FFD700",
    icon: "🔴",
  },
  {
    name: "Liga MX",
    code: "MX",
    color: "#CE1126",
    accent: "#007C5B",
    icon: "🇲🇽",
  },
  {
    name: "CONMEBOL Libertadores",
    code: "AR",
    color: "#003DA5",
    accent: "#DD0000",
    icon: "🏆",
  },
];

const FEATURES: Feature[] = [
  {
    id: "duelos",
    icon: "⚔️",
    title: "Duelos Directos",
    desc: "Desafía a tus amigos en competencias cabeza a cabeza con réplicas reales de partidos.",
  },
  {
    id: "achievements",
    icon: "🏆",
    title: "Achievements",
    desc: "Desbloquea logros y medallas por tus victorias y récords históricos.",
  },
  {
    id: "minijuegos",
    icon: "🎮",
    title: "Minijuegos",
    desc: "Penales, headers, pases precisos y más minijuegos integrados en cada fecha.",
  },
  {
    id: "rankings",
    icon: "🌍",
    title: "Rankings Globales",
    desc: "Compite contra jugadores de todo el mundo en tablas de posiciones dinámicas.",
  },
  {
    id: "stats",
    icon: "📊",
    title: "Live Stats",
    desc: "Estadísticas en vivo de todos los partidos actualizadas en tiempo real.",
  },
  {
    id: "predictions",
    icon: "💰",
    title: "Predictions Tournament",
    desc: "Torneo de predicciones con premios reales cada jornada y al final de temporada.",
  },
];

const STEPS: StepItem[] = [
  {
    number: 1,
    title: "Selecciona tu equipo favorito",
    desc: "Elige qué equipo vitorear y personaliza tu experiencia. Cada equipo tiene su propia comunidad y duelos.",
    stat: 50,
    suffix: "+ Equipos",
  },
  {
    number: 2,
    title: "Participa en minijuegos",
    desc: "Juega en cada fecha para ganar puntos. Penales, predicciones, estadísticas en vivo y más.",
    stat: 8,
    suffix: " Minijuegos",
  },
  {
    number: 3,
    title: "Sube en el ranking global",
    desc: "Compite contra jugadores del mundo entero. Gana premios semanales y alcanza el pódium.",
    stat: 100,
    suffix: "+ Mil Jugadores",
  },
];

// ═══════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════

// LeagueCard: tarjeta de liga con bandera y nombre
function LeagueCard({ league }: { league: League }) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:scale-105"
      style={{
        background: `linear-gradient(135deg, ${league.color}22 0%, ${league.accent}11 100%)`,
        borderColor: league.color,
        borderWidth: "1px",
      }}
    >
      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${league.color}, ${league.accent})` }}
      />

      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div className="text-3xl">{league.icon}</div>
        <FlagImage
          code={league.code}
          alt={league.name}
          width={64}
          className="rounded-lg overflow-hidden shadow-lg"
        />
        <h3
          className="font-bold text-sm sm:text-base leading-tight"
          style={{ color: league.color }}
        >
          {league.name}
        </h3>
      </div>
    </div>
  );
}

// FeatureCard: tarjeta de feature con iconografía
function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <SectionCard variant="ghost" className="h-full">
      <div className="flex flex-col gap-3">
        <div className="text-4xl">{feature.icon}</div>
        <h3 className="font-bold text-base text-white">{feature.title}</h3>
        <p className="text-sm text-[var(--zm-text-muted)] leading-relaxed">
          {feature.desc}
        </p>
      </div>
    </SectionCard>
  );
}

// StepCard: tarjeta de paso con animación de número
function StepCard({ step }: { step: StepItem }) {
  return (
    <SectionCard variant="ghost">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--zm-gold)] text-[var(--zm-bg)] font-black text-xl">
          {step.number}
        </div>
        <h3 className="font-bold text-lg text-white leading-tight">{step.title}</h3>
        <p className="text-sm text-[var(--zm-text-muted)] leading-relaxed">{step.desc}</p>

        {/* Stat animado */}
        <div className="pt-2 flex items-baseline gap-1">
          <StatCounter
            value={step.stat}
            className="text-2xl font-black text-[var(--zm-gold)]"
          />
          <span className="text-xs text-[var(--zm-text-muted)]">{step.suffix}</span>
        </div>
      </div>
    </SectionCard>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

export default function ZonaFutbolPreviewPage() {
  const ctaRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="min-h-screen bg-[var(--zm-bg)] text-[var(--zm-text)]"
      style={{
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — Parallax + Título
          ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 sm:py-32 px-4">
        {/* Background Parallax */}
        <div className="absolute inset-0 z-0">
          <ParallaxImage
            src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop"
            alt="Fondo Zona Futbol"
            className="h-full"
            speed={0.5}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--zm-bg)]/50 to-[var(--zm-bg)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="animate-fade-in space-y-6">
            {/* Eyebrow */}
            <div className="inline-block">
              <span className="text-xs font-bold text-[var(--zm-gold)] uppercase tracking-[0.25em]">
                🌍 Experiencia Global
              </span>
            </div>

            {/* Main Title */}
            <h1
              className="font-black text-white leading-tight animate-slide-up"
              style={{
                fontSize: "clamp(32px, 6vw, 64px)",
                letterSpacing: "-0.02em",
              }}
            >
              Zona Futbol{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #c9a84c, #e8d48b)",
                }}
              >
                2026/2027
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[var(--zm-text-muted)] max-w-2xl mx-auto leading-relaxed">
              La plataforma de fútbol más completa: duelos, minijuegos, rankings globales y
              premios reales. Juega cada jornada, compite contra el mundo entero.
            </p>

            {/* CTA Hero */}
            <div className="pt-4">
              <ShimmerButton
                className="px-8 py-4 text-base sm:text-lg"
                href="/zona-futbol-preview"
              >
                Explorar Zona Futbol →
              </ShimmerButton>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LIGAS SECTION — Grid 3x2
          ════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionCard>
            <SectionHeader
              eyebrow="Grandes Campeonatos"
              title="Las Ligas Más Emocionantes"
              subtitle="Sigue todos los partidos de las principales ligas europeas y la CONMEBOL Libertadores"
              align="center"
            />

            <AnimatedSection
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6"
              stagger={0.1}
              delay={0.2}
            >
              {LEAGUES.map((league) => (
                <LeagueCard key={league.name} league={league} />
              ))}
            </AnimatedSection>
          </SectionCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES SECTION — 6 Cards con Iconografía
          ════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionCard variant="solid">
            <SectionHeader
              eyebrow="Funcionalidades"
              title="Lo que Zona Futbol te Ofrece"
              subtitle="Una experiencia interactiva completa con herramientas que transforman cómo vives el fútbol"
              align="center"
            />

            <AnimatedSection
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              stagger={0.08}
              delay={0.1}
            >
              {FEATURES.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} />
              ))}
            </AnimatedSection>
          </SectionCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CÓMO JUGAR SECTION — 3 Pasos con StatCounter
          ════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionCard variant="solid">
            <SectionHeader
              eyebrow="Guía Rápida"
              title="Cómo Jugar en Zona Futbol"
              subtitle="3 simples pasos para convertirte en un jugador competitivo"
              align="center"
            />

            <AnimatedSection
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8"
              stagger={0.12}
              delay={0.1}
            >
              {STEPS.map((step) => (
                <StepCard key={step.number} step={step} />
              ))}
            </AnimatedSection>

            {/* Descriptión detallada bajo los pasos */}
            <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-[var(--zm-surface)] border border-[var(--zm-border)]">
              <p className="text-sm sm:text-base text-[var(--zm-text-muted)] leading-relaxed">
                Cada semana hay nuevos minijuegos, predicciones y desafíos. Gana puntos,
                sube en el ranking global y compite contra jugadores de todo el mundo.
                Los mejores jugadores de cada jornada y al final de la temporada ganan
                premios reales en tu billetera.
              </p>
            </div>
          </SectionCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CTA PRINCIPAL — Gigante con ShimmerButton
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={ctaRef}
        className="py-16 sm:py-24 px-4"
      >
        <div className="max-w-2xl mx-auto">
          <SectionCard variant="accent">
            <div className="text-center space-y-6">
              <h2
                className="font-black text-white"
                style={{
                  fontSize: "clamp(28px, 4vw, 48px)",
                  letterSpacing: "-0.02em",
                }}
              >
                ¿Listo para el Desafío?
              </h2>

              <p className="text-base sm:text-lg text-[var(--zm-text-muted)] max-w-lg mx-auto">
                Únete a miles de jugadores que ya están compitiendo en Zona Futbol.
                Cada partido, cada minijuego, cada predicción te acerca a los premios.
              </p>

              {/* Botón gigante */}
              <div className="pt-6">
                <ShimmerButton
                  className="px-12 py-5 text-lg sm:text-xl font-bold w-full sm:w-auto"
                  href="/app"
                >
                  Comenzar Ahora
                </ShimmerButton>
              </div>

              {/* Sub-CTA: Link a registrarse */}
              <div className="text-sm text-[var(--zm-text-muted)]">
                ¿Sin cuenta?{" "}
                <Link
                  href="/registro"
                  className="text-[var(--zm-gold)] font-bold hover:text-[var(--zm-gold-light)] transition-colors"
                >
                  Regístrate aquí
                </Link>
              </div>
            </div>
          </SectionCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER SECTION
          ════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[var(--zm-border)] py-12 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-12">
            {/* Branding */}
            <div className="space-y-4">
              <h3 className="font-black text-lg text-white">Zona Futbol</h3>
              <p className="text-sm text-[var(--zm-text-muted)]">
                La plataforma de fútbol interactivo más completa de América Latina.
              </p>
            </div>

            {/* Links Rápidos */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                Producto
              </h4>
              <ul className="space-y-2 text-sm text-[var(--zm-text-muted)]">
                <li>
                  <Link href="/app" className="hover:text-[var(--zm-gold)] transition-colors">
                    Mi Cuenta
                  </Link>
                </li>
                <li>
                  <Link href="/cromos" className="hover:text-[var(--zm-gold)] transition-colors">
                    Cromos
                  </Link>
                </li>
                <li>
                  <Link href="/calendario" className="hover:text-[var(--zm-gold)] transition-colors">
                    Calendario
                  </Link>
                </li>
              </ul>
            </div>

            {/* Recursos */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                Recursos
              </h4>
              <ul className="space-y-2 text-sm text-[var(--zm-text-muted)]">
                <li>
                  <Link href="/tutoriales" className="hover:text-[var(--zm-gold)] transition-colors">
                    Tutoriales
                  </Link>
                </li>
                <li>
                  <Link href="/contacto" className="hover:text-[var(--zm-gold)] transition-colors">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terminos" className="hover:text-[var(--zm-gold)] transition-colors">
                    Términos
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                Síguenos
              </h4>
              <ul className="space-y-2 text-sm text-[var(--zm-text-muted)]">
                <li>
                  <a
                    href="https://twitter.com/zonamundial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--zm-gold)] transition-colors"
                  >
                    Twitter/X
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/zonamundial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--zm-gold)] transition-colors"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/zonamundial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--zm-gold)] transition-colors"
                  >
                    Discord
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-[var(--zm-border)]">
            <p className="text-center text-xs sm:text-sm text-[var(--zm-text-muted)]">
              © 2026 Zona Futbol. Todos los derechos reservados. |{" "}
              <Link href="/legal/privacidad" className="hover:text-[var(--zm-gold)] transition-colors">
                Privacidad
              </Link>{" "}
              |{" "}
              <Link href="/legal/terminos" className="hover:text-[var(--zm-gold)] transition-colors">
                Términos
              </Link>
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════
          CSS ANIMATIONS (Inline Styles)
          ════════════════════════════════════════════════════════════ */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gold-glow {
          0% {
            box-shadow: 0 0 10px rgba(201, 168, 76, 0);
          }
          50% {
            box-shadow: 0 0 20px rgba(201, 168, 76, 0.4);
          }
          100% {
            box-shadow: 0 0 10px rgba(201, 168, 76, 0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .hover\:gold-glow:hover {
          animation: gold-glow 1.5s ease-in-out;
        }

        /* ═════════════════════════════════════════════════════════════
           RESPONSIVE ADJUSTMENTS
           ═════════════════════════════════════════════════════════════ */

        @media (max-width: 640px) {
          section {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

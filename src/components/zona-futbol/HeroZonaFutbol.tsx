"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShimmerCard } from "../ShimmerCard";

gsap.registerPlugin(ScrollTrigger);

interface HeroZonaFutbolProps {
  title: string;
  subtitle?: string;
  leagueLogos: Array<{
    id: string;
    logoUrl: string;
    name: string;
    color: string;
  }>;
  backgroundImage?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  showParallax?: boolean;
  variant?: "full" | "compact";
}

export default function HeroZonaFutbol({
  title,
  subtitle,
  leagueLogos,
  backgroundImage,
  primaryCta,
  secondaryCta,
  showParallax = true,
  variant = "full",
}: HeroZonaFutbolProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const logosContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showParallax || !logosContainerRef.current) return;

    const trigger = gsap.to(logosContainerRef.current, {
      y: -100,
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
      paused: true,
    });

    return () => {
      trigger.scrollTrigger?.kill();
    };
  }, [showParallax]);

  return (
    <section
      ref={heroRef}
      className={`relative overflow-hidden ${
        variant === "full" ? "min-h-screen" : "min-h-[500px]"
      } flex items-center`}
      style={{
        background: backgroundImage
          ? `url(${backgroundImage})`
          : "linear-gradient(135deg, #000000 0%, #14110a 50%, #0a0906 100%)",
        backgroundSize: backgroundImage ? "cover" : "auto",
        backgroundPosition: "center",
        backgroundAttachment: backgroundImage ? "fixed" : "initial",
      }}
    >
      {/* Overlay gradient */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            rgba(0,0,0,0.6) 0%,
            rgba(0,0,0,0.8) 60%,
            rgba(0,0,0,1) 100%)`,
        }}
      />

      {/* Fondo con múltiples ligas (parallax effect) */}
      <div
        ref={logosContainerRef}
        aria-hidden
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(201,168,76,0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 30%, rgba(59,130,246,0.2) 0%, transparent 60%)
          `,
          transform: "translateZ(0)",
        }}
      />

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="flex flex-col items-center text-center">
          {/* Título */}
          <h1
            className="font-black text-white leading-tight tracking-tight mb-4"
            style={{
              fontSize: "clamp(40px, 8vw, 72px)",
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </h1>

          {/* Subtítulo */}
          {subtitle && (
            <p className="text-lg sm:text-xl text-zm-text-muted max-w-2xl mb-8 leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Logos de ligas (grid parallax) */}
          {leagueLogos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
              {leagueLogos.map((league, idx) => (
                <ShimmerCard key={league.id}>
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center backdrop-blur-md border transition-transform hover:scale-110"
                    style={{
                      background: `${league.color}15`,
                      borderColor: `${league.color}30`,
                      animationDelay: `${idx * 0.1}s`,
                    }}
                    title={league.name}
                  >
                    <img
                      src={league.logoUrl}
                      alt={league.name}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </ShimmerCard>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-4">
            {primaryCta && (
              <Link
                href={primaryCta.href}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm transition-all group bb-touch hover:shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #c9a84c, #e8d48b)",
                  color: "#000000",
                  boxShadow:
                    "0 0 0 1px rgba(232,212,139,0.55), 0 12px 30px -8px rgba(201,168,76,0.45)",
                }}
              >
                {primaryCta.text}
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            )}

            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-sm border text-white transition-all bb-touch hover:bg-white/10"
                style={{
                  borderColor: "rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {secondaryCta.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

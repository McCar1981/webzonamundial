"use client";

import { useEffect, RefObject } from "react";
import { gsap } from "gsap";
import { LuxuryBallBanner } from "@/components/LuxuryBallBanner";
import { FloatingElements } from "@/components/FloatingElements";
import { MagneticButton } from "../components/MagneticButton";
import { BG, BG2, ACCENT_ORANGE } from "../constants";

export function HeroSection({
  heroRef,
  titleRef,
  h,
  cd,
  IMGS,
}: {
  heroRef: RefObject<HTMLDivElement | null>;
  titleRef: RefObject<HTMLHeadingElement | null>;
  h: any;
  cd: { d: number; h: number; m: number; s: number };
  IMGS: Record<string, string>;
}) {
  useEffect(() => {
    if (titleRef.current) {
      const lines = titleRef.current.querySelectorAll(".hero-title-line");
      gsap.fromTo(
        lines,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          delay: 0.5,
        }
      );
    }
  }, [titleRef]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-12 pb-20 overflow-hidden"
    >
      {/* Stadium background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/28847309/pexels-photo-28847309.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
          alt="Estadio de fútbol con gradas iluminadas durante el Mundial 2026"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
      {/* Overlays for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(170deg, ${BG2}ee 0%, ${BG}dd 40%, #0a0f1aee 100%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.15) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 70% 80%, rgba(0,180,220,0.05) 0%, transparent 40%)",
        }}
      />

      {/* Animated Field pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none parallax-slow"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect x="50" y="50" width="1100" height="700" fill="none" stroke="#c9a84c" strokeWidth="2" />
        <line x1="600" y1="50" x2="600" y2="750" stroke="#c9a84c" strokeWidth="2" />
        <circle cx="600" cy="400" r="91.5" fill="none" stroke="#c9a84c" strokeWidth="2" />
        <circle cx="600" cy="400" r="3" fill="#c9a84c" />
        <rect x="50" y="244" width="165" height="312" fill="none" stroke="#c9a84c" strokeWidth="2" />
        <rect x="985" y="244" width="165" height="312" fill="none" stroke="#c9a84c" strokeWidth="2" />
      </svg>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#C9A84C]/10 rounded-full blur-[100px] animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      {/* Floating Elements */}
      <FloatingElements />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="gsap-hero-item inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/5 mb-8 hover:bg-[#C9A84C]/10 transition-all cursor-default">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] animate-pulse" />
          <span className="text-[#C9A84C] text-xs font-bold tracking-wider uppercase">
            {h.heroBadge}
          </span>
        </div>

        {/* Title con animación GSAP */}
        <h1
          ref={titleRef}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[0.95] tracking-tighter"
        >
          <span className="hero-title-line block">{h.heroTitle1}</span>
          <span className="hero-title-line block text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] via-[#E8D48B] to-[#ff6b35] animate-gradient">
            {h.heroTitle2}
          </span>
        </h1>

        {/* VIDEO LOGO */}
        <div className="gsap-hero-item mb-8 flex justify-center">
          <div className="relative rounded-full overflow-hidden shadow-[0_0_80px_rgba(201,168,76,0.4)] hover:shadow-[0_0_120px_rgba(201,168,76,0.6)] transition-shadow duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-[#C9A84C]/20 to-transparent z-10" />
            <video
              src="/img/zonamundial-images/video logo dando vueltas.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full max-w-[320px] h-auto block"
              style={{ mixBlendMode: "screen" }}
            />
          </div>
        </div>

        <p className="gsap-hero-item text-xl text-[#8a94b0] max-w-2xl mx-auto mb-10 leading-relaxed">
          {h.heroSubtitle}
        </p>

        {/* Countdown */}
        <div className="gsap-hero-item flex justify-center gap-3 sm:gap-5 mb-10">
          {[
            { v: cd.d, l: h.countdown.days },
            { v: cd.h, l: h.countdown.hours },
            { v: cd.m, l: h.countdown.min },
            { v: cd.s, l: h.countdown.sec },
          ].map((u) => (
            <div key={u.l} className="text-center group">
              <div className="relative w-[70px] sm:w-[85px] h-[70px] sm:h-[85px] rounded-2xl bg-gradient-to-br from-[#0F1D32] to-[#0B1825] border border-[#C9A84C]/20 flex items-center justify-center shadow-lg group-hover:border-[#C9A84C]/50 group-hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] transition-all duration-300">
                <span className="text-3xl sm:text-4xl font-black text-[#C9A84C] tabular-nums group-hover:scale-110 transition-transform">
                  {String(u.v).padStart(2, "0")}
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C9A84C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-[11px] text-gray-400 font-semibold mt-3 block tracking-widest">
                {u.l}
              </span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="gsap-hero-item flex flex-wrap justify-center gap-4">
          <MagneticButton href="/registro" variant="primary">
            {h.heroCta1}
          </MagneticButton>
          <MagneticButton href="/selecciones" variant="secondary">
            {h.heroCta2}
          </MagneticButton>
        </div>

        {/* Social proof — contador pre-registros */}
        <div className="gsap-hero-item mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Avatares apilados */}
            <div className="flex -space-x-2">
              {[IMGS.c_jose_cobo, IMGS.c_svgiago, IMGS.c_pimpeano, IMGS.c_nachocp].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  role="presentation"
                  loading="lazy"
                  decoding="async"
                  className="w-8 h-8 rounded-full border-2 border-[#060B14] object-cover"
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <span className="text-sm text-gray-300">
                <span className="font-bold text-white">{h.socialProof.count}</span>{" "}
                {h.socialProof.label}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400">{h.socialProof.trust}</p>
        </div>

      </div>

      {/* Luxury Ball Background - Parabolic Motion */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        <div className="relative w-full h-full">
          <LuxuryBallBanner />
        </div>
      </div>
    </section>
  );
}

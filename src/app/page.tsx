// src/app/page.tsx
// ZonaMundial.app — Home Page con GSAP Animations

"use client";

import { useRef } from "react";
import { GoldParticles } from "@/components/GoldParticles";
import { useLanguage } from "@/i18n/LanguageContext";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { useCountdown } from "./_home/hooks/useCountdown";
import { BG, IMGS } from "./_home/constants";
import { MODULES_BASE } from "./_home/data";

import { ScrollProgressBar } from "./_home/components/ScrollProgressBar";
import { HeroSection } from "./_home/sections/HeroSection";
import { StatsHowSection } from "./_home/sections/StatsHowSection";
import { PlatformShowcaseSection } from "./_home/sections/PlatformShowcaseSection";
import { ModulesGridSection } from "./_home/sections/ModulesGridSection";
import { ModulesBentoSection } from "./_home/sections/ModulesBentoSection";
import { GuaranteesBar } from "./_home/sections/GuaranteesBar";
import { CommunityCreatorsSection } from "./_home/sections/CommunityCreatorsSection";
import { SocialProofTicker } from "./_home/sections/SocialProofTicker";
import { WaitlistSection } from "./_home/sections/WaitlistSection";
import { FinalCTASection } from "./_home/sections/FinalCTASection";
import { AlbumDominaSection } from "./_home/sections/AlbumDominaSection";
import { AppRevealSection } from "./_home/sections/AppRevealSection";
import { CinematicDivider } from "./_home/sections/CinematicDivider";
import { CalendarBanner } from "./_home/sections/CalendarBanner";

export default function HomePage() {
  const { t } = useLanguage();
  const h = t.home;

  const MODULES = MODULES_BASE.map((m) => ({
    ...m,
    title: h.modules[m.key].title,
    desc: h.modules[m.key].desc,
  }));

  const cd = useCountdown("2026-06-11T00:00:00-05:00");
  const {
    heroRef,
    statsRef,
    featuresRef,
    cardsRef,
    creatorsRef,
    screenshotsRef,
    howItWorksRef,
    albumRef,
    ctaRef,
  } = useGSAPAnimations();
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <div
      style={{
        background: BG,
        color: "#fff",
        fontFamily: "'Outfit',sans-serif",
        minHeight: "100vh",
      }}
      className="relative overflow-hidden"
    >
      <ScrollProgressBar />
      <GoldParticles />

      <HeroSection
        heroRef={heroRef}
        titleRef={titleRef}
        h={h}
        cd={cd}
        IMGS={IMGS}
      />
      <StatsHowSection />
      <CalendarBanner />
      <ModulesGridSection />
      <PlatformShowcaseSection />
      <ModulesBentoSection />
      <GuaranteesBar items={h.guarantees} />
      <CommunityCreatorsSection />
      <AlbumDominaSection />
      <AppRevealSection />
      <WaitlistSection />
      <SocialProofTicker items={h.testimonials} />
      <FinalCTASection />
    </div>
  );
}

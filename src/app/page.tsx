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
import { StatsSection } from "./_home/sections/StatsSection";
import { AppScreenshotsSection } from "./_home/sections/AppScreenshotsSection";
import { WhyDifferentSection } from "./_home/sections/WhyDifferentSection";
import { FeaturesCarouselSection } from "./_home/sections/FeaturesCarouselSection";
import { GuaranteesBar } from "./_home/sections/GuaranteesBar";
import { CreatorsSection } from "./_home/sections/CreatorsSection";
import { SocialProofTicker } from "./_home/sections/SocialProofTicker";
import { AppBannerSection } from "./_home/sections/AppBannerSection";
import { CtaFinalSection } from "./_home/sections/CtaFinalSection";
import { HowItWorksSection } from "./_home/sections/HowItWorksSection";
import { AlbumSection } from "./_home/sections/AlbumSection";
import { CinematicDivider } from "./_home/sections/CinematicDivider";

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
      <StatsSection statsRef={statsRef} h={h} />
      <HowItWorksSection sectionRef={howItWorksRef} h={h} />
      <AppScreenshotsSection screenshotsRef={screenshotsRef} h={h} />
      <WhyDifferentSection h={h} />
      <FeaturesCarouselSection
        featuresRef={featuresRef}
        cardsRef={cardsRef}
        modules={MODULES}
        h={h}
      />
      <GuaranteesBar items={h.guarantees} />
      <CinematicDivider
        src="https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
        height="h-[250px] sm:h-[350px]"
        overlay="from-[#060B14] via-[#060B14]/20 to-[#0B1825]"
      />
      <CreatorsSection creatorsRef={creatorsRef} h={h} />
      <AlbumSection albumRef={albumRef} h={h} />
      <AppBannerSection h={h} />
      <SocialProofTicker items={h.testimonials} />
      <CtaFinalSection ctaRef={ctaRef} h={h} />
    </div>
  );
}

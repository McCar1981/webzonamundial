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
import { EditorialIntro } from "./_home/sections/EditorialIntro";
import { GuiaMundial2026Section } from "./_home/sections/GuiaMundial2026Section";
import PushOptInBanner from "@/components/PushOptInBanner";
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
import { BracketBanner } from "./_home/sections/BracketBanner";
import { HomeTriviaPlaySection } from "./_home/sections/HomeTriviaPlaySection";
import { HomeMatchPredictSection } from "./_home/sections/HomeMatchPredictSection";

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
      {/*
        Trivia JUGABLE inline: el único módulo que ya está activo (no requiere
        que el Mundial haya comenzado). Interactividad aditiva — va alta en el
        scroll para enganchar, pero SIN desplazar el contenido editorial.
      */}
      <HomeTriviaPlaySection />
      <CalendarBanner />
      <BracketBanner />
      {/*
        Contenido editorial PRIMERO (tras el hero y los banners contextuales
        del Mundial). Antes estaba al final del home, lo que hacía que un
        revisor de AdSense viera primero la vitrina de producto. Subirlo deja
        la prosa de calidad en el primer tercio del scroll y del HTML, dejando
        claro que la home tiene contenido editorial real, no solo marketing.
      */}
      <EditorialIntro />
      {/*
        FRENTE 1 AdSense: bloque editorial extenso (~1.800 palabras) que sube
        la home de 2.272 a ~4.000 palabras de contenido real. Demuestra a
        Google que la home NO es marketing puro: tiene guía editorial,
        autoría, fecha y referencias verificables (FIFA, sedes, DTs,
        jugadores). Pieza con autoridad SEO y E-E-A-T.
      */}
      <GuiaMundial2026Section />
      {/*
        Match Center + Predicciones (teaser interactivo): debajo del editorial.
        Próximo partido jugable "¿quién gana?" + tira de próximos partidos que
        enlazan a su Match Center. Aditivo, no reemplaza prosa.
      */}
      <HomeMatchPredictSection />
      {/* Vitrina de producto: debajo del contenido editorial. */}
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
      {/* Push banner: aparece tras 7s en la primera visita (config interno).
          Antes solo estaba en /noticias y resultaba que tenía 1 suscriptor.
          La home recibe ~10× más tráfico → multiplicador de captación. */}
      <PushOptInBanner />
    </div>
  );
}

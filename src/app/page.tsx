// src/app/page.tsx
// ZonaMundial.app — Home Page con GSAP Animations

"use client";

import { useRef } from "react";
import { GoldParticles } from "@/components/GoldParticles";
import { useLanguage } from "@/i18n/LanguageContext";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { useCountdown } from "./_home/hooks/useCountdown";
import { usePostMundial } from "./_home/hooks/usePostMundial";
import { BG, IMGS } from "./_home/constants";
import { MODULES_BASE } from "./_home/data";

import { ScrollProgressBar } from "./_home/components/ScrollProgressBar";
import { HeroSection } from "./_home/sections/HeroSection";
import { EditorialIntro } from "./_home/sections/EditorialIntro";
import { GuiaMundial2026Section } from "./_home/sections/GuiaMundial2026Section";
import { LatestNewsSection } from "./_home/sections/LatestNewsSection";
import PushOptInBanner from "@/components/PushOptInBanner";
import HomeInstallBanner from "@/components/HomeInstallBanner";
import { StatsHowSection } from "./_home/sections/StatsHowSection";
import { PlatformShowcaseSection } from "./_home/sections/PlatformShowcaseSection";
import { ModulesGridSection } from "./_home/sections/ModulesGridSection";
import { ModulesBentoSection } from "./_home/sections/ModulesBentoSection";
import { GuaranteesBar } from "./_home/sections/GuaranteesBar";
import { SocialProofTicker } from "./_home/sections/SocialProofTicker";
import { WaitlistSection } from "./_home/sections/WaitlistSection";
import { FinalCTASection } from "./_home/sections/FinalCTASection";
import { AlbumDominaSection } from "./_home/sections/AlbumDominaSection";
import { AppRevealSection } from "./_home/sections/AppRevealSection";
import { CinematicDivider } from "./_home/sections/CinematicDivider";
import { CalendarBanner } from "./_home/sections/CalendarBanner";
import { BracketBanner } from "./_home/sections/BracketBanner";
import { LigasBanner } from "./_home/sections/LigasBanner";
import { HomeTriviaPlaySection } from "./_home/sections/HomeTriviaPlaySection";
import { HomeMatchPredictSection } from "./_home/sections/HomeMatchPredictSection";
import AdBanner from "@/components/ads/AdBanner";

export default function HomePage() {
  const { t } = useLanguage();
  const h = t.home;

  const MODULES = MODULES_BASE.map((m) => ({
    ...m,
    title: h.modules[m.key].title,
    desc: h.modules[m.key].desc,
  }));

  const cd = useCountdown("2026-06-11T00:00:00-05:00");
  // Pivote post-Mundial: desde el lunes 20-jul (o con ?zm-ligas=1) la home
  // vende Zona de Ligas — hero en modo Ligas y banners del torneo retirados.
  // El contenido editorial del Mundial se CONSERVA: sigue rentando SEO.
  const postMundial = usePostMundial();
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
        post={postMundial}
      />
      {/* Banner de instalación PWA: justo bajo el hero, máxima visibilidad.
          Se autooculta si la app ya está instalada o si el navegador no es
          instalable; en iOS muestra las instrucciones de Safari. */}
      <HomeInstallBanner />
      {/*
        Banner del Match Center: ahora vive DENTRO del hero (HeroSection), con
        selección automática de partido (regla fija en /api/match-center/featured).
      */}
      <StatsHowSection />
      {/*
        Trivia JUGABLE inline: el único módulo que ya está activo (no requiere
        que el Mundial haya comenzado). Interactividad aditiva — va alta en el
        scroll para enganchar, pero SIN desplazar el contenido editorial.
      */}
      <HomeTriviaPlaySection />
      {/* Post-final se retiran: "añade el Mundial a tu calendario" y
          "construye tu bracket" son CTAs de un torneo que ya terminó. El
          LigasBanner ocupa su hueco como banner contextual principal. */}
      {!postMundial && <CalendarBanner />}
      {!postMundial && <BracketBanner />}
      {/*
        Puente a Zona de Ligas: el tráfico del Mundial caduca con la final; este
        banner (estático, sin JS) es el desvío hacia el producto de temporada
        completa. También aporta enlazado interno SEO desde la página con más
        autoridad hacia /ligas.
      */}
      <LigasBanner />
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
        "Últimas del Mundial": rejilla de tarjetas tirando del motor editorial
        (getAllPublicNoticias vía /api/noticias/ultimas). La sección es client
        y hace fetch en useEffect porque page.tsx es "use client" y no puede
        importar el loader server-only. Si la lista llega vacía, no renderiza.
      */}
      <LatestNewsSection />
      {/*
        Match Center + Predicciones (teaser interactivo): debajo del editorial.
        Próximo partido jugable "¿quién gana?" + tira de próximos partidos que
        enlazan a su Match Center. Aditivo, no reemplaza prosa.
        Post-final se retira: su fuente (matches.ts) ya no tiene partidos
        futuros y el fallback mostraría partidos PASADOS como "próximos".
      */}
      {!postMundial && <HomeMatchPredictSection />}
      {/* AdSense: banner entre contenido editorial y vitrina de producto. */}
      <AdBanner />
      {/* Vitrina de producto: debajo del contenido editorial. */}
      <ModulesGridSection />
      <PlatformShowcaseSection />
      <ModulesBentoSection />
      <GuaranteesBar items={h.guarantees} />
      <AlbumDominaSection />
      <AppRevealSection />
      <WaitlistSection />
      <SocialProofTicker items={h.testimonials} />
      <FinalCTASection />
      {/* AdSense: banner antes del footer. */}
      <AdBanner />
      {/* Push banner: aparece tras 7s en la primera visita (config interno).
          Antes solo estaba en /noticias y resultaba que tenía 1 suscriptor.
          La home recibe ~10× más tráfico → multiplicador de captación. */}
      <PushOptInBanner />
    </div>
  );
}

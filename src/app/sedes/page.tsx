'use client';
// src/app/sedes/page.tsx
// ZonaMundial.app — Índice de las 16 sedes con imágenes reales y animaciones GSAP

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { SEDES, getSedesByPais } from '@/data/sedes';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '@/i18n/LanguageContext';

// Registrar ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14";
const BG2 = "#0F1D32";
const BG3 = "#0B1825";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";

// Mapeo de imágenes de estadios - Imágenes locales del proyecto
const STADIUM_IMAGES: Record<string, string> = {
  'nueva-york': '/img/zonamundial-images/stadiums/metlife-stadium.jpg',
  'los-angeles': '/img/zonamundial-images/stadiums/sofi-stadium-los-angeles.jpg',
  'miami': '/img/zonamundial-images/stadiums/hard-rock-stadium-miami.jpg',
  'dallas': '/img/zonamundial-images/stadiums/att-stadium-dallas.jpg',
  'san-francisco': '/img/zonamundial-images/stadiums/levis-stadium-san-francisco.jpg',
  'seattle': '/img/zonamundial-images/stadiums/lumen-field-seattle.jpg',
  'atlanta': '/img/zonamundial-images/stadiums/mercedes-benz-stadium-atlanta.jpg',
  'houston': '/img/zonamundial-images/stadiums/nrg-stadium-houston.jpg',
  'filadelfia': '/img/zonamundial-images/stadiums/lincoln-financial-field-filadelfia.jpg',
  'boston': '/img/zonamundial-images/stadiums/gillette-stadium-boston.jpg',
  'kansas-city': '/img/zonamundial-images/stadiums/arrowhead-stadium-kansas-city.jpg',
  'ciudad-de-mexico': '/img/zonamundial-images/stadiums/estadio-azteca-cdmx.jpg',
  'guadalajara': '/img/zonamundial-images/stadiums/estadio-akron-guadalajara.jpg',
  'monterrey': '/img/zonamundial-images/stadiums/estadio-bbva-monterrey.jpg',
  'toronto': '/img/zonamundial-images/stadiums/bmo-field-toronto.jpg',
  'vancouver': '/img/zonamundial-images/stadiums/bc-place-vancouver.jpg',
};

// Componente de tarjeta de estadio
function EstadioCard({ sede, index, labels }: { sede: typeof SEDES[0]; index: number; labels: { capacidad: string; partidos: string; clima: string; verGuia: string } }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const imageUrl = STADIUM_IMAGES[sede.slug];
  const isFinal = sede.fasesQueAlberga.includes('FINAL');
  const isSemifinal = sede.fasesQueAlberga.includes('Semifinal');
  const isInaugural = sede.partidosDestacados.some(p => p.toLowerCase().includes('inaugur'));
  
  useEffect(() => {
    const card = cardRef.current;
    const image = imageRef.current;
    
    if (!card) return;
    
    // Hover animations
    const hoverTl = gsap.timeline({ paused: true });
    
    if (image) {
      hoverTl.to(image, {
        scale: 1.15,
        duration: 0.6,
        ease: "power2.out"
      }, 0);
    }
    
    hoverTl.to(card, {
      y: -8,
      boxShadow: "0 25px 80px rgba(201, 168, 76, 0.25)",
      borderColor: "rgba(201, 168, 76, 0.5)",
      duration: 0.4,
      ease: "power2.out"
    }, 0);
    
    const handleMouseEnter = () => hoverTl.play();
    const handleMouseLeave = () => hoverTl.reverse();
    
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      hoverTl.kill();
    };
  }, []);
  
  return (
    <Link
      ref={cardRef}
      href={`/sedes/${sede.slug}`}
      className="group relative block rounded-2xl overflow-hidden border border-white/5 bg-[#0B1825] estadio-card"
      style={{ opacity: 0, transform: 'translateY(40px)' }}
    >
      {/* Imagen del estadio */}
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <img
            ref={imageRef}
            src={imageUrl}
            alt={sede.estadio}
            className="w-full h-full object-cover stadium-image"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0F1D32] to-[#1a2a3f] flex items-center justify-center">
            <span className="text-5xl">🏟️</span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {isFinal && (
            <span className="px-3 py-1 bg-[#c9a84c] text-[#060B14] text-xs font-black rounded-full shadow-lg">
              <img src="/img/imagenessilviu/balondefutbol.png" alt="" className="w-4 h-4 inline-block mr-1" /> FINAL
            </span>
          )}
          {isSemifinal && !isFinal && (
            <span className="px-3 py-1 bg-[#c9a84c]/90 text-[#060B14] text-xs font-black rounded-full shadow-lg">
              <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png" alt="" className="w-4 h-4 inline-block mr-1" /> SEMIFINAL
            </span>
          )}
          {isInaugural && (
            <span className="px-3 py-1 bg-green-500 text-white text-xs font-black rounded-full shadow-lg">
              <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/historia.png" alt="" className="w-4 h-4 inline-block mr-1" /> INAUGURACIÓN
            </span>
          )}
          {sede.techoCerrado && (
            <span className="px-3 py-1 bg-blue-500/80 text-white text-xs font-bold rounded-full shadow-lg">
              <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/ranking.png" alt="" className="w-4 h-4 inline-block mr-1" /> TECHO
            </span>
          )}
        </div>

        {/* Bandera del país */}
        <div className="absolute top-3 left-3">
          <img
            src={`https://flagcdn.com/w80/${sede.paisCodigo.toLowerCase()}.png`}
            alt={sede.pais}
            className="w-10 h-7 object-cover rounded shadow-lg border border-white/20"
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-white text-lg group-hover:text-[#c9a84c] transition-colors duration-300 leading-tight">
              {sede.nombre}
            </h3>
            <p className="text-sm text-[#6a7a9a] mt-1">{sede.estadio}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
          <div className="bg-[#060B14] rounded-lg p-2 text-center stat-item">
            <p className="text-[10px] text-[#6a7a9a] uppercase">{labels.capacidad}</p>
            <p className="text-sm font-bold text-[#c9a84c]">{sede.capacidad.toLocaleString()}</p>
          </div>
          <div className="bg-[#060B14] rounded-lg p-2 text-center stat-item">
            <p className="text-[10px] text-[#6a7a9a] uppercase">{labels.partidos}</p>
            <p className="text-sm font-bold text-white">{sede.totalPartidos}</p>
          </div>
          <div className="bg-[#060B14] rounded-lg p-2 text-center stat-item">
            <p className="text-[10px] text-[#6a7a9a] uppercase">{labels.clima}</p>
            <p className="text-sm font-bold text-white">{sede.clima.tempMedia}</p>
          </div>
        </div>

        {/* Fases */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sede.fasesQueAlberga.slice(0, 3).map((fase) => (
            <span 
              key={fase}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                fase === 'FINAL' || fase === 'Semifinal' 
                  ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30'
                  : 'bg-white/5 text-[#8a94b0]'
              }`}
            >
              {fase}
            </span>
          ))}
          {sede.fasesQueAlberga.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#6a7a9a]">
              +{sede.fasesQueAlberga.length - 3}
            </span>
          )}
        </div>

        {/* Partidos destacados */}
        {sede.partidosDestacados.length > 0 && (
          <div className="pt-3 border-t border-white/5">
            <p className="text-xs text-[#8a94b0] flex items-center gap-1">
              <span>⭐</span>
              <span className="truncate">{sede.partidosDestacados[0]}</span>
            </p>
          </div>
        )}

        {/* Hover indicator */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[#6a7a9a] group-hover:text-[#c9a84c] transition-colors duration-300">
            {labels.verGuia}
          </span>
          <span className="text-[#c9a84c] transform group-hover:translate-x-1 transition-transform duration-300">→</span>
        </div>
      </div>

      {/* Bottom glow on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </Link>
  );
}

// Componente de estadio destacado (hero)
function EstadioDestacado({ sede, badge, badgeColor, index, labels }: { sede: typeof SEDES[0]; badge: string; badgeColor: string; index: number; labels: { capacidad: string; partidos: string; clima: string } }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageUrl = STADIUM_IMAGES[sede.slug];
  
  useEffect(() => {
    const card = cardRef.current;
    const image = imageRef.current;
    
    if (!card) return;
    
    // Parallax en scroll
    if (image) {
      gsap.to(image, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: card,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });
    }
    
    // Hover animations
    const hoverTl = gsap.timeline({ paused: true });
    
    if (image) {
      hoverTl.to(image, {
        scale: 1.08,
        duration: 0.7,
        ease: "power2.out"
      }, 0);
    }
    
    hoverTl.to(card, {
      borderColor: "rgba(201, 168, 76, 0.8)",
      duration: 0.3,
      ease: "power2.out"
    }, 0);
    
    const handleMouseEnter = () => hoverTl.play();
    const handleMouseLeave = () => hoverTl.reverse();
    
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      hoverTl.kill();
    };
  }, []);
  
  return (
    <Link
      ref={cardRef}
      href={`/sedes/${sede.slug}`}
      className="group relative block rounded-3xl overflow-hidden border-2 border-[#c9a84c]/30 estadio-destacado"
      style={{ opacity: 0, transform: 'translateY(50px)' }}
    >
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden">
        {imageUrl ? (
          <img
            ref={imageRef}
            src={imageUrl}
            alt={sede.estadio}
            className="w-full h-[130%] object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0F1D32] to-[#1a2a3f]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative p-6 md:p-8 min-h-[300px] flex flex-col justify-end">
        {/* Badge */}
        <span 
          className="absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-black shadow-lg"
          style={{ background: badgeColor, color: badgeColor === '#c9a84c' ? '#060B14' : '#fff' }}
        >
          {badge}
        </span>

        {/* Bandera */}
        <img
          src={`https://flagcdn.com/w80/${sede.paisCodigo.toLowerCase()}.png`}
          alt={sede.pais}
          className="w-12 h-8 object-cover rounded shadow-lg border border-white/20 mb-4"
        />

        <h3 className="text-2xl md:text-3xl font-black text-white mb-2 group-hover:text-[#c9a84c] transition-colors duration-300">
          {sede.nombre}
        </h3>
        <p className="text-lg text-[#8a94b0] mb-4">{sede.estadio}</p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-xs text-[#6a7a9a]">{labels.capacidad}</p>
              <p className="text-lg font-bold text-[#c9a84c]">{sede.capacidad.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <div>
              <p className="text-xs text-[#6a7a9a]">{labels.partidos}</p>
              <p className="text-lg font-bold text-white">{sede.totalPartidos}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌡️</span>
            <div>
              <p className="text-xs text-[#6a7a9a]">{labels.clima}</p>
              <p className="text-lg font-bold text-white">{sede.clima.tempMedia}</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-[#8a94b0] line-clamp-2">{sede.historia}</p>
      </div>
    </Link>
  );
}

export default function SedesIndex() {
  const { t } = useLanguage();
  const sT = t.sedes;
  const nav = t.nav;

  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const sedesDestacadasRef = useRef<HTMLElement>(null);
  const usaRef = useRef<HTMLElement>(null);
  const mexRef = useRef<HTMLElement>(null);
  const canRef = useRef<HTMLElement>(null);
  const guiasRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const cardLabels = { capacidad: sT.capacidad, partidos: sT.partidos, clima: sT.clima, verGuia: sT.verGuia };
  const destLabels = { capacidad: sT.capacidad, partidos: sT.partidos, clima: sT.clima };

  const usa = getSedesByPais('Estados Unidos');
  const mex = getSedesByPais('México');
  const can = getSedesByPais('Canadá');

  // Sedes destacadas
  const finalSede = SEDES.find(s => s.fasesQueAlberga.includes('FINAL'));
  const inauguralSede = SEDES.find(s => s.partidosDestacados.some(p => p.toLowerCase().includes('inaugur')));
  const semifinalSede = SEDES.find(s => s.fasesQueAlberga.includes('Semifinal') && !s.fasesQueAlberga.includes('FINAL'));

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      const heroTl = gsap.timeline({ delay: 0.2 });
      
      heroTl.fromTo('.hero-breadcrumb', 
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      )
      .fromTo('.hero-badge',
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
        "-=0.3"
      )
      .fromTo('.hero-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.2"
      )
      .fromTo('.hero-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      )
      .fromTo('.hero-stat',
        { opacity: 0, y: 40, scale: 0.9 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.7, 
          stagger: 0.15,
          ease: "back.out(1.4)"
        },
        "-=0.3"
      );

      // Parallax para emojis decorativos del hero
      gsap.to('.hero-emoji-1', {
        y: -50,
        rotation: -5,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5
        }
      });

      gsap.to('.hero-emoji-2', {
        y: -30,
        rotation: 10,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5
        }
      });

      // Sedes destacadas animations
      gsap.fromTo('.destacados-title',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sedesDestacadasRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Estadios destacados stagger
      gsap.fromTo('.estadio-destacado',
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sedesDestacadasRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // USA Section
      gsap.fromTo('.usa-title',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: usaRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo('.usa-section .estadio-card',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: usaRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // México Section
      gsap.fromTo('.mex-title',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: mexRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo('.mex-section .estadio-card',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: mexRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Canadá Section
      gsap.fromTo('.can-title',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: canRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo('.can-section .estadio-card',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: canRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Guías de viaje section
      gsap.fromTo('.guias-title',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: guiasRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo('.guia-card',
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: guiasRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // CTA Final animation
      gsap.fromTo('.cta-container',
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo('.cta-emoji',
        { opacity: 0, scale: 0, rotation: -180 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo('.cta-title',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 78%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo('.cta-button',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Parallax para glow del CTA
      gsap.to('.cta-glow-1', {
        x: 30,
        y: -20,
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 2
        }
      });

      gsap.to('.cta-glow-2', {
        x: -20,
        y: 30,
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 2
        }
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ background: BG, minHeight: '100vh' }}>
      {/* Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://zonamundial.app' },
          { '@type': 'ListItem', position: 2, name: 'Sedes', item: 'https://zonamundial.app/sedes' },
        ],
      })}} />

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ padding: '20px 20px 60px' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.08)_0%,transparent_60%)]" />
        <div className="absolute top-10 left-10 text-8xl opacity-[0.03] rotate-[-15deg] hero-emoji-1">🏟️</div>
        <div className="absolute bottom-10 right-10 text-7xl opacity-[0.03] rotate-[15deg] hero-emoji-2">⚽</div>

        <div className="max-w-6xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="hero-breadcrumb flex items-center gap-2 text-sm text-[#6a7a9a] mb-6">
            <Link href="/" className="hover:text-[#c9a84c] transition-colors">{nav.inicio}</Link>
            <span>/</span>
            <span className="text-[#c9a84c]">{nav.sedes}</span>
          </nav>

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="hero-badge inline-block px-3 py-1 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] text-xs font-bold tracking-wider uppercase mb-4 border border-[#c9a84c]/20">
              {sT.badge}
            </span>
            <h1 className="hero-title text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a84c] to-[#e8d48b]">16</span> {sT.heroTitle}
            </h1>
            <p className="hero-subtitle text-lg text-[#8a94b0] mb-8">
              {sT.heroSubtitle}
            </p>

            {/* Stats de países */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="hero-stat bg-[#0B1825] rounded-2xl p-4 border border-white/5 hover:border-blue-500/30 transition-colors">
                <img src="https://flagcdn.com/w80/us.png" alt="USA" className="w-12 h-8 object-cover rounded mx-auto mb-2 shadow-lg" />
                <p className="text-2xl font-black text-white">10</p>
                <p className="text-xs text-[#6a7a9a]">Estados Unidos</p>
                <p className="text-xs text-blue-400 mt-1">78 partidos</p>
              </div>
              <div className="hero-stat bg-[#0B1825] rounded-2xl p-4 border border-white/5 hover:border-green-500/30 transition-colors">
                <img src="https://flagcdn.com/w80/mx.png" alt="México" className="w-12 h-8 object-cover rounded mx-auto mb-2 shadow-lg" />
                <p className="text-2xl font-black text-white">3</p>
                <p className="text-xs text-[#6a7a9a]">México</p>
                <p className="text-xs text-green-400 mt-1">13 partidos</p>
              </div>
              <div className="hero-stat bg-[#0B1825] rounded-2xl p-4 border border-white/5 hover:border-red-500/30 transition-colors">
                <img src="https://flagcdn.com/w80/ca.png" alt="Canadá" className="w-12 h-8 object-cover rounded mx-auto mb-2 shadow-lg" />
                <p className="text-2xl font-black text-white">3</p>
                <p className="text-xs text-[#6a7a9a]">Canadá</p>
                <p className="text-xs text-red-400 mt-1">13 partidos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <a href="https://rotulemos.com" target="_blank" rel="noopener noreferrer" className="w-full bg-[#0B1825] border border-white/5 rounded-xl flex items-center justify-center py-3" data-sponsor-slot="sedes-hero">
          <img src="/img/imagenessilviu/rotulemos320x50.png" alt="Rotulemos" className="rounded-lg" style={{maxWidth:"100%",height:"auto"}} />
        </a>
      </div>

      {/* Sedes destacadas */}
      {(finalSede || inauguralSede || semifinalSede) && (
        <section ref={sedesDestacadasRef} className="max-w-6xl mx-auto px-4 mb-16">
          <div className="destacados-title flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">{sT.destacadas}</h2>
              <p className="text-sm text-[#6a7a9a]">{sT.destacadasSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finalSede && (
              <EstadioDestacado
                sede={finalSede}
                badge="🏆 LA FINAL"
                badgeColor="#c9a84c"
                index={0}
                labels={destLabels}
              />
            )}
            {inauguralSede && (
              <EstadioDestacado
                sede={inauguralSede}
                badge="🚀 INAUGURACIÓN"
                badgeColor="#22c55e"
                index={1}
                labels={destLabels}
              />
            )}
            {semifinalSede && (
              <EstadioDestacado
                sede={semifinalSede}
                badge="⚽ SEMIFINAL"
                badgeColor="#3b82f6"
                index={2}
                labels={destLabels}
              />
            )}
          </div>
        </section>
      )}

      {/* Estados Unidos */}
      <section ref={usaRef} className="usa-section max-w-6xl mx-auto px-4 mb-16">
        <div className="usa-title flex items-center gap-4 mb-8">
          <img src="https://flagcdn.com/w80/us.png" alt="USA" className="w-14 h-10 object-cover rounded-lg shadow-lg" />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Estados Unidos</h2>
            <p className="text-sm text-[#6a7a9a]">{usa.length} sedes · 78 partidos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {usa.map((sede, index) => (
            <EstadioCard key={sede.slug} sede={sede} index={index} labels={cardLabels} />
          ))}
        </div>
      </section>

      {/* México */}
      <section ref={mexRef} className="mex-section max-w-6xl mx-auto px-4 mb-16">
        <div className="mex-title flex items-center gap-4 mb-8">
          <img src="https://flagcdn.com/w80/mx.png" alt="México" className="w-14 h-10 object-cover rounded-lg shadow-lg" />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">México</h2>
            <p className="text-sm text-[#6a7a9a]">{mex.length} sedes · 13 partidos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mex.map((sede, index) => (
            <EstadioCard key={sede.slug} sede={sede} index={index} labels={cardLabels} />
          ))}
        </div>
      </section>

      {/* Canadá */}
      <section ref={canRef} className="can-section max-w-6xl mx-auto px-4 mb-16">
        <div className="can-title flex items-center gap-4 mb-8">
          <img src="https://flagcdn.com/w80/ca.png" alt="Canadá" className="w-14 h-10 object-cover rounded-lg shadow-lg" />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Canadá</h2>
            <p className="text-sm text-[#6a7a9a]">{can.length} sedes · 13 partidos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {can.map((sede, index) => (
            <EstadioCard key={sede.slug} sede={sede} index={index} labels={cardLabels} />
          ))}
        </div>
      </section>

      {/* Info general */}
      <section ref={guiasRef} className="max-w-6xl mx-auto px-4 mb-16">
        <div className="bg-gradient-to-br from-[#0B1825] to-[#0F1D32] rounded-2xl p-6 md:p-8 border border-white/5">
          <div className="guias-title flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
              <span className="text-2xl">🌎</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{sT.infoViaje}</h2>
              <p className="text-sm text-[#6a7a9a]">{sT.infoViajeSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="guia-card p-4 bg-[#060B14] rounded-xl border border-white/5 hover:border-[#c9a84c]/30 transition-all duration-300 hover:-translate-y-1">
              <span className="text-3xl mb-3 block">🛂</span>
              <h3 className="font-bold text-white mb-2">{sT.visas}</h3>
              <ul className="text-sm text-[#8a94b0] space-y-1">
                <li>• USA: ESTA o Visa B2</li>
                <li>• México: Sin visa (180 días)</li>
                <li>• Canadá: eTA electrónica</li>
              </ul>
            </div>
            <div className="guia-card p-4 bg-[#060B14] rounded-xl border border-white/5 hover:border-[#c9a84c]/30 transition-all duration-300 hover:-translate-y-1">
              <span className="text-3xl mb-3 block">💱</span>
              <h3 className="font-bold text-white mb-2">{sT.currency}</h3>
              <ul className="text-sm text-[#8a94b0] space-y-1">
                <li>• USA: Dólar USD</li>
                <li>• México: Peso MXN</li>
                <li>• Canadá: Dólar CAD</li>
              </ul>
            </div>
            <div className="guia-card p-4 bg-[#060B14] rounded-xl border border-white/5 hover:border-[#c9a84c]/30 transition-all duration-300 hover:-translate-y-1">
              <span className="text-3xl mb-3 block">🌤️</span>
              <h3 className="font-bold text-white mb-2">{sT.weather}</h3>
              <ul className="text-sm text-[#8a94b0] space-y-1">
                <li>• Junio: 15-35°C variable</li>
                <li>• Julio: 18-38°C caluroso</li>
                <li>• Revisa cada sede</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section ref={ctaRef} className="max-w-4xl mx-auto px-4 mb-16">
        <div className="cta-container relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#c9a84c]/10 via-[#0B1825] to-[#0F1D32] border border-[#c9a84c]/20 p-8 md:p-12 text-center">
          <div className="cta-glow-1 absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="cta-glow-2 absolute bottom-0 left-0 w-48 h-48 bg-[#c9a84c]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <span className="cta-emoji text-5xl mb-4 block">🎯</span>
            <h2 className="cta-title text-3xl md:text-4xl font-black text-white mb-4">
              {sT.ctaTitle}
            </h2>
            <p className="text-[#8a94b0] mb-8 max-w-xl mx-auto">
              {sT.ctaDesc}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/calendario"
                className="cta-button inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#060B14] font-bold rounded-xl hover:shadow-[0_8px_32px_rgba(201,168,76,0.4)] transition-all hover:-translate-y-0.5"
              >
                {sT.ctaBtn1}
              </Link>
              <Link
                href="/grupos"
                className="cta-button inline-flex items-center gap-2 px-6 py-3 bg-[#060B14] border border-[#c9a84c]/30 text-[#c9a84c] font-bold rounded-xl hover:bg-[#c9a84c]/10 transition-all"
              >
                {sT.ctaBtn2}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor footer */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <a href="#" target="_blank" rel="noopener noreferrer" className="w-full bg-[#0B1825] border border-white/5 rounded-xl flex items-center justify-center py-3" data-sponsor-slot="sedes-footer">
          <img src="/img/imagenessilviu/ChatGPT Image 8 abr 2026, 04_53_21 p.m..png" alt="Publicidad" className="rounded-lg" style={{maxWidth:"100%",height:"auto"}} />
        </a>
      </div>
    </div>
  );
}

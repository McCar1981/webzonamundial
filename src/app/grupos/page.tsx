'use client';
// src/app/grupos/page.tsx
// ZonaMundial.app — Índice de los 12 grupos con animaciones GSAP

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SELECCIONES, getSeleccionesByGrupo } from '@/data/selecciones';
import { useLanguage } from '@/i18n/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14";
const BG2 = "#0F1D32";
const BG3 = "#0B1825";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";

const TAG_STYLES: Record<string, { color: string; bg: string; icon?: string }> = {
  'A': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/48 selecciones.png' },
  'B': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/48 selecciones.png' },
  'C': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   icon: '/img/imagenessilviu/balondefutbol.png' },
  'D': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/48 selecciones.png' },
  'E': { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  icon: '/img/imagenessilviu/balondefutbol.png' },
  'G': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/micro-predicciones.png' },
  'H': { color: '#c9a84c', bg: 'rgba(201,168,76,0.15)',  icon: '/img/imagenessilviu/balondefutbol.png' },
  'I': { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  icon: '/img/imagenessilviu/balondefutbol.png' },
  'J': { color: '#38bdf8', bg: 'rgba(56,189,248,0.15)',  icon: '/img/zonamundial-images/imagenas/logos para sustuir emojis/ranking.png' },
  'K': { color: '#a855f7', bg: 'rgba(168,85,247,0.15)',  icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/modo carrera.png' },
  'L': { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/historia.png' },
};

// Componente de tarjeta de grupo
function GrupoCard({ letra, index }: { letra: string; index: number }) {
  const { t } = useLanguage();
  const gT = t.grupos;
  const cardRef = useRef<HTMLAnchorElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const teamsRef = useRef<HTMLDivElement>(null);
  const selecciones = getSeleccionesByGrupo(letra);
  const tagStyle = TAG_STYLES[letra];
  const tagText = gT.tags[letra as keyof typeof gT.tags];
  const tag = tagStyle ? { ...tagStyle, text: tagText } : undefined;
  const isHighlight = tagText?.includes('CAMPEÓN') || tagText?.includes('CHAMPION');

  useEffect(() => {
    const card = cardRef.current;
    const tagEl = tagRef.current;
    const teamsEl = teamsRef.current;
    
    if (!card) return;

    // Animación de entrada inmediata al cargar la página
    gsap.fromTo(card,
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        delay: 0.2 + index * 0.08,
        ease: "power3.out"
      }
    );

    // Animación del tag
    if (tagEl) {
      gsap.fromTo(tagEl,
        { opacity: 0, x: 20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          delay: 0.5 + index * 0.08,
          ease: "power2.out"
        }
      );
    }

    // Animación de equipos con stagger
    if (teamsEl) {
      const teams = teamsEl.querySelectorAll('.team-item');
      gsap.fromTo(teams,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.1,
          delay: 0.6 + index * 0.08,
          ease: "power2.out"
        }
      );
    }

    // Hover effect con GSAP
    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -8,
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      });
      
      if (isHighlight) {
        gsap.to(card, {
          boxShadow: "0 20px 40px rgba(239,68,68,0.3)",
          duration: 0.3
        });
      } else {
        gsap.to(card, {
          boxShadow: "0 20px 40px rgba(201,168,76,0.2)",
          duration: 0.3
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        boxShadow: "0 0 0 rgba(0,0,0,0)",
        duration: 0.3,
        ease: "power2.out"
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [index, isHighlight]);

  return (
    <Link
      ref={cardRef}
      href={`/grupos/grupo-${letra.toLowerCase()}`}
      className={`group relative block rounded-2xl overflow-hidden ${
        isHighlight 
          ? 'border-2 border-red-500/50' 
          : 'border border-white/5'
      }`}
      style={{ 
        background: isHighlight 
          ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(15,23,42,0.8))'
          : BG3
      }}
    >
      {/* Tag */}
      {tag && (
        <div 
          ref={tagRef}
          className="absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl text-[10px] font-black tracking-wider z-10 flex items-center gap-1"
          style={{ 
            background: tag.bg, 
            color: tag.color, 
            borderLeft: `1px solid ${tag.color}30`, 
            borderBottom: `1px solid ${tag.color}30`
          }}
        >
          {tag.icon && <img src={tag.icon} alt="" className="w-3 h-3 object-contain" />}
          {tag.text}
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <div 
            className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl ${
              isHighlight ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''
            }`}
            style={!isHighlight ? { 
              background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))', 
              color: '#c9a84c',
              border: '1px solid rgba(201,168,76,0.3)'
            } : {}}
          >
            {letra}
          </div>
          <div>
            <h2 className={`text-lg font-bold group-hover:text-[#c9a84c] transition-colors ${isHighlight ? 'text-white' : 'text-white'}`}>
              {gT.allGroups === "All groups" ? "Group" : "Grupo"} {letra}
            </h2>
            <p className="text-xs text-[#6a7a9a]">{gT.teamsMatch}</p>
          </div>
        </div>

        {/* Equipos */}
        <div ref={teamsRef} className="space-y-2.5">
          {selecciones.map((team, idx) => (
            <Link
              key={team.slug}
              href={`/selecciones/${team.slug}`}
              className="team-item flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <img 
                src={`https://flagcdn.com/w40/${team.flagCode}.png`}
                alt={team.nombre}
                className="w-7 h-5 object-cover rounded shadow-md"
              />
              <span className={`text-sm font-medium truncate flex-1 ${idx === 0 ? 'text-[#c9a84c]' : 'text-[#CBD5E1]'} group-hover:text-[#c9a84c] transition-colors`}>
                {team.nombre}
              </span>
              {idx === 0 && (
                <span className="text-[10px] font-bold text-[#c9a84c] bg-[#c9a84c]/10 px-2 py-0.5 rounded-full">
                  {t.ui.cabeza}
                </span>
              )}
              {team.mejorResultado?.includes('Campeón') && (
                <span className="text-[10px] text-yellow-400" title={team.mejorResultado}>
                  🏆
                </span>
              )}
              {team.esAnfitrion && (
                <span className="text-[10px] text-green-400">🏟️</span>
              )}
            </Link>
          ))}
        </div>

        {/* Ver más */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <span className="text-xs text-[#6a7a9a] group-hover:text-[#c9a84c] transition-colors flex items-center gap-1">
            {gT.verGrupoCompleto}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </div>
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#c9a84c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {/* Highlight pulse effect */}
      {isHighlight && (
        <div className="absolute inset-0 border-2 border-red-500/30 rounded-2xl animate-pulse pointer-events-none" />
      )}
    </Link>
  );
}

// Componente de descripción de grupo
function GrupoDescripcion({ letra, index }: { letra: string; index: number }) {
  const { t } = useLanguage();
  const gT = t.grupos;
  const descRef = useRef<HTMLDivElement>(null);
  const flagsRef = useRef<HTMLDivElement>(null);
  const selecciones = getSeleccionesByGrupo(letra);
  const descripcion = gT.descriptions[letra as keyof typeof gT.descriptions];
  const isHighlight = ['C', 'I'].includes(letra);

  useEffect(() => {
    const desc = descRef.current;
    const flags = flagsRef.current;
    
    if (!desc) return;

    // Animación de entrada inmediata
    gsap.fromTo(desc,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: 0.3 + index * 0.05,
        ease: "power2.out"
      }
    );

    // Animación de banderas
    if (flags) {
      const flagItems = flags.querySelectorAll('.flag-item');
      gsap.fromTo(flagItems,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          stagger: 0.05,
          delay: 0.5 + index * 0.05,
          ease: "back.out(1.7)"
        }
      );
    }
  }, [index]);

  return (
    <div 
      ref={descRef}
      className={`p-5 rounded-xl border transition-all hover:border-[#c9a84c]/30 ${
        isHighlight ? 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent' : 'border-white/5 bg-[#0B1825]'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div 
          className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${
            isHighlight ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#c9a84c]/10 text-[#c9a84c]'
          }`}
        >
          {letra}
        </div>
        <h3 className="text-lg font-bold text-white">{t.ui.grupo} {letra}</h3>
      </div>

      {/* Banderas */}
      <div ref={flagsRef} className="flex flex-wrap gap-2 mb-4">
        {selecciones.map((team) => (
          <Link
            key={team.slug}
            href={`/selecciones/${team.slug}`}
            className="flag-item flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#060B14] border border-white/5 hover:border-[#c9a84c]/30 transition-all"
           
          >
            <img 
              src={`https://flagcdn.com/w20/${team.flagCode}.png`}
              alt={team.nombre}
              className="w-5 h-3.5 object-cover rounded"
            />
            <span className="text-xs text-[#CBD5E1] hover:text-[#c9a84c]">{team.nombre}</span>
          </Link>
        ))}
      </div>

      <p className="text-sm text-gray-400 leading-relaxed">{descripcion}</p>
    </div>
  );
}

export default function GruposIndex() {
  const { t } = useLanguage();
  const gT = t.grupos;
  const gruposLetras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  
  const heroRef = useRef<HTMLDivElement>(null);
  const breadcrumbRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const sectionTitleRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animación del breadcrumb
      if (breadcrumbRef.current) {
        gsap.fromTo(breadcrumbRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.1 }
        );
      }

      // Animación del título
      if (titleRef.current) {
        gsap.fromTo(titleRef.current,
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out", delay: 0.2 }
        );
      }

      // Animación del subtítulo
      if (subtitleRef.current) {
        gsap.fromTo(subtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.4 }
        );
      }

      // Animación de stats con stagger
      if (statsRef.current) {
        const statItems = statsRef.current.querySelectorAll('.stat-item');
        gsap.fromTo(statItems,
          { opacity: 0, y: 30, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: "back.out(1.7)",
            delay: 0.5
          }
        );
      }

      // Animación de títulos de sección
      if (sectionTitleRef.current) {
        gsap.fromTo(sectionTitleRef.current,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: "power2.out",
            delay: 0.1
          }
        );
      }

      // Animación de sección de formato
      if (formatRef.current) {
        gsap.fromTo(formatRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: formatRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse"
            }
          }
        );

        // Animación de pasos del formato
        const steps = formatRef.current.querySelectorAll('.format-step');
        gsap.fromTo(steps,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: formatRef.current,
              start: "top 75%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Animación del CTA
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { opacity: 0, scale: 0.9, y: 50 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      {/* Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', 
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://zonamundial.app' },
          { '@type': 'ListItem', position: 2, name: 'Grupos', item: 'https://zonamundial.app/grupos' },
        ],
      })}} />

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ padding: '20px 20px 60px' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.08)_0%,transparent_60%)]" />
        <div className="absolute top-10 left-10 text-8xl opacity-[0.03] rotate-[-15deg]">📊</div>
        <div className="absolute bottom-10 right-10 text-7xl opacity-[0.03] rotate-[15deg]">⚽</div>

        <div className="max-w-6xl mx-auto relative">
          {/* Breadcrumb */}
          <nav ref={breadcrumbRef} className="flex items-center gap-2 text-sm text-[#6a7a9a] mb-6">
            <Link href="/" className="hover:text-[#c9a84c] transition-colors">{t.ui.inicio}</Link>
            <span>/</span>
            <span className="text-[#c9a84c]">{gT.allGroups === "All groups" ? "Groups" : "Grupos"}</span>
          </nav>

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] text-xs font-bold tracking-wider uppercase mb-4 border border-[#c9a84c]/20">
              {gT.badge}
            </span>
            <h1 ref={titleRef} className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              {gT.title.split('12')[0]}<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a84c] to-[#e8d48b]">12</span>{gT.title.split('12')[1]}
            </h1>
            <p ref={subtitleRef} className="text-lg text-[#8a94b0] mb-8">
              {gT.subtitle}
            </p>

            {/* Stats */}
            <div ref={statsRef} className="flex flex-wrap justify-center gap-4">
              {[
                { value: '12', label: gT.stats.grupos, icon: '📊' },
                { value: '48', label: gT.stats.equipos, icon: '⚽' },
                { value: '72', label: gT.stats.partidos, icon: '🏟️' },
                { value: '32', label: gT.stats.clasifican, icon: '✅' },
              ].map((stat) => (
                <div key={stat.label} className="stat-item flex items-center gap-3 px-4 py-2 bg-[#0F1D32] rounded-xl border border-white/5">
                  <span className="text-2xl">{stat.icon}</span>
                  <div className="text-left">
                    <p className="text-xl font-black text-[#c9a84c]">{stat.value}</p>
                    <p className="text-xs text-[#6a7a9a]">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <a href="https://rotulemos.com" target="_blank" rel="noopener noreferrer" className="w-full bg-[#0B1825] border border-white/5 rounded-xl flex items-center justify-center py-3" data-sponsor-slot="grupos-hero">
          <img src="/img/imagenessilviu/rotulemos320x50.png" alt="Rotulemos" className="rounded-lg" style={{maxWidth:"100%",height:"auto"}} />
        </a>
      </div>

      {/* Grid de grupos */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div ref={sectionTitleRef} className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{gT.allGroups}</h2>
            <p className="text-sm text-[#6a7a9a]">{gT.allGroupsSub}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {gruposLetras.map((letra, index) => (
            <GrupoCard key={letra} letra={letra} index={index} />
          ))}
        </div>
      </section>

      {/* Descripciones detalladas */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
            <span className="text-2xl">📖</span>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{gT.analysis}</h2>
            <p className="text-sm text-[#6a7a9a]">{gT.analysisSub}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gruposLetras.map((letra, index) => (
            <GrupoDescripcion key={letra} letra={letra} index={index} />
          ))}
        </div>
      </section>

      {/* Cómo funciona el formato */}
      <section ref={formatRef} className="max-w-6xl mx-auto px-4 mb-16">
        <div className="bg-gradient-to-br from-[#0B1825] to-[#0F1D32] rounded-2xl p-6 md:p-8 border border-white/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 flex items-center justify-center border border-blue-500/20">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{gT.format.title}</h2>
              <p className="text-sm text-[#6a7a9a]">{gT.format.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: gT.format.step1Title, desc: gT.format.step1Desc, icon: '🏆' },
              { step: '2', title: gT.format.step2Title, desc: gT.format.step2Desc, icon: '⭐' },
              { step: '3', title: gT.format.step3Title, desc: gT.format.step3Desc, icon: '🎯' },
            ].map((item) => (
              <div key={item.step} className="format-step relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 text-[#c9a84c] flex items-center justify-center font-black text-lg border border-[#c9a84c]/20">
                    {item.step}
                  </div>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[#8a94b0] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[#8a94b0]">
              📅 {gT.format.finalNote} <span className="text-[#c9a84c] font-bold">{gT.format.finalDate}</span> {gT.format.finalCity}
            </p>
            <Link
              href="/datos/formato-2026"
              className="px-5 py-2.5 bg-[#060B14] rounded-xl text-[#c9a84c] text-sm font-medium hover:bg-[#c9a84c]/10 transition-colors border border-[#c9a84c]/20"
            >
              {gT.format.verFormato}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-4xl mx-auto px-4 mb-16">
        <div 
          ref={ctaRef}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#c9a84c]/10 via-[#0B1825] to-[#0F1D32] border border-[#c9a84c]/20 p-8 md:p-12 text-center"
         
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#c9a84c]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <span className="text-5xl mb-4 block">🎯</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              {gT.cta.title}
            </h2>
            <p className="text-[#8a94b0] mb-8 max-w-xl mx-auto">
              {gT.cta.desc}
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#060B14] font-bold rounded-xl hover:shadow-[0_8px_32px_rgba(201,168,76,0.4)] transition-all hover:-translate-y-0.5"
            >
              {gT.cta.btn}
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Sponsor footer */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <a href="#" target="_blank" rel="noopener noreferrer" className="w-full bg-[#0B1825] border border-white/5 rounded-xl flex items-center justify-center py-3" data-sponsor-slot="grupos-footer">
          <img src="/img/imagenessilviu/ChatGPT Image 8 abr 2026, 04_53_21 p.m..png" alt="Publicidad" className="rounded-lg" style={{maxWidth:"100%",height:"auto"}} />
        </a>
      </div>
    </div>
  );
}

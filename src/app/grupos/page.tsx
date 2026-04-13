'use client';
// src/app/grupos/page.tsx
// ZonaMundial.app — Índice de los 12 grupos

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SELECCIONES, getSeleccionesByGrupo } from '@/data/selecciones';
import { useLanguage } from '@/i18n/LanguageContext';
import { MATCHES } from '@/data/matches';
import { SvgIcon } from '@/components/icons';

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14";
const BG3 = "#0B1825";

const TAG_STYLES: Record<string, { color: string; bg: string; icon?: string }> = {
  'A': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   icon: '48 selecciones' },
  'B': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   icon: '48 selecciones' },
  'C': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   icon: '/img/imagenessilviu/balondefutbol.png' },
  'D': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   icon: '48 selecciones' },
  'E': { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  icon: '/img/imagenessilviu/balondefutbol.png' },
  'F': { color: '#f97316', bg: 'rgba(249,115,22,0.15)',  icon: '/img/imagenessilviu/balondefutbol.png' },
  'G': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: 'micro-predicciones' },
  'H': { color: '#c9a84c', bg: 'rgba(201,168,76,0.15)',  icon: '/img/imagenessilviu/balondefutbol.png' },
  'I': { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  icon: '/img/imagenessilviu/balondefutbol.png' },
  'J': { color: '#38bdf8', bg: 'rgba(56,189,248,0.15)',  icon: 'ranking' },
  'K': { color: '#a855f7', bg: 'rgba(168,85,247,0.15)',  icon: 'modo carrera' },
  'L': { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: 'historia' },
};

function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' });
}

// Mini fixture de 6 partidos para cada grupo
function MiniFixture({ letra, locale }: { letra: string; locale: string }) {
  const matches = MATCHES.filter((m) => m.g === letra);
  if (matches.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-sm font-bold uppercase tracking-wider text-[#c9a84c] mb-3">{locale === 'en' ? 'Group fixtures' : 'Fixture del grupo'}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {matches.map((m) => (
          <div
            key={m.i}
            className="rounded-xl border border-white/5 bg-[#060B14] p-3 transition hover:border-[#c9a84c]/20"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <img src={`https://flagcdn.com/w20/${m.hf}.png`} alt={m.h} className="w-5 h-3.5 object-cover rounded" />
                <span className="text-sm font-semibold text-white truncate">{m.h}</span>
              </div>
              <span className="text-[10px] text-[#6a7a9a]">VS</span>
              <div className="flex items-center gap-2 min-w-0 justify-end">
                <span className="text-sm font-semibold text-white truncate">{m.a}</span>
                <img src={`https://flagcdn.com/w20/${m.af}.png`} alt={m.a} className="w-5 h-3.5 object-cover rounded" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#6a7a9a]">
              <span>{formatDate(m.d, locale)} · {m.t}</span>
              <span className="truncate max-w-[60%]">{m.vc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

    gsap.fromTo(card,
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.2 + index * 0.08, ease: "power3.out" }
    );

    if (tagEl) {
      gsap.fromTo(tagEl,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.4, delay: 0.5 + index * 0.08, ease: "power2.out" }
      );
    }

    if (teamsEl) {
      const teams = teamsEl.querySelectorAll('.team-item');
      gsap.fromTo(teams,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, delay: 0.6 + index * 0.08, ease: "power2.out" }
      );
    }
  }, [index]);

  return (
    <Link
      ref={cardRef}
      href={`/grupos/grupo-${letra.toLowerCase()}`}
      className={`group relative block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
        isHighlight
          ? 'border-2 border-red-500/50 hover:shadow-[0_8px_32px_rgba(239,68,68,0.25)]'
          : 'border border-white/5 hover:shadow-[0_8px_32px_rgba(201,168,76,0.15)]'
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
          {tag.icon && (tag.icon.startsWith('/') ? <img src={tag.icon} alt="" className="w-3 h-3 object-contain" /> : <SvgIcon name={tag.icon} size={12} />)}
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#facc15"><title>{team.mejorResultado}</title><path d="M5 3h14l-1.5 6H20l-8 12v-8H7l2-10z"/></svg>
              )}
              {team.esAnfitrion && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#4ade80"><path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 3.5L18 12h-1.5v6h-9v-6H6L12 5.5z"/></svg>
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

// Componente de contenido de tab de grupo
function GrupoTabContent({ letra }: { letra: string }) {
  const { t, locale } = useLanguage();
  const gT = t.grupos;
  const selecciones = getSeleccionesByGrupo(letra);
  const descripcion = gT.descriptions[letra as keyof typeof gT.descriptions];
  const isHighlight = ['C', 'I'].includes(letra);
  const analysis = gT.detailedAnalysis ? gT.detailedAnalysis[letra as keyof typeof gT.detailedAnalysis] : null;
  const labels = gT.analysisLabels;

  const sections = analysis ? [
    { key: 'keyMatchups', label: labels.keyMatchups, color: '#ef4444', icon: 'M12 2L2 12h3v8h14v-8h3L12 2z' },
    { key: 'favorites', label: labels.favorites, color: '#c9a84c', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { key: 'darkHorses', label: labels.darkHorses, color: '#a855f7', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { key: 'keyPlayers', label: labels.keyPlayers, color: '#3b82f6', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { key: 'history', label: labels.history, color: '#f59e0b', icon: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z' },
  ] : [];

  return (
    <div
      className={`p-5 md:p-6 rounded-2xl border transition-all ${
        isHighlight ? 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent' : 'border-white/5 bg-[#0B1825]'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                isHighlight ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#c9a84c]/10 text-[#c9a84c]'
              }`}
            >
              {letra}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{t.ui.grupo} {letra}</h3>
              <p className="text-sm text-[#6a7a9a]">{descripcion}</p>
            </div>
          </div>

          {/* Banderas */}
          <div className="flex flex-wrap gap-2 mb-5">
            {selecciones.map((team) => (
              <Link
                key={team.slug}
                href={`/selecciones/${team.slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#060B14] border border-white/5 hover:border-[#c9a84c]/30 transition-all"
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

          {/* Análisis detallado */}
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections.map((s) => (
                <div key={s.key} className="flex gap-3 p-3 rounded-xl bg-[#060B14]/60 border border-white/5">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={s.color}><path d={s.icon}/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: s.color }}>{s.label}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{analysis[s.key as keyof typeof analysis]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MiniFixture letra={letra} locale={locale} />
    </div>
  );
}

export default function GruposIndex() {
  const { t, locale } = useLanguage();
  const gT = t.grupos;
  const gruposLetras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const [activeTab, setActiveTab] = useState('A');

  const heroRef = useRef<HTMLDivElement>(null);
  const breadcrumbRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const sectionTitleRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (breadcrumbRef.current) {
        gsap.fromTo(breadcrumbRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.1 }
        );
      }

      if (titleRef.current) {
        gsap.fromTo(titleRef.current,
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out", delay: 0.2 }
        );
      }

      if (subtitleRef.current) {
        gsap.fromTo(subtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.4 }
        );
      }

      if (statsRef.current) {
        const statItems = statsRef.current.querySelectorAll('.stat-item');
        gsap.fromTo(statItems,
          { opacity: 0, y: 30, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)", delay: 0.5 }
        );
      }

      if (sectionTitleRef.current) {
        gsap.fromTo(sectionTitleRef.current,
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", delay: 0.1 }
        );
      }

      if (formatRef.current) {
        gsap.fromTo(formatRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
            scrollTrigger: { trigger: formatRef.current, start: "top 80%", toggleActions: "play none none reverse" }
          }
        );

        const steps = formatRef.current.querySelectorAll('.format-step');
        gsap.fromTo(steps,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: "power2.out",
            scrollTrigger: { trigger: formatRef.current, start: "top 75%", toggleActions: "play none none reverse" }
          }
        );
      }

      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { opacity: 0, scale: 0.9, y: 50 },
          {
            opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: ctaRef.current, start: "top 85%", toggleActions: "play none none reverse" }
          }
        );
      }

      if (tabsRef.current) {
        gsap.fromTo(tabsRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.3 }
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
        <SvgIcon name="los 12 grupos" size={112} className="absolute top-10 left-10 opacity-[0.06] rotate-[-15deg] pointer-events-none" />
        <SvgIcon name="match center" size={96} className="absolute bottom-10 right-10 opacity-[0.06] rotate-[15deg] pointer-events-none" />

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
                { value: '12', label: gT.stats.grupos, icon: 'los 12 grupos' },
                { value: '48', label: gT.stats.equipos, icon: '48 selecciones' },
                { value: '72', label: gT.stats.partidos, icon: 'match center' },
                { value: '32', label: gT.stats.clasifican, icon: 'ranking' },
              ].map((stat) => (
                <div key={stat.label} className="stat-item flex items-center gap-3 px-4 py-2 bg-[#0F1D32] rounded-xl border border-white/5">
                  <SvgIcon name={stat.icon} size={40} />
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
      <div className="max-w-6xl mx-auto px-4 mb-12 text-center">
        <a href="mailto:info@sprintmarkt.com?subject=Publicidad%20en%20ZonaMundial%20-%20P%C3%A1gina%20Grupos&body=Hola%20equipo%20de%20ZonaMundial%2C%0A%0AMe%20interesa%20contratar%20un%20espacio%20publicitario%20en%20la%20p%C3%A1gina%20de%20Grupos.%0A%0AEmpresa%3A%20%0AContacto%3A%20%0APresupuesto%20estimado%3A%20%0A%0AQuedo%20a%20la%20espera%20de%20vuestra%20propuesta.%0A%0AGracias." className="inline-block w-full bg-[#0B1825] border border-dashed border-[#C9A84C]/30 rounded-xl py-4 hover:bg-[#C9A84C]/5 hover:border-[#C9A84C]/50 transition-all group">
          <p className="text-[#C9A84C]/60 text-sm font-bold tracking-widest uppercase mb-2 group-hover:text-[#C9A84C]/80">Espacio disponible para publicidad</p>
          <p className="text-gray-500 text-sm group-hover:text-gray-400">Contacta con nosotros → info@sprintmarkt.com</p>
        </a>
      </div>

      {/* Grid de grupos */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div ref={sectionTitleRef} className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
            <SvgIcon name="los 12 grupos" size={32} />
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

      {/* Análisis detallado con Tabs */}
      <section ref={tabsRef} className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
            <SvgIcon name="historia" size={32} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{gT.analysis}</h2>
            <p className="text-sm text-[#6a7a9a]">{gT.analysisSub}</p>
          </div>
        </div>

        {/* Tabs navegación */}
        <div className="flex flex-wrap gap-2 mb-6">
          {gruposLetras.map((letra) => {
            const active = activeTab === letra;
            return (
              <button
                key={letra}
                onClick={() => setActiveTab(letra)}
                className={`min-w-[2.5rem] rounded-xl px-3 py-2 text-sm font-bold transition-all border ${
                  active
                    ? 'bg-[#c9a84c]/15 text-[#c9a84c] border-[#c9a84c]/40'
                    : 'bg-[#0B1825] text-[#8a94b0] border-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                {letra}
              </button>
            );
          })}
        </div>

        {/* Contenido activo */}
        <GrupoTabContent letra={activeTab} />
      </section>

      {/* Cómo funciona el formato */}
      <section ref={formatRef} className="max-w-6xl mx-auto px-4 mb-16">
        <div className="bg-gradient-to-br from-[#0B1825] to-[#0F1D32] rounded-2xl p-6 md:p-8 border border-white/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 flex items-center justify-center border border-blue-500/20">
              <SvgIcon name="formato 2026" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{gT.format.title}</h2>
              <p className="text-sm text-[#6a7a9a]">{gT.format.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: gT.format.step1Title, desc: gT.format.step1Desc, icon: 'los 12 grupos' },
              { step: '2', title: gT.format.step2Title, desc: gT.format.step2Desc, icon: 'ranking' },
              { step: '3', title: gT.format.step3Title, desc: gT.format.step3Desc, icon: 'predicciones' },
            ].map((item) => (
              <div key={item.step} className="format-step relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 text-[#c9a84c] flex items-center justify-center font-black text-lg border border-[#c9a84c]/20">
                    {item.step}
                  </div>
                  <SvgIcon name={item.icon} size={32} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[#8a94b0] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[#8a94b0]">
              {gT.format.finalNote} <span className="text-[#c9a84c] font-bold">{gT.format.finalDate}</span> {gT.format.finalCity}
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
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div ref={ctaRef} className="relative rounded-3xl border border-[#c9a84c]/20 overflow-hidden group">
          <img src="/img/imagenessilviu/Estadio Atmosphere.png" alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/85 to-[#060B14]/70"/>
          <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c]/10 via-transparent to-[#c9a84c]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"/>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 p-8 md:p-12">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-[#c9a84c]/20 blur-[60px] rounded-full"/>
                <SvgIcon name="unete ahora" size={192} className="relative float-animation drop-shadow-[0_0_40px_rgba(201,168,76,0.4)] sm:!w-56 sm:!h-56" />
              </div>
            </div>
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">{gT.cta.title}</h2>
              <p className="text-gray-300 mb-8 max-w-xl text-lg leading-relaxed">{gT.cta.desc}</p>
              <Link href="/registro" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#060B14] font-bold rounded-xl hover:shadow-[0_8px_32px_rgba(201,168,76,0.4)] transition-all hover:-translate-y-0.5">
                {gT.cta.btn} <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor footer */}
      <div className="max-w-6xl mx-auto px-4 mb-8 text-center">
        <a href="mailto:info@sprintmarkt.com?subject=Publicidad%20en%20ZonaMundial%20-%20P%C3%A1gina%20Grupos%20(footer)&body=Hola%20equipo%20de%20ZonaMundial%2C%0A%0AMe%20interesa%20contratar%20un%20espacio%20publicitario%20en%20la%20p%C3%A1gina%20de%20Grupos%20(footer).%0A%0AEmpresa%3A%20%0AContacto%3A%20%0APresupuesto%20estimado%3A%20%0A%0AQuedo%20a%20la%20espera%20de%20vuestra%20propuesta.%0A%0AGracias." className="inline-block w-full bg-[#0B1825] border border-dashed border-[#C9A84C]/30 rounded-xl py-4 hover:bg-[#C9A84C]/5 hover:border-[#C9A84C]/50 transition-all group">
          <p className="text-[#C9A84C]/60 text-sm font-bold tracking-widest uppercase mb-2 group-hover:text-[#C9A84C]/80">Espacio disponible para publicidad</p>
          <p className="text-gray-500 text-sm group-hover:text-gray-400">Contacta con nosotros → info@sprintmarkt.com</p>
        </a>
      </div>
    </div>
  );
}

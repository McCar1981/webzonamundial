'use client';
// src/app/sedes/page.tsx

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Landmark, Sparkles, Star, MapPin, Calendar, LayoutGrid } from 'lucide-react';
import { SEDES, getSedesByPais } from '@/data/sedes';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  SedesStats,
  SedesFiltros,
  EstadioCard,
  EstadioDestacado,
  SedesTravelTabs,
  SedesMatches,
} from './_components';

gsap.registerPlugin(ScrollTrigger);

const BG = '#060B14';

export default function SedesIndex() {
  const { t } = useLanguage();
  const sT = t.sedes;
  const nav = t.nav;

  const [paisFilter, setPaisFilter] = useState('Todos');
  const [faseFilter, setFaseFilter] = useState('Todas');
  const [techoFilter, setTechoFilter] = useState('Todos');

  const filteredSedes = useMemo(() => {
    return SEDES.filter((sede) => {
      if (paisFilter !== 'Todos' && sede.pais !== paisFilter) return false;
      if (faseFilter !== 'Todas' && !sede.fasesQueAlberga.includes(faseFilter)) return false;
      if (techoFilter !== 'Todos') {
        const hasRoof = sede.techoCerrado;
        if (techoFilter === 'true' && !hasRoof) return false;
        if (techoFilter === 'false' && hasRoof) return false;
      }
      return true;
    });
  }, [paisFilter, faseFilter, techoFilter]);

  const finalSede = SEDES.find((s) => s.fasesQueAlberga.includes('FINAL'));
  const inauguralSede = SEDES.find((s) =>
    s.partidosDestacados.some((p) => p.toLowerCase().includes('inaugur'))
  );
  const semifinalSede = SEDES.find(
    (s) => s.fasesQueAlberga.includes('Semifinal') && !s.fasesQueAlberga.includes('FINAL')
  );
  const travelSedes = [finalSede, inauguralSede, semifinalSede].filter(Boolean) as typeof SEDES;

  const paisesVisibles = paisFilter === 'Todos'
    ? ['Estados Unidos', 'México', 'Canadá']
    : [paisFilter];

  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const destacadasRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const travelRef = useRef<HTMLDivElement>(null);
  const matchesRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero
      const heroTl = gsap.timeline({ delay: 0.2 });
      heroTl
        .fromTo('.hero-breadcrumb', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
        .fromTo('.hero-badge', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.3')
        .fromTo('.hero-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.2')
        .fromTo('.hero-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
        .fromTo('.hero-stat', { opacity: 0, y: 40, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.15, ease: 'back.out(1.4)' }, '-=0.3');

      // Stats
      gsap.fromTo(statsRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: statsRef.current, start: 'top 85%', toggleActions: 'play none none reverse' } });

      // Destacadas
      gsap.fromTo('.destacadas-title', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: destacadasRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } });
      gsap.fromTo('.estadio-destacado', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out', scrollTrigger: { trigger: destacadasRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } });

      // Grid de sedes
      gsap.fromTo('.pais-section', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out', scrollTrigger: { trigger: gridRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } });

      // Travel Tabs
      gsap.fromTo(travelRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: travelRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } });

      // Matches
      gsap.fromTo(matchesRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: matchesRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } });

      // CTA
      gsap.fromTo('.cta-container', { opacity: 0, y: 60, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: ctaRef.current, start: 'top 85%', toggleActions: 'play none none reverse' } });
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
        <Landmark className="absolute top-10 left-10 w-28 h-28 opacity-[0.06] rotate-[-15deg] pointer-events-none hero-emoji-1 text-white" strokeWidth={1} />
        <Sparkles className="absolute bottom-10 right-10 w-28 h-28 opacity-[0.06] rotate-[15deg] pointer-events-none hero-emoji-2 text-white" strokeWidth={1} />

        <div className="max-w-6xl mx-auto relative">
          <nav className="hero-breadcrumb flex items-center gap-2 text-sm text-[#6a7a9a] mb-6">
            <Link href="/" className="hover:text-[#c9a84c] transition-colors">{nav.inicio}</Link>
            <span>/</span>
            <span className="text-[#c9a84c]">{nav.sedes}</span>
          </nav>

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

      {/* Sponsor top */}
      <div className="max-w-6xl mx-auto px-4 mb-12 text-center">
        <a href="mailto:info@sprintmarkt.com?subject=Publicidad%20en%20ZonaMundial%20-%20P%C3%A1gina%20Sedes&body=Hola%20equipo%20de%20ZonaMundial%2C%0A%0AMe%20interesa%20contratar%20un%20espacio%20publicitario%20en%20la%20p%C3%A1gina%20de%20Sedes.%0A%0AEmpresa%3A%20%0AContacto%3A%20%0APresupuesto%20estimado%3A%20%0A%0AQuedo%20a%20la%20espera%20de%20vuestra%20propuesta.%0A%0AGracias." className="inline-block w-full bg-[#0B1825] border border-dashed border-[#C9A84C]/30 rounded-xl py-4 hover:bg-[#C9A84C]/5 hover:border-[#C9A84C]/50 transition-all group">
          <p className="text-[#C9A84C]/60 text-sm font-bold tracking-widest uppercase mb-2 group-hover:text-[#C9A84C]/80">Espacio disponible para publicidad</p>
          <p className="text-gray-500 text-sm group-hover:text-gray-400">Contacta con nosotros → info@sprintmarkt.com</p>
        </a>
      </div>

      {/* Stats globales */}
      <section ref={statsRef} className="max-w-6xl mx-auto px-4 mb-12">
        <SedesStats />
      </section>

      {/* Filtros */}
      <section className="max-w-6xl mx-auto px-4 mb-6">
        <SedesFiltros
          pais={paisFilter}
          onPaisChange={setPaisFilter}
          fase={faseFilter}
          onFaseChange={setFaseFilter}
          techo={techoFilter}
          onTechoChange={setTechoFilter}
          onClear={() => { setPaisFilter('Todos'); setFaseFilter('Todas'); setTechoFilter('Todos'); }}
        />
      </section>

      {/* Sedes destacadas */}
      {(finalSede || inauguralSede || semifinalSede) && (
        <section ref={destacadasRef} className="max-w-6xl mx-auto px-4 mb-16">
          <div className="destacadas-title flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
              <Star className="w-8 h-8 text-[#c9a84c]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">{sT.destacadas}</h2>
              <p className="text-sm text-[#6a7a9a]">{sT.destacadasSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finalSede && (
              <EstadioDestacado sede={finalSede} badge="LA FINAL" badgeColor="#c9a84c" />
            )}
            {inauguralSede && (
              <EstadioDestacado sede={inauguralSede} badge="INAUGURACIÓN" badgeColor="#22c55e" />
            )}
            {semifinalSede && (
              <EstadioDestacado sede={semifinalSede} badge="SEMIFINAL" badgeColor="#3b82f6" />
            )}
          </div>
        </section>
      )}

      {/* Grid de sedes filtradas */}
      <section ref={gridRef} className="max-w-6xl mx-auto px-4 mb-16">
        {paisesVisibles.map((pais) => {
          const sedesPais = filteredSedes.filter((s) => s.pais === pais);
          if (sedesPais.length === 0) return null;
          const flagCode = pais === 'Estados Unidos' ? 'us' : pais === 'México' ? 'mx' : 'ca';
          return (
            <div key={pais} className="pais-section mb-12 last:mb-0">
              <div className="flex items-center gap-4 mb-6">
                <img src={`https://flagcdn.com/w80/${flagCode}.png`} alt={pais} className="w-14 h-10 object-cover rounded-lg shadow-lg" />
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{pais}</h2>
                  <p className="text-sm text-[#6a7a9a]">{sedesPais.length} sede{sedesPais.length === 1 ? '' : 's'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sedesPais.map((sede) => (
                  <EstadioCard key={sede.slug} sede={sede} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Guía de viaje por sede destacada */}
      <section ref={travelRef} className="max-w-6xl mx-auto px-4 mb-16">
        <SedesTravelTabs sedes={travelSedes} />
      </section>

      {/* Partidos por sede */}
      <section ref={matchesRef} className="max-w-6xl mx-auto px-4 mb-16">
        <SedesMatches />
      </section>

      {/* CTA Final */}
      <section ref={ctaRef} className="max-w-4xl mx-auto px-4 mb-16">
        <div className="cta-container relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#c9a84c]/10 via-[#0B1825] to-[#0F1D32] border border-[#c9a84c]/20 p-8 md:p-12 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#c9a84c]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <MapPin className="cta-emoji w-12 h-12 text-[#c9a84c] mb-4 block mx-auto" strokeWidth={1.5} />
            <h2 className="cta-title text-3xl md:text-4xl font-black text-white mb-4">
              {sT.ctaTitle}
            </h2>
            <p className="text-[#8a94b0] mb-8 max-w-xl mx-auto">
              {sT.ctaDesc}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/calendario" className="cta-button inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#060B14] font-bold rounded-xl hover:shadow-[0_8px_32px_rgba(201,168,76,0.4)] transition-all hover:-translate-y-0.5">
                <Calendar className="w-5 h-5" />
                {sT.ctaBtn1}
              </Link>
              <Link href="/grupos" className="cta-button inline-flex items-center gap-2 px-6 py-3 bg-[#060B14] border border-[#c9a84c]/30 text-[#c9a84c] font-bold rounded-xl hover:bg-[#c9a84c]/10 transition-all">
                <LayoutGrid className="w-5 h-5" />
                {sT.ctaBtn2}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor footer */}
      <div className="max-w-6xl mx-auto px-4 mb-8 text-center">
        <a href="mailto:info@sprintmarkt.com?subject=Publicidad%20en%20ZonaMundial%20-%20P%C3%A1gina%20Sedes%20(footer)&body=Hola%20equipo%20de%20ZonaMundial%2C%0A%0AMe%20interesa%20contratar%20un%20espacio%20publicitario%20en%20la%20p%C3%A1gina%20de%20Sedes%20(footer).%0A%0AEmpresa%3A%20%0AContacto%3A%20%0APresupuesto%20estimado%3A%20%0A%0AQuedo%20a%20la%20espera%20de%20vuestra%20propuesta.%0A%0AGracias." className="inline-block w-full bg-[#0B1825] border border-dashed border-[#C9A84C]/30 rounded-xl py-4 hover:bg-[#C9A84C]/5 hover:border-[#C9A84C]/50 transition-all group">
          <p className="text-[#C9A84C]/60 text-sm font-bold tracking-widest uppercase mb-2 group-hover:text-[#C9A84C]/80">Espacio disponible para publicidad</p>
          <p className="text-gray-500 text-sm group-hover:text-gray-400">Contacta con nosotros → info@sprintmarkt.com</p>
        </a>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SELECCIONES } from '@/data/selecciones';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  SeleccionCard,
  SeleccionFilters,
  DebutantesSection,
  CuriosidadesSection,
} from './_components';
import { ICON_V3, ICON_DESCUBRE } from '@/components/icons';

gsap.registerPlugin(ScrollTrigger);

const CONFEDERACIONES_DATA = [
  { name: 'UEFA', plazas: 16, icon: 'ball', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400' },
  { name: 'CONMEBOL', plazas: '6+1', icon: 'americas', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400' },
  { name: 'CONCACAF', plazas: 6, icon: 'star', color: 'from-red-500/20 to-red-600/10 border-red-500/20 text-red-400' },
  { name: 'CAF', plazas: 9, icon: 'africa', color: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400' },
  { name: 'AFC', plazas: 8, icon: 'asia', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400' },
  { name: 'OFC', plazas: 1, icon: 'ocean', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 text-cyan-400' },
];

export default function SeleccionesIndex() {
  const { t } = useLanguage();
  const sT = t.selecciones;

  // Filtros
  const [search, setSearch] = useState('');
  const [confFilter, setConfFilter] = useState('Todas');
  const [hostsOnly, setHostsOnly] = useState(false);

  // Refs animaciones
  const heroRef = useRef<HTMLElement>(null);
  const favoritosRef = useRef<HTMLElement>(null);
  const aSeguirRef = useRef<HTMLElement>(null);
  const confederacionesRef = useRef<HTMLElement>(null);
  const restoRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  // Datos base
  const favoritosSlugs = ['argentina', 'francia', 'brasil', 'espana', 'inglaterra', 'portugal', 'alemania'];
  const aSeguirSlugs = ['mexico', 'estados-unidos', 'canada', 'marruecos', 'noruega'];

  const favoritosBase = useMemo(() => SELECCIONES.filter((s) => favoritosSlugs.includes(s.slug)), []);
  const aSeguirBase = useMemo(() => SELECCIONES.filter((s) => aSeguirSlugs.includes(s.slug)), []);
  const restoBase = useMemo(
    () =>
      SELECCIONES.filter((s) => ![...favoritosSlugs, ...aSeguirSlugs].includes(s.slug)).sort(
        (a, b) => (a.rankingFIFA || 999) - (b.rankingFIFA || 999)
      ),
    []
  );

  const applyFilters = (list: typeof SELECCIONES) => {
    return list.filter((s) => {
      const matchSearch = s.nombre.toLowerCase().includes(search.toLowerCase());
      const matchConf = confFilter === 'Todas' || s.confederacion === confFilter;
      const matchHost = !hostsOnly || s.esAnfitrion;
      return matchSearch && matchConf && matchHost;
    });
  };

  const favoritos = applyFilters(favoritosBase);
  const aSeguir = applyFilters(aSeguirBase);
  const resto = applyFilters(restoBase);
  const allFiltered = applyFilters(SELECCIONES);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.fromTo(
          '.gsap-hero-badge',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
        );
        gsap.fromTo(
          '.gsap-hero-title',
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
        );
        gsap.fromTo(
          '.gsap-hero-subtitle',
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 }
        );
        gsap.fromTo(
          '.gsap-stat-item',
          { opacity: 0, y: 50, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.3 }
        );
      }

      [favoritosRef, aSeguirRef, confederacionesRef, restoRef].forEach((ref) => {
        if (ref.current) {
          gsap.fromTo(
            ref.current.querySelectorAll('.gsap-section-header'),
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: 'power3.out',
              scrollTrigger: { trigger: ref.current, start: 'top 80%', toggleActions: 'play none none none' },
            }
          );
          gsap.fromTo(
            ref.current.querySelectorAll('.gsap-card'),
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power3.out',
              stagger: 0.06,
              scrollTrigger: { trigger: ref.current, start: 'top 75%', toggleActions: 'play none none none' },
            }
          );
        }
      });

      if (ctaRef.current) {
        gsap.fromTo(
          '.gsap-cta-content',
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 80%', toggleActions: 'play none none none' },
          }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  const clearFilters = () => {
    setSearch('');
    setConfFilter('Todas');
    setHostsOnly(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#060B14' }}>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://zonamundial.app' },
              { '@type': 'ListItem', position: 2, name: 'Selecciones', item: 'https://zonamundial.app/selecciones' },
            ],
          }),
        }}
      />

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden px-5 pb-16 pt-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.08)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl">
          <nav className="mb-6 flex items-center gap-2 text-sm text-[#6a7a9a]">
            <Link href="/" className="transition-colors hover:text-[#c9a84c]">{t.ui.inicio}</Link>
            <span>/</span>
            <span className="text-[#c9a84c]">{t.ui.selecciones}</span>
          </nav>

          <div className="mx-auto max-w-3xl text-center">
            <span className="gsap-hero-badge mb-4 inline-block rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#c9a84c]">
              {sT.badge}
            </span>
            <h1 className="gsap-hero-title mb-4 text-4xl font-black leading-tight text-white md:text-6xl">
              {sT.title.split('48')[0]}
              <span className="bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] bg-clip-text text-transparent">48</span>
              {sT.title.split('48')[1]}
            </h1>
            <p className="gsap-hero-subtitle mb-8 text-lg text-[#8a94b0]">{sT.subtitle}</p>

            <div className="flex flex-wrap justify-center gap-4">
              {[
                { value: '48', label: sT.stats.selecciones, icon: ICON_DESCUBRE.selecciones },
                { value: '12', label: sT.stats.grupos, icon: ICON_DESCUBRE.grupos },
                { value: '6', label: sT.stats.confederaciones, icon: ICON_V3.rankings },
                { value: '104', label: sT.stats.partidos, icon: ICON_V3.matchCenter },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="gsap-stat-item flex items-center gap-3 rounded-xl border border-white/5 bg-[#0F1D32] px-4 py-2"
                >
                  <div className="flex h-10 w-10 items-center justify-center [&_svg]:h-8 [&_svg]:w-8">{stat.icon}</div>
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

      {/* Sponsor slot */}
      <div className="mx-auto mb-8 max-w-6xl px-4 text-center">
        <a
          href="mailto:info@sprintmarkt.com?subject=Publicidad%20en%20ZonaMundial%20-%20P%C3%A1gina%20Selecciones"
          className="group inline-block w-full rounded-xl border border-dashed border-[#C9A84C]/30 bg-[#0B1825] py-4 transition-all hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5"
        >
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#C9A84C]/60 group-hover:text-[#C9A84C]/80">
            Espacio disponible para publicidad
          </p>
          <p className="text-sm text-gray-500 group-hover:text-gray-400">Contacta con nosotros → info@sprintmarkt.com</p>
        </a>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* Filtros */}
        <SeleccionFilters
          search={search}
          onSearchChange={setSearch}
          conf={confFilter}
          onConfChange={setConfFilter}
          hostsOnly={hostsOnly}
          onHostsOnlyChange={setHostsOnly}
          resultCount={allFiltered.length}
          onClear={clearFilters}
        />

        {/* Favoritos */}
        {favoritos.length > 0 && (
          <section ref={favoritosRef} className="mb-12">
            <div className="gsap-section-header mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c9a84c]/20 bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5">
                <img src="/img/imagenessilviu/balondefutbol.webp" alt="" role="presentation" loading="lazy" decoding="async" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white md:text-3xl">{sT.favoritos}</h2>
                <p className="text-sm text-[#6a7a9a]">{sT.favoritosSub}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favoritos.map((team) => (
                <SeleccionCard key={team.slug} team={team} />
              ))}
            </div>
          </section>
        )}

        {/* A seguir */}
        {aSeguir.length > 0 && (
          <section ref={aSeguirRef} className="mb-12">
            <div className="gsap-section-header mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-blue-600/5">
                <div className="flex h-8 w-8 items-center justify-center [&_svg]:h-7 [&_svg]:w-7">{ICON_V3.microPred}</div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white md:text-3xl">{sT.aSeguir}</h2>
                <p className="text-sm text-[#6a7a9a]">{sT.aSeguirSub}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {aSeguir.map((team) => (
                <SeleccionCard key={team.slug} team={team} />
              ))}
            </div>
          </section>
        )}

        {/* Confederaciones */}
        <section ref={confederacionesRef} className="mb-12">
          <div className="gsap-section-header mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/20 to-green-600/5 [&_svg]:h-7 [&_svg]:w-7">
              {ICON_DESCUBRE.selecciones}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">{sT.confederaciones}</h2>
              <p className="text-sm text-[#6a7a9a]">{sT.confederacionesSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CONFEDERACIONES_DATA.map((conf) => (
              <button
                key={conf.name}
                onClick={() => setConfFilter(confFilter === conf.name ? 'Todas' : conf.name)}
                className={`gsap-card rounded-2xl border bg-gradient-to-br ${conf.color} p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                  confFilter === conf.name ? 'ring-1 ring-[#c9a84c]/50' : ''
                }`}
              >
                <p className="text-2xl font-black text-[#c9a84c]">{conf.plazas}</p>
                <p className="text-xs text-[#8a94b0]">{conf.name}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Resto de selecciones */}
        {resto.length > 0 && (
          <section ref={restoRef} className="mb-12">
            <div className="gsap-section-header mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 [&_svg]:h-7 [&_svg]:w-7">
                {ICON_DESCUBRE.selecciones}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white md:text-3xl">{sT.restoSelecciones}</h2>
                <p className="text-sm text-[#6a7a9a]">{sT.restoSeleccionesSub}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {resto.map((team) => (
                <SeleccionCard key={team.slug} team={team} />
              ))}
            </div>
          </section>
        )}

        {/* Nuevas secciones */}
        <DebutantesSection teams={SELECCIONES} />
        <CuriosidadesSection />

        {/* CTA Final */}
        <section ref={ctaRef} className="mx-auto mb-16 max-w-5xl">
          <div
            className="gsap-cta-content group relative overflow-hidden rounded-3xl border border-[#c9a84c]/20"
            style={{ opacity: 0 }}
          >
            <img
              src="/img/imagenessilviu/Estadio Atmosphere.webp"
              alt=""
              role="presentation"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/85 to-[#060B14]/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c]/10 via-transparent to-[#c9a84c]/10 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

            <div className="relative z-10 flex flex-col items-center gap-8 p-8 md:flex-row md:gap-12 md:p-12">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#c9a84c]/20 blur-[60px]" />
                  <div className="relative flex h-48 w-48 items-center justify-center drop-shadow-[0_0_40px_rgba(201,168,76,0.4)] sm:h-56 sm:w-56 [&_svg]:h-32 [&_svg]:w-32 sm:[&_svg]:h-40 sm:[&_svg]:w-40">
                    {ICON_DESCUBRE.unete}
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="mb-4 text-3xl font-black leading-tight text-white md:text-4xl">{sT.cta.title}</h2>
                <p className="mb-8 max-w-xl text-lg leading-relaxed text-gray-300">{sT.cta.desc}</p>
                <Link
                  href="/registro"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] px-8 py-4 font-bold text-[#060B14] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(201,168,76,0.4)]"
                >
                  {sT.cta.btn}
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Sponsor footer */}
      <div className="mx-auto mb-8 max-w-6xl px-4 text-center">
        <a
          href="mailto:info@sprintmarkt.com?subject=Publicidad%20en%20ZonaMundial%20-%20P%C3%A1gina%20Selecciones%20(footer)"
          className="group inline-block w-full rounded-xl border border-dashed border-[#C9A84C]/30 bg-[#0B1825] py-4 transition-all hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5"
        >
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#C9A84C]/60 group-hover:text-[#C9A84C]/80">
            Espacio disponible para publicidad
          </p>
          <p className="text-sm text-gray-500 group-hover:text-gray-400">Contacta con nosotros → info@sprintmarkt.com</p>
        </a>
      </div>
    </div>
  );
}

"use client";
// src/app/sedes/[slug]/SedeSlugClient.tsx

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Sede } from '@/data/sedes';
import PartidosSede from '@/components/PartidosSede';
import { AnimatedSection } from '@/components/AnimatedSection';

const GOLD = "#c9a84c";

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

function StatBadge({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`px-4 py-3 rounded-xl border border-white/10 bg-[#0B1825]/90 backdrop-blur-md text-center min-w-[100px] transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <p className="text-lg sm:text-xl font-black text-[#c9a84c]">{value}</p>
      <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}

function InfoCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0B1825] rounded-2xl p-5 md:p-6 border border-white/5 hover:border-[#c9a84c]/20 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">
          {icon.startsWith('/') ? (
            <img src={icon} alt="" className="w-8 h-8 object-contain" />
          ) : (
            icon
          )}
        </span>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function GallerySection({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  return (
    <section className="mb-12 sm:mb-16">
      <AnimatedSection>
        <h2 className="text-2xl font-black text-white mb-6">{title}</h2>
      </AnimatedSection>
      <AnimatedSection y={20}>
        <div className="rounded-3xl overflow-hidden border border-white/5 bg-[#0B0F1A]">
          {/* Main viewer */}
          <div
            className="relative aspect-[16/9] sm:aspect-[21/9] cursor-zoom-in"
            onClick={() => setLightbox(true)}
          >
            <img
              src={images[idx]}
              alt="Stadium"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/60 via-transparent to-transparent" />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                >
                  →
                </button>
              </>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-xs text-white/70 font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                {idx + 1} / {images.length}
              </span>
            </div>
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="p-4 flex gap-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === i ? 'border-[#c9a84c] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-[#030712]/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
          <img
            src={images[idx]}
            alt="Stadium"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}

function MapEmbed({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  return (
    <div className="rounded-3xl overflow-hidden border border-white/5 bg-[#0B0F1A]">
      <div className="relative w-full aspect-[16/9]" style={{ filter: 'invert(0.9) hue-rotate(180deg)' }}>
        <iframe
          title={label}
          src={mapSrc}
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-sm text-gray-400">Google Maps · {label}</span>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-[#c9a84c] hover:underline"
        >
          Ver en Google Maps →
        </a>
      </div>
    </div>
  );
}

export default function SedeSlugClient({ sede }: { sede: Sede }) {
  const { t } = useLanguage();
  const sT = t.sedeSlug;
  const nav = t.nav;

  const g = sede.guiaViaje;
  const imageUrl = STADIUM_IMAGES[sede.slug];
  const isFinalSede = sede.fasesQueAlberga.includes('FINAL');

  // Gallery images: primary + fallback extras if only one exists
  const galleryImages = imageUrl ? [imageUrl] : [];

  return (
    <div className="min-h-screen bg-[#060B14]">
      {/* Schema.org */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Place',
        name: `${sede.estadio} — ${sede.nombre}`,
        address: { '@type': 'PostalAddress', addressLocality: sede.ciudad, addressCountry: sede.paisCodigo },
        geo: { '@type': 'GeoCoordinates', latitude: sede.coordenadas.lat, longitude: sede.coordenadas.lng },
        maximumAttendeeCapacity: sede.capacidad,
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://zonamundial.app' },
          { '@type': 'ListItem', position: 2, name: 'Sedes', item: 'https://zonamundial.app/sedes' },
          { '@type': 'ListItem', position: 3, name: sede.nombre, item: `https://zonamundial.app/sedes/${sede.slug}` },
        ],
      })}} />

      <div className="max-w-7xl mx-auto px-4 pt-0 pb-8 sm:pb-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-[#6a7a9a] mb-6 pt-6">
          <Link href="/" className="hover:text-[#c9a84c] transition-colors">{nav.inicio}</Link>
          <span>/</span>
          <Link href="/sedes" className="hover:text-[#c9a84c] transition-colors">{nav.sedes}</Link>
          <span>/</span>
          <span className="text-[#c9a84c]">{sede.nombre}</span>
        </nav>

        {/* Immersive Hero */}
        <section className="relative mb-8 sm:mb-10 rounded-[2rem] overflow-hidden">
          <div className="relative h-[55vh] sm:h-[65vh] min-h-[420px]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={sede.estadio}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0F1D32] to-[#1a2a3f] flex items-center justify-center">
                <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png" alt="" className="w-20 h-20 object-contain" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/50 to-[#060B14]/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060B14]/60 via-transparent to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <img
                  src={`https://flagcdn.com/w80/${sede.paisCodigo.toLowerCase()}.png`}
                  alt={sede.pais}
                  className="w-10 h-7 object-cover rounded shadow-lg"
                />
                {isFinalSede && (
                  <span className="px-4 py-1.5 bg-[#c9a84c] text-[#060B14] text-sm font-black rounded-full">
                    FINAL DEL MUNDIAL
                  </span>
                )}
                {sede.techoCerrado && (
                  <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-sm font-bold rounded-full border border-blue-500/30">
                    TECHO RETRACTABLE
                  </span>
                )}
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-2">
                {sede.nombre}
              </h1>
              <p className="text-xl sm:text-2xl md:text-3xl text-[#c9a84c] font-semibold">
                {sede.estadio}
              </p>
            </div>
          </div>

          {/* Floating stats band */}
          <div className="relative -mt-10 sm:-mt-12 px-4 sm:px-6 z-10">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <StatBadge value={sede.capacidad.toLocaleString()} label={sT.capacidad} delay={100} />
              <StatBadge value={sede.totalPartidos.toString()} label={sT.partidos} delay={200} />
              <StatBadge value={sede.clima.tempMedia} label={sT.temperatura} delay={300} />
              <StatBadge value={`${sede.altitudMetros}m`} label={sT.altitud} delay={400} />
            </div>
          </div>
        </section>

        {/* Sponsor */}
        <div className="w-full text-center mb-10 sm:mb-12">
          <a href="mailto:info@sprintmarkt.com?subject=Publicidad%20en%20ZonaMundial%20-%20P%C3%A1gina%20Sede&body=Hola%20equipo%20de%20ZonaMundial%2C%0A%0AMe%20interesa%20contratar%20un%20espacio%20publicitario%20en%20la%20p%C3%A1gina%20de%20Sede.%0A%0AEmpresa%3A%20%0AContacto%3A%20%0APresupuesto%20estimado%3A%20%0A%0AQuedo%20a%20la%20espera%20de%20vuestra%20propuesta.%0A%0AGracias." className="block w-full bg-[#0B1825] border border-dashed border-[#C9A84C]/30 rounded-xl py-4 hover:bg-[#C9A84C]/5 hover:border-[#C9A84C]/50 transition-all group">
            <p className="text-[#C9A84C]/60 text-sm font-bold tracking-widest uppercase mb-2 group-hover:text-[#C9A84C]/80">Espacio disponible para publicidad</p>
            <p className="text-gray-500 text-sm group-hover:text-gray-400">Contacta con nosotros → info@sprintmarkt.com</p>
          </a>
        </div>

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <GallerySection images={galleryImages} title={sT.galeria} />
        )}

        {/* Partidos en esta sede */}
        <section className="mb-12 sm:mb-16">
          <AnimatedSection>
            <h2 className="text-2xl font-black text-white mb-6">{sT.partidosTitle}</h2>
          </AnimatedSection>
          <PartidosSede estadio={sede.estadio} accentColor={GOLD} />
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* History */}
            <AnimatedSection className="bg-[#0B1825] rounded-3xl p-6 md:p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
                  <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/historia.png" alt="" className="w-8 h-8 object-contain" />
                </div>
                <h2 className="text-2xl font-bold text-white">{sT.historiaTitle}</h2>
              </div>
              <p className="text-[#8a94b0] leading-relaxed text-lg mb-6">
                {sede.historia}
              </p>
              <div className="p-4 bg-[#c9a84c]/10 border-l-4 border-[#c9a84c] rounded-r-xl">
                <p className="text-[#c9a84c] font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 inline-block flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg> {sede.datosClave}
                </p>
              </div>
            </AnimatedSection>

            {/* Matches detail */}
            <AnimatedSection className="bg-[#0B1825] rounded-3xl p-6 md:p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
                  <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png" alt="" className="w-8 h-8 object-contain" />
                </div>
                <h2 className="text-2xl font-bold text-white">{sT.partidosTitle}</h2>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {sede.fasesQueAlberga.map(fase => (
                  <span
                    key={fase}
                    className={`px-4 py-2 rounded-xl text-sm font-bold ${
                      fase.includes('FINAL') || fase.includes('SEMI')
                        ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30'
                        : 'bg-[#060B14] text-[#8a94b0] border border-white/5'
                    }`}
                  >
                    {fase}
                  </span>
                ))}
              </div>

              <div className="mb-6">
                <p className="text-sm text-[#6a7a9a] mb-3">{sT.gruposAsignados}</p>
                <div className="flex flex-wrap gap-2">
                  {sede.gruposAsignados.map(gr => (
                    <Link
                      key={gr}
                      href={`/grupos/grupo-${gr.toLowerCase()}`}
                      className="px-4 py-2 bg-[#060B14] rounded-xl text-white font-bold hover:bg-[#c9a84c]/20 hover:text-[#c9a84c] transition-all border border-white/5"
                    >
                      {sT.grupo} {gr}
                    </Link>
                  ))}
                </div>
              </div>

              {sede.partidosDestacados.length > 0 && (
                <div>
                  <p className="text-sm text-[#6a7a9a] mb-3">{sT.partidosDestacados}</p>
                  <div className="space-y-2">
                    {sede.partidosDestacados.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-[#060B14] rounded-xl border border-white/5">
                        <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/ranking.png" alt="" className="w-4 h-4 object-contain inline-block" />
                        <span className="text-white">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </AnimatedSection>

            {/* How to get there / Map */}
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
                  <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/stories.png" alt="" className="w-8 h-8 object-contain" />
                </div>
                <h2 className="text-2xl font-bold text-white">{sT.comoLlegar}</h2>
              </div>
            </AnimatedSection>
            <AnimatedSection y={20}>
              <MapEmbed lat={sede.coordenadas.lat} lng={sede.coordenadas.lng} label={sede.estadio} />
            </AnimatedSection>

            {/* Technical data */}
            <AnimatedSection className="bg-[#0B1825] rounded-3xl p-6 md:p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
                  <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png" alt="" className="w-8 h-8 object-contain" />
                </div>
                <h2 className="text-2xl font-bold text-white">{sT.datosTecnicos}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  [sT.labelEstadio, sede.estadio],
                  [sT.labelCiudad, sede.ciudad],
                  [sT.labelPais, `${sede.paisEmoji} ${sede.pais}`],
                  [sT.labelCapacidad, `${sede.capacidad.toLocaleString()} ${sT.espectadores}`],
                  [sT.labelAltitud, `${sede.altitudMetros}${sT.sobreNivelMar}`],
                  [sT.labelTecho, sede.techoCerrado ? sT.techoRetractil : sT.techoAbierto],
                  [sT.labelZonaHoraria, `${sede.zonaHoraria} (${sede.utcOffset})`],
                  [sT.labelTotalPartidos, `${sede.totalPartidos} ${sT.partidos}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between p-4 bg-[#060B14] rounded-xl">
                    <span className="text-[#6a7a9a]">{label}</span>
                    <span className="text-white font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Travel guide */}
            <AnimatedSection className="bg-gradient-to-br from-[#0B1825] to-[#0F1D32] rounded-3xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/stories.png" alt="" className="w-8 h-8 object-contain" />
                <h3 className="text-xl font-bold text-white">{sT.guiaViaje}</h3>
              </div>

              <div className="space-y-4">
                <InfoCard title={sT.comoLlegar} icon="/img/zonamundial-images/imagenes/logos para sustuir emojis/stories.png">
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelAeropuerto}</strong> {sede.transporte.aeropuerto}</p>
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelCodigo}</strong> {sede.transporte.codigoIATA}</p>
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelAlEstadio}</strong> {sede.transporte.distanciaEstadio}</p>
                  <p className="text-[#8a94b0] text-sm"><strong className="text-white">{sT.labelTransporte}</strong> {sede.transporte.metroTren}</p>
                </InfoCard>

                <InfoCard title={sT.visaYDinero} icon="/img/zonamundial-images/imagenes/logos para sustuir emojis/predicciones.png">
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelVisa}</strong> {g.visa}</p>
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelIdioma}</strong> {g.idioma}</p>
                  <p className="text-[#8a94b0] text-sm"><strong className="text-white">{sT.labelMoneda}</strong> {g.moneda}</p>
                </InfoCard>

                <InfoCard title={sT.alojamiento} icon="/img/zonamundial-images/imagenes/logos para sustuir emojis/ligas privadas.png">
                  <p className="text-[#8a94b0] text-sm mb-3">{g.costoAlojamiento}</p>
                  <p className="text-white text-sm font-semibold mb-2">{sT.zonasRecomendadas}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.zonasRecomendadas.map(z => (
                      <span key={z} className="px-3 py-1 bg-[#060B14] rounded-lg text-xs text-[#8a94b0]">{z}</span>
                    ))}
                  </div>
                </InfoCard>

                <InfoCard title={sT.clima} icon="/img/zonamundial-images/imagenes/logos para sustuir emojis/streaming.png">
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelJunio}</strong> {sede.clima.junio}</p>
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelJulio}</strong> {sede.clima.julio}</p>
                  <p className="text-[#8a94b0] text-sm"><strong className="text-white">{sT.labelLluvia}</strong> {sede.clima.lluvia}</p>
                </InfoCard>

                <InfoCard title={sT.gastronomia} icon="/img/zonamundial-images/imagenes/logos para sustuir emojis/creadores.png">
                  <p className="text-[#8a94b0] text-sm">{g.gastronomia}</p>
                </InfoCard>

                <InfoCard title={sT.seguridad} icon="/img/zonamundial-images/imagenes/logos para sustuir emojis/ia coach.png">
                  <p className="text-[#8a94b0] text-sm mb-2">{g.seguridadNota}</p>
                  {g.fanZone && (
                    <p className="text-[#8a94b0] text-sm"><strong className="text-white">{sT.fanZone}</strong> {g.fanZone}</p>
                  )}
                </InfoCard>
              </div>
            </AnimatedSection>

            {/* CTA */}
            <AnimatedSection className="bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 rounded-3xl p-6 border border-[#c9a84c]/20">
              <h3 className="font-bold text-white mb-2">{sT.ctaTitle} {sede.nombre}?</h3>
              <p className="text-sm text-[#8a94b0] mb-4">{sT.ctaDesc}</p>
              <Link
                href="/registro"
                className="block w-full py-3 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#060B14] font-bold rounded-xl text-center hover:shadow-lg transition-all"
              >
                {sT.ctaBtn}
              </Link>
            </AnimatedSection>
          </div>
        </div>

        {/* Related links */}
        <AnimatedSection className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">{sT.explorarMas}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { href: '/sedes', icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png', label: sT.todasLasSedes },
              { href: '/calendario', icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/formato 2026.png', label: nav.calendario },
              { href: '/selecciones', icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/48 selecciones.png', label: nav.selecciones },
              { href: '/grupos', icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/los 12 grupos.png', label: nav.grupos },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-4 bg-[#0B1825] rounded-xl border border-white/5 hover:border-[#c9a84c]/30 hover:text-[#c9a84c] transition-all group"
              >
                <img src={link.icon} alt="" className="w-6 h-6 object-contain group-hover:scale-110 transition-transform" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </AnimatedSection>

        {/* Sponsor footer */}
        <a href="mailto:info@sprintmarkt.com?subject=Publicidad%20en%20ZonaMundial%20-%20P%C3%A1gina%20Sede%20(footer)&body=Hola%20equipo%20de%20ZonaMundial%2C%0A%0AMe%20interesa%20contratar%20un%20espacio%20publicitario%20en%20la%20p%C3%A1gina%20de%20Sede%20(footer).%0A%0AEmpresa%3A%20%0AContacto%3A%20%0APresupuesto%20estimado%3A%20%0A%0AQuedo%20a%20la%20espera%20de%20vuestra%20propuesta.%0A%0AGracias." className="block w-full bg-[#0B1825] border border-dashed border-[#C9A84C]/30 rounded-xl py-4 hover:bg-[#C9A84C]/5 hover:border-[#C9A84C]/50 transition-all group text-center">
          <p className="text-[#C9A84C]/60 text-sm font-bold tracking-widest uppercase mb-2 group-hover:text-[#C9A84C]/80">Espacio disponible para publicidad</p>
          <p className="text-gray-500 text-sm group-hover:text-gray-400">Contacta con nosotros → info@sprintmarkt.com</p>
        </a>
      </div>
    </div>
  );
}

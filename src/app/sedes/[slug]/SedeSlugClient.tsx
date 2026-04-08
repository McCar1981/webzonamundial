"use client";
// src/app/sedes/[slug]/SedeSlugClient.tsx

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Sede } from '@/data/sedes';

const BG = "#060B14";
const BG2 = "#0F1D32";
const BG3 = "#0B1825";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#8a94b0";
const DIM = "#6a7a9a";

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

function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="p-4 bg-[#0B1825] rounded-2xl border border-white/5 hover:border-[#c9a84c]/30 transition-all group">
      <span className="text-2xl mb-2 block">{icon}</span>
      <p className="text-2xl font-black text-[#c9a84c] group-hover:scale-105 transition-transform">{value}</p>
      <p className="text-xs text-[#6a7a9a] mt-1">{label}</p>
    </div>
  );
}

function InfoCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0B1825] rounded-2xl p-6 border border-white/5 hover:border-[#c9a84c]/20 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      {children}
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

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
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

      <div className="max-w-6xl mx-auto px-4 pt-0 pb-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-[#6a7a9a] mb-6">
          <Link href="/" className="hover:text-[#c9a84c] transition-colors">{nav.inicio}</Link>
          <span>/</span>
          <Link href="/sedes" className="hover:text-[#c9a84c] transition-colors">{nav.sedes}</Link>
          <span>/</span>
          <span className="text-[#c9a84c]">{sede.nombre}</span>
        </nav>

        {/* Hero Section */}
        <section className="relative mb-12 rounded-3xl overflow-hidden">
          <div className="relative h-[400px] md:h-[500px]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={sede.estadio}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0F1D32] to-[#1a2a3f] flex items-center justify-center">
                <span className="text-8xl">🏟️</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/60 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <img
                  src={`https://flagcdn.com/w80/${sede.paisCodigo.toLowerCase()}.png`}
                  alt={sede.pais}
                  className="w-10 h-7 object-cover rounded shadow-lg"
                />
                {isFinalSede && (
                  <span className="px-4 py-1.5 bg-[#c9a84c] text-[#060B14] text-sm font-black rounded-full">
                    🏆 FINAL DEL MUNDIAL
                  </span>
                )}
                {sede.techoCerrado && (
                  <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-sm font-bold rounded-full border border-blue-500/30">
                    🏠 TECHO
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-white mb-2">
                {sede.nombre}
              </h1>
              <p className="text-xl md:text-2xl text-[#c9a84c] font-semibold">
                {sede.estadio}
              </p>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard value={sede.capacidad.toLocaleString()} label={sT.capacidad} icon="👥" />
            <StatCard value={sede.totalPartidos.toString()} label={sT.partidos} icon="⚽" />
            <StatCard value={sede.clima.tempMedia} label={sT.temperatura} icon="🌡️" />
            <StatCard value={`${sede.altitudMetros}m`} label={sT.altitud} icon="⛰️" />
            <StatCard value={sede.zonaHoraria} label={sT.zonaHoraria} icon="🕐" />
            <StatCard value={sede.transporte.codigoIATA} label={sT.aeropuerto} icon="✈️" />
          </div>
        </section>

        {/* Sponsor */}
        <a href="#" target="_blank" rel="noopener noreferrer" className="w-full bg-[#0B1825] border border-white/5 rounded-xl flex items-center justify-center mb-12 py-3" data-sponsor-slot="sede-banner">
          <img src="/img/imagenessilviu/ChatGPT Image 8 abr 2026, 04_53_21 p.m..png" alt="Publicidad" className="rounded-lg" style={{maxWidth:"100%",height:"auto"}} />
        </a>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* History */}
            <section className="bg-[#0B1825] rounded-2xl p-6 md:p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
                  <span className="text-2xl">📖</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{sT.historiaTitle}</h2>
              </div>
              <p className="text-[#8a94b0] leading-relaxed text-lg mb-6">
                {sede.historia}
              </p>
              <div className="p-4 bg-[#c9a84c]/10 border-l-4 border-[#c9a84c] rounded-r-xl">
                <p className="text-[#c9a84c] font-semibold flex items-center gap-2">
                  <span>💡</span> {sede.datosClave}
                </p>
              </div>
            </section>

            {/* Matches */}
            <section className="bg-[#0B1825] rounded-2xl p-6 md:p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
                  <span className="text-2xl">⚽</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{sT.partidosTitle}</h2>
              </div>

              {/* Phases */}
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

              {/* Groups */}
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

              {/* Featured matches */}
              {sede.partidosDestacados.length > 0 && (
                <div>
                  <p className="text-sm text-[#6a7a9a] mb-3">{sT.partidosDestacados}</p>
                  <div className="space-y-2">
                    {sede.partidosDestacados.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-[#060B14] rounded-xl border border-white/5">
                        <span className="text-[#c9a84c]">⭐</span>
                        <span className="text-white">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Technical data */}
            <section className="bg-[#0B1825] rounded-2xl p-6 md:p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
                  <span className="text-2xl">🏟️</span>
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
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Travel guide */}
            <div className="bg-gradient-to-br from-[#0B1825] to-[#0F1D32] rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🧳</span>
                <h3 className="text-xl font-bold text-white">{sT.guiaViaje}</h3>
              </div>

              <div className="space-y-4">
                <InfoCard title={sT.comoLlegar} icon="✈️">
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelAeropuerto}</strong> {sede.transporte.aeropuerto}</p>
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelCodigo}</strong> {sede.transporte.codigoIATA}</p>
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelAlEstadio}</strong> {sede.transporte.distanciaEstadio}</p>
                  <p className="text-[#8a94b0] text-sm"><strong className="text-white">{sT.labelTransporte}</strong> {sede.transporte.metroTren}</p>
                </InfoCard>

                <InfoCard title={sT.visaYDinero} icon="🛂">
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelVisa}</strong> {g.visa}</p>
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelIdioma}</strong> {g.idioma}</p>
                  <p className="text-[#8a94b0] text-sm"><strong className="text-white">{sT.labelMoneda}</strong> {g.moneda}</p>
                </InfoCard>

                <InfoCard title={sT.alojamiento} icon="🏨">
                  <p className="text-[#8a94b0] text-sm mb-3">{g.costoAlojamiento}</p>
                  <p className="text-white text-sm font-semibold mb-2">{sT.zonasRecomendadas}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.zonasRecomendadas.map(z => (
                      <span key={z} className="px-3 py-1 bg-[#060B14] rounded-lg text-xs text-[#8a94b0]">{z}</span>
                    ))}
                  </div>
                </InfoCard>

                <InfoCard title={sT.clima} icon="🌡️">
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelJunio}</strong> {sede.clima.junio}</p>
                  <p className="text-[#8a94b0] text-sm mb-2"><strong className="text-white">{sT.labelJulio}</strong> {sede.clima.julio}</p>
                  <p className="text-[#8a94b0] text-sm"><strong className="text-white">{sT.labelLluvia}</strong> {sede.clima.lluvia}</p>
                </InfoCard>

                <InfoCard title={sT.gastronomia} icon="🍽️">
                  <p className="text-[#8a94b0] text-sm">{g.gastronomia}</p>
                </InfoCard>

                <InfoCard title={sT.seguridad} icon="🔒">
                  <p className="text-[#8a94b0] text-sm mb-2">{g.seguridadNota}</p>
                  {g.fanZone && (
                    <p className="text-[#8a94b0] text-sm"><strong className="text-white">{sT.fanZone}</strong> {g.fanZone}</p>
                  )}
                </InfoCard>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 rounded-2xl p-6 border border-[#c9a84c]/20">
              <h3 className="font-bold text-white mb-2">{sT.ctaTitle} {sede.nombre}?</h3>
              <p className="text-sm text-[#8a94b0] mb-4">{sT.ctaDesc}</p>
              <Link
                href="/registro"
                className="block w-full py-3 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#060B14] font-bold rounded-xl text-center hover:shadow-lg transition-all"
              >
                {sT.ctaBtn}
              </Link>
            </div>
          </div>
        </div>

        {/* Related links */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">{sT.explorarMas}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { href: '/sedes', icon: '🏟️', label: sT.todasLasSedes },
              { href: '/calendario', icon: '📅', label: nav.calendario },
              { href: '/selecciones', icon: '⚽', label: nav.selecciones },
              { href: '/grupos', icon: '📊', label: nav.grupos },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-4 bg-[#0B1825] rounded-xl border border-white/5 hover:border-[#c9a84c]/30 hover:text-[#c9a84c] transition-all group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Sponsor footer */}
        <a href="https://rotulemos.com" target="_blank" rel="noopener noreferrer" className="w-full bg-[#0B1825] border border-white/5 rounded-xl flex items-center justify-center py-3" data-sponsor-slot="sede-footer">
          <img src="/img/imagenessilviu/rotulemos320x50.png" alt="Rotulemos" className="rounded-lg" style={{maxWidth:"100%",height:"auto"}} />
        </a>
      </div>
    </div>
  );
}

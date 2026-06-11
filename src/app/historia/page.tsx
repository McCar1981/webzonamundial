// src/app/historia/page.tsx
// ZonaMundial.app — Historia del Mundial 1930-2026 — HUB PRINCIPAL
// Base de datos hispanohablante más completa sobre Mundiales

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getAllEdiciones,
  getPalmares,
  getResumenGlobal,
  getAllCuriosidades,
  getAllJugadoresLegendarios,
  getAllArbitros,
  getAllPolemicas,
  getAllGolesLegendarios,
  getAllBalones,
  getAllMascotas,
  getAllEstadios,
  getRegistrosHistoricos,
} from '@/lib/content/ediciones';

export const metadata: Metadata = {
  // Corto y sin sufijo: el template del layout raíz añade " | ZonaMundial".
  // El anterior (90 chars + sufijo duplicado por el template) salía truncado en la SERP.
  title: 'Historia del Mundial de Fútbol (1930–2026)',
  description:
    'La base de datos hispanohablante más completa sobre los Mundiales: 23 ediciones, campeones, goleadores, récords, 100+ curiosidades y 15 leyendas. Verificada con RSSSF y FIFA.',
  keywords: [
    'historia mundial futbol',
    'todos los mundiales',
    'copa del mundo historia',
    '1930 a 2026 mundiales',
    'campeones mundiales',
    'palmares mundiales',
    'curiosidades mundial',
    'records mundial',
  ],
  alternates: { canonical: 'https://zonamundial.app/historia' },
  openGraph: {
    title: 'Historia del Mundial 1930–2026 | ZonaMundial',
    description: 'La base de datos hispanohablante más completa: 23 ediciones, 15 leyendas, 100+ curiosidades, 23 balones, polémicas, goles legendarios y más.',
    url: 'https://zonamundial.app/historia',
    siteName: 'ZonaMundial',
    locale: 'es_ES',
    type: 'website',
  },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
};

const GOLD = '#c9a84c';

function fmt(n: number): string {
  return new Intl.NumberFormat('es-ES').format(n);
}

export default function HistoriaPage() {
  const ediciones = getAllEdiciones();
  const palmares = getPalmares();
  const resumen = getResumenGlobal();
  const curiosidades = getAllCuriosidades();
  const jugadores = getAllJugadoresLegendarios();
  const arbitros = getAllArbitros();
  const polemicas = getAllPolemicas();
  const goles = getAllGolesLegendarios();
  const balones = getAllBalones();
  const mascotas = getAllMascotas();
  const estadios = getAllEstadios();
  const registros = getRegistrosHistoricos();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Historia del Mundial de Fútbol 1930–2026',
    description: 'La base de datos hispanohablante más completa sobre la Copa del Mundo.',
    inLanguage: 'es',
    url: 'https://zonamundial.app/historia',
    hasPart: ediciones.map((e) => ({
      '@type': 'SportsEvent',
      name: e.meta.tituloOficial,
      startDate: e.fechas.inicio,
      endDate: e.fechas.final,
      location: e.sede.paises.map((p) => p.nombre).join(', '),
      url: `https://zonamundial.app/historia/${e.meta.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li>
            <Link href="/" className="hover:text-[#C9A84C]">
              Inicio
            </Link>
          </li>
          <li>/</li>
          <li className="text-[#C9A84C]">Historia</li>
        </ol>
      </nav>

      {/* HERO */}
      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          1930 — 2026
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          La Historia del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          La base de datos hispanohablante más completa sobre la Copa del Mundo. Datos
          verificados con RSSSF, archivos FIFA, Wikipedia y prensa internacional.
        </p>
      </header>

      {/* RESUMEN MEGA STATS */}
      <section className="mb-10 sm:mb-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-3">
          <MegaStat n={resumen.totalEdicionesJugadas} label="Ediciones jugadas" />
          <MegaStat n={fmt(resumen.totalGoles)} label="Goles totales" />
          <MegaStat n={fmt(resumen.totalPartidos)} label="Partidos disputados" />
          <MegaStat n={`${(resumen.asistenciaTotal / 1_000_000).toFixed(1)}M`} label="Asistencia acumulada" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <MegaStat n={curiosidades.length} label="Curiosidades" small />
          <MegaStat n={jugadores.length} label="Jugadores legendarios" small />
          <MegaStat n={polemicas.length} label="Polémicas verificadas" small />
          <MegaStat n={registros.recordsAbsolutos.length} label="Récords absolutos" small />
        </div>
      </section>

      {/* PALMARES */}
      <section className="mb-12 sm:mb-16">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Palmarés</h2>
          <Link
            href="/historia/selecciones"
            className="text-xs text-[#C9A84C] hover:opacity-80 no-underline"
          >
            Perfiles completos →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {palmares.map((p) => (
            <Link
              key={p.iso3}
              href={`/historia/selecciones/${getSeleccionSlug(p.iso3)}`}
              className="p-3 sm:p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60 text-center hover:border-[#C9A84C]/40 transition-all no-underline"
            >
              {p.banderaUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.banderaUrl}
                  alt={p.pais}
                  loading="lazy"
                  className="w-10 h-7 sm:w-12 sm:h-8 rounded object-cover mx-auto border border-[#1E293B]"
                />
              )}
              <div className="text-xl sm:text-2xl font-black text-[#C9A84C] mt-2">
                {'★'.repeat(p.count)}
              </div>
              <div className="text-sm font-bold text-white mt-1">{p.pais}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{p.anios.join(', ')}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECCIONES TEMÁTICAS - GRID PRINCIPAL */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Explora la base de datos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <FeatureCard
            href="/historia/jugadores"
            icon="⚽"
            title="Jugadores legendarios"
            count={`${jugadores.length} biografías completas`}
            highlight="Pelé, Maradona, Messi, Klose"
          />
          <FeatureCard
            href="/historia/selecciones"
            icon="★"
            title="Selecciones campeonas"
            count="8 perfiles históricos"
            highlight="Brasil 5★ · Alemania 4★ · Italia 4★"
          />
          <FeatureCard
            href="/historia/estadios"
            icon="🏟️"
            title="Estadios míticos"
            count={`${estadios.length} templos del fútbol`}
            highlight="Maracanã, Wembley, Azteca"
          />
          <FeatureCard
            href="/historia/goleadores"
            icon="🥇"
            title="Goleadores históricos"
            count="Top 10 + Botas de Oro"
            highlight="Klose 16, Ronaldo 15, Müller 14"
          />
          <FeatureCard
            href="/historia/records"
            icon="📊"
            title="Récords absolutos"
            count={`${registros.recordsAbsolutos.length} récords vigentes`}
            highlight="Maracanazo 173.850, Salenko 5"
          />
          <FeatureCard
            href="/historia/curiosidades"
            icon="💡"
            title="Curiosidades"
            count={`${curiosidades.length} anécdotas`}
            highlight="Pickles, Mano de Dios, Pulpo Paul"
          />
          <FeatureCard
            href="/historia/balones"
            icon="⚽"
            title="Balones oficiales"
            count={`${balones.length} balones`}
            highlight="Tiento 1930 → Trionda 2026"
          />
          <FeatureCard
            href="/historia/mascotas"
            icon="🐾"
            title="Mascotas oficiales"
            count={`${mascotas.length} mascotas`}
            highlight="Willie, Naranjito, La'eeb"
          />
          <FeatureCard
            href="/historia/goles"
            icon="🎯"
            title="Goles legendarios"
            count={`Top ${goles.filter(g => g.anio).length} ranqueados`}
            highlight="Gol del Siglo, Carlos Alberto, Iniesta"
          />
          <FeatureCard
            href="/historia/arbitros"
            icon="👨‍⚖️"
            title="Árbitros legendarios"
            count={`${arbitros.length} figuras del silbato`}
            highlight="Collina, Aston, Bahramov"
          />
          <FeatureCard
            href="/historia/polemicas"
            icon="🔥"
            title="Polémicas arbitrales"
            count={`${polemicas.length} escándalos`}
            highlight="Mano de Dios, Wembley-Tor, Lampard"
          />
          <FeatureCard
            href="/historia/trofeos"
            icon="🏆"
            title="Trofeos del Mundial"
            count="Jules Rimet + FIFA"
            highlight="Pickles, escondites, robos"
          />
          <FeatureCard
            href="/historia/cancelados"
            icon="✕"
            title="Mundiales cancelados"
            count="1942 y 1946"
            highlight="WWII: 12 años de paréntesis"
          />
          <FeatureCard
            href="/historia/comparar"
            icon="⚖️"
            title="Comparar ediciones"
            count="Cualquiera vs cualquiera"
            highlight="Estadísticas lado a lado"
          />
          <FeatureCard
            href="/historia/comparar-jugadores"
            icon="🆚"
            title="Comparar jugadores"
            count="25 leyendas"
            highlight="Pelé vs Maradona vs Messi"
          />
          <FeatureCard
            href="/historia/premios"
            icon="🥇"
            title="Premios individuales"
            count="Balón / Bota / Guante"
            highlight="Todos los Mundiales 1930-2022"
          />
          <FeatureCard
            href="/historia/eras"
            icon="📜"
            title="Las 7 Eras"
            count="Cronología por épocas"
            highlight="Pionera → Contemporánea"
          />
          <FeatureCard
            href="/historia/buscar"
            icon="🔍"
            title="Búsqueda global"
            count="Indexa todo"
            highlight="Ctrl+K · filtros por tipo"
          />
          <FeatureCard
            href="/historia/entrenadores"
            icon="👨‍🏫"
            title="Entrenadores"
            count="15 técnicos legendarios"
            highlight="Pozzo, Zagallo, Beckenbauer, Deschamps"
          />
          <FeatureCard
            href="/historia/partidos-legendarios"
            icon="🎬"
            title="Partidos legendarios"
            count="Top 25 ranqueados"
            highlight="Maracanazo, Mineirazo, Mano de Dios"
          />
          <FeatureCard
            href="/historia/confederaciones"
            icon="🌍"
            title="Confederaciones"
            count="6 perfiles FIFA"
            highlight="UEFA 12★ · CONMEBOL 10★"
          />
          <FeatureCard
            href="/historia/visualizaciones"
            icon="📈"
            title="Visualizaciones"
            count="6 gráficos de datos"
            highlight="Goles · Asistencia · Palmarés"
          />
          <FeatureCard
            href="/historia/2026"
            icon="🆕"
            title="Mundial 2026"
            count="48 equipos · 104 partidos"
            highlight="11 jun → 19 jul · CAN/MEX/USA"
          />
          <FeatureCard
            href="/historia/camisetas"
            icon="👕"
            title="Camisetas icónicas"
            count="Top 25 jerseys"
            highlight="Brasil 70 · Naranja Mecánica · Maradona 86"
          />
          <FeatureCard
            href="/historia/momentos"
            icon="📸"
            title="Momentos mundialistas"
            count="Top 40 imágenes eternas"
            highlight="Bisht Messi · Llanto Maradona · Banks-azo"
          />
          <FeatureCard
            href="/historia/quiz"
            icon="🎮"
            title="Quiz del Mundial"
            count="20 preguntas"
            highlight="Pon a prueba tu conocimiento"
          />
          <FeatureCard
            href="/historia/best-xi"
            icon="⭐"
            title="Best XI All-Time"
            count="Once Ideal histórico"
            highlight="Yashin · Maradona · Pelé · Messi"
          />
          <FeatureCard
            href="/historia/notables"
            icon="🥈"
            title="Selecciones notables"
            count="12 que no ganaron"
            highlight="Países Bajos · Hungría 1954 · Marruecos"
          />
          <FeatureCard
            href="/historia/sedes-2026"
            icon="📍"
            title="Sedes Mundial 2026"
            count="16 estadios"
            highlight="MetLife (final) · Azteca (inaugural)"
          />
          <FeatureCard
            href="/historia/hat-tricks"
            icon="🎯"
            title="Hat-tricks históricos"
            count="20 destacados"
            highlight="Salenko 5 · Hurst final · Mbappé final"
          />
          <FeatureCard
            href="/historia/economia"
            icon="💰"
            title="Economía del Mundial"
            count="Premios FIFA 1982-2026"
            highlight="$138K (1982) → $50M (2026)"
          />
          <FeatureCard
            href="/historia/sociopolitica"
            icon="🌐"
            title="Mundial y política"
            count="19 eventos verificados"
            highlight="Mussolini · Malvinas · Pussy Riot · DDHH"
          />
          <FeatureCard
            href="/historia/campeones"
            icon="🏅"
            title="Todos los campeones"
            count="22 finales"
            highlight="Tabla de palmarés"
          />
        </div>
      </section>

      {/* TIMELINE VERTICAL */}
      <section className="mb-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Las 23 ediciones, una a una
          </h2>
          <span className="text-xs text-gray-500">Click en cualquiera para ver el detalle</span>
        </div>
        <div className="relative pl-10 sm:pl-14">
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 w-[2px]"
            style={{
              left: '14px',
              background: `linear-gradient(180deg, transparent 0%, ${GOLD} 8%, ${GOLD} 92%, transparent 100%)`,
            }}
          />
          <ol className="space-y-4 sm:space-y-5">
            {ediciones.map((e) => {
              const champ = e.resultados?.campeon;
              const sub = e.resultados?.subcampeon;
              const isProximo = Boolean(e.proximo);
              const goles = e.estadisticas.totalGoles;
              const fmt = e.formato.numEquipos;
              return (
                <li key={e.meta.slug} className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute -left-10 sm:-left-14 top-5 w-4 h-4 rounded-full border-2"
                    style={{
                      borderColor: GOLD,
                      background: isProximo ? '#0F1D32' : GOLD,
                      left: '6px',
                    }}
                  />
                  <Link
                    href={`/historia/${e.meta.slug}`}
                    className="block p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60 hover:border-[#C9A84C]/40 hover:bg-[#0F1D32]/90 transition-all no-underline"
                  >
                    <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap mb-2">
                      <span className="text-2xl sm:text-3xl font-black" style={{ color: GOLD }}>
                        {e.meta.anio}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-white">
                        {e.meta.nombreCorto}
                      </span>
                      {isProximo && (
                        <span className="text-[10px] sm:text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
                          PRÓXIMO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 sm:gap-5 flex-wrap text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Sede:</span>
                        <div className="flex items-center gap-1.5">
                          {e.sede.paises.map((p) => (
                            <span key={p.iso3} className="flex items-center gap-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.banderaUrl}
                                alt={p.nombre}
                                loading="lazy"
                                className="w-5 h-3.5 rounded-[1px] object-cover"
                              />
                              <span className="text-gray-300">{p.nombre}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {champ && !isProximo && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Campeón:</span>
                          <div className="flex items-center gap-1.5">
                            {champ.banderaUrl && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={champ.banderaUrl}
                                alt={champ.pais}
                                loading="lazy"
                                className="w-5 h-3.5 rounded-[1px] object-cover"
                              />
                            )}
                            <span className="font-bold text-white">{champ.pais}</span>
                            {sub && (
                              <span className="text-gray-500 text-[11px] sm:text-xs">
                                vs {sub.pais}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 ml-auto text-[11px] sm:text-xs text-gray-400">
                        <span>{fmt} eq</span>
                        <span>•</span>
                        <span>{e.formato.numPartidos} part</span>
                        {!isProximo && (
                          <>
                            <span>•</span>
                            <span>{goles} goles</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
}

function MegaStat({
  n,
  label,
  small,
}: {
  n: number | string;
  label: string;
  small?: boolean;
}) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60 ${small ? '' : ''}`}>
      <div className={`font-black tabular-nums ${small ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`} style={{ color: GOLD }}>
        {n}
      </div>
      <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function FeatureCard({
  href,
  icon,
  title,
  count,
  highlight,
}: {
  href: string;
  icon: string;
  title: string;
  count: string;
  highlight: string;
}) {
  return (
    <Link
      href={href}
      className="block p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60 hover:border-[#C9A84C]/40 hover:bg-[#0F1D32]/90 transition-all no-underline group"
    >
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-[10px] text-[#C9A84C] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
      </div>
      <h3 className="text-sm sm:text-base font-bold text-white mb-1">{title}</h3>
      <div className="text-[11px] text-[#C9A84C] mb-2 font-semibold tabular-nums">
        {count}
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed truncate">{highlight}</p>
    </Link>
  );
}

function getSeleccionSlug(iso3: string): string {
  const map: Record<string, string> = {
    BRA: 'brasil',
    DEU: 'alemania',
    ITA: 'italia',
    ARG: 'argentina',
    FRA: 'francia',
    URY: 'uruguay',
    ENG: 'inglaterra',
    ESP: 'espana',
  };
  return map[iso3] ?? '';
}

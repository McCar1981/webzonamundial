// src/app/historia/[edicion]/page.tsx
// ZonaMundial.app — Detalle de cada edición del Mundial (SSG)

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllSlugs,
  getEdicionBySlug,
  getAllEdiciones,
} from '@/lib/content/ediciones';
import type { EdicionMundial } from '@/types/edicion';
import PlantillaTabla from '@/components/historia/PlantillaTabla';
import BracketEliminatorio from '@/components/historia/BracketEliminatorio';

export const dynamicParams = false;
export const revalidate = 86400; // 24h ISR

const GOLD = '#c9a84c';

export async function generateStaticParams() {
  return getAllSlugs().map((edicion) => ({ edicion }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ edicion: string }>;
}): Promise<Metadata> {
  const { edicion: slug } = await params;
  const e = getEdicionBySlug(slug);
  if (!e) return { title: 'Edición no encontrada · ZonaMundial' };

  const champ = e.resultados?.campeon;
  const titleParts: string[] = [];
  titleParts.push(`Mundial ${e.meta.nombreCorto}`);
  if (champ) titleParts.push(`Campeón: ${champ.pais}`);
  const title = `${titleParts.join(' · ')} | ZonaMundial`;

  const desc = e.contextoHistorico?.resumen
    ? e.contextoHistorico.resumen.slice(0, 158) + '…'
    : `${e.meta.tituloOficial} — ${e.formato.numEquipos} equipos, ${e.formato.numPartidos} partidos en ${e.sede.paises.map((p) => p.nombre).join(', ')}.`;

  return {
    title,
    description: desc,
    alternates: { canonical: `https://zonamundial.app/historia/${slug}` },
    openGraph: {
      title,
      description: desc,
      url: `https://zonamundial.app/historia/${slug}`,
      siteName: 'ZonaMundial',
      locale: 'es_ES',
      type: 'article',
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
  };
}

function fmt(n: number | undefined): string {
  if (n === undefined) return '—';
  return new Intl.NumberFormat('es-ES').format(n);
}

function fmtFecha(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00Z').toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return iso;
  }
}

function buildJsonLd(e: EdicionMundial) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: e.meta.tituloOficial,
    description: e.contextoHistorico?.resumen,
    startDate: e.fechas.inicio,
    endDate: e.fechas.final,
    location: e.sede.paises.map((p) => ({
      '@type': 'Country',
      name: p.nombre,
    })),
    sport: 'Football',
    inLanguage: 'es',
    url: `https://zonamundial.app/historia/${e.meta.slug}`,
  };
}

export default async function EdicionPage({
  params,
}: {
  params: Promise<{ edicion: string }>;
}) {
  const { edicion: slug } = await params;
  const e = getEdicionBySlug(slug);
  if (!e) notFound();

  const ediciones = getAllEdiciones();
  const idx = ediciones.findIndex((x) => x.meta.slug === slug);
  const prev = idx > 0 ? ediciones[idx - 1] : null;
  const next = idx < ediciones.length - 1 ? ediciones[idx + 1] : null;

  const champ = e.resultados?.campeon;
  const sub = e.resultados?.subcampeon;
  const tercero = e.resultados?.tercero;
  const cuarto = e.resultados?.cuarto;
  const final = e.partidoFinal;
  const inaugural = e.partidoInaugural;
  const partido3 = e.partido3;

  const sedeStr = e.sede.paises.map((p) => p.nombre).join(' / ');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(e)) }}
      />

      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li>
            <Link href="/" className="hover:text-[#C9A84C]">
              Inicio
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/historia" className="hover:text-[#C9A84C]">
              Historia
            </Link>
          </li>
          <li>/</li>
          <li className="text-[#C9A84C]">{e.meta.nombreCorto}</li>
        </ol>
      </nav>

      {/* HERO */}
      <header className="mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-[#1E293B]">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Edición {e.meta.edicion} · {e.meta.era.toUpperCase()}
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-3 leading-[1.05]">
          <span style={{ color: GOLD }}>{e.meta.anio}</span> {sedeStr}
        </h1>
        {e.identidadVisual.eslogan && (
          <p className="italic text-base sm:text-lg text-gray-400">
            «{e.identidadVisual.eslogan}»
          </p>
        )}
        <div className="mt-5 flex items-center gap-3 sm:gap-4 flex-wrap text-xs sm:text-sm text-gray-300">
          <span>📅 {fmtFecha(e.fechas.inicio)} → {fmtFecha(e.fechas.final)}</span>
          <span>•</span>
          <span>{e.formato.numEquipos} selecciones</span>
          <span>•</span>
          <span>{e.formato.numPartidos} partidos</span>
          {!e.proximo && (
            <>
              <span>•</span>
              <span>{e.estadisticas.totalGoles} goles</span>
            </>
          )}
        </div>
      </header>

      {/* RESUMEN PODIO */}
      {!e.proximo && champ && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">El podio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { label: '🥇 Campeón', team: champ },
              { label: '🥈 Subcampeón', team: sub },
              { label: '🥉 Tercer lugar', team: tercero },
              { label: '4º Cuarto', team: cuarto },
            ].map((row, i) =>
              row.team ? (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60"
                  style={i === 0 ? { borderColor: GOLD + '55' } : undefined}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {row.label}
                  </div>
                  <div className="flex items-center gap-2">
                    {row.team.banderaUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={row.team.banderaUrl}
                        alt={row.team.pais}
                        className="w-7 h-5 object-cover rounded-[1px]"
                        loading="lazy"
                      />
                    )}
                    <span
                      className="font-bold text-white"
                      style={i === 0 ? { color: GOLD } : undefined}
                    >
                      {row.team.pais}
                    </span>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* FINAL */}
      {final && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">La final</h2>
          <div className="p-5 sm:p-6 rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#0F1D32]/80 to-[#0B1825]/80">
            <div className="flex items-center justify-center gap-4 sm:gap-8 mb-3">
              <div className="flex flex-col items-center gap-2 flex-1">
                {final.local.banderaUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={final.local.banderaUrl}
                    alt={final.local.pais}
                    className="w-12 h-8 sm:w-16 sm:h-11 object-cover rounded"
                    loading="lazy"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`https://flagcdn.com/w160/${final.local.iso2}.png`}
                    alt={final.local.pais}
                    className="w-12 h-8 sm:w-16 sm:h-11 object-cover rounded"
                    loading="lazy"
                  />
                )}
                <span className="text-sm sm:text-base font-bold text-white text-center">
                  {final.local.pais}
                </span>
              </div>
              <div
                className="text-3xl sm:text-5xl font-black tabular-nums text-center min-w-[120px]"
                style={{ color: GOLD }}
              >
                {final.marcador}
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    final.visitante.banderaUrl ??
                    `https://flagcdn.com/w160/${final.visitante.iso2}.png`
                  }
                  alt={final.visitante.pais}
                  className="w-12 h-8 sm:w-16 sm:h-11 object-cover rounded"
                  loading="lazy"
                />
                <span className="text-sm sm:text-base font-bold text-white text-center">
                  {final.visitante.pais}
                </span>
              </div>
            </div>
            <div className="text-center text-xs sm:text-sm text-gray-400 mt-4 space-y-1">
              <div>{fmtFecha(final.fecha)}</div>
              {(final.estadio || final.ciudad) && (
                <div>
                  {final.estadio}
                  {final.ciudad ? ` · ${final.ciudad}` : ''}
                  {final.asistencia ? ` · ${fmt(final.asistencia)} asistentes` : ''}
                </div>
              )}
              {final.arbitro && <div>Árbitro: {final.arbitro}</div>}
            </div>

            {final.goleadores && final.goleadores.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#1E293B]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Goles
                </div>
                <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
                  {final.goleadores.map((g, i) => (
                    <li key={i}>
                      <span className="text-[#C9A84C] font-bold mr-2 tabular-nums">
                        {g.minuto}
                      </span>
                      {g.jugador}
                      {g.tipo && g.tipo !== 'normal' ? (
                        <span className="text-gray-500"> ({g.tipo})</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ESTADÍSTICAS */}
      {!e.proximo && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Estadísticas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Equipos" value={String(e.formato.numEquipos)} />
            <Stat label="Partidos" value={String(e.formato.numPartidos)} />
            <Stat label="Goles totales" value={fmt(e.estadisticas.totalGoles)} />
            <Stat
              label="Goles por partido"
              value={e.estadisticas.promedioGolesPartido.toFixed(2)}
            />
            {e.estadisticas.asistenciaTotal !== undefined && (
              <Stat
                label="Asistencia total"
                value={fmt(e.estadisticas.asistenciaTotal)}
              />
            )}
            {e.estadisticas.asistenciaPromedio !== undefined && (
              <Stat
                label="Asistencia / partido"
                value={fmt(e.estadisticas.asistenciaPromedio)}
              />
            )}
          </div>
        </section>
      )}

      {/* TOP GOLEADORES */}
      {e.topGoleadores && e.topGoleadores.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            Goleadores del torneo
          </h2>
          <div className="rounded-xl border border-[#1E293B] overflow-hidden bg-[#0F1D32]/40">
            {e.topGoleadores.map((g, i) => (
              <div
                key={`${g.nombre}-${i}`}
                className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-[#0F172A] last:border-b-0"
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.3)' }}
              >
                <span className="text-xs sm:text-sm font-bold text-gray-500 w-6 tabular-nums">
                  {i + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${g.seleccion.iso2}.png`}
                  alt={g.seleccion.pais}
                  className="w-6 h-4 object-cover rounded-[1px]"
                  loading="lazy"
                />
                <span className="text-sm sm:text-base font-bold text-white">{g.nombre}</span>
                <span className="text-[11px] sm:text-xs text-gray-500">
                  ({g.seleccion.pais})
                </span>
                {g.botaOro && (
                  <span className="text-[10px] font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded ml-auto">
                    BOTA DE ORO
                  </span>
                )}
                <span
                  className={`text-base sm:text-lg font-black tabular-nums ${g.botaOro ? '' : 'ml-auto'}`}
                  style={{ color: GOLD }}
                >
                  {g.goles}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PREMIOS */}
      {e.premios && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Premios oficiales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {e.premios.balonOro && (
              <PremioCard label="Balón de Oro" value={e.premios.balonOro} />
            )}
            {e.premios.guanteOro && (
              <PremioCard label="Guante de Oro" value={e.premios.guanteOro} />
            )}
            {e.premios.mejorJoven && (
              <PremioCard label="Mejor Jugador Joven" value={e.premios.mejorJoven} />
            )}
            {e.premios.fairPlay && (
              <PremioCard label="Fair Play" value={e.premios.fairPlay.pais} />
            )}
          </div>
        </section>
      )}

      {/* IDENTIDAD VISUAL */}
      {(e.identidadVisual.balon || e.identidadVisual.mascota) && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Identidad visual</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {e.identidadVisual.balon && (
              <PremioCard label="Balón oficial" value={e.identidadVisual.balon} />
            )}
            {e.identidadVisual.mascota && (
              <PremioCard label="Mascota" value={e.identidadVisual.mascota} />
            )}
          </div>
        </section>
      )}

      {/* PARTIDO INAUGURAL */}
      {inaugural && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Partido inaugural</h2>
          <PartidoCard p={inaugural} />
        </section>
      )}

      {/* BRACKET ELIMINATORIO */}
      {(e.fasesKO || final) && !e.proximo && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            Camino al título
          </h2>
          <BracketEliminatorio
            fasesKO={e.fasesKO}
            partidoFinal={final}
            partido3={partido3}
          />
        </section>
      )}

      {/* HAT-TRICKS */}
      {e.hatTricks && e.hatTricks.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Hat-tricks</h2>
          <div className="space-y-2">
            {e.hatTricks.map((h, i) => (
              <div
                key={i}
                className="p-3 sm:p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60 flex items-center gap-3 flex-wrap"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${h.seleccion.iso2}.png`}
                  alt=""
                  className="w-7 h-5 object-cover rounded-[1px]"
                  loading="lazy"
                />
                <div>
                  <div className="text-sm font-bold text-white">{h.jugador}</div>
                  <div className="text-[11px] text-gray-500">
                    {h.seleccion.pais} · {h.fase} vs {h.rival.pais}
                  </div>
                </div>
                {h.marcador && (
                  <span
                    className="ml-auto text-base font-black tabular-nums"
                    style={{ color: GOLD }}
                  >
                    {h.marcador}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PLANTILLA CAMPEÓN */}
      {e.plantillaCampeon && e.plantillaCampeon.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            Plantilla campeona
          </h2>
          <PlantillaTabla
            plantilla={e.plantillaCampeon}
            titulo={
              e.resultados?.campeon
                ? `★ ${e.resultados.campeon.pais}`
                : undefined
            }
          />
        </section>
      )}

      {/* PLANTILLA SUBCAMPEÓN */}
      {e.plantillaSubcampeon && e.plantillaSubcampeon.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            Plantilla subcampeona
          </h2>
          <PlantillaTabla
            plantilla={e.plantillaSubcampeon}
            titulo={
              e.resultados?.subcampeon
                ? e.resultados.subcampeon.pais
                : undefined
            }
          />
        </section>
      )}

      {/* RECORDS DE EDICIÓN */}
      {e.recordsEdicion && e.recordsEdicion.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            Récords de esta edición
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {e.recordsEdicion.map((rec, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#0F1D32]/80 to-[#0B1825]/80"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] mb-2">
                  {rec.categoria}
                </div>
                <p className="text-sm text-white leading-relaxed">{rec.descripcion}</p>
                {rec.valor && (
                  <div
                    className="mt-2 text-base font-black tabular-nums"
                    style={{ color: GOLD }}
                  >
                    {rec.valor}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PARTIDO 3º */}
      {partido3 && !e.fasesKO && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Tercer puesto</h2>
          <PartidoCard p={partido3} />
        </section>
      )}

      {/* CONTEXTO + EVENTOS */}
      {e.contextoHistorico && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">El contexto</h2>
          {e.contextoHistorico.resumen && (
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-[65ch] mb-4">
              {e.contextoHistorico.resumen}
            </p>
          )}
          {e.contextoHistorico.eventos && e.contextoHistorico.eventos.length > 0 && (
            <ul className="space-y-2 text-sm sm:text-base text-gray-300 max-w-[65ch]">
              {e.contextoHistorico.eventos.map((ev, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#C9A84C] flex-shrink-0">▸</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* CURIOSIDADES */}
      {e.curiosidades && e.curiosidades.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">¿Sabías que…?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {e.curiosidades.map((c, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] mb-2">
                  {c.categoria}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{c.texto}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FUENTES */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Fuentes</h2>
        <ul className="text-xs sm:text-sm text-gray-400 space-y-1.5">
          {e.fuentes.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#C9A84C] flex-shrink-0">→</span>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-[#C9A84C] underline-offset-2 hover:underline break-all"
              >
                {f.nombre}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* NAV ANTERIOR / SIGUIENTE */}
      <nav className="grid grid-cols-2 gap-3 mt-12 pt-8 border-t border-[#1E293B]">
        {prev ? (
          <Link
            href={`/historia/${prev.meta.slug}`}
            className="p-4 rounded-xl border border-[#1E293B] bg-[#0B1825] hover:border-[#C9A84C]/40 no-underline transition-all"
          >
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              ← Anterior
            </div>
            <div className="text-sm font-bold text-white">{prev.meta.nombreCorto}</div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/historia/${next.meta.slug}`}
            className="p-4 rounded-xl border border-[#1E293B] bg-[#0B1825] hover:border-[#C9A84C]/40 no-underline transition-all text-right"
          >
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              Siguiente →
            </div>
            <div className="text-sm font-bold text-white">{next.meta.nombreCorto}</div>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60">
      <div
        className="text-xl sm:text-2xl font-black tabular-nums"
        style={{ color: GOLD }}
      >
        {value}
      </div>
      <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function PremioCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}
      </div>
      <div className="text-sm sm:text-base font-bold text-white">{value}</div>
    </div>
  );
}

function PartidoCard({ p }: { p: NonNullable<EdicionMundial['partidoInaugural']> }) {
  return (
    <div className="p-4 sm:p-5 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60">
      <div className="flex items-center justify-center gap-3 sm:gap-6 mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.local.banderaUrl ?? `https://flagcdn.com/w160/${p.local.iso2}.png`}
          alt={p.local.pais}
          className="w-9 h-6 sm:w-12 sm:h-8 object-cover rounded"
          loading="lazy"
        />
        <span className="text-sm sm:text-base font-bold text-white">{p.local.pais}</span>
        <span className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: GOLD }}>
          {p.marcador}
        </span>
        <span className="text-sm sm:text-base font-bold text-white">{p.visitante.pais}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.visitante.banderaUrl ?? `https://flagcdn.com/w160/${p.visitante.iso2}.png`}
          alt={p.visitante.pais}
          className="w-9 h-6 sm:w-12 sm:h-8 object-cover rounded"
          loading="lazy"
        />
      </div>
      <div className="text-center text-xs text-gray-400 mt-2">
        {p.fecha && fmtFecha(p.fecha)}
        {p.estadio ? ` · ${p.estadio}` : ''}
        {p.ciudad ? `, ${p.ciudad}` : ''}
      </div>
    </div>
  );
}

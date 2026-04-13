"use client";

import Link from 'next/link';
import FlagImage from '@/components/FlagImage';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Seleccion } from '@/data/selecciones';

// Degradados personalizados por país basados en sus banderas
const getFlagGradient = (slug: string): string => {
  const gradients: Record<string, string> = {
    'qatar': 'from-[#8D1B3D] via-[#5C0D2E] to-[#2D0615]',
    'japon': 'from-[#BC002D] via-[#8B001F] to-[#1D1D1D]',
    'corea-del-sur': 'from-[#C60C30] via-[#003478] to-[#000000]',
    'iran': 'from-[#239F40] via-[#FFFFFF] to-[#DA0000]',
    'australia': 'from-[#012169] via-[#FFFFFF] to-[#E4002B]',
    'arabia-saudita': 'from-[#006C35] via-[#005C2D] to-[#003D1F]',
    'argentina': 'from-[#75AADB] via-[#FFFFFF] to-[#F6B40E]',
    'brasil': 'from-[#009739] via-[#FEDD00] to-[#002776]',
    'uruguay': 'from-[#0038A8] via-[#FFFFFF] to-[#FCD116]',
    'colombia': 'from-[#FCD116] via-[#003893] to-[#CE1126]',
    'espana': 'from-[#AA151B] via-[#F1BF00] to-[#AA151B]',
    'francia': 'from-[#002395] via-[#FFFFFF] to-[#ED2939]',
    'alemania': 'from-[#000000] via-[#DD0000] to-[#FFCE00]',
    'italia': 'from-[#009246] via-[#FFFFFF] to-[#CE2B37]',
    'inglaterra': 'from-[#FFFFFF] via-[#CF081F] to-[#00247D]',
    'portugal': 'from-[#006600] via-[#FF0000] to-[#006600]',
    'paises-bajos': 'from-[#AE1C28] via-[#FFFFFF] to-[#21468B]',
    'mexico': 'from-[#006847] via-[#FFFFFF] to-[#CE1126]',
    'estados-unidos': 'from-[#B22234] via-[#FFFFFF] to-[#3C3B6E]',
    'canada': 'from-[#FF0000] via-[#FFFFFF] to-[#FF0000]',
    'marruecos': 'from-[#C1272D] via-[#006233] to-[#C1272D]',
    'senegal': 'from-[#00853F] via-[#FDEF42] to-[#E31B23]',
    'sudafrica': 'from-[#007749] via-[#FFB81C] to-[#DE3831]',
    'egipto': 'from-[#CE1126] via-[#FFFFFF] to-[#000000]',
  };
  return gradients[slug] || '';
};

const getConfederacionStyle = (conf: string) => {
  const styles: Record<string, { gradient: string; accent: string; text: string }> = {
    'UEFA': { gradient: 'from-blue-600 via-blue-700 to-blue-900', accent: '#3b82f6', text: 'text-blue-400' },
    'CONMEBOL': { gradient: 'from-yellow-500 via-yellow-600 to-orange-600', accent: '#eab308', text: 'text-yellow-400' },
    'CONCACAF': { gradient: 'from-red-600 via-red-700 to-red-900', accent: '#ef4444', text: 'text-red-400' },
    'CAF': { gradient: 'from-green-600 via-green-700 to-green-900', accent: '#22c55e', text: 'text-green-400' },
    'AFC': { gradient: 'from-purple-600 via-purple-700 to-purple-900', accent: '#a855f7', text: 'text-purple-400' },
    'OFC': { gradient: 'from-cyan-600 via-cyan-700 to-cyan-900', accent: '#06b6d4', text: 'text-cyan-400' },
  };
  return styles[conf] || { gradient: 'from-gray-600 via-gray-700 to-gray-900', accent: '#9ca3af', text: 'text-gray-400' };
};

interface Props {
  team: Seleccion & Record<string, any>;
  companeros: Seleccion[];
}

export default function SeleccionClient({ team, companeros }: Props) {
  const { t } = useLanguage();
  const sT = t.seleccion;
  const gT = t.grupos;
  const nav = t.nav;

  const style = getConfederacionStyle(team.confederacion);
  const flagGradient = getFlagGradient(team.slug);

  const getBarGradient = () => {
    if (flagGradient) return flagGradient;
    return 'from-[#c9a84c] via-[#e8d48b] to-[#c9a84c]';
  };

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Barra superior con color de la bandera */}
      <div className={`h-2 bg-gradient-to-r ${getBarGradient()}`} />

      {/* Background con degradado de la bandera */}
      {flagGradient && (
        <div className="fixed inset-0 pointer-events-none">
          <div className={`absolute inset-0 bg-gradient-to-br ${flagGradient} opacity-[0.08]`} />
          <div className={`absolute top-0 left-1/4 w-[1000px] h-[600px] bg-gradient-to-br ${flagGradient} opacity-[0.05] blur-[120px] rounded-full`} />
          <div className={`absolute bottom-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-tl ${flagGradient} opacity-[0.03] blur-[100px] rounded-full`} />
        </div>
      )}

      {!flagGradient && (
        <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full bg-white blur-[150px]" />
        </div>
      )}

      <div className="relative max-w-6xl mx-auto px-6 pt-0 pb-8">
        {/* NAVEGACIÓN */}
        <div className="flex items-center gap-4 mb-12">
          <Link
            href="/selecciones"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 hover:border-[#c9a84c]/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {sT.volver}
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-gray-500 hover:text-white transition-colors">{nav.inicio}</Link>
            <span className="text-gray-700">/</span>
            <Link href="/selecciones" className="text-gray-500 hover:text-white transition-colors">{nav.selecciones}</Link>
            <span className="text-gray-700">/</span>
            <span className="text-white font-medium">{team.nombre}</span>
          </nav>
        </div>

        {/* HEADER PRINCIPAL */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 mb-12">
          {/* Bandera */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <FlagImage
                code={team.flagCode}
                alt={team.nombre}
                width={640}
                className="w-full h-full object-cover"
                fallback={team.emoji}
              />
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-white/5 to-transparent rounded-3xl -z-10 blur-2xl" />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {team.esAnfitrion && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                  🏟️ {sT.anfitrion}
                </span>
              )}
              <span className={`px-3 py-1 bg-white/5 text-xs font-bold rounded-full border border-white/10 ${style.text}`}>
                {team.confederacion}
              </span>
              <Link
                href={`/grupos/grupo-${team.grupo.toLowerCase()}`}
                className="px-3 py-1 bg-white/5 text-gray-400 text-xs font-bold rounded-full border border-white/10 hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] hover:border-[#c9a84c]/30 transition-all"
              >
                {sT.grupo} {team.grupo}
              </Link>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
              {team.nombre}
            </h1>

            <div className="flex items-center gap-6 text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-sm">{sT.rankingFIFA}</span>
                <span className="text-2xl font-bold text-white">#{team.rankingFIFA || 'TBD'}</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-sm">{sT.mundiales}</span>
                <span className="text-2xl font-bold text-white">{team.mundiales}</span>
              </div>
              {team.mejorResultado.includes('Campeón') && (
                <>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">🏆</span>
                    <span className="text-amber-400 font-bold">{team.mejorResultado.match(/\d+/)?.[0] || '1'} {sT.titulos}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-gray-500 text-sm mb-1">{sT.stats.participaciones}</div>
            <div className="text-4xl font-black text-white">{team.mundiales}</div>
            <div className="text-xs text-gray-600 mt-1">{sT.stats.mundialesJugados}</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-gray-500 text-sm mb-1">{sT.stats.titulos}</div>
            <div className={`text-4xl font-black ${team.mejorResultado.includes('Campeón') ? 'text-amber-400' : 'text-white'}`}>
              {team.mejorResultado.includes('Campeón') ? (team.mejorResultado.match(/\d+/)?.[0] || '1') : '0'}
            </div>
            <div className="text-xs text-gray-600 mt-1">{sT.stats.copas}</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-gray-500 text-sm mb-1">{sT.stats.mejorResultado}</div>
            <div className="text-xl font-bold text-white leading-tight">{team.mejorResultado}</div>
            <div className="text-xs text-gray-600 mt-1">{sT.stats.historico}</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-gray-500 text-sm mb-1">{sT.stats.confederacion}</div>
            <div className={`text-2xl font-bold ${style.text}`}>{team.confederacion}</div>
            <div className="text-xs text-gray-600 mt-1">{['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'].indexOf(team.confederacion) + 1} {sT.stats.de6}</div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Historia */}
            <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">📖</div>
                <h2 className="text-xl font-bold text-white">{sT.historia}</h2>
              </div>
              <p className="text-gray-400 leading-relaxed text-lg">
                {team.historia || `${team.nombre} se prepara para su participación en el Mundial 2026. ${team.mundiales > 0 ? `Esta será su ${team.mundiales + 1}ª aparición en la historia de los mundiales.` : 'Será su primera experiencia en una Copa del Mundo.'}`}
              </p>
              {team.datosClave && (
                <div className="mt-6 p-5 rounded-2xl bg-[#c9a84c]/5 border border-[#c9a84c]/20">
                  <p className="text-[#c9a84c]">💡 {team.datosClave}</p>
                </div>
              )}
            </section>

            {/* Clasificación */}
            <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">🎯</div>
                <h2 className="text-xl font-bold text-white">{sT.clasificacion}</h2>
              </div>
              <p className="text-gray-400 leading-relaxed">
                {team.clasificacion || `${team.nombre} ${team.esAnfitrion ? 'se clasificó automáticamente como uno de los países anfitriones del Mundial 2026' : `obtuvo su plaza para el Mundial 2026 a través del proceso clasificatorio de ${team.confederacion}`}.`}
              </p>
            </section>

            {/* Jugadores Clave */}
            {team.jugadoresClave && team.jugadoresClave.length > 0 && (
              <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">⭐</div>
                  <h2 className="text-xl font-bold text-white">{sT.jugadores}</h2>
                </div>
                <div className="space-y-4">
                  {team.jugadoresClave.map((j: any) => (
                    <div key={j.nombre} className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors border border-white/5">
                      <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                        {j.posicion === 'POR' ? '🧤' : j.posicion === 'DEF' ? '🛡️' : j.posicion === 'MED' ? '⚙️' : '⚽'}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">{j.nombre}</p>
                        <p className="text-sm text-gray-500">{j.club} · {j.posicion}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#c9a84c]">{j.golesIntl}</p>
                        <p className="text-xs text-gray-600">{sT.goles}</p>
                      </div>
                      <div className="text-right px-4 border-l border-white/10">
                        <p className="text-xl font-bold text-white">{j.internacionalidades}</p>
                        <p className="text-xs text-gray-600">{sT.partidos}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sponsor */}
            <div className="h-32 rounded-3xl bg-white/[0.02] border border-white/10 flex items-center justify-center">
              <span className="text-gray-600">{sT.espacio}</span>
            </div>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="space-y-6">
            {/* Grupo */}
            <section className="p-6 rounded-3xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">{sT.grupo} {team.grupo}</h3>
                <Link href={`/grupos/grupo-${team.grupo.toLowerCase()}`} className="text-sm text-[#c9a84c] hover:underline">
                  {sT.verGrupo}
                </Link>
              </div>
              <div className="space-y-2">
                {[team, ...companeros]
                  .sort((a, b) => (a.rankingFIFA || 999) - (b.rankingFIFA || 999))
                  .map((t, idx) => (
                    <div
                      key={t.slug}
                      className={`flex items-center gap-3 p-3 rounded-xl ${t.slug === team.slug ? 'bg-[#c9a84c]/10 border border-[#c9a84c]/30' : 'bg-white/[0.02]'}`}
                    >
                      <span className="text-gray-600 w-5">{idx + 1}</span>
                      <FlagImage code={t.flagCode} alt="" width={40} className="w-8 h-6 object-cover rounded" fallback={t.emoji} />
                      <span className={`flex-1 font-medium ${t.slug === team.slug ? 'text-[#c9a84c]' : 'text-white'}`}>
                        {t.nombre}
                      </span>
                      <span className="text-xs text-gray-600">#{t.rankingFIFA || '-'}</span>
                    </div>
                  ))}
              </div>
            </section>

            {/* Predicción */}
            <section className="p-6 rounded-3xl bg-gradient-to-br from-[#c9a84c]/10 to-transparent border border-[#c9a84c]/20">
              <h3 className="text-lg font-bold text-white mb-4">{sT.hastalDonde}</h3>
              <div className="grid grid-cols-2 gap-2">
                {sT.stages.map((f) => (
                  <button key={f} className="py-3 px-2 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] transition-colors border border-white/5 hover:border-[#c9a84c]/30">
                    {f}
                  </button>
                ))}
              </div>
            </section>

            {/* Links */}
            <section className="p-6 rounded-3xl bg-white/[0.02] border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">{sT.enlacesUtiles}</h3>
              <div className="space-y-2">
                {[
                  { label: sT.links[0], href: '/selecciones' },
                  { label: sT.links[1], href: '/calendario' },
                  { label: sT.links[2], href: '/sedes' },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 border border-[#c9a84c]/20">
              <h3 className="font-bold text-white mb-2">{sT.predice}</h3>
              <p className="text-sm text-gray-400 mb-4">{sT.prediceSub}</p>
              <Link href="/registro" className="block w-full py-3 bg-[#c9a84c] text-black font-bold rounded-xl text-center hover:bg-[#e8d48b] transition-colors">
                {sT.registrarseGratis}
              </Link>
            </div>

            {/* Sponsor */}
            <a href="#" target="_blank" rel="noopener noreferrer" className="rounded-3xl bg-white/[0.02] border border-white/10 flex items-center justify-center py-3">
              <img src="/img/imagenessilviu/ChatGPT Image 8 abr 2026, 04_53_21 p.m..png" alt="Publicidad" className="rounded-lg" style={{maxWidth:"100%",height:"auto"}} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

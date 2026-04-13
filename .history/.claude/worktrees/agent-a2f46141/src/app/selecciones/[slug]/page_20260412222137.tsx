// src/app/selecciones/[slug]/page.tsx
// ZonaMundial.app — Página de selección (Diseño 2025)

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSeleccionBySlug, getSeleccionesByGrupo, getAllSlugs } from '@/data/selecciones';
import Link from 'next/link';

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const team = getSeleccionBySlug(params.slug);
  if (!team) return { title: 'Selección no encontrada | ZonaMundial' };
  return {
    title: `${team.nombre} — Mundial 2026 | ZonaMundial`,
    description: `Todo sobre ${team.nombre} en el Mundial 2026`,
  };
}

// Degradados personalizados por país basados en sus banderas
const getFlagGradient = (slug: string): string => {
  const gradients: Record<string, string> = {
    // AFC (Asia)
    'qatar': 'from-[#8D1B3D] via-[#5C0D2E] to-[#2D0615]', // Granate Qatar
    'japon': 'from-[#BC002D] via-[#8B001F] to-[#1D1D1D]', // Rojo Japón
    'corea-del-sur': 'from-[#C60C30] via-[#003478] to-[#000000]', // Rojo-Azul-Corea
    'iran': 'from-[#239F40] via-[#FFFFFF] to-[#DA0000]', // Verde-Blanco-Rojo
    'australia': 'from-[#012169] via-[#FFFFFF] to-[#E4002B]', // Azul-Rojo
    'arabia-saudita': 'from-[#006C35] via-[#005C2D] to-[#003D1F]', // Verde Arabia
    
    // CONMEBOL
    'argentina': 'from-[#75AADB] via-[#FFFFFF] to-[#F6B40E]', // Celeste-Blanco-Oro
    'brasil': 'from-[#009739] via-[#FEDD00] to-[#002776]', // Verde-Amarillo-Azul
    'uruguay': 'from-[#0038A8] via-[#FFFFFF] to-[#FCD116]', // Azul-Blanco-Amarillo
    'colombia': 'from-[#FCD116] via-[#003893] to-[#CE1126]', // Amarillo-Azul-Rojo
    
    // UEFA
    'espana': 'from-[#AA151B] via-[#F1BF00] to-[#AA151B]', // Rojo-Amarillo-Rojo
    'francia': 'from-[#002395] via-[#FFFFFF] to-[#ED2939]', // Azul-Blanco-Rojo
    'alemania': 'from-[#000000] via-[#DD0000] to-[#FFCE00]', // Negro-Rojo-Oro
    'italia': 'from-[#009246] via-[#FFFFFF] to-[#CE2B37]', // Verde-Blanco-Rojo
    'inglaterra': 'from-[#FFFFFF] via-[#CF081F] to-[#00247D]', // Blanco-Rojo-Azul
    'portugal': 'from-[#006600] via-[#FF0000] to-[#006600]', // Verde-Rojo
    'paises-bajos': 'from-[#AE1C28] via-[#FFFFFF] to-[#21468B]', // Rojo-Blanco-Azul
    
    // CONCACAF
    'mexico': 'from-[#006847] via-[#FFFFFF] to-[#CE1126]', // Verde-Blanco-Rojo
    'estados-unidos': 'from-[#B22234] via-[#FFFFFF] to-[#3C3B6E]', // Rojo-Blanco-Azul
    'canada': 'from-[#FF0000] via-[#FFFFFF] to-[#FF0000]', // Rojo-Blanco-Rojo
    
    // CAF
    'marruecos': 'from-[#C1272D] via-[#006233] to-[#C1272D]', // Rojo-Verde
    'senegal': 'from-[#00853F] via-[#FDEF42] to-[#E31B23]', // Verde-Amarillo-Rojo
    'sudafrica': 'from-[#007749] via-[#FFB81C] to-[#DE3831]', // Verde-Amarillo-Rojo
    'egipto': 'from-[#CE1126] via-[#FFFFFF] to-[#000000]', // Rojo-Blanco-Negro
    
    // Por defecto según confederación
    'default': ''
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

export default function SeleccionPage({ params }: { params: { slug: string } }) {
  const team = getSeleccionBySlug(params.slug);
  if (!team) notFound();

  const companeros = getSeleccionesByGrupo(team.grupo).filter(t => t.slug !== team.slug);
  const style = getConfederacionStyle(team.confederacion);
  const flagGradient = getFlagGradient(team.slug);
  const teamAny = team as any;

  // Extraer colores del gradient de la bandera para la barra superior
  const getBarGradient = () => {
    if (flagGradient) {
      // Usar el gradient de la bandera para la barra
      return flagGradient;
    }
    // Si no hay gradient específico, usar dorado (color marca)
    return 'from-[#c9a84c] via-[#e8d48b] to-[#c9a84c]';
  };

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Barra superior con color de la bandera */}
      <div className={`h-2 bg-gradient-to-r ${getBarGradient()}`} />
      
      {/* Background con degradado de la bandera */}
      {flagGradient && (
        <div className="fixed inset-0 pointer-events-none">
          {/* Degradado principal */}
          <div className={`absolute inset-0 bg-gradient-to-br ${flagGradient} opacity-[0.08]`} />
          {/* Glow superior */}
          <div className={`absolute top-0 left-1/4 w-[1000px] h-[600px] bg-gradient-to-br ${flagGradient} opacity-[0.05] blur-[120px] rounded-full`} />
          {/* Glow inferior */}
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
            Volver
          </Link>
          
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-gray-500 hover:text-white transition-colors">Inicio</Link>
            <span className="text-gray-700">/</span>
            <Link href="/selecciones" className="text-gray-500 hover:text-white transition-colors">Selecciones</Link>
            <span className="text-gray-700">/</span>
            <span className="text-white font-medium">{team.nombre}</span>
          </nav>
        </div>

        {/* HEADER PRINCIPAL */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 mb-12">
          {/* Bandera */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src={`https://flagcdn.com/w640/${team.flagCode}.png`}
                alt={team.nombre}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-white/5 to-transparent rounded-3xl -z-10 blur-2xl" />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {team.esAnfitrion && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                  🏟️ ANFITRIÓN 2026
                </span>
              )}
              <span className={`px-3 py-1 bg-white/5 text-xs font-bold rounded-full border border-white/10 ${style.text}`}>
                {team.confederacion}
              </span>
              <Link 
                href={`/grupos/grupo-${team.grupo.toLowerCase()}`}
                className="px-3 py-1 bg-white/5 text-gray-400 text-xs font-bold rounded-full border border-white/10 hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] hover:border-[#c9a84c]/30 transition-all"
              >
                GRUPO {team.grupo}
              </Link>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
              {team.nombre}
            </h1>

            <div className="flex items-center gap-6 text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-sm">Ranking FIFA</span>
                <span className="text-2xl font-bold text-white">#{team.rankingFIFA || 'TBD'}</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-sm">Mundiales</span>
                <span className="text-2xl font-bold text-white">{team.mundiales}</span>
              </div>
              {team.mejorResultado.includes('Campeón') && (
                <>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">🏆</span>
                    <span className="text-amber-400 font-bold">{team.mejorResultado.match(/\d+/)?.[0] || '1'} títulos</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-gray-500 text-sm mb-1">Participaciones</div>
            <div className="text-4xl font-black text-white">{team.mundiales}</div>
            <div className="text-xs text-gray-600 mt-1">Mundiales jugados</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-gray-500 text-sm mb-1">Títulos</div>
            <div className={`text-4xl font-black ${team.mejorResultado.includes('Campeón') ? 'text-amber-400' : 'text-white'}`}>
              {team.mejorResultado.includes('Campeón') ? (team.mejorResultado.match(/\d+/)?.[0] || '1') : '0'}
            </div>
            <div className="text-xs text-gray-600 mt-1">Copas del mundo</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-gray-500 text-sm mb-1">Mejor resultado</div>
            <div className="text-xl font-bold text-white leading-tight">{team.mejorResultado}</div>
            <div className="text-xs text-gray-600 mt-1">Histórico</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-gray-500 text-sm mb-1">Confederación</div>
            <div className={`text-2xl font-bold ${style.text}`}>{team.confederacion}</div>
            <div className="text-xs text-gray-600 mt-1">{['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'].indexOf(team.confederacion) + 1} de 6</div>
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
                <h2 className="text-xl font-bold text-white">Historia en el Mundial</h2>
              </div>
              <p className="text-gray-400 leading-relaxed text-lg">
                {teamAny.historia || `${team.nombre} se prepara para su participación en el Mundial 2026. ${team.mundiales > 0 ? `Esta será su ${team.mundiales + 1}ª aparición en la historia de los mundiales.` : 'Será su primera experiencia en una Copa del Mundo.'}`}
              </p>
              {teamAny.datosClave && (
                <div className="mt-6 p-5 rounded-2xl bg-[#c9a84c]/5 border border-[#c9a84c]/20">
                  <p className="text-[#c9a84c]">💡 {teamAny.datosClave}</p>
                </div>
              )}
            </section>

            {/* Clasificación */}
            <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">🎯</div>
                <h2 className="text-xl font-bold text-white">Cómo se clasificó</h2>
              </div>
              <p className="text-gray-400 leading-relaxed">
                {teamAny.clasificacion || `${team.nombre} ${team.esAnfitrion ? 'se clasificó automáticamente como uno de los países anfitriones del Mundial 2026' : `obtuvo su plaza para el Mundial 2026 a través del proceso clasificatorio de ${team.confederacion}`}.`}
              </p>
            </section>

            {/* Jugadores Clave */}
            {teamAny.jugadoresClave && teamAny.jugadoresClave.length > 0 && (
              <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">⭐</div>
                  <h2 className="text-xl font-bold text-white">Jugadores a seguir</h2>
                </div>
                <div className="space-y-4">
                  {teamAny.jugadoresClave.map((j: any) => (
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
                        <p className="text-xs text-gray-600">Goles</p>
                      </div>
                      <div className="text-right px-4 border-l border-white/10">
                        <p className="text-xl font-bold text-white">{j.internacionalidades}</p>
                        <p className="text-xs text-gray-600">Partidos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sponsor */}
            <div className="h-32 rounded-3xl bg-white/[0.02] border border-white/10 flex items-center justify-center">
              <span className="text-gray-600">Espacio publicitario</span>
            </div>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="space-y-6">
            {/* Grupo */}
            <section className="p-6 rounded-3xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Grupo {team.grupo}</h3>
                <Link href={`/grupos/grupo-${team.grupo.toLowerCase()}`} className="text-sm text-[#c9a84c] hover:underline">
                  Ver grupo
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
                    <img src={`https://flagcdn.com/w40/${t.flagCode}.png`} alt="" className="w-8 h-6 object-cover rounded" />
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
              <h3 className="text-lg font-bold text-white mb-4">¿Hasta dónde llegará?</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Fase de grupos', 'Octavos', 'Cuartos', 'Semis', 'Final', 'Campeón'].map((f) => (
                  <button key={f} className="py-3 px-2 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] transition-colors border border-white/5 hover:border-[#c9a84c]/30">
                    {f}
                  </button>
                ))}
              </div>
            </section>

            {/* Links */}
            <section className="p-6 rounded-3xl bg-white/[0.02] border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Enlaces útiles</h3>
              <div className="space-y-2">
                {[
                  { label: '📋 Todas las selecciones', href: '/selecciones' },
                  { label: '📅 Calendario', href: '/calendario' },
                  { label: '🏟️ Sedes del Mundial', href: '/sedes' },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 border border-[#c9a84c]/20">
              <h3 className="font-bold text-white mb-2">Predice los resultados</h3>
              <p className="text-sm text-gray-400 mb-4">Compite con tus amigos en ZonaMundial</p>
              <Link href="/registro" className="block w-full py-3 bg-[#c9a84c] text-black font-bold rounded-xl text-center hover:bg-[#e8d48b] transition-colors">
                Registrarse gratis
              </Link>
            </div>

            {/* Sponsor */}
            <div className="h-40 rounded-3xl bg-white/[0.02] border border-white/10 flex items-center justify-center">
              <span className="text-gray-600 text-sm">Publicidad</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

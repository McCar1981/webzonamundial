// src/app/datos/formato-2026/page.tsx
// ZonaMundial.app — Explicación del formato 48 equipos
// Keyword target: "formato mundial 2026", "48 equipos mundial", "mejores terceros mundial"

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Formato del Torneo 2026: 48 Equipos, 12 Grupos, 104 Partidos Explicados | ZonaMundial',
  description: 'Cómo funciona el nuevo formato de 48 equipos del torneo 2026: 12 grupos de 4, mejores terceros, dieciseisavos de final, y el camino a la final. Todo explicado paso a paso.',
  keywords: ['formato mundial 2026', '48 equipos mundial 2026', 'mejores terceros mundial', 'dieciseisavos de final mundial', 'cómo funciona mundial 2026', 'nuevo formato copa del mundo'],
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
};

export default function Formato2026() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: '¿Cuántos equipos participan en el torneo 2026?', acceptedAnswer: { '@type': 'Answer', text: '48 equipos, divididos en 12 grupos de 4. Es la primera vez que se expande de 32 a 48 equipos.' }},
          { '@type': 'Question', name: '¿Cómo funcionan los mejores terceros?', acceptedAnswer: { '@type': 'Answer', text: 'Los 8 mejores terceros de los 12 grupos clasifican a la ronda de 32. Se comparan por puntos, diferencia de goles, goles a favor y ranking FIFA.' }},
          { '@type': 'Question', name: '¿Cuántos partidos tiene el torneo 2026?', acceptedAnswer: { '@type': 'Answer', text: '104 partidos en total: 72 en fase de grupos y 32 en fase eliminatoria. El torneo dura 39 días.' }},
        ],
      })}} />

      <nav className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/datos" className="hover:text-[#C9A84C]">Datos</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Formato 2026</li>
        </ol>
      </nav>

      <header className="mb-6 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3">
          El Nuevo Formato 2026
        </h1>
        <p className="text-base sm:text-lg text-gray-300">
          Por primera vez en la historia, 48 selecciones compiten en 12 grupos. Así funciona.
        </p>
      </header>

      {/* KEY NUMBERS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {[
          { n: '48', label: 'Equipos', sub: '+16 vs 2022' },
          { n: '12', label: 'Grupos', sub: 'de 4 equipos' },
          { n: '104', label: 'Partidos', sub: '+40 vs 2022' },
          { n: '39', label: 'Días', sub: '11 jun — 19 jul' },
        ].map(d => (
          <div key={d.label} className="p-4 sm:p-5 rounded-xl border border-[#1E293B]"
            style={{ background: 'rgba(15,23,42,0.5)' }}>
            <div className="text-2xl sm:text-3xl font-black text-[#C9A84C]">{d.n}</div>
            <div className="text-sm font-bold text-white mt-1">{d.label}</div>
            <div className="text-[10px] sm:text-xs text-gray-500">{d.sub}</div>
          </div>
        ))}
      </div>

      {/* PHASE 1: GROUPS */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl font-black"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8893D)', color: '#030712' }}>1</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Fase de Grupos</h2>
        </div>
        <div className="p-4 sm:p-6 rounded-xl border border-[#1E293B]" style={{ background: 'rgba(15,23,42,0.5)' }}>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4">
            48 selecciones se dividen en 12 grupos de 4 equipos (Grupo A al Grupo L). Cada equipo juega 3 partidos: uno contra cada rival de su grupo. Los partidos se juegan del 11 al 28 de junio de 2026.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#0F172A] border border-[#22C55E33]">
              <span className="text-xs font-bold text-[#22C55E]">✅ CLASIFICAN DIRECTO</span>
              <p className="text-sm text-gray-300 mt-1">Los 2 primeros de cada grupo (24 equipos)</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0F172A] border border-[#FBBF2433]">
              <span className="text-xs font-bold text-[#FBBF24]">⚡ POSIBLE CLASIFICACIÓN</span>
              <p className="text-sm text-gray-300 mt-1">Los 8 mejores terceros de los 12 grupos</p>
            </div>
          </div>
        </div>
      </section>

      {/* PHASE 2: BEST THIRD */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl font-black"
            style={{ background: 'linear-gradient(135deg, #FBBF24, #D97706)', color: '#030712' }}>2</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Mejores Terceros</h2>
        </div>
        <div className="p-4 sm:p-6 rounded-xl border border-[#1E293B]" style={{ background: 'rgba(15,23,42,0.5)' }}>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4">
            De los 12 terceros, se clasifican los 8 mejores. Se comparan entre sí usando estos criterios en orden:
          </p>
          <div className="space-y-2">
            {[
              { n: '1', text: 'Puntos obtenidos', desc: '3 por victoria, 1 por empate' },
              { n: '2', text: 'Diferencia de goles', desc: 'Goles a favor menos goles en contra' },
              { n: '3', text: 'Goles a favor', desc: 'Total de goles marcados' },
              { n: '4', text: 'Conducta deportiva', desc: 'Tarjetas amarillas y rojas' },
              { n: '5', text: 'Ranking FIFA', desc: 'Último recurso si todo lo anterior es igual' },
            ].map(c => (
              <div key={c.n} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-[#0F172A]">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black bg-[#FBBF2422] text-[#FBBF24] flex-shrink-0">{c.n}</span>
                <div>
                  <span className="text-sm font-bold text-white">{c.text}</span>
                  <span className="text-xs text-gray-500 ml-2">{c.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg border-l-4 border-[#C9A84C]" style={{ background: 'rgba(201,168,76,0.06)' }}>
            <p className="text-xs sm:text-sm text-[#C9A84C] font-semibold">
              💡 Esto significa que un equipo puede quedar tercero con 4 puntos y clasificar, mientras que otro con 3 puntos queda eliminado. Cada gol cuenta.
            </p>
          </div>
        </div>
      </section>

      {/* PHASE 3: KNOCKOUT */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl font-black"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#030712' }}>3</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Fase Eliminatoria</h2>
        </div>
        <div className="p-4 sm:p-6 rounded-xl border border-[#1E293B]" style={{ background: 'rgba(15,23,42,0.5)' }}>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4">
            32 equipos pasan a las eliminatorias. El formato añade una ronda nueva que no existía antes: los dieciseisavos de final.
          </p>
          <div className="space-y-2 sm:space-y-3">
            {[
              { fase: 'Dieciseisavos', equipos: 32, partidos: 16, fechas: '28 jun — 2 jul', nota: 'NUEVA RONDA' },
              { fase: 'Octavos de final', equipos: 16, partidos: 8, fechas: '3 — 6 jul' },
              { fase: 'Cuartos de final', equipos: 8, partidos: 4, fechas: '9 — 12 jul' },
              { fase: 'Semifinales', equipos: 4, partidos: 2, fechas: '14 — 15 jul', nota: 'Atlanta y Dallas' },
              { fase: 'Tercer puesto', equipos: 2, partidos: 1, fechas: '18 jul', nota: 'Miami' },
              { fase: 'FINAL', equipos: 2, partidos: 1, fechas: '19 jul', nota: 'Nueva York' },
            ].map(f => (
              <div key={f.fase} className={`flex items-center justify-between p-3 rounded-lg ${f.fase === 'FINAL' ? 'border border-[#C9A84C44]' : 'bg-[#0F172A]'}`}
                style={f.fase === 'FINAL' ? { background: 'linear-gradient(135deg, rgba(201,168,76,0.1), transparent)' } : {}}>
                <div className="flex items-center gap-3">
                  <div className="text-sm sm:text-base font-bold text-white">{f.fase}</div>
                  {f.nota && (
                    <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${f.fase === 'FINAL' ? 'bg-[#C9A84C22] text-[#C9A84C]' : f.nota === 'NUEVA RONDA' ? 'bg-[#22C55E22] text-[#22C55E]' : 'bg-[#0F172A] text-gray-500'}`}>
                      {f.nota}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">{f.fechas}</div>
                  <div className="text-[10px] text-gray-500">{f.partidos} {f.partidos === 1 ? 'partido' : 'partidos'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KEY CHANGES */}
      <section className="mb-8 sm:mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">¿Qué cambia respecto a 2022?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { before: '32 equipos', after: '48 equipos', label: '+16 selecciones' },
            { before: '8 grupos', after: '12 grupos', label: '+4 grupos' },
            { before: '64 partidos', after: '104 partidos', label: '+40 partidos' },
            { before: '32 días', after: '39 días', label: '+7 días' },
            { before: '7 partidos al campeón', after: '8 partidos al campeón', label: '+1 ronda nueva' },
            { before: '6 confederaciones (OFC sin plaza fija)', after: '6 conf. (OFC con plaza garantizada)', label: 'Primera vez para Oceanía' },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-3 p-3 rounded-lg bg-[#0F172A] border border-[#1E293B]">
              <div className="text-right flex-1">
                <div className="text-xs text-gray-500 line-through">{c.before}</div>
              </div>
              <div className="text-[#C9A84C] font-black text-lg">→</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{c.after}</div>
                <div className="text-[10px] text-[#C9A84C]">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BRACKET SEPARATION */}
      <section className="mb-8 sm:mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Sistema de Brackets Separados</h2>
        <div className="p-4 sm:p-6 rounded-xl border border-[#1E293B]" style={{ background: 'rgba(15,23,42,0.5)' }}>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-3">
            Por primera vez, el cuadro de eliminatorias se divide en dos caminos separados, asegurando que los 4 mejores equipos del ranking (España, Argentina, Francia e Inglaterra) no se enfrenten hasta las semifinales si ganan sus grupos.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#0F172A]">
              <div className="text-xs font-bold text-[#C9A84C] mb-2">CAMINO 1</div>
              <p className="text-xs text-gray-400">España (#1) y Argentina (#2) están en este camino. Solo pueden encontrarse en la final.</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0F172A]">
              <div className="text-xs font-bold text-[#C9A84C] mb-2">CAMINO 2</div>
              <p className="text-xs text-gray-400">Francia (#3) e Inglaterra (#4) están en este camino. Solo pueden encontrarse en la final.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center p-5 sm:p-7 rounded-2xl border border-[#C9A84C22] mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(15,23,42,0.3))' }}>
        <p className="text-[#C9A84C] text-sm font-semibold mb-3">¿Listo para predecir los 104 partidos?</p>
        <Link href="/registro"
          className="inline-block px-7 py-3 rounded-xl text-[#030712] font-extrabold text-sm no-underline"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #A8893D)', boxShadow: '0 4px 24px rgba(201,168,76,0.3)' }}>
          Regístrate Gratis
        </Link>
      </div>

      {/* Internal links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Link href="/grupos" className="p-3 bg-[#0B1825] border border-[#1a2a3f] rounded-lg text-gray-300 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all text-xs no-underline">📊 12 grupos</Link>
        <Link href="/selecciones" className="p-3 bg-[#0B1825] border border-[#1a2a3f] rounded-lg text-gray-300 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all text-xs no-underline">📋 48 selecciones</Link>
        <Link href="/calendario" className="p-3 bg-[#0B1825] border border-[#1a2a3f] rounded-lg text-gray-300 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all text-xs no-underline">📅 Calendario</Link>
      </div>
    </>
  );
}

'use client';

import { useLanguage } from '@/i18n/LanguageContext';

const CURIOSIDADES = [
  {
    conf: 'UEFA',
    icon: 'ball',
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    textES: 'UEFA cuenta con 16 plazas, el mayor número de representantes europeos en la historia del torneo.',
    textEN: 'UEFA has 16 spots, the highest number of European representatives in tournament history.',
  },
  {
    conf: 'CONMEBOL',
    icon: 'americas',
    color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20',
    textES: 'CONMEBOL aporta 6 equipos directos más 1 repescante, dando a Sudamérica una presencia histórica.',
    textEN: 'CONMEBOL contributes 6 direct teams plus 1 playoff, giving South America a historic presence.',
  },
  {
    conf: 'CONCACAF',
    icon: 'star',
    color: 'from-red-500/20 to-red-600/10 border-red-500/20',
    textES: 'CONCACAF tiene 6 plazas, incluyendo a los 3 anfitriones (México, EE.UU. y Canadá).',
    textEN: 'CONCACAF has 6 spots, including the 3 hosts (Mexico, USA, and Canada).',
  },
  {
    conf: 'CAF',
    icon: 'africa',
    color: 'from-green-500/20 to-green-600/10 border-green-500/20',
    textES: 'África estará representada por 9 selecciones, consolidando el crecimiento del fútbol africano.',
    textEN: 'Africa will be represented by 9 teams, consolidating the growth of African football.',
  },
  {
    conf: 'AFC',
    icon: 'asia',
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
    textES: 'Asia aporta 8 selecciones, el mayor contingente asiático hasta la fecha.',
    textEN: 'Asia contributes 8 teams, the largest Asian contingent to date.',
  },
  {
    conf: 'OFC',
    icon: 'ocean',
    color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
    textES: 'OFC tendrá una plaza garantizada por primera vez en la historia de la Copa del Mundo.',
    textEN: 'OFC will have a guaranteed spot for the first time in World Cup history.',
  },
];

export function CuriosidadesSection() {
  const { t, locale } = useLanguage();
  const sT = t.selecciones;

  return (
    <section className="mb-16">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-emerald-600/5">
          <span className="text-xl"></span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white md:text-3xl">{sT.curiosidadesTitle}</h2>
          <p className="text-sm text-[#6a7a9a]">{sT.curiosidadesSub}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CURIOSIDADES.map((item) => (
          <div
            key={item.conf}
            className={`rounded-2xl border bg-gradient-to-br ${item.color} p-5 transition hover:-translate-y-0.5 hover:shadow-lg`}
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <h3 className="text-lg font-bold text-white">{item.conf}</h3>
            </div>
            <p className="text-sm leading-relaxed text-[#94a3b8]">
              {locale === 'en' ? item.textEN : item.textES}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { MOMENTS_ES, MOMENTS_EN, getAllMomentSlugs } from '@/data/momentos-iconicos';

export default function MomentoSlugClient({ slug }: { slug: string }) {
  const { t } = useLanguage();
  const nav = t.nav;
  const isEN = nav.inicio === 'Home';
  const moments = isEN ? MOMENTS_EN : MOMENTS_ES;
  const moment = moments.find((m) => m.id === slug);

  if (!moment) return null;

  const allSlugs = getAllMomentSlugs();
  const currentIndex = allSlugs.indexOf(slug);
  const prevSlug = currentIndex > 0 ? allSlugs[currentIndex - 1] : null;
  const nextSlug = currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null;
  const prevMoment = prevSlug ? moments.find((m) => m.id === prevSlug) : null;
  const nextMoment = nextSlug ? moments.find((m) => m.id === nextSlug) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-0 pb-10 sm:pb-16">
      {/* Breadcrumb */}
      <nav className="text-xs sm:text-sm text-gray-400 mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">{nav.inicio}</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">{nav.historia}</Link></li>
          <li>/</li>
          <li><Link href="/historia/momentos-iconicos" className="hover:text-[#C9A84C]">{isEN ? 'Iconic Moments' : 'Momentos Icónicos'}</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">{moment.title.split(' — ')[0]}</li>
        </ol>
      </nav>

      {/* === CINEMATIC HERO === */}
      <div className="relative rounded-3xl overflow-hidden mb-10 sm:mb-14">
        {/* Flag background - full bleed */}
        <img
          src={`https://flagcdn.com/w1280/${moment.flag}.png`}
          alt=""
          role="presentation"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[4px] scale-125"
        />
        {/* Multiple overlay layers for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/80 to-[#060B14]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060B14]/60 to-transparent" />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 20%, ${moment.color}18 0%, transparent 60%)` }} />
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${moment.color}, ${moment.color}80, transparent)` }} />
        {/* Glow effect */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full blur-[120px] opacity-20" style={{ background: moment.color }} />

        <div className="relative z-10 px-6 sm:px-10 md:px-14 pt-14 sm:pt-20 md:pt-28 pb-10 sm:pb-14 md:pb-20">
          {/* Year badge + flag */}
          <div className="flex items-center gap-4 mb-6">
            <span
              className="text-lg sm:text-xl font-black px-4 py-1.5 rounded-full border-2 backdrop-blur-md"
              style={{ color: moment.color, borderColor: `${moment.color}50`, background: `${moment.color}12` }}
            >
              {moment.year}
            </span>
            <img
              src={`https://flagcdn.com/w80/${moment.flag}.png`}
              alt={moment.country}
              className="w-12 h-8 rounded-md object-cover border border-white/20 shadow-xl"
            />
            <span className="text-base text-gray-300 font-semibold tracking-wide">{moment.country}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-2xl mb-4 leading-[1.05] max-w-3xl">
            {moment.title}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-medium max-w-2xl leading-relaxed" style={{ color: `${moment.color}cc` }}>
            {moment.subtitle}
          </p>

          {/* Quick stats inline */}
          {moment.score && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-8 pt-6 border-t border-white/10">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">{isEN ? 'Result' : 'Resultado'}</p>
                <p className="text-base sm:text-lg font-black text-white">{moment.score}</p>
              </div>
              {moment.venue && (
                <>
                  <div className="w-px h-8 bg-white/10 hidden sm:block" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">{isEN ? 'Stadium' : 'Estadio'}</p>
                    <p className="text-sm sm:text-base font-bold text-gray-200">{moment.venue}</p>
                  </div>
                </>
              )}
              {moment.date && (
                <>
                  <div className="w-px h-8 bg-white/10 hidden sm:block" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">{isEN ? 'Date' : 'Fecha'}</p>
                    <p className="text-sm sm:text-base font-bold text-gray-200">{moment.date}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === STORY SECTION === */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-5 sm:left-8 top-0 bottom-0 w-px hidden md:block" style={{ background: `linear-gradient(to bottom, ${moment.color}40, ${moment.color}10, transparent)` }} />

        <div className="space-y-10 sm:space-y-14 md:pl-20">
          {/* The Story */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${moment.color}15`, borderColor: `${moment.color}30` }}>
                <svg className="w-5 h-5" style={{ color: moment.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{isEN ? 'The Story' : 'La Historia'}</h2>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0F1D32]/90 to-[#0B1220]/90 p-6 sm:p-8 md:p-10">
              <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-[1.8]">
                <span className="text-4xl font-black float-left mr-3 mt-1 leading-none" style={{ color: moment.color }}>{moment.description.charAt(0)}</span>
                {moment.description.slice(1)}
              </p>
            </div>
          </section>

          {/* Key Facts - numbered */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${moment.color}15`, borderColor: `${moment.color}30` }}>
                <svg className="w-5 h-5" style={{ color: moment.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{isEN ? 'Key Facts' : 'Datos Clave'}</h2>
            </div>
            <div className="space-y-3">
              {moment.details.map((detail, i) => (
                <div
                  key={i}
                  className="group flex items-start gap-4 p-4 sm:p-5 rounded-2xl border border-white/[0.04] bg-[#0F1D32]/60 hover:bg-[#0F1D32]/90 hover:border-white/10 transition-all duration-300"
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border transition-colors duration-300"
                    style={{
                      color: moment.color,
                      borderColor: `${moment.color}25`,
                      background: `${moment.color}08`,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Protagonists */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${moment.color}15`, borderColor: `${moment.color}30` }}>
                <svg className="w-5 h-5" style={{ color: moment.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{isEN ? 'Protagonists' : 'Protagonistas'}</h2>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0F1D32]/90 to-[#0B1220]/90 p-6 sm:p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {moment.protagonists.map((name, i) => (
                  <div
                    key={i}
                    className="relative p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/15 transition-all duration-300 group overflow-hidden"
                  >
                    {/* Subtle glow on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle at center, ${moment.color}08, transparent)` }} />
                    <div className="relative">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black mb-3 border" style={{ color: moment.color, borderColor: `${moment.color}25`, background: `${moment.color}10` }}>
                        {name.charAt(0)}
                      </div>
                      <p className="text-sm font-bold text-white leading-snug">{name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* === NAVIGATION === */}
      <div className="mt-14 sm:mt-20 pt-8 border-t border-white/[0.06]">
        <p className="text-xs uppercase tracking-widest text-gray-600 mb-4 text-center">{isEN ? 'Continue exploring' : 'Sigue explorando'}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevMoment ? (
            <Link
              href={`/historia/momentos-iconicos/${prevSlug}`}
              className="group relative flex items-center gap-4 p-5 rounded-2xl border border-white/[0.06] bg-[#0F1D32]/60 hover:bg-[#0F1D32]/90 hover:border-white/15 transition-all duration-300 overflow-hidden"
            >
              <img
                src={`https://flagcdn.com/w320/${prevMoment.flag}.png`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 blur-sm scale-150"
              />
              <div className="relative flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.03] group-hover:border-[#C9A84C]/30 transition-colors flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-[#C9A84C] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{isEN ? 'Previous' : 'Anterior'}</p>
                  <p className="text-sm font-bold text-white truncate group-hover:text-[#C9A84C] transition-colors">{prevMoment.title.split(' — ')[0]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{prevMoment.year} · {prevMoment.country}</p>
                </div>
              </div>
            </Link>
          ) : <div />}
          {nextMoment ? (
            <Link
              href={`/historia/momentos-iconicos/${nextSlug}`}
              className="group relative flex items-center justify-end gap-4 p-5 rounded-2xl border border-white/[0.06] bg-[#0F1D32]/60 hover:bg-[#0F1D32]/90 hover:border-white/15 transition-all duration-300 overflow-hidden text-right"
            >
              <img
                src={`https://flagcdn.com/w320/${nextMoment.flag}.png`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 blur-sm scale-150"
              />
              <div className="relative flex items-center gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{isEN ? 'Next' : 'Siguiente'}</p>
                  <p className="text-sm font-bold text-white truncate group-hover:text-[#C9A84C] transition-colors">{nextMoment.title.split(' — ')[0]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{nextMoment.year} · {nextMoment.country}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.03] group-hover:border-[#C9A84C]/30 transition-colors flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-[#C9A84C] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ) : <div />}
        </div>

        {/* Back to all */}
        <div className="mt-8 text-center">
          <Link
            href="/historia/momentos-iconicos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/5 text-sm font-bold text-[#C9A84C] hover:bg-[#C9A84C]/15 hover:border-[#C9A84C]/40 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            {isEN ? 'See all iconic moments' : 'Ver todos los momentos icónicos'}
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { IconicMoment, MOMENTS_ES, MOMENTS_EN } from '@/data/momentos-iconicos';

function MomentCard({
  moment,
  isActive,
  onClick,
}: {
  moment: IconicMoment;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left rounded-2xl border overflow-hidden transition-all duration-300 ${
        isActive
          ? 'border-white/20 scale-[1.02] shadow-lg'
          : 'border-white/5 hover:border-white/15 hover:-translate-y-1'
      }`}
      style={isActive ? { boxShadow: `0 0 24px ${moment.color}20` } : undefined}
    >
      {/* Flag background */}
      <img
        src={`https://flagcdn.com/w640/${moment.flag}.png`}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 blur-[2px] ${
          isActive ? 'opacity-30 scale-110' : 'opacity-20 group-hover:opacity-30 group-hover:scale-110'
        }`}
        loading="lazy"
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/70 to-transparent" />
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${moment.color}20 0%, transparent 60%)` }} />
      <div
        className="absolute top-0 left-0 right-0 transition-all duration-300"
        style={{
          height: isActive ? 3 : 2,
          background: `linear-gradient(90deg, ${moment.color}, ${moment.color}60)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-end h-36 sm:h-44">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <span
            className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm"
            style={{ color: moment.color }}
          >
            {moment.year}
          </span>
          <img
            src={`https://flagcdn.com/w40/${moment.flag}.png`}
            alt={moment.country}
            className="w-6 h-4 sm:w-7 sm:h-5 rounded-sm object-cover border border-white/20 shadow-lg"
          />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-white mb-1 drop-shadow-lg line-clamp-1">
          {moment.title.split(' — ')[0]}
        </h3>
        <p className="text-[11px] sm:text-xs text-gray-300 drop-shadow-md line-clamp-2">
          {moment.subtitle}
        </p>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full animate-pulse" style={{ background: moment.color }} />
      )}
    </button>
  );
}

function MomentDetail({ moment, isEN }: { moment: IconicMoment; isEN: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#0B0F1A' }}>
      {/* Hero header */}
      <div className="relative overflow-hidden">
        <img
          src={`https://flagcdn.com/w1280/${moment.flag}.png`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-25 blur-[3px] scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/60 to-[#0B0F1A]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F1A]/50 to-transparent" />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 80% 20%, ${moment.color}15 0%, transparent 60%)` }} />
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: moment.color }} />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 pt-8 sm:pt-10 md:pt-14 pb-6 sm:pb-8 md:pb-10">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-sm font-black px-3 py-1 rounded-full border backdrop-blur-sm"
              style={{ color: moment.color, borderColor: `${moment.color}40`, background: `${moment.color}15` }}
            >
              {moment.year}
            </span>
            <img
              src={`https://flagcdn.com/w80/${moment.flag}.png`}
              alt={moment.country}
              className="w-10 h-7 rounded object-cover border border-white/20 shadow-lg"
            />
            <span className="text-sm text-gray-300 font-medium">{moment.country}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-lg mb-2">{moment.title}</h2>
          <p className="text-sm sm:text-base md:text-lg font-medium drop-shadow-md" style={{ color: `${moment.color}cc` }}>{moment.subtitle}</p>

          {/* Quick stats inline */}
          {moment.score && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-6 pt-5 border-t border-white/10">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">{isEN ? 'Result' : 'Resultado'}</p>
                <p className="text-sm sm:text-base font-black text-white">{moment.score}</p>
              </div>
              {moment.venue && (
                <>
                  <div className="w-px h-7 bg-white/10 hidden sm:block" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">{isEN ? 'Stadium' : 'Estadio'}</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-200">{moment.venue}</p>
                  </div>
                </>
              )}
              {moment.date && (
                <>
                  <div className="w-px h-7 bg-white/10 hidden sm:block" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">{isEN ? 'Date' : 'Fecha'}</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-200">{moment.date}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8 md:p-10 space-y-8">
        {/* Description */}
        <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-[1.8]">
          <span className="text-3xl font-black float-left mr-3 mt-1 leading-none" style={{ color: moment.color }}>{moment.description.charAt(0)}</span>
          {moment.description.slice(1)}
        </p>

        {/* Details — numbered */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: moment.color }} />
            {isEN ? 'Key Facts' : 'Datos clave'}
          </h3>
          <div className="space-y-2.5">
            {moment.details.map((detail, i) => (
              <div key={i} className="flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/10 transition-all">
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border"
                  style={{ color: moment.color, borderColor: `${moment.color}25`, background: `${moment.color}08` }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-sm text-gray-400 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Protagonists */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: moment.color }} />
            {isEN ? 'Protagonists' : 'Protagonistas'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {moment.protagonists.map((name, i) => (
              <span
                key={i}
                className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border font-medium"
                style={{
                  color: moment.color,
                  borderColor: `${moment.color}30`,
                  background: `${moment.color}10`,
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* CTA to full page */}
        <div className="pt-4 border-t border-white/[0.06]">
          <Link
            href={`/historia/momentos-iconicos/${moment.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-sm transition-all hover:scale-[1.02]"
            style={{
              color: moment.color,
              borderColor: `${moment.color}30`,
              background: `${moment.color}08`,
            }}
          >
            {isEN ? 'Read full story' : 'Leer historia completa'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MomentosIconicosClient() {
  const { t } = useLanguage();
  const nav = t.nav;
  const isEN = nav.inicio === 'Home';
  const moments = isEN ? MOMENTS_EN : MOMENTS_ES;
  const [activeId, setActiveId] = useState(moments[moments.length - 1].id);

  const activeMoment = moments.find((m) => m.id === activeId) || moments[moments.length - 1];

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">{nav.inicio}</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">{nav.historia}</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">{isEN ? 'Iconic Moments' : 'Momentos Icónicos'}</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8 sm:mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 flex items-center justify-center border border-[#C9A84C]/20">
            <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/historia.png" alt="" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              {isEN ? 'Iconic Moments' : 'Momentos Icónicos'}
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              {isEN
                ? '10 moments that defined World Cup history'
                : '10 momentos que definieron la historia de los Mundiales'}
            </p>
          </div>
        </div>
      </header>

      {/* Cards grid — full width, all moments visible */}
      <div className="mb-8 sm:mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {moments.map((moment) => (
            <MomentCard
              key={moment.id}
              moment={moment}
              isActive={activeId === moment.id}
              onClick={() => {
                setActiveId(moment.id);
                setTimeout(() => {
                  const el = document.getElementById('moment-detail');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
            />
          ))}
        </div>
      </div>

      {/* Detail panel — below cards, full width */}
      <div id="moment-detail" className="scroll-mt-20">
        <MomentDetail moment={activeMoment} isEN={isEN} />
      </div>

      {/* Back link */}
      <div className="mt-10 text-center">
        <Link
          href="/historia"
          className="inline-flex items-center gap-2 text-sm text-[#C9A84C] hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {isEN ? 'Back to History' : 'Volver a Historia'}
        </Link>
      </div>
    </>
  );
}

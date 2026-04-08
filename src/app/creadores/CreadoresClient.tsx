"use client";

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Creador } from '@/data/creadores';

interface Props {
  creadores: Creador[];
  total: string;
}

export default function CreadoresClient({ creadores, total }: Props) {
  const { t } = useLanguage();
  const cT = t.creadores;
  const nav = t.nav;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-0 pb-6 sm:pb-8">
      <nav className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
        <ol className="flex gap-2">
          <li><Link href="/" className="hover:text-[#C9A84C]">{nav.inicio}</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">{cT.title}</li>
        </ol>
      </nav>

      <header className="mb-6 sm:mb-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full border border-[#C9A84C33] text-[10px] font-bold text-[#C9A84C] tracking-wider uppercase mb-4"
          style={{ background: 'rgba(201,168,76,0.06)' }}>
          {cT.badge}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3">
          {cT.title}
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
          {creadores.length} {cT.subtitle} <strong className="text-[#C9A84C]">{total} {cT.subtitleFollowers}</strong> {cT.subtitleEnd}
        </p>
      </header>

      {/* Sponsor */}
      <div className="w-full bg-[#0B1825] border border-[#1a2a3f] rounded-lg flex items-center justify-center mb-6 sm:mb-8 py-3"
        data-sponsor-slot="creadores-hero">
        <a href="#" target="_blank" rel="noopener noreferrer">
          <img src="/img/imagenessilviu/ChatGPT Image 8 abr 2026, 04_53_21 p.m..png" alt="Publicidad" className="rounded-lg" style={{maxWidth:"100%",height:"auto"}} />
        </a>
      </div>

      {/* CREATORS GRID — 1 col mobile, 2 tablet, 3 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-8 sm:mb-10">
        {creadores.sort((a, b) => b.seguidoresNum - a.seguidoresNum).map(c => (
          <div key={c.slug}
            className="group rounded-2xl border overflow-hidden transition-all duration-500 hover:-translate-y-2 relative"
            style={{
              borderColor: c.colorPrimario + '20',
              background: `linear-gradient(180deg, ${c.colorPrimario}05 0%, rgba(15,23,42,0.6) 50%, rgba(10,15,30,0.8) 100%)`,
              boxShadow: `0 4px 24px ${c.colorPrimario}08`,
            }}>

            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 0%, ${c.colorPrimario}15 0%, transparent 70%)` }} />

            {/* Top color bar */}
            <div className="h-1 relative z-10" style={{ background: `linear-gradient(90deg, ${c.colorPrimario}, ${c.colorSecundario})` }} />

            <div className="p-6 relative z-10">
              {/* Header with Photo */}
              <div className="flex flex-col items-center mb-5">
                {/* Photo with gradient ring */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full p-[3px] transition-transform duration-500 group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${c.colorPrimario}, ${c.colorSecundario}60)` }}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#0f172a] border-[3px] border-[#0f172a]">
                      <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  {/* Platform badge */}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    style={{ background: c.colorPrimario, border: '2px solid #0f172a' }}>
                    {c.plataformaPrincipal === 'YouTube' && '▶️'}
                    {c.plataformaPrincipal === 'Twitch' && '📺'}
                    {c.plataformaPrincipal === 'TikTok' && '🎵'}
                    {c.plataformaPrincipal === 'Instagram' && '📸'}
                    {c.plataformaPrincipal === 'Twitter' && '🐦'}
                  </div>
                </div>

                {/* Name and Handle */}
                <h2 className="text-xl font-bold text-white mb-1">{c.nombre}</h2>
                <p className="text-sm text-gray-400 mb-2">{c.handle}</p>

                {/* Followers badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: `${c.colorPrimario}15`,
                    color: c.colorPrimario,
                    border: `1px solid ${c.colorPrimario}30`
                  }}>
                  <span>👥</span> {c.seguidores}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-300 mb-3 leading-relaxed text-center">{c.bio}</p>
              <p className="text-xs text-gray-500 mb-5 text-center" style={{ color: `${c.colorPrimario}80` }}>{c.contenido}</p>

              {/* Country */}
              <div className="flex items-center justify-center gap-2 mb-5">
                <img src={`https://flagcdn.com/w20/${c.paisFlag}.png`}
                  className="w-5 h-4 rounded-[2px] object-cover shadow-sm" alt={c.pais} />
                <span className="text-sm text-gray-400">{c.pais}</span>
              </div>

              {/* CTA */}
              <Link href={`/registro/${c.slug}`}
                className="block w-full py-3.5 rounded-xl text-center text-sm font-bold no-underline transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${c.colorPrimario}, ${c.colorSecundario})`,
                  color: '#fff',
                  boxShadow: `0 4px 20px ${c.colorPrimario}40`,
                }}>
                <span className="relative z-10">{cT.joinBtn}</span>
                <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* More creators coming */}
      <div className="text-center p-8 sm:p-10 rounded-2xl border mb-8 relative overflow-hidden"
        style={{
          borderColor: 'rgba(201,168,76,0.15)',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(15,23,42,0.4) 100%)'
        }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, #C9A84C 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))', border: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="text-3xl">🚀</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{cT.moreSoon}</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">{cT.moreSoonDesc}</p>
        </div>
      </div>

      {/* CTA generic */}
      <div className="text-center p-8 sm:p-10 rounded-2xl border mb-6 relative overflow-hidden group"
        style={{
          borderColor: 'rgba(201,168,76,0.25)',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(15,23,42,0.5) 50%, rgba(10,15,30,0.6) 100%)'
        }}>
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.2) 0%, transparent 60%)' }} />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))', border: '1px solid rgba(201,168,76,0.3)' }}>
            <span className="text-2xl">🤔</span>
          </div>
          <p className="text-[#C9A84C] text-base font-semibold mb-2">{cT.noFav}</p>
          <p className="text-gray-400 text-sm mb-5 max-w-sm mx-auto">{cT.noFavDesc}</p>
          <Link href="/registro"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[#030712] font-extrabold text-sm no-underline transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #B8943D)',
              boxShadow: '0 4px 24px rgba(201,168,76,0.35)'
            }}>
            <span>{cT.noFavBtn}</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Creador, RedSocial } from '@/data/creadores';
import { AnimatedSection } from '@/components/AnimatedSection';

interface Props {
  creadores: Creador[];
  total: string;
}

const PLATFORMS = ['Todas', 'YouTube', 'Twitch', 'TikTok', 'Instagram', 'Twitter'];

function PlatformPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-bold border transition-all duration-300 ${
        active
          ? 'bg-[#C9A84C] text-[#030712] border-[#C9A84C] shadow-[0_4px_20px_rgba(201,168,76,0.35)]'
          : 'bg-white/5 text-gray-300 border-white/10 hover:border-[#C9A84C]/40 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function SocialIcon({ red }: { red: RedSocial }) {
  const icons: Record<string, JSX.Element> = {
    youtube: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff0000">
        <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" />
      </svg>
    ),
    twitch: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#9146ff">
        <path d="M11.6 11.2h2v5.3h-2v-5.3zm5.3 0h2v5.3h-2v-5.3zM6 0L1.3 4.7v14.7h5.3V24l4.7-4.7h3.8L22.7 12V0H6zm14.7 11l-3.6 3.6h-3.6l-3.1 3.1v-3.1H6.6V2h14v9z" />
      </svg>
    ),
    tiktok: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
        <path d="M19.3 5.3A4.5 4.5 0 0116.5 2h-3.4v13.5a2.7 2.7 0 11-1.8-2.5V9.5a6.2 6.2 0 105.3 6.1V10a8 8 0 004.7 1.5V8a4.5 4.5 0 01-2-2.7z" />
      </svg>
    ),
    instagram: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#e4405f">
        <path d="M12 2.2c2.7 0 3 0 4.1.1 1 0 1.5.2 1.9.3.5.2.8.4 1.1.7.3.3.5.7.7 1.1.1.4.3.9.3 1.9 0 1.1.1 1.4.1 4.1s0 3-.1 4.1c0 1-.2 1.5-.3 1.9-.2.5-.4.8-.7 1.1-.3.3-.7.5-1.1.7-.4.1-.9.3-1.9.3-1.1 0-1.4.1-4.1.1s-3 0-4.1-.1c-1 0-1.5-.2-1.9-.3-.5-.2-.8-.4-1.1-.7-.3-.3-.5-.7-.7-1.1-.1-.4-.3-.9-.3-1.9 0-1.1-.1-1.4-.1-4.1s0-3 .1-4.1c0-1 .2-1.5.3-1.9.2-.5.4-.8.7-1.1.3-.3.7-.5 1.1-.7.4-.1.9-.3 1.9-.3 1.1 0 1.4-.1 4.1-.1M12 0C9.3 0 8.9 0 7.8.1 6.7.1 5.9.3 5.2.6c-.7.3-1.3.6-1.9 1.2C2.7 2.4 2.4 3 2.1 3.7c-.3.7-.5 1.5-.5 2.6C1.5 7.4 1.5 7.8 1.5 12s0 4.6.1 5.7c.1 1.1.3 1.9.6 2.6.3.7.6 1.3 1.2 1.9.6.6 1.2.9 1.9 1.2.7.3 1.5.5 2.6.6 1.1 0 1.5.1 5.7.1s4.6 0 5.7-.1c1.1-.1 1.9-.3 2.6-.6.7-.3 1.3-.6 1.9-1.2.6-.6.9-1.2 1.2-1.9.3-.7.5-1.5.6-2.6 0-1.1.1-1.5.1-5.7s0-4.6-.1-5.7c-.1-1.1-.3-1.9-.6-2.6-.3-.7-.6-1.3-1.2-1.9-.6-.6-1.2-.9-1.9-1.2C18.1.3 17.3.1 16.2.1 15.1 0 14.7 0 12 0zm0 5.8a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zm0 10.2a4 4 0 110-8 4 4 0 010 8zm6.4-10.5a1.4 1.4 0 100-2.9 1.4 1.4 0 000 2.9z" />
      </svg>
    ),
    twitter: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
        <path d="M18.2 2.25h3.5l-7.6 8.7 9 11.8h-7l-5.5-7.2-6.3 7.2H.8l8.1-9.3-8.6-11.3h7.2l5 6.6 5.7-6.5zm-1.2 18.5h1.9L7.1 4.2H5.1l11.9 16.5z" />
      </svg>
    ),
    threads: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
        <path d="M12.2 2C6.6 2 2.2 6.5 2.2 12c0 5.5 4.4 10 9.8 10h.2c5.5 0 9.8-4.5 9.8-10S17.6 2 12.2 2zm4.5 14.3c-.5 1.2-1.7 2-3 2.2-.8.1-1.5.1-2.3-.1-1.1-.3-2-1-2.5-2-.3-.6-.4-1.2-.3-1.9.2-1.3 1.1-2.2 2.3-2.6.8-.3 1.7-.3 2.5 0 .5.2.9.5 1.2.9l-1 .8c-.5-.5-1.2-.7-1.9-.5-.9.2-1.5 1-1.3 1.9.1.6.5 1 1 1.3.6.3 1.3.3 1.9.1.5-.2.8-.5 1-.9h-1.5v-1.2h2.8c.1.7 0 1.3-.2 1.9z" />
      </svg>
    ),
  };

  return (
    <a
      href={red.url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 hover:scale-110 transition-all duration-300"
      title={red.usuario}
    >
      {icons[red.plataforma] || null}
    </a>
  );
}

function CreatorCard({ c, joinText }: { c: Creador; joinText: string }) {
  return (
    <div
      className="group relative rounded-2xl overflow-hidden border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
      style={{
        borderColor: c.colorPrimario + '30',
        background: '#0B101A',
        boxShadow: `0 8px 32px ${c.colorPrimario}10`,
      }}
    >
      {/* Imagen principal */}
      <div className="aspect-[3/4] relative overflow-hidden">
        <img
          src={c.imagen}
          alt={c.nombre}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
        />
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/50 to-transparent opacity-90 group-hover:opacity-40 transition-opacity duration-500" />

        {/* Info base visible */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10 group-hover:opacity-0 group-hover:translate-y-4 transition-all duration-500">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: c.colorPrimario }}
            />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: c.colorPrimario }}>
              {c.plataformaPrincipal}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mb-1 leading-tight">{c.nombre}</h2>
          <p className="text-sm text-gray-300">{c.seguidores}</p>
        </div>
      </div>

      {/* Hover reveal overlay */}
      <div
        className="absolute inset-x-0 bottom-0 bg-[#030712]/95 backdrop-blur-md border-t p-5 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ borderColor: c.colorPrimario + '40' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <img
            src={`https://flagcdn.com/w20/${c.paisFlag}.png`}
            className="w-5 h-4 rounded-[2px] object-cover shadow-sm"
            alt={c.pais}
          />
          <span className="text-xs text-gray-400">{c.pais}</span>
        </div>
        <h3 className="text-xl font-black text-white mb-1">{c.nombre}</h3>
        <p className="text-sm font-bold mb-3" style={{ color: c.colorPrimario }}>
          {c.seguidores} seguidores
        </p>
        <p className="text-xs text-gray-400 mb-4 line-clamp-2">{c.bio}</p>

        {/* Redes grandes */}
        {c.redes && c.redes.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {c.redes.map((red) => (
              <SocialIcon key={red.plataforma} red={red} />
            ))}
          </div>
        )}

        <Link
          href={`/registro/${c.slug}`}
          className="block w-full py-3 rounded-xl text-center text-sm font-black transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${c.colorPrimario}, ${c.colorSecundario})`,
            color: '#fff',
            boxShadow: `0 4px 20px ${c.colorPrimario}40`,
          }}
        >
          {joinText}
        </Link>
      </div>
    </div>
  );
}

export default function CreadoresClient({ creadores, total }: Props) {
  const { t, locale } = useLanguage();
  const cT = t.creadores;
  const nav = t.nav;
  const [filtro, setFiltro] = useState('Todas');

  const filtrados =
    filtro === 'Todas'
      ? [...creadores]
      : creadores.filter((c) => c.plataformaPrincipal === filtro);

  const sorted = filtrados.sort((a, b) => b.seguidoresNum - a.seguidoresNum);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-0 pb-6 sm:pb-8">
      <nav className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
        <ol className="flex gap-2">
          <li>
            <Link href="/" className="hover:text-[#C9A84C]">
              {nav.inicio}
            </Link>
          </li>
          <li>/</li>
          <li className="text-[#C9A84C]">{cT.title}</li>
        </ol>
      </nav>

      <header className="mb-6 sm:mb-10 text-center">
        <div
          className="inline-block px-4 py-1.5 rounded-full border border-[#C9A84C33] text-[10px] font-bold text-[#C9A84C] tracking-wider uppercase mb-4"
          style={{ background: 'rgba(201,168,76,0.06)' }}
        >
          {cT.badge}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3">{cT.title}</h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
          {creadores.length} {cT.subtitle} <strong className="text-[#C9A84C]">
            {total} {cT.subtitleFollowers}
          </strong>{' '}
          {cT.subtitleEnd}
        </p>
      </header>

      {/* Sponsor */}
      <div className="w-full text-center mb-6 sm:mb-8">
        <a
          href="mailto:info@sprintmarkt.com?subject=Publicidad%20en%20ZonaMundial%20-%20P%C3%A1gina%20Creadores&body=Hola%20equipo%20de%20ZonaMundial%2C%0A%0AMe%20interesa%20contratar%20un%20espacio%20publicitario%20en%20la%20p%C3%A1gina%20de%20Creadores.%0A%0AEmpresa%3A%20%0AContacto%3A%20%0APresupuesto%20estimado%3A%20%0A%0AQuedo%20a%20la%20espera%20de%20vuestra%20propuesta.%0A%0AGracias."
          className="block w-full bg-[#0B1825] border border-dashed border-[#C9A84C]/30 rounded-xl py-4 hover:bg-[#C9A84C]/5 hover:border-[#C9A84C]/50 transition-all group"
        >
          <p className="text-[#C9A84C]/60 text-sm font-bold tracking-widest uppercase mb-2 group-hover:text-[#C9A84C]/80">
            Espacio disponible para publicidad
          </p>
          <p className="text-gray-500 text-sm group-hover:text-gray-400">Contacta con nosotros → info@sprintmarkt.com</p>
        </a>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 sm:mb-10">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider w-full text-center sm:w-auto sm:text-left sm:mr-2 mb-2 sm:mb-0">
          {cT.filterBy}
        </span>
        {PLATFORMS.map((p) => (
          <PlatformPill
            key={p}
            label={p === 'Todas' ? (locale === 'en' ? 'All' : cT.all) : p}
            active={filtro === p}
            onClick={() => setFiltro(p)}
          />
        ))}
      </div>

      {/* Creators Grid */}
      <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 mb-8 sm:mb-10" stagger={0.08} y={30}>
        {sorted.map((c) => (
          <CreatorCard key={c.slug} c={c} joinText={cT.joinBtn} />
        ))}
      </AnimatedSection>

      {/* More creators coming */}
      <div
        className="text-center p-8 sm:p-10 rounded-2xl border mb-8 relative overflow-hidden"
        style={{
          borderColor: 'rgba(201,168,76,0.15)',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(15,23,42,0.4) 100%)',
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, #C9A84C 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div className="relative z-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))',
              border: '1px solid rgba(201,168,76,0.2)',
            }}
          >
            <img
              src="/img/zonamundial-images/imagenes/logos para sustuir emojis/creadores.png"
              alt=""
              className="w-10 h-10 object-contain mx-auto"
            />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{cT.moreSoon}</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">{cT.moreSoonDesc}</p>
        </div>
      </div>

      {/* CTA generic */}
      <div
        className="text-center p-8 sm:p-10 rounded-2xl border mb-6 relative overflow-hidden group"
        style={{
          borderColor: 'rgba(201,168,76,0.25)',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(15,23,42,0.5) 50%, rgba(10,15,30,0.6) 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.2) 0%, transparent 60%)' }}
        />
        <div className="relative z-10">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))',
              border: '1px solid rgba(201,168,76,0.3)',
            }}
          >
            <span className="text-2xl">🤔</span>
          </div>
          <p className="text-[#C9A84C] text-base font-semibold mb-2">{cT.noFav}</p>
          <p className="text-gray-400 text-sm mb-5 max-w-sm mx-auto">{cT.noFavDesc}</p>
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[#030712] font-extrabold text-sm no-underline transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #B8943D)',
              boxShadow: '0 4px 24px rgba(201,168,76,0.35)',
            }}
          >
            <span>{cT.noFavBtn}</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";
// src/app/historia/campeones/CampeonesClient.tsx

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { SvgIcon } from '@/components/icons';

const CHAMPIONS = [
  { year: 1930, host: 'Uruguay', hostFlag: 'uy', champion: 'Uruguay', champFlag: 'uy', runnerUp: 'Argentina', ruFlag: 'ar', final: '4-2', scorer: 'Guillermo Stábile (8)', teams: 13 },
  { year: 1934, host: 'Italia', hostFlag: 'it', champion: 'Italia', champFlag: 'it', runnerUp: 'Checoslovaquia', ruFlag: 'cz', final: '2-1 (prórroga)', scorer: 'Oldřich Nejedlý (5)', teams: 16 },
  { year: 1938, host: 'Francia', hostFlag: 'fr', champion: 'Italia', champFlag: 'it', runnerUp: 'Hungría', ruFlag: 'hu', final: '4-2', scorer: 'Leônidas (7)', teams: 15 },
  { year: 1950, host: 'Brasil', hostFlag: 'br', champion: 'Uruguay', champFlag: 'uy', runnerUp: 'Brasil', ruFlag: 'br', final: 'Fase final (Maracanazo)', scorer: 'Ademir (8)', teams: 13 },
  { year: 1954, host: 'Suiza', hostFlag: 'ch', champion: 'Alemania', champFlag: 'de', runnerUp: 'Hungría', ruFlag: 'hu', final: '3-2 (Milagro de Berna)', scorer: 'Sándor Kocsis (11)', teams: 16 },
  { year: 1958, host: 'Suecia', hostFlag: 'se', champion: 'Brasil', champFlag: 'br', runnerUp: 'Suecia', ruFlag: 'se', final: '5-2', scorer: 'Just Fontaine (13)', teams: 16 },
  { year: 1962, host: 'Chile', hostFlag: 'cl', champion: 'Brasil', champFlag: 'br', runnerUp: 'Checoslovaquia', ruFlag: 'cz', final: '3-1', scorer: 'Garrincha y otros (4)', teams: 16 },
  { year: 1966, host: 'Inglaterra', hostFlag: 'gb-eng', champion: 'Inglaterra', champFlag: 'gb-eng', runnerUp: 'Alemania', ruFlag: 'de', final: '4-2 (prórroga)', scorer: 'Eusébio (9)', teams: 16 },
  { year: 1970, host: 'México', hostFlag: 'mx', champion: 'Brasil', champFlag: 'br', runnerUp: 'Italia', ruFlag: 'it', final: '4-1', scorer: 'Gerd Müller (10)', teams: 16 },
  { year: 1974, host: 'Alemania', hostFlag: 'de', champion: 'Alemania', champFlag: 'de', runnerUp: 'Países Bajos', ruFlag: 'nl', final: '2-1', scorer: 'Grzegorz Lato (7)', teams: 16 },
  { year: 1978, host: 'Argentina', hostFlag: 'ar', champion: 'Argentina', champFlag: 'ar', runnerUp: 'Países Bajos', ruFlag: 'nl', final: '3-1 (prórroga)', scorer: 'Mario Kempes (6)', teams: 16 },
  { year: 1982, host: 'España', hostFlag: 'es', champion: 'Italia', champFlag: 'it', runnerUp: 'Alemania', ruFlag: 'de', final: '3-1', scorer: 'Paolo Rossi (6)', teams: 24 },
  { year: 1986, host: 'México', hostFlag: 'mx', champion: 'Argentina', champFlag: 'ar', runnerUp: 'Alemania', ruFlag: 'de', final: '3-2', scorer: 'Gary Lineker (6)', teams: 24 },
  { year: 1990, host: 'Italia', hostFlag: 'it', champion: 'Alemania', champFlag: 'de', runnerUp: 'Argentina', ruFlag: 'ar', final: '1-0', scorer: 'Salvatore Schillaci (6)', teams: 24 },
  { year: 1994, host: 'Estados Unidos', hostFlag: 'us', champion: 'Brasil', champFlag: 'br', runnerUp: 'Italia', ruFlag: 'it', final: '0-0 (penaltis 3-2)', scorer: 'Oleg Salenko, Hristo Stoichkov (6)', teams: 24 },
  { year: 1998, host: 'Francia', hostFlag: 'fr', champion: 'Francia', champFlag: 'fr', runnerUp: 'Brasil', ruFlag: 'br', final: '3-0', scorer: 'Davor Šuker (6)', teams: 32 },
  { year: 2002, host: 'Corea/Japón', hostFlag: 'kr', champion: 'Brasil', champFlag: 'br', runnerUp: 'Alemania', ruFlag: 'de', final: '2-0', scorer: 'Ronaldo (8)', teams: 32 },
  { year: 2006, host: 'Alemania', hostFlag: 'de', champion: 'Italia', champFlag: 'it', runnerUp: 'Francia', ruFlag: 'fr', final: '1-1 (penaltis 5-3)', scorer: 'Miroslav Klose (5)', teams: 32 },
  { year: 2010, host: 'Sudáfrica', hostFlag: 'za', champion: 'España', champFlag: 'es', runnerUp: 'Países Bajos', ruFlag: 'nl', final: '1-0 (prórroga)', scorer: 'Thomas Müller y otros (5)', teams: 32 },
  { year: 2014, host: 'Brasil', hostFlag: 'br', champion: 'Alemania', champFlag: 'de', runnerUp: 'Argentina', ruFlag: 'ar', final: '1-0 (prórroga)', scorer: 'James Rodríguez (6)', teams: 32 },
  { year: 2018, host: 'Rusia', hostFlag: 'ru', champion: 'Francia', champFlag: 'fr', runnerUp: 'Croacia', ruFlag: 'hr', final: '4-2', scorer: 'Harry Kane (6)', teams: 32 },
  { year: 2022, host: 'Catar', hostFlag: 'qa', champion: 'Argentina', champFlag: 'ar', runnerUp: 'Francia', ruFlag: 'fr', final: '3-3 (penaltis 4-2)', scorer: 'Kylian Mbappé (8)', teams: 32 },
];

const TITLES: Record<string, { count: number; flag: string; years: string }> = {
  'Brasil': { count: 5, flag: 'br', years: '1958, 1962, 1970, 1994, 2002' },
  'Alemania': { count: 4, flag: 'de', years: '1954, 1974, 1990, 2014' },
  'Italia': { count: 4, flag: 'it', years: '1934, 1938, 1982, 2006' },
  'Argentina': { count: 3, flag: 'ar', years: '1978, 1986, 2022' },
  'Francia': { count: 2, flag: 'fr', years: '1998, 2018' },
  'Uruguay': { count: 2, flag: 'uy', years: '1930, 1950' },
  'Inglaterra': { count: 1, flag: 'gb-eng', years: '1966' },
  'España': { count: 1, flag: 'es', years: '2010' },
};

export default function CampeonesClient() {
  const { t } = useLanguage();
  const cT = t.campeones;
  const nav = t.nav;

  return (
    <>
      <nav className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">{nav.inicio}</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">{nav.historia}</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">{cT.crumb}</li>
        </ol>
      </nav>

      <header className="mb-6 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3">
          {cT.title}
        </h1>
        <p className="text-base sm:text-lg text-gray-300">{cT.subtitle}</p>
      </header>

      {/* TITLES RANKING */}
      <section className="mb-8 sm:mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">{cT.palmares}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {Object.entries(TITLES).map(([name, d]) => (
            <div key={name} className="p-3 sm:p-4 rounded-xl border border-[#1E293B] text-center"
              style={{ background: 'rgba(15,23,42,0.5)' }}>
              <img src={`https://flagcdn.com/w80/${d.flag}.png`}
                className="w-10 h-7 sm:w-12 sm:h-8 rounded object-cover mx-auto border border-[#1E293B]"
                alt={name} />
              <div className="text-xl sm:text-2xl font-black text-[#C9A84C] mt-2 flex items-center justify-center gap-1">
                <SvgIcon name="historia" size={20} className="sm:!w-6 sm:!h-6" />
                <span>&times;{d.count}</span>
              </div>
              <div className="text-sm font-bold text-white mt-1">{name}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{d.years}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sponsor */}
      <div className="w-full bg-[#0B1825] border border-[#1a2a3f] rounded-lg flex items-center justify-center mb-6 sm:mb-8 py-3"
        data-sponsor-slot="historia-campeones">
        <a href="#" target="_blank" rel="noopener noreferrer">
          <img src="/img/imagenessilviu/ChatGPT Image 8 abr 2026, 04_53_21 p.m..png" alt="Publicidad" className="rounded-lg" style={{maxWidth:"100%",height:"auto"}} />
        </a>
      </div>

      {/* ALL EDITIONS TABLE */}
      <section className="mb-8 sm:mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-1">{cT.tableTitle}</h2>
        <p className="text-sm text-gray-500 mb-4">{cT.tableSub}</p>

        {/* Desktop table */}
        <div className="hidden sm:block rounded-xl border border-[#1E293B] overflow-hidden"
          style={{ background: 'rgba(15,23,42,0.5)' }}>
          <div className="grid gap-0 px-4 py-2.5 text-[10px] font-bold text-[#334155] uppercase tracking-wider border-b border-[#0F172A]"
            style={{ gridTemplateColumns: '60px 1fr 1fr 1fr 100px 1fr' }}>
            <span>{cT.headers.year}</span>
            <span>{cT.headers.host}</span>
            <span>{cT.headers.champion}</span>
            <span>{cT.headers.runnerUp}</span>
            <span>{cT.headers.final}</span>
            <span>{cT.headers.scorer}</span>
          </div>
          {CHAMPIONS.map((c, i) => (
            <div key={c.year}
              className="grid gap-0 items-center px-4 py-3 border-b border-[#0F172A] transition-colors hover:bg-[#0F172A]/50"
              style={{ gridTemplateColumns: '60px 1fr 1fr 1fr 100px 1fr', background: i % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.3)' }}>
              <span className="text-sm font-black text-[#C9A84C]">{c.year}</span>
              <span className="flex items-center gap-2">
                <img src={`https://flagcdn.com/w20/${c.hostFlag}.png`} className="w-5 h-3.5 rounded-[1px] object-cover" alt="" />
                <span className="text-xs text-gray-300">{c.host}</span>
              </span>
              <span className="flex items-center gap-2">
                <img src={`https://flagcdn.com/w20/${c.champFlag}.png`} className="w-5 h-3.5 rounded-[1px] object-cover" alt="" />
                <span className="text-sm font-bold text-white">{c.champion}</span>
              </span>
              <span className="flex items-center gap-2">
                <img src={`https://flagcdn.com/w20/${c.ruFlag}.png`} className="w-5 h-3.5 rounded-[1px] object-cover" alt="" />
                <span className="text-xs text-gray-400">{c.runnerUp}</span>
              </span>
              <span className="text-xs text-gray-400">{c.final}</span>
              <span className="text-xs text-gray-500 truncate">{c.scorer}</span>
            </div>
          ))}
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {CHAMPIONS.map(c => (
            <div key={c.year} className="p-3 rounded-xl border border-[#1E293B]"
              style={{ background: 'rgba(15,23,42,0.5)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-black text-[#C9A84C]">{c.year}</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <img src={`https://flagcdn.com/w20/${c.hostFlag}.png`} className="w-4 h-3 rounded-[1px] object-cover" alt="" />
                  {c.host}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <SvgIcon name="historia" size={20} />
                <img src={`https://flagcdn.com/w20/${c.champFlag}.png`} className="w-5 h-3.5 rounded-[1px] object-cover" alt="" />
                <span className="text-sm font-bold text-white">{c.champion}</span>
                <span className="text-xs text-gray-500">{c.final}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold" style={{ color: '#A0AEC0' }}>2&#186;</span>
                <img src={`https://flagcdn.com/w20/${c.ruFlag}.png`} className="w-5 h-3.5 rounded-[1px] object-cover" alt="" />
                <span className="text-xs text-gray-400">{c.runnerUp}</span>
              </div>
              <div className="mt-2 text-[10px] text-gray-600">{cT.mobileScorer}: {c.scorer}</div>
            </div>
          ))}
        </div>
      </section>

      {/* NEXT EDITION CTA */}
      <div className="text-center p-5 sm:p-7 rounded-2xl border border-[#C9A84C22] mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(15,23,42,0.3))' }}>
        <div className="mb-2 flex justify-center"><SvgIcon name="historia" size={32} /></div>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">{cT.cta1Title}</h2>
        <p className="text-sm text-gray-400 mb-4">{cT.cta1Desc}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/historia" className="px-6 py-3 rounded-xl text-sm font-bold text-[#030712] no-underline"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8893D)' }}>
            {cT.cta1Title}
          </Link>
          <Link href="/grupos" className="px-6 py-3 rounded-xl text-sm font-bold text-[#C9A84C] border border-[#C9A84C44] no-underline hover:bg-[#C9A84C11]">
            {cT.cta2Title}
          </Link>
        </div>
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Link href="/historia" className="p-3 bg-[#0B1825] border border-[#1a2a3f] rounded-lg text-gray-300 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all text-xs no-underline flex items-center gap-1.5"><SvgIcon name="match center" size={16} /> {nav.historia}</Link>
        <Link href="/grupos" className="p-3 bg-[#0B1825] border border-[#1a2a3f] rounded-lg text-gray-300 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all text-xs no-underline flex items-center gap-1.5"><SvgIcon name="los 12 grupos" size={16} /> {nav.grupos}</Link>
        <Link href="/selecciones" className="p-3 bg-[#0B1825] border border-[#1a2a3f] rounded-lg text-gray-300 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all text-xs no-underline flex items-center gap-1.5"><SvgIcon name="48 selecciones" size={16} /> {nav.selecciones}</Link>
      </div>
    </>
  );
}

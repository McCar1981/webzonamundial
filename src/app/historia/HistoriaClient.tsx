"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { AnimatedSection } from '@/components/AnimatedSection';
import { StatCounter } from '@/components/StatCounter';
import HistoriaTimeline from '@/components/HistoriaTimeline';
import { WORLD_CUP_DETAILS } from '@/data/historia';

const WORLD_CUP_STATS = [
  { year: 1930, host: "Uruguay", champion: "Uruguay", runnerUp: "Argentina", teams: 13, hostFlag: 'uy', champFlag: 'uy', ruFlag: 'ar' },
  { year: 1934, host: "Italia", champion: "Italia", runnerUp: "Checoslovaquia", teams: 16, hostFlag: 'it', champFlag: 'it', ruFlag: 'cz' },
  { year: 1938, host: "Francia", champion: "Italia", runnerUp: "Hungría", teams: 15, hostFlag: 'fr', champFlag: 'it', ruFlag: 'hu' },
  { year: 1950, host: "Brasil", champion: "Uruguay", runnerUp: "Brasil", teams: 13, hostFlag: 'br', champFlag: 'uy', ruFlag: 'br' },
  { year: 1954, host: "Suiza", champion: "Alemania", runnerUp: "Hungría", teams: 16, hostFlag: 'ch', champFlag: 'de', ruFlag: 'hu' },
  { year: 1958, host: "Suecia", champion: "Brasil", runnerUp: "Suecia", teams: 16, hostFlag: 'se', champFlag: 'br', ruFlag: 'se' },
  { year: 1962, host: "Chile", champion: "Brasil", runnerUp: "Checoslovaquia", teams: 16, hostFlag: 'cl', champFlag: 'br', ruFlag: 'cz' },
  { year: 1966, host: "Inglaterra", champion: "Inglaterra", runnerUp: "Alemania", teams: 16, hostFlag: 'gb-eng', champFlag: 'gb-eng', ruFlag: 'de' },
  { year: 1970, host: "México", champion: "Brasil", runnerUp: "Italia", teams: 16, hostFlag: 'mx', champFlag: 'br', ruFlag: 'it' },
  { year: 1974, host: "Alemania", champion: "Alemania", runnerUp: "Países Bajos", teams: 16, hostFlag: 'de', champFlag: 'de', ruFlag: 'nl' },
  { year: 1978, host: "Argentina", champion: "Argentina", runnerUp: "Países Bajos", teams: 16, hostFlag: 'ar', champFlag: 'ar', ruFlag: 'nl' },
  { year: 1982, host: "España", champion: "Italia", runnerUp: "Alemania", teams: 24, hostFlag: 'es', champFlag: 'it', ruFlag: 'de' },
  { year: 1986, host: "México", champion: "Argentina", runnerUp: "Alemania", teams: 24, hostFlag: 'mx', champFlag: 'ar', ruFlag: 'de' },
  { year: 1990, host: "Italia", champion: "Alemania", runnerUp: "Argentina", teams: 24, hostFlag: 'it', champFlag: 'de', ruFlag: 'ar' },
  { year: 1994, host: "Estados Unidos", champion: "Brasil", runnerUp: "Italia", teams: 24, hostFlag: 'us', champFlag: 'br', ruFlag: 'it' },
  { year: 1998, host: "Francia", champion: "Francia", runnerUp: "Brasil", teams: 32, hostFlag: 'fr', champFlag: 'fr', ruFlag: 'br' },
  { year: 2002, host: "Corea/Japón", champion: "Brasil", runnerUp: "Alemania", teams: 32, hostFlag: 'kr', champFlag: 'br', ruFlag: 'de' },
  { year: 2006, host: "Alemania", champion: "Italia", runnerUp: "Francia", teams: 32, hostFlag: 'de', champFlag: 'it', ruFlag: 'fr' },
  { year: 2010, host: "Sudáfrica", champion: "España", runnerUp: "Países Bajos", teams: 32, hostFlag: 'za', champFlag: 'es', ruFlag: 'nl' },
  { year: 2014, host: "Brasil", champion: "Alemania", runnerUp: "Argentina", teams: 32, hostFlag: 'br', champFlag: 'de', ruFlag: 'ar' },
  { year: 2018, host: "Rusia", champion: "Francia", runnerUp: "Croacia", teams: 32, hostFlag: 'ru', champFlag: 'fr', ruFlag: 'hr' },
  { year: 2022, host: "Qatar", champion: "Argentina", runnerUp: "Francia", teams: 32, hostFlag: 'qa', champFlag: 'ar', ruFlag: 'fr' },
];

const ICONIC_MOMENTS_ES = [
  { year: 1930, title: "Uruguay 1930", description: "La primera Copa del Mundo con 13 equipos participantes", color: "#C9A84C", flag: "uy", slug: "uruguay-1930" },
  { year: 1950, title: "El Maracanazo", description: "Uruguay derrota a Brasil en el Maracaná ante 200.000 personas", color: "#22C55E", flag: "uy", slug: "maracanazo" },
  { year: 1966, title: "La tumba de Pickles", description: "El trofeo Jules Rimet fue robado y encontrado por un perro", color: "#ef4444", flag: "gb-eng", slug: "pickles-1966" },
  { year: 1970, title: "Brasil de Pelé", description: "Considerado el mejor equipo de la historia del fútbol", color: "#FACC15", flag: "br", slug: "brasil-1970" },
  { year: 1986, title: "La mano de Dios", description: "Maradona anota el gol más famoso de la historia vs Inglaterra", color: "#38BDF8", flag: "ar", slug: "mano-de-dios" },
  { year: 1998, title: "Zidane y los dos cabezazos", description: "Francia gana su primera Copa del Mundo en casa", color: "#3b82f6", flag: "fr", slug: "zidane-1998" },
  { year: 2002, title: "Ronaldo renace", description: "El Fenómeno lidera a Brasil a su quinta estrella", color: "#22C55E", flag: "br", slug: "ronaldo-2002" },
  { year: 2010, title: "España campeona", description: "El gol de Iniesta en la prórroga da la primera Copa a España", color: "#C9A84C", flag: "es", slug: "espana-2010" },
  { year: 2014, title: "El Mineirazo", description: "Alemania aplasta 7-1 a Brasil en semifinales", color: "#a855f7", flag: "de", slug: "mineirazo" },
  { year: 2022, title: "Messi se consagra", description: "Argentina campeona en una final épica vs Francia con hat-trick de Mbappé", color: "#60A5FA", flag: "ar", slug: "messi-2022" },
];

const ICONIC_MOMENTS_EN = [
  { year: 1930, title: "Uruguay 1930", description: "The first World Cup with 13 participating teams", color: "#C9A84C", flag: "uy", slug: "uruguay-1930" },
  { year: 1950, title: "The Maracanazo", description: "Uruguay defeats Brazil at the Maracanã in front of 200,000 people", color: "#22C55E", flag: "uy", slug: "maracanazo" },
  { year: 1966, title: "Pickles' find", description: "The Jules Rimet trophy was stolen and found by a dog", color: "#ef4444", flag: "gb-eng", slug: "pickles-1966" },
  { year: 1970, title: "Pelé's Brazil", description: "Considered the greatest football team in history", color: "#FACC15", flag: "br", slug: "brasil-1970" },
  { year: 1986, title: "Hand of God", description: "Maradona scores the most famous goal in history vs England", color: "#38BDF8", flag: "ar", slug: "mano-de-dios" },
  { year: 1998, title: "Zidane's two headers", description: "France wins their first World Cup at home", color: "#3b82f6", flag: "fr", slug: "zidane-1998" },
  { year: 2002, title: "Ronaldo's comeback", description: "The Phenomenon leads Brazil to their fifth star", color: "#22C55E", flag: "br", slug: "ronaldo-2002" },
  { year: 2010, title: "Spain champions", description: "Iniesta's extra-time goal gives Spain their first World Cup", color: "#C9A84C", flag: "es", slug: "espana-2010" },
  { year: 2014, title: "The Mineirazo", description: "Germany crushes Brazil 7-1 in the semifinals", color: "#a855f7", flag: "de", slug: "mineirazo" },
  { year: 2022, title: "Messi crowned", description: "Argentina wins an epic final vs France with Mbappé's hat-trick", color: "#60A5FA", flag: "ar", slug: "messi-2022" },
];


function HistoriaNav({ items, isEN }: { items: { id: string; label: string }[]; isEN: boolean }) {
  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="sticky top-0 z-30 -mx-4 mb-8 border-y border-white/5 bg-[#060B14]/90 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className="whitespace-nowrap rounded-lg border border-white/10 bg-[#0B1825] px-3 py-1.5 text-xs font-semibold text-[#8a94b0] transition hover:border-[#c9a84c]/30 hover:text-white"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function DecadeAccordion({ data, isEN, hT }: { data: typeof WORLD_CUP_STATS; isEN: boolean; hT: any }) {
  const decades = [
    { key: "1930s", label: "1930s", years: data.filter((w) => w.year >= 1930 && w.year < 1940) },
    { key: "1950s", label: "1950s", years: data.filter((w) => w.year >= 1950 && w.year < 1960) },
    { key: "1960s", label: "1960s", years: data.filter((w) => w.year >= 1960 && w.year < 1970) },
    { key: "1970s", label: "1970s", years: data.filter((w) => w.year >= 1970 && w.year < 1980) },
    { key: "1980s", label: "1980s", years: data.filter((w) => w.year >= 1980 && w.year < 1990) },
    { key: "1990s", label: "1990s", years: data.filter((w) => w.year >= 1990 && w.year < 2000) },
    { key: "2000s", label: "2000s", years: data.filter((w) => w.year >= 2000 && w.year < 2010) },
    { key: "2010s", label: "2010s", years: data.filter((w) => w.year >= 2010 && w.year < 2020) },
    { key: "2020s", label: "2020s", years: data.filter((w) => w.year >= 2020) },
  ];

  const [open, setOpen] = useState<string[]>(["2020s"]);

  const toggle = (key: string) => {
    setOpen((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  return (
    <div className="space-y-3">
      {decades.map((dec) => (
        <div key={dec.key} className="rounded-2xl border border-[#1E293B] overflow-hidden bg-[#0F1D32]/50">
          <button
            onClick={() => toggle(dec.key)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1E293B]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-[#C9A84C]">{dec.label}</span>
              <span className="text-xs text-gray-500">
                {dec.years.length} {isEN ? (dec.years.length === 1 ? "edition" : "editions") : (dec.years.length === 1 ? "edición" : "ediciones")}
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${open.includes(dec.key) ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open.includes(dec.key) && (
            <div className="px-4 pb-4">
              <div className="hidden md:grid gap-0 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-[#1E293B]"
                style={{ gridTemplateColumns: '70px 1fr 1fr 1fr 80px' }}>
                <span>{hT.tableHeaders.year}</span>
                <span>{hT.tableHeaders.host}</span>
                <span>{hT.tableHeaders.champion}</span>
                <span>{hT.tableHeaders.runnerUp}</span>
                <span className="text-right">{hT.tableHeaders.teams}</span>
              </div>
              {dec.years.map((wc, i) => (
                <div key={wc.year}>
                  {/* Desktop row */}
                  <div className="hidden md:grid gap-0 items-center px-4 py-3 border-b border-[#1E293B] last:border-0 hover:bg-[#1E293B]/50 transition-colors"
                    style={{ gridTemplateColumns: '70px 1fr 1fr 1fr 80px', background: i % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.3)' }}>
                    <span className="text-sm font-black text-[#C9A84C]">{wc.year}</span>
                    <span className="flex items-center gap-2">
                      <img src={`https://flagcdn.com/w20/${wc.hostFlag}.png`} className="w-5 h-3.5 rounded-[1px] object-cover" alt="" />
                      <span className="text-sm text-gray-300">{wc.host}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <img src={`https://flagcdn.com/w20/${wc.champFlag}.png`} className="w-5 h-3.5 rounded-[1px] object-cover" alt="" />
                      <span className="text-sm font-bold text-white">{wc.champion}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <img src={`https://flagcdn.com/w20/${wc.ruFlag}.png`} className="w-5 h-3.5 rounded-[1px] object-cover" alt="" />
                      <span className="text-sm text-gray-400">{wc.runnerUp}</span>
                    </span>
                    <span className="text-sm text-gray-500 text-right">{wc.teams}</span>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden p-3 rounded-xl border border-[#1E293B] bg-[#0B0F1A] mb-2 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-black text-[#C9A84C]">{wc.year}</span>
                      <span className="flex items-center gap-2 text-sm text-gray-400">
                        <img src={`https://flagcdn.com/w20/${wc.hostFlag}.png`} className="w-5 h-3.5 rounded-[1px] object-cover" alt="" />
                        {wc.host}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={`https://flagcdn.com/w20/${wc.champFlag}.png`} className="w-5 h-3.5 rounded-[1px] object-cover" alt="" />
                        <span className="text-sm font-bold text-white">{wc.champion}</span>
                      </div>
                      <span className="text-xs text-gray-500">{wc.teams} {hT.mobileTeams}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-base font-bold text-gray-400" style={{ color: '#A0AEC0' }}>2º</span>
                      <img src={`https://flagcdn.com/w20/${wc.ruFlag}.png`} className="w-5 h-3.5 rounded-[1px] object-cover" alt="" />
                      <span className="text-sm text-gray-400">{wc.runnerUp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LegendsGrid({ legends }: { legends: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {legends.map((l, i) => (
        <div key={i} className="rounded-2xl border border-white/5 bg-[#0F1D32]/80 p-5 hover:border-[#c9a84c]/20 transition-all">
          <div className="mb-3 flex items-center gap-3">
            <img src={`https://flagcdn.com/w40/${l.flag}.png`} alt={l.country} className="w-10 h-7 rounded object-cover border border-white/10" />
            <div>
              <h4 className="font-bold text-white text-sm">{l.name}</h4>
              <p className="text-[10px] text-gray-500">{l.country}</p>
            </div>
          </div>
          <p className="text-xs font-bold mb-2" style={{ color: l.color }}>{l.stats}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{l.fact}</p>
        </div>
      ))}
    </div>
  );
}

function FinalsGrid({ finals, isEN }: { finals: any[]; isEN: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {finals.map((f, i) => (
        <div key={i} className="relative rounded-2xl border border-white/5 bg-[#0F1D32]/80 p-5 overflow-hidden hover:border-[#c9a84c]/20 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: f.color }} />
          <span className="text-xs font-black text-[#C9A84C]">{f.year}</span>
          <h4 className="text-base font-bold text-white mt-1">{f.title}</h4>
          <p className="text-sm font-bold mt-1" style={{ color: f.color }}>{f.teams}</p>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

function TrophiesSection({ hT }: { hT: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hT.trophies.map((t: any, i: number) => (
        <div key={i} className="rounded-2xl border border-white/5 bg-[#0F1D32]/80 p-5 flex items-start gap-4 hover:border-[#c9a84c]/20 transition-all">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${t.color}20`, color: t.color }}>🏆</div>
          <div>
            <h4 className="font-bold text-white">{t.name}</h4>
            <p className="text-xs text-[#C9A84C] mb-1">{t.period}</p>
            <p className="text-sm text-gray-400 leading-relaxed">{t.desc}</p>
          </div>
        </div>
      ))}
      <div className="md:col-span-2 rounded-2xl border border-white/5 bg-[#0F1D32]/80 p-5">
        <h4 className="font-bold text-white mb-3">{hT.ballsTitle}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {hT.balls.map((b: any, i: number) => (
            <div key={i} className="rounded-xl border border-white/5 bg-[#060B14] p-3">
              <p className="text-sm font-bold text-white">{b.name}</p>
              <p className="text-xs text-gray-400 mt-1">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CancelledSection({ hT }: { hT: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hT.cancelled.map((c: any, i: number) => (
        <div key={i} className="rounded-2xl border border-white/5 bg-[#0F1D32]/80 p-5 hover:border-red-500/20 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl font-black text-red-400">{c.year}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-400/80">{c.reason}</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">{c.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function HistoriaClient() {
  const { t } = useLanguage();
  const hT = t.historia;
  const nav = t.nav;
  const isEN = nav.inicio === 'Home';

  const iconicMoments = isEN ? ICONIC_MOMENTS_EN : ICONIC_MOMENTS_ES;

  const navItems = [
    { id: 'timeline', label: hT.navTimeline },
    { id: 'moments', label: hT.navMoments },
    { id: 'map', label: hT.navMap },
    { id: 'records', label: hT.navRecords },
    { id: 'evolution', label: hT.navEvolution },
    { id: 'scorers', label: hT.navScorers },
    { id: 'legends', label: hT.navLegends },
    { id: 'finals', label: hT.navFinals },
    { id: 'trophies', label: hT.navTrophies },
    { id: 'cancelled', label: hT.navCancelled },
    { id: 'all', label: hT.navAll },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-0 pb-6 sm:pb-8">
      {/* Breadcrumb */}
      <nav className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2">
          <li><Link href="/" className="hover:text-[#C9A84C]">{nav.inicio}</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">{nav.historia}</li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="mb-8 sm:mb-12 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#C9A84C]/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full border border-[#C9A84C]/20 text-[10px] font-bold text-[#C9A84C] tracking-wider uppercase mb-4 bg-[#C9A84C]/5">
            {hT.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            {hT.title} <span className="text-[#C9A84C]">{hT.titleHighlight}</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">{hT.subtitle}</p>
        </div>
      </header>

      {/* Sticky Nav */}
      <HistoriaNav items={navItems} isEN={isEN} />

      {/* Stats banner */}
      <AnimatedSection className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10" y={20}>
        <div className="p-4 rounded-2xl border border-white/5 bg-[#0B0F1A] text-center">
          <div className="text-2xl sm:text-3xl font-black text-[#C9A84C]"><StatCounter value={22} /></div>
          <div className="text-xs text-gray-500 mt-1">{isEN ? "Editions" : "Ediciones"}</div>
        </div>
        <div className="p-4 rounded-2xl border border-white/5 bg-[#0B0F1A] text-center">
          <div className="text-2xl sm:text-3xl font-black text-[#C9A84C]"><StatCounter value={8} /></div>
          <div className="text-xs text-gray-500 mt-1">{isEN ? "Champions" : "Campeones"}</div>
        </div>
        <div className="p-4 rounded-2xl border border-white/5 bg-[#0B0F1A] text-center">
          <div className="text-2xl sm:text-3xl font-black text-[#C9A84C]"><StatCounter value={79} /></div>
          <div className="text-xs text-gray-500 mt-1">{isEN ? "Years of history" : "Años de historia"}</div>
        </div>
        <div className="p-4 rounded-2xl border border-white/5 bg-[#0B0F1A] text-center">
          <div className="text-2xl sm:text-3xl font-black text-[#C9A84C]"><StatCounter value={48} /></div>
          <div className="text-xs text-gray-500 mt-1">{isEN ? "Teams in 2026" : "Equipos en 2026"}</div>
        </div>
      </AnimatedSection>

      {/* Interactive Timeline */}
      <section id="timeline" className="scroll-mt-24 mb-10 sm:mb-12">
        <AnimatedSection className="rounded-3xl border border-white/5 overflow-hidden" style={{ background: '#0B0F1A' }} y={20}>
          <div className="p-5 sm:p-6 border-b border-white/5 flex items-center gap-3" style={{ background: 'rgba(201,168,76,0.06)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.18)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C9A84C' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{isEN ? "Interactive Timeline" : "Línea de tiempo interactiva"}</h2>
              <p className="text-sm text-gray-500">{isEN ? "Click on any edition to discover its story" : "Haz clic en cualquier edición para descubrir su historia"}</p>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <HistoriaTimeline data={WORLD_CUP_DETAILS} isEN={isEN} />
          </div>
        </AnimatedSection>
      </section>

      {/* Sponsor */}
      <div className="w-full text-center mb-8 sm:mb-10">
        <a href="mailto:info@sprintmarkt.com?subject=Publicidad%20en%20ZonaMundial%20-%20P%C3%A1gina%20Historia&body=Hola%20equipo%20de%20ZonaMundial%2C%0A%0AMe%20interesa%20contratar%20un%20espacio%20publicitario%20en%20la%20p%C3%A1gina%20de%20Historia.%0A%0AEmpresa%3A%20%0AContacto%3A%20%0APresupuesto%20estimado%3A%20%0A%0AQuedo%20a%20la%20espera%20de%20vuestra%20propuesta.%0A%0AGracias." className="block w-full bg-[#0B1825] border border-dashed border-[#C9A84C]/30 rounded-xl py-4 hover:bg-[#C9A84C]/5 hover:border-[#C9A84C]/50 transition-all group">
          <p className="text-[#C9A84C]/60 text-sm font-bold tracking-widest uppercase mb-2 group-hover:text-[#C9A84C]/80">Espacio disponible para publicidad</p>
          <p className="text-gray-500 text-sm group-hover:text-gray-400">Contacta con nosotros → info@sprintmarkt.com</p>
        </a>
      </div>

      {/* Iconic Moments */}
      <section id="moments" className="scroll-mt-24 mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 flex items-center justify-center border border-[#C9A84C]/20">
            <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/historia.png" alt="" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{hT.iconicTitle}</h2>
            <p className="text-sm text-gray-500">{hT.iconicSub}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {iconicMoments.map((moment, i) => (
            <Link key={i} href={`/historia/momentos-iconicos/${moment.slug}`} className="group relative h-64 rounded-2xl border border-white/5 overflow-hidden hover:border-white/15 transition-all duration-300 hover:-translate-y-1 block">
              {/* Flag as background image */}
              <img
                src={`https://flagcdn.com/w640/${moment.flag}.png`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-25 transition-all duration-500 group-hover:opacity-35 group-hover:scale-110 blur-[2px]"
                loading="lazy"
              />
              {/* Dark overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/70 to-transparent" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${moment.color}20 0%, transparent 60%)` }} />
              <div className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 z-10" style={{ background: `linear-gradient(90deg, ${moment.color}, ${moment.color}60)` }} />
              <div className="absolute inset-0 p-5 flex flex-col justify-end z-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm" style={{ color: moment.color }}>{moment.year}</span>
                  <img src={`https://flagcdn.com/w40/${moment.flag}.png`} alt="" className="w-7 h-5 rounded-sm object-cover border border-white/20 shadow-lg" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 drop-shadow-lg">{moment.title}</h3>
                <p className="text-sm text-gray-200 leading-relaxed drop-shadow-md">{moment.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/historia/momentos-iconicos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-sm font-bold text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all"
          >
            {isEN ? 'See all iconic moments' : 'Ver todos los momentos icónicos'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Records */}
      <section id="records" className="scroll-mt-24 mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center border border-amber-500/20">
            <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/los 12 grupos.png" alt="" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{hT.recordsTitle}</h2>
            <p className="text-sm text-gray-500">{hT.recordsSub}</p>
          </div>
        </div>
        <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" y={20}>
          {hT.records.map((record: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border border-white/5 bg-[#0F1D32]/80 flex items-center gap-4 hover:border-[#C9A84C]/30 transition-all duration-300">
              <img src={`https://flagcdn.com/w40/${record.flag}.png`} alt={record.holder} className="w-10 h-7 rounded object-cover border border-white/10" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-0.5">{record.title}</div>
                <div className="text-sm font-bold text-white truncate">{record.holder}</div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20">
                <span className="text-sm font-bold text-[#C9A84C]">{record.value}</span>
              </div>
            </div>
          ))}
        </AnimatedSection>
      </section>

      {/* Hosts 2026 */}
      <section className="mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 flex items-center justify-center border border-blue-500/20">
            <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/48 selecciones.png" alt="" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{hT.hostsTitle}</h2>
            <p className="text-sm text-gray-500">{hT.hostsSub}</p>
          </div>
        </div>
        <AnimatedSection className="grid grid-cols-1 sm:grid-cols-3 gap-4" y={20}>
          {hT.hosts2026.map((host: any, i: number) => (
            <div key={i} className="p-6 rounded-2xl border border-white/5 bg-[#0F1D32]/80 text-center hover:border-white/10 transition-all duration-300">
              <img src={`https://flagcdn.com/w80/${host.flag}.png`} alt={host.country} className="w-16 h-11 rounded-lg object-cover mx-auto mb-4 border border-white/10" />
              <h3 className="text-lg font-bold text-white mb-1">{host.country}</h3>
              <div className="text-3xl font-black text-[#C9A84C] mb-2">{host.times}×</div>
              <div className="text-xs text-gray-500 mb-3">{host.years}</div>
              <p className="text-sm text-gray-400 leading-relaxed">{host.description}</p>
            </div>
          ))}
        </AnimatedSection>
      </section>

      {/* Evolución del Mundial */}
      {hT.evolutionPeriods && (
        <section id="evolution" className="scroll-mt-24 mb-10 sm:mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center border border-[#c9a84c]/20">
              <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/formato 2026.png" alt="" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{hT.evolutionTitle}</h2>
              <p className="text-sm text-gray-500">{hT.evolutionSub}</p>
            </div>
          </div>
          <AnimatedSection className="space-y-4" y={20}>
            {hT.evolutionPeriods.map((era: { period: string; title: string; content: string; color: string }, i: number) => (
              <div key={i} className="relative p-6 rounded-2xl border border-white/5 bg-[#0F1D32]/80 overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ background: era.color }} />
                <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: era.color }}>{era.period}</p>
                <h3 className="text-lg font-bold text-white mb-3">{era.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{era.content}</p>
              </div>
            ))}
          </AnimatedSection>
        </section>
      )}

      {/* Leyendas */}
      <section id="legends" className="scroll-mt-24 mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center border border-emerald-500/20">
            <span className="text-2xl">⭐</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{hT.legendsTitle}</h2>
            <p className="text-sm text-gray-500">{hT.legendsSub}</p>
          </div>
        </div>
        <AnimatedSection y={20}>
          <LegendsGrid legends={hT.legends} />
        </AnimatedSection>
      </section>

      {/* Finales Épicas */}
      <section id="finals" className="scroll-mt-24 mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 flex items-center justify-center border border-red-500/20">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{hT.finalsTitle}</h2>
            <p className="text-sm text-gray-500">{hT.finalsSub}</p>
          </div>
        </div>
        <AnimatedSection y={20}>
          <FinalsGrid finals={hT.finals} isEN={isEN} />
        </AnimatedSection>
      </section>

      {/* Trofeos y Balones */}
      <section id="trophies" className="scroll-mt-24 mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center border border-amber-500/20">
            <span className="text-2xl">🥇</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{hT.trophiesTitle}</h2>
            <p className="text-sm text-gray-500">{hT.trophiesSub}</p>
          </div>
        </div>
        <AnimatedSection y={20}>
          <TrophiesSection hT={hT} />
        </AnimatedSection>
      </section>

      {/* Mundiales Cancelados */}
      <section id="cancelled" className="scroll-mt-24 mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-500/20 to-gray-600/5 flex items-center justify-center border border-gray-500/20">
            <span className="text-2xl">🕊️</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{hT.cancelledTitle}</h2>
            <p className="text-sm text-gray-500">{hT.cancelledSub}</p>
          </div>
        </div>
        <AnimatedSection y={20}>
          <CancelledSection hT={hT} />
        </AnimatedSection>
      </section>

      {/* Máximos goleadores */}
      {hT.topScorers && (
        <section id="scorers" className="scroll-mt-24 mb-10 sm:mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 flex items-center justify-center border border-red-500/20">
              <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png" alt="" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{hT.topScorersTitle}</h2>
              <p className="text-sm text-gray-500">{hT.topScorersSub}</p>
            </div>
          </div>
          <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" y={20}>
            {hT.topScorers.map((scorer: { name: string; goals: number; country: string; flag: string; editions: string }, i: number) => (
              <div key={i} className="p-5 rounded-2xl border border-white/5 bg-[#0F1D32]/80 hover:border-[#c9a84c]/30 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-black text-[#c9a84c]">{scorer.goals}</span>
                  <img src={`https://flagcdn.com/w20/${scorer.flag}.png`} alt={scorer.country} className="w-6 h-4 object-cover rounded" />
                </div>
                <h4 className="font-bold text-white text-sm mb-1 group-hover:text-[#c9a84c] transition-colors">{scorer.name}</h4>
                <p className="text-xs text-gray-500">{scorer.country} · {scorer.editions}</p>
              </div>
            ))}
          </AnimatedSection>
        </section>
      )}

      {/* Curiosidades */}
      {hT.curiosities && (
        <section className="mb-10 sm:mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center border border-emerald-500/20">
              <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/trivia.png" alt="" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{hT.curiositiesTitle}</h2>
              <p className="text-sm text-gray-500">{hT.curiositiesSub}</p>
            </div>
          </div>
          <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 gap-3" y={20}>
            {hT.curiosities.map((fact: string, i: number) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl border border-white/5 bg-[#0B1825] hover:border-emerald-500/20 transition-colors">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <p className="text-sm text-gray-400 leading-relaxed">{fact}</p>
              </div>
            ))}
          </AnimatedSection>
        </section>
      )}

      {/* All World Cups - Decade accordion */}
      <section id="all" className="scroll-mt-24 mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 flex items-center justify-center border border-purple-500/20">
            <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/historia.png" alt="" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{hT.allTitle}</h2>
            <p className="text-sm text-gray-500">{hT.allSub}</p>
          </div>
        </div>
        <AnimatedSection y={20}>
          <DecadeAccordion data={WORLD_CUP_STATS} isEN={isEN} hT={hT} />
        </AnimatedSection>
      </section>

      {/* CTAs */}
      <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 gap-4" y={20}>
        <Link href="/historia/campeones" className="p-6 rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#C9A84C]/10 to-transparent text-center hover:border-[#C9A84C]/40 transition-all duration-300 group">
          <div className="mb-3 group-hover:scale-110 transition-transform flex justify-center"><img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/historia.png" alt="" className="w-10 h-10 object-contain" /></div>
          <h3 className="text-lg font-bold text-white mb-2">{hT.cta1Title}</h3>
          <p className="text-sm text-gray-400">{hT.cta1Desc}</p>
        </Link>
        <Link href="/app/trivia" className="p-6 rounded-2xl border border-white/10 bg-[#0F1D32] text-center hover:border-[#C9A84C]/30 transition-all duration-300 group">
          <div className="mb-3 group-hover:scale-110 transition-transform flex justify-center"><img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/predicciones.png" alt="" className="w-10 h-10 object-contain" /></div>
          <h3 className="text-lg font-bold text-white mb-2">{hT.cta2Title}</h3>
          <p className="text-sm text-gray-400">{hT.cta2Desc}</p>
        </Link>
      </AnimatedSection>

      {/* Links */}
      <AnimatedSection className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-8" y={20}>
        {[
          { label: hT.links[0], href: '/historia/campeones' },
          { label: hT.links[1], href: '/grupos' },
          { label: hT.links[2], href: '/selecciones' },
          { label: hT.links[3], href: '/registro' },
        ].map((l, i) => (
          <Link key={i} href={l.href} className="p-3 bg-[#0B1825] border border-[#1a2a3f] rounded-lg text-gray-400 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all text-xs text-center">
            {l.label}
          </Link>
        ))}
      </AnimatedSection>
    </div>
  );
}

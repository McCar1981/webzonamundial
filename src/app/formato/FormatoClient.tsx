"use client";

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';

const FORMAT_2026 = { teams: 48, groups: 12, matches: 104, venues: 16, days: 39 };

const COMPARISON_CLASSIC = [
  { key: 'equipos', value: '32' },
  { key: 'grupos', value: '8 de 4' },
  { key: 'partidos', value: '64' },
  { key: 'clasifican', value: '16 (1º y 2º)' },
  { key: 'duracion', value: '29 días' },
];
const COMPARISON_NEW = [
  { key: 'equipos', value: '48', highlight: true },
  { key: 'grupos', value: '12 de 4', highlight: true },
  { key: 'partidos', value: '104', highlight: true },
  { key: 'clasifican', value: '32 (2+8 terceros)', highlight: false },
  { key: 'duracion', value: '39 días', highlight: true },
  { key: 'nuevaRonda', value: '32avos de final', highlight: true },
];

export default function FormatoClient() {
  const { t } = useLanguage();
  const fT = t.formato;
  const nav = t.nav;

  const stats = [
    { value: FORMAT_2026.teams, label: fT.stats.selecciones, icon: "🌍" },
    { value: FORMAT_2026.groups, label: fT.stats.grupos, icon: "📊" },
    { value: FORMAT_2026.matches, label: fT.stats.partidos, icon: "⚽" },
    { value: FORMAT_2026.venues, label: fT.stats.sedes, icon: "🏟️" },
    { value: FORMAT_2026.days, label: fT.stats.dias, icon: "📅" },
    { value: "3", label: fT.stats.paises, icon: "🌎" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-0 pb-6 sm:pb-8">
      {/* Breadcrumb */}
      <nav className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2">
          <li><Link href="/" className="hover:text-[#C9A84C]">{nav.inicio}</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">{nav.formato}</li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="mb-8 sm:mb-12 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#C9A84C]/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full border border-[#C9A84C]/20 text-[10px] font-bold text-[#C9A84C] tracking-wider uppercase mb-4 bg-[#C9A84C]/5">
            {fT.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            {fT.title} <span className="text-[#C9A84C]">{fT.titleHighlight}</span> 🆕
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">{fT.subtitle}</p>
        </div>
      </header>

      {/* Sponsor */}
      <div className="w-full bg-[#0B1825] border border-[#1a2a3f] rounded-xl flex items-center justify-center mb-8 sm:mb-10 py-3" data-sponsor-slot="formato-hero">
        <a href="https://rotulemos.com" target="_blank" rel="noopener noreferrer">
          <img src="/img/imagenessilviu/rotulemos320x50.png" alt="Rotulemos" className="rounded-lg" style={{maxWidth:"100%",height:"auto"}} />
        </a>
      </div>

      {/* Stats Grid */}
      <section className="mb-10 sm:mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="p-4 sm:p-6 rounded-xl border border-white/5 bg-[#0F1D32]/80 text-center hover:border-[#C9A84C]/30 transition-all duration-300">
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <div className="text-3xl sm:text-4xl font-black text-[#C9A84C] mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Antes vs Ahora */}
      <section className="mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 flex items-center justify-center border border-[#C9A84C]/20">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{fT.antesAhora}</h2>
            <p className="text-sm text-gray-500">{fT.antesAhoraSub}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 sm:p-8 rounded-2xl border border-white/5 bg-[#0F1D32]/80">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{fT.qatar2022}</div>
            <h3 className="text-xl font-bold text-white mb-6">{fT.formatoClasico}</h3>
            <div className="space-y-4">
              {COMPARISON_CLASSIC.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-gray-400">{fT.labels[item.key as keyof typeof fT.labels]}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 sm:p-8 rounded-2xl border-2 border-[#C9A84C] bg-[#0F1D32]/80 relative overflow-hidden">
            <div className="absolute top-4 right-4 px-3 py-1 bg-[#C9A84C] text-[#030712] text-[10px] font-bold uppercase rounded-full">
              {fT.nuevo}
            </div>
            <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider mb-4">2026</div>
            <h3 className="text-xl font-bold text-white mb-6">{fT.formatoAmpliado}</h3>
            <div className="space-y-4">
              {COMPARISON_NEW.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-gray-400">{fT.labels[item.key as keyof typeof fT.labels]}</span>
                  <span className={`text-sm font-bold ${item.highlight ? 'text-[#C9A84C]' : 'text-white'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 flex items-center justify-center border border-green-500/20">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{fT.comofunciona}</h2>
            <p className="text-sm text-gray-500">{fT.comofuncionaSub}</p>
          </div>
        </div>
        <div className="p-6 sm:p-8 rounded-2xl border border-white/5 bg-[#0F1D32]/80 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#E8D48B] flex items-center justify-center text-xl">📋</div>
            <h3 className="text-xl font-bold text-white">{fT.faseGrupos}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[12, 4, 32].map((num, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#060B14] border border-white/5 text-center">
                <div className="text-3xl font-black text-[#C9A84C] mb-1">{num}</div>
                <div className="text-sm text-gray-500">{fT.groupsDetail[i]}</div>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: fT.groupsText }} />
        </div>
        <div className="p-6 sm:p-8 rounded-2xl border border-white/5 bg-[#0F1D32]/80">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#E8D48B] flex items-center justify-center text-xl">⚔️</div>
            <h3 className="text-xl font-bold text-white">{fT.eliminatoria}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {fT.rounds.map((round, i) => (
              <div key={i} className={`p-4 rounded-xl border text-center ${round.isNew ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-white/5 bg-[#060B14]'}`}>
                <div className="text-xs text-gray-500 mb-1">{round.from} → {round.to}</div>
                <div className={`text-base font-bold ${round.isNew ? 'text-[#C9A84C]' : 'text-white'}`}>{round.name}</div>
                {round.isNew && <div className="text-[10px] text-[#C9A84C] mt-1">{fT.nuevo_label}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fases del torneo */}
      <section className="mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 flex items-center justify-center border border-purple-500/20">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{fT.fasesTorneo}</h2>
            <p className="text-sm text-gray-500">{fT.fasesTorneoSub}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {fT.phases.map((phase, i) => (
            <div key={i} className="group p-4 sm:p-5 rounded-xl border border-white/5 bg-[#0F1D32]/80 hover:border-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 ${i === fT.phases.length - 1 ? 'bg-gradient-to-br from-[#C9A84C] to-[#E8D48B] text-[#030712]' : 'bg-[#0B1825] text-[#C9A84C] border border-[#C9A84C]/20'}`}>
                  {i === fT.phases.length - 1 ? '🏆' : phase.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{phase.name}</h3>
                  <p className="text-xs text-gray-500">{fT.faseSub} {i + 1}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3 leading-relaxed">{phase.desc}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-[#060B14] text-[#C9A84C] font-semibold">{phase.matches} {fT.partidos_label}</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-1 rounded bg-[#060B14] text-white font-semibold">{phase.qualified} {fT.clasifican_label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ventajas */}
      <section className="mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center border border-emerald-500/20">
            <span className="text-2xl">✅</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{fT.ventajas}</h2>
            <p className="text-sm text-gray-500">{fT.ventajasSub}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fT.ventajasList.map((item, i) => (
            <div key={i} className="p-5 rounded-xl border border-white/5 bg-[#0F1D32]/80 hover:border-[#C9A84C]/30 transition-all duration-300 group">
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{item.icon}</span>
              <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Críticas */}
      <section className="mb-10 sm:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 flex items-center justify-center border border-red-500/20">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{fT.criticas}</h2>
            <p className="text-sm text-gray-500">{fT.criticasSub}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fT.criticasList.map((item, i) => (
            <div key={i} className="p-5 rounded-xl border border-white/5 bg-[#0F1D32]/80 text-center">
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/grupos" className="p-6 rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#C9A84C]/10 to-transparent text-center hover:border-[#C9A84C]/40 transition-all duration-300 group">
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📊</div>
          <h3 className="text-lg font-bold text-white mb-2">{fT.cta1Title}</h3>
          <p className="text-sm text-gray-400">{fT.cta1Desc}</p>
        </Link>
        <Link href="/registro" className="p-6 rounded-2xl border border-white/10 bg-[#0F1D32] text-center hover:border-[#C9A84C]/30 transition-all duration-300 group">
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎮</div>
          <h3 className="text-lg font-bold text-white mb-2">{fT.cta2Title}</h3>
          <p className="text-sm text-gray-400">{fT.cta2Desc}</p>
        </Link>
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-8">
        {[
          { label: fT.links[0], href: '/grupos' },
          { label: fT.links[1], href: '/selecciones' },
          { label: fT.links[2], href: '/historia' },
          { label: fT.links[3], href: '/registro' },
        ].map((l, i) => (
          <Link key={i} href={l.href} className="p-3 bg-[#0B1825] border border-[#1a2a3f] rounded-lg text-gray-400 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all text-xs text-center">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

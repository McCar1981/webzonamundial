"use client";

import React from 'react';
import Link from 'next/link';
import SimuladorGrupos from '@/components/SimuladorGrupos';
import FlagImage from '@/components/FlagImage';
import { SvgIcon } from '@/components/icons';
import TablaClasificacion from '@/components/TablaClasificacion';
import CalendarioGrupo from '@/components/CalendarioGrupo';
import { AnimatedSection } from '@/components/AnimatedSection';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Seleccion } from '@/data/selecciones';
import { SEDES } from '@/data/sedes';
import { MATCHES } from '@/data/matches';
import { getExtendedSeleccion } from '@/data/selecciones-extended';
import type { SeleccionExtended } from '@/data/selecciones-extended';

const BG = "#030712";

const GROUP_COLORS: Record<string, string> = {
  a: '#22c55e', b: '#22c55e', c: '#eab308', d: '#22c55e', e: '#fbbf24',
  f: '#ef4444', g: '#a855f7', h: '#c9a84c', i: '#3b82f6', j: '#38bdf8',
  k: '#a855f7', l: '#94a3b8',
};

const VALID_GROUPS = ['a','b','c','d','e','f','g','h','i','j','k','l'];

function getGroupColor(letter: string): string {
  return GROUP_COLORS[letter.toLowerCase()] || '#c9a84c';
}

function getHeadToHeadText(a: Seleccion, b: Seleccion): string {
  const facts: string[] = [];
  if (a.mejorResultado.includes('Campeón') && b.mejorResultado.includes('Campeón')) {
    facts.push(`${a.nombre} (${a.mejorResultado}) vs ${b.nombre} (${b.mejorResultado}). Un duelo de campeones mundiales.`);
  } else if (a.mejorResultado.includes('Campeón')) {
    facts.push(`${a.nombre} es campeón del mundo (${a.mejorResultado}).`);
  } else if (b.mejorResultado.includes('Campeón')) {
    facts.push(`${b.nombre} es campeón del mundo (${b.mejorResultado}).`);
  }
  if (a.confederacion !== b.confederacion) {
    facts.push(`Encuentro intercontinental: ${a.confederacion} vs ${b.confederacion}.`);
  }
  if (a.rankingFIFA && b.rankingFIFA) {
    const diff = Math.abs(a.rankingFIFA - b.rankingFIFA);
    if (diff > 30) {
      facts.push(`Diferencia de ${diff} puestos en el ranking FIFA.`);
    } else {
      facts.push(`Equipos muy parejos en el ranking FIFA (diferencia de ${diff}).`);
    }
  }
  if (facts.length === 0) {
    facts.push(`Primer duelo directo en esta fase de grupos. ¿Quién se llevará los 3 puntos?`);
  }
  return facts.join(' ');
}

function HeadToHeadCard({ a, b, groupColor }: { a: Seleccion; b: Seleccion; groupColor: string }) {
  return (
    <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <FlagImage code={a.flagCode} alt={a.nombre} width={28} className="rounded-sm shadow-sm" />
          <span className="text-sm font-bold text-white">{a.nombre}</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${groupColor}20`, color: groupColor }}>VS</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{b.nombre}</span>
          <FlagImage code={b.flagCode} alt={b.nombre} width={28} className="rounded-sm shadow-sm" />
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center leading-relaxed">{getHeadToHeadText(a, b)}</p>
    </div>
  );
}

/* ── Analysis Section ─────────────────────────────────────────────── */
function AnalysisSection({ letter, groupColor, gsT, gT }: {
  letter: string; groupColor: string;
  gsT: Record<string, string | Record<string, unknown>>;
  gT: Record<string, unknown>;
}) {
  const labels = gT.analysisLabels as Record<string, string>;
  const allAnalysis = gT.detailedAnalysis as Record<string, Record<string, string>>;
  const analysis = allAnalysis[letter.toUpperCase()];
  if (!analysis) return null;

  const items: { key: string; icon: JSX.Element; label: string; text: string }[] = [
    {
      key: 'keyMatchups',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
      label: labels.keyMatchups,
      text: analysis.keyMatchups,
    },
    {
      key: 'favorites',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
      label: labels.favorites,
      text: analysis.favorites,
    },
    {
      key: 'darkHorses',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      label: labels.darkHorses,
      text: analysis.darkHorses,
    },
    {
      key: 'keyPlayers',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      label: labels.keyPlayers,
      text: analysis.keyPlayers,
    },
    {
      key: 'history',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
      label: labels.history,
      text: analysis.history,
    },
  ];

  return (
    <AnimatedSection className="rounded-3xl border border-white/5 overflow-hidden" style={{ background: '#0B0F1A' }} y={20}>
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3" style={{ background: `${groupColor}08` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${groupColor}20` }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: groupColor }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{gsT.analisisTitle as string}</h2>
          <p className="text-sm text-gray-500">{gsT.analisisDesc as string}</p>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {items.map((item) => (
          <div key={item.key} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: groupColor }}>
                {item.icon}
              </svg>
              <span className="text-sm font-bold" style={{ color: groupColor }}>{item.label}</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </AnimatedSection>
  );
}

/* ── Group Stats ──────────────────────────────────────────────────── */
const GROUP_STAT_ICONS: Record<string, React.ReactNode> = {
  chart: (
    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#c9a84c' }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  trophy: (
    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#c9a84c' }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 21h8m-4-4v4m-4.5-9.5A4.5 4.5 0 0112 3a4.5 4.5 0 014.5 4.5M7.5 7.5H5a2 2 0 00-2 2c0 1.657 1.343 3 3 3h1.5m9-5H19a2 2 0 012 2c0 1.657-1.343 3-3 3h-1.5" />
    </svg>
  ),
  globe: (
    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#c9a84c' }}>
      <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
      <path strokeWidth={1.8} d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  star: (
    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#c9a84c' }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
};

function GroupStats({ selecciones, groupColor, gsT }: {
  selecciones: Seleccion[]; groupColor: string;
  gsT: Record<string, string | Record<string, unknown>>;
}) {
  const avgRanking = Math.round(
    selecciones.reduce((sum, s) => sum + (s.rankingFIFA || 100), 0) / selecciones.length
  );
  const totalMundiales = selecciones.reduce((sum, s) => sum + s.mundiales, 0);
  const confeds = [...new Set(selecciones.map(s => s.confederacion))];
  const titulos = selecciones.reduce((sum, s) => {
    const match = s.mejorResultado.match(/Campeón\s*\((\d+)\)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  const stats = [
    { label: gsT.rankingPromedio as string, value: `#${avgRanking}`, icon: 'chart' },
    { label: gsT.mundialesTotal as string, value: `${totalMundiales}`, icon: 'trophy' },
    { label: gsT.confederaciones as string, value: confeds.join(', '), icon: 'globe' },
    { label: gsT.campeonatos as string, value: `${titulos}`, icon: 'star' },
  ];

  return (
    <AnimatedSection className="rounded-3xl p-6 border border-white/5" style={{ background: '#0B0F1A' }} y={20}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${groupColor}15` }}>
          <SvgIcon name="predicciones" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{gsT.statsTitle as string}</h3>
          <p className="text-sm text-gray-500">{gsT.statsDesc as string}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
            <div className="mb-1">{GROUP_STAT_ICONS[stat.icon]}</div>
            <p className="text-lg font-black text-white mt-1">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </AnimatedSection>
  );
}

/* ── Sedes del Grupo ──────────────────────────────────────────────── */
function SedesGrupo({ letter, groupColor, gsT }: {
  letter: string; groupColor: string;
  gsT: Record<string, string | Record<string, unknown>>;
}) {
  const groupMatches = MATCHES.filter(m => m.g === letter.toUpperCase());
  const venueNames = [...new Set(groupMatches.map(m => m.vn))];
  const sedes = SEDES.filter(s => venueNames.some(vn => vn.includes(s.estadio) || s.estadio.includes(vn) || s.gruposAsignados.includes(letter.toUpperCase())));

  // Fallback: if no sedes match by name, try by gruposAsignados
  const finalSedes = sedes.length > 0 ? sedes : SEDES.filter(s => s.gruposAsignados.includes(letter.toUpperCase()));

  if (finalSedes.length === 0) return null;

  return (
    <AnimatedSection className="rounded-3xl p-6 border border-white/5" style={{ background: '#0B0F1A' }} y={20}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${groupColor}15` }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: groupColor }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{gsT.sedesTitle as string}</h3>
          <p className="text-sm text-gray-500">{gsT.sedesDesc as string}</p>
        </div>
      </div>
      <div className="space-y-3">
        {finalSedes.map((sede) => (
          <Link
            key={sede.slug}
            href={`/sedes/${sede.slug}`}
            className="block p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
          >
            <div className="flex items-start gap-3">
              <FlagImage code={sede.paisCodigo} alt={sede.pais} width={32} className="rounded-sm shadow-sm mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm group-hover:text-gray-200 transition-colors">{sede.estadio}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sede.ciudad}, {sede.pais}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500">
                    {gsT.capacidad as string}: <span className="text-white font-medium">{sede.capacidad.toLocaleString()}</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${groupColor}15`, color: groupColor }}>
                    {sede.techoCerrado ? gsT.techoCerrado as string : gsT.techoAbierto as string}
                  </span>
                </div>
                {sede.clima && (
                  <p className="text-xs text-gray-500 mt-1.5">{sede.clima.junio}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AnimatedSection>
  );
}

/* ── Jugadores Clave ──────────────────────────────────────────────── */
const POS_COLORS: Record<string, string> = {
  POR: '#22c55e',
  DEF: '#3b82f6',
  MED: '#eab308',
  DEL: '#ef4444',
};

function KeyPlayersSection({ selecciones, groupColor, gsT }: {
  selecciones: Seleccion[]; groupColor: string;
  gsT: Record<string, string | Record<string, unknown>>;
}) {
  const extendedTeams: SeleccionExtended[] = [];
  for (const s of selecciones) {
    const ext = getExtendedSeleccion(s.slug);
    if (ext) extendedTeams.push(ext);
  }

  if (extendedTeams.length === 0) return null;

  return (
    <AnimatedSection className="rounded-3xl border border-white/5 overflow-hidden" style={{ background: '#0B0F1A' }} y={20}>
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3" style={{ background: `${groupColor}08` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${groupColor}20` }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: groupColor }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{gsT.jugadoresTitle as string}</h2>
          <p className="text-sm text-gray-500">{gsT.jugadoresDesc as string}</p>
        </div>
      </div>
      <div className="p-5 space-y-5">
        {extendedTeams.map((team) => (
          <div key={team.slug}>
            <div className="flex items-center gap-2 mb-3">
              <FlagImage code={team.flagCode} alt={team.nombre} width={24} className="rounded-sm" />
              <span className="text-sm font-bold text-white">{team.nombre}</span>
              {team.cuerpoTecnico?.dt && (
                <span className="text-xs text-gray-500 ml-auto">{gsT.entrenador as string}: {team.cuerpoTecnico.dt}</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(team.jugadoresClave || []).slice(0, 3).map((player) => {
                const posColor = POS_COLORS[player.posicion] || '#94a3b8';
                return (
                  <div key={player.nombre} className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${posColor}20`, color: posColor }}>
                        {player.posicion}
                      </span>
                      <span className="text-xs font-bold text-white truncate">{player.nombre}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{player.club}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {player.golesIntl > 0 && (
                        <span className="text-[10px] text-gray-400">
                          {player.golesIntl} {gsT.goles as string}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {player.internacionalidades} {gsT.partidos as string}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AnimatedSection>
  );
}

interface Props {
  letter: string;
  selecciones: Seleccion[];
}

export default function GrupoSlugClient({ letter, selecciones }: Props) {
  const { t } = useLanguage();
  const gT = t.grupos;
  const gsT = t.grupoSlug;
  const nav = t.nav;
  const ui = t.ui;

  const groupColor = getGroupColor(letter);
  const desc = gT.descriptions[letter as keyof typeof gT.descriptions] || '';
  const subtitle = gT.tags[letter as keyof typeof gT.tags] || '';

  // Generate all pairings for head-to-head
  const pairings: Array<[Seleccion, Seleccion]> = [];
  for (let i = 0; i < selecciones.length; i++) {
    for (let j = i + 1; j < selecciones.length; j++) {
      pairings.push([selecciones[i], selecciones[j]]);
    }
  }

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      {/* Top Color Bar */}
      <div style={{ height: '4px', background: groupColor }} />

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ padding: '16px 20px 60px' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.05)_0%,transparent_60%)]" />

        <div className="max-w-6xl mx-auto relative">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/grupos"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {ui.volver}
            </Link>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-white transition-colors">{nav.inicio}</Link>
              <span>/</span>
              <Link href="/grupos" className="hover:text-white transition-colors">{nav.grupos}</Link>
              <span>/</span>
              <span className="text-white font-medium">{ui.grupo} {letter}</span>
            </nav>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Large Letter Box */}
            <div
              className="w-[140px] h-[140px] rounded-3xl flex items-center justify-center font-black text-7xl flex-shrink-0"
              style={{ background: `${groupColor}20`, color: groupColor, border: `2px solid ${groupColor}40` }}
            >
              {letter}
            </div>

            <div className="flex-1 pt-2">
              {/* Subtitle Tag */}
              <span
                className="inline-block px-3 py-1.5 rounded-full text-xs font-bold mb-4 tracking-wide"
                style={{ background: `${groupColor}15`, color: groupColor, border: `1px solid ${groupColor}30` }}
              >
                {subtitle.toUpperCase()}
              </span>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                {ui.grupo} {letter}
              </h1>

              <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                {desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* Sponsor Banner */}
        <a
          href="mailto:info@sprintmarkt.com?subject=Publicidad%20en%20ZonaMundial%20-%20P%C3%A1gina%20Grupo&body=Hola%20equipo%20de%20ZonaMundial%2C%0A%0AMe%20interesa%20contratar%20un%20espacio%20publicitario%20en%20la%20p%C3%A1gina%20de%20Grupo.%0A%0AEmpresa%3A%20%0AContacto%3A%20%0APresupuesto%20estimado%3A%20%0A%0AQuedo%20a%20la%20espera%20de%20vuestra%20propuesta.%0A%0AGracias."
          className="w-full rounded-3xl flex flex-col items-center justify-center border border-dashed border-[#C9A84C]/30 py-4 hover:bg-[#C9A84C]/5 hover:border-[#C9A84C]/50 transition-all group"
          style={{ background: '#0B0F1A' }}
        >
          <p className="text-[#C9A84C]/60 text-sm font-bold tracking-widest uppercase mb-2 group-hover:text-[#C9A84C]/80">Espacio disponible para publicidad</p>
          <p className="text-gray-500 text-sm group-hover:text-gray-400">Contacta con nosotros → info@sprintmarkt.com</p>
        </a>

        <div className="h-8" />

        {/* DASHBOARD LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN - Fixture + Analysis + H2H + Players + Simulator */}
          <div className="lg:col-span-8 space-y-6">
            {/* Fixture */}
            <AnimatedSection y={20}>
              <CalendarioGrupo grupo={letter} groupColor={groupColor} />
            </AnimatedSection>

            {/* Group Analysis */}
            <AnalysisSection letter={letter} groupColor={groupColor} gsT={gsT as unknown as Record<string, string | Record<string, unknown>>} gT={gT as unknown as Record<string, unknown>} />

            {/* Head-to-head */}
            <AnimatedSection className="rounded-3xl border border-white/5 overflow-hidden" style={{ background: '#0B0F1A' }} y={20}>
              <div
                className="px-6 py-5 border-b border-white/5 flex items-center gap-3"
                style={{ background: `${groupColor}08` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${groupColor}20` }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: groupColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Face to face</h2>
                  <p className="text-sm text-gray-500">Historia y contexto de cada enfrentamiento</p>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {pairings.map(([a, b], i) => (
                  <HeadToHeadCard key={i} a={a} b={b} groupColor={groupColor} />
                ))}
              </div>
            </AnimatedSection>

            {/* Key Players */}
            <KeyPlayersSection selecciones={selecciones} groupColor={groupColor} gsT={gsT as unknown as Record<string, string | Record<string, unknown>>} />

            {/* Simulador Card */}
            <AnimatedSection className="rounded-3xl border border-white/5 overflow-hidden" style={{ background: '#0B0F1A' }} y={20}>
              <div
                className="px-6 py-5 border-b border-white/5 flex items-center justify-between"
                style={{ background: `${groupColor}08` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${groupColor}20` }}>
                    <SvgIcon name="predicciones" size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{gsT.simuladorGrupo} {letter}</h2>
                    <p className="text-sm text-gray-500">{gsT.simuladorDesc}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${groupColor}15`, color: groupColor }}>
                  {gsT.simuladorLabel}
                </span>
              </div>
              <div className="p-6">
                <SimuladorGrupos initialGroup={letter} />
              </div>
            </AnimatedSection>
          </div>

          {/* RIGHT COLUMN - Standings + Stats + Teams + Sedes + CTA + Other Groups */}
          <div className="lg:col-span-4 space-y-6">
            {/* Standings */}
            <AnimatedSection y={20}>
              <TablaClasificacion selecciones={selecciones} groupColor={groupColor} />
            </AnimatedSection>

            {/* Group Stats */}
            <GroupStats selecciones={selecciones} groupColor={groupColor} gsT={gsT as unknown as Record<string, string | Record<string, unknown>>} />

            {/* Teams List */}
            <AnimatedSection className="rounded-3xl p-6 border border-white/5" style={{ background: '#0B0F1A' }} y={20}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${groupColor}15` }}>
                  <SvgIcon name="48 selecciones" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{gT.stats.equipos}</h3>
                  <p className="text-sm text-gray-500">{selecciones.length} {ui.selecciones.toLowerCase()}</p>
                </div>
              </div>

              <div className="space-y-2">
                {selecciones.map((team, idx) => (
                  <Link
                    key={team.slug}
                    href={`/selecciones/${team.slug}`}
                    className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-white/5 group"
                  >
                    <span className="text-gray-600 text-sm font-mono w-5">{idx + 1}</span>
                    <FlagImage
                      code={team.flagCode}
                      alt={team.nombre}
                      width={40}
                      className="w-8 h-6 object-cover rounded shadow-md group-hover:scale-110 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate group-hover:text-gray-200 transition-colors">{team.nombre}</p>
                      <p className="text-xs text-gray-500">{team.confederacion}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {team.mejorResultado?.includes('Campeón') && <svg width="12" height="12" viewBox="0 0 24 24" fill="#facc15"><path d="M5 3h14l-1.5 6H20l-8 12v-8H7l2-10z"/></svg>}
                      {team.esAnfitrion && <svg width="12" height="12" viewBox="0 0 24 24" fill="#4ade80"><path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 3.5L18 12h-1.5v6h-9v-6H6L12 5.5z"/></svg>}
                    </div>
                  </Link>
                ))}
              </div>
            </AnimatedSection>

            {/* Sedes del Grupo */}
            <SedesGrupo letter={letter} groupColor={groupColor} gsT={gsT as unknown as Record<string, string | Record<string, unknown>>} />

            {/* CTA Card */}
            <AnimatedSection className="rounded-3xl p-6 border" style={{ background: `${groupColor}10`, borderColor: `${groupColor}30` }} y={20}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${groupColor}20` }}>
                <SvgIcon name="predicciones" size={32} />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{gsT.quienGanara}</h3>
              <p className="text-sm text-gray-400 mb-5">{gsT.quienGanaraDesc}</p>
              <Link
                href="/registro"
                className="block w-full py-3.5 rounded-xl text-center font-bold transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: groupColor, color: '#030712' }}
              >
                {gsT.crearPrediccion}
              </Link>
            </AnimatedSection>

            {/* Other Groups */}
            <AnimatedSection className="rounded-3xl p-6 border border-white/5" style={{ background: '#0B0F1A' }} y={20}>
              <h3 className="text-lg font-bold text-white mb-4">{gsT.otrosGrupos}</h3>
              <div className="grid grid-cols-6 gap-2">
                {VALID_GROUPS.filter(g => g !== letter.toLowerCase()).map((g) => {
                  const gColor = getGroupColor(g);
                  return (
                    <Link
                      key={g}
                      href={`/grupos/grupo-${g}`}
                      className="aspect-square flex items-center justify-center rounded-xl font-bold text-sm transition-all hover:scale-105"
                      style={{ background: `${gColor}15`, color: gColor, border: `1px solid ${gColor}30` }}
                    >
                      {g.toUpperCase()}
                    </Link>
                  );
                })}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}

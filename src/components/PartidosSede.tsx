"use client";

import { useState, useEffect } from 'react';
import { getPartidosByEstadio } from '@/data/calendario';
import { getSeleccionBySlug } from '@/data/selecciones';
import FlagImage from '@/components/FlagImage';
import { SvgIcon } from '@/components/icons';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
  estadio: string;
  accentColor?: string;
}

export default function PartidosSede({ estadio, accentColor = '#c9a84c' }: Props) {
  const { t } = useLanguage();
  const isEN = t.nav.selecciones === '48 Teams';
  const [timezone, setTimezone] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setMounted(true);
  }, []);

  const partidos = getPartidosByEstadio(estadio).sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  if (partidos.length === 0) return null;

  const labels = isEN
    ? { title: 'Matches at this venue', subtitle: 'Times in your local timezone', group: 'Group', vs: 'vs', yourTz: 'Your timezone' }
    : { title: 'Partidos en esta sede', subtitle: 'Horarios en tu zona horaria local', group: 'Grupo', vs: 'vs', yourTz: 'Tu zona horaria' };

  const locale = isEN ? 'en-US' : 'es-ES';

  function formatDate(fecha: string) {
    if (!mounted) return { date: '...', time: '...' };
    const d = new Date(fecha);
    const tz = timezone || undefined;
    return {
      date: d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }),
      time: d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: tz }),
    };
  }

  return (
    <div className="rounded-3xl border border-white/5 overflow-hidden" style={{ background: '#0B0F1A' }}>
      {/* Header */}
      <div className="px-5 sm:px-6 py-5 border-b border-white/5" style={{ background: `${accentColor}08` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}20` }}>
            <SvgIcon name="formato 2026" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{labels.title}</h2>
            <p className="text-sm text-gray-500">{partidos.length} {isEN ? 'matches' : 'partidos'} · {labels.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Mobile: horizontal scroll cards */}
      <div className="sm:hidden p-4">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4">
          {partidos.map((partido) => {
            const home = getSeleccionBySlug(partido.homeSlug);
            const away = getSeleccionBySlug(partido.awaySlug);
            const { date, time } = formatDate(partido.fecha);
            if (!home || !away) return null;

            return (
              <div
                key={partido.id}
                className="snap-start flex-shrink-0 w-[280px] p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-gray-400 uppercase tracking-wider">
                    {labels.group} {partido.grupo}
                  </span>
                  {mounted ? (
                    <span className="text-sm font-bold" style={{ color: accentColor }}>{time}</span>
                  ) : (
                    <div className="h-4 w-12 rounded bg-white/5 animate-pulse" />
                  )}
                </div>

                <div className="text-xs text-gray-500 mb-3">{mounted ? date : <span className="inline-block h-3 w-20 rounded bg-white/5 animate-pulse" />}</div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <FlagImage code={home.flagCode} alt={home.nombre} width={32} className="w-8 h-6 object-cover rounded shadow-sm" />
                    <span className="text-xs font-medium text-white text-center line-clamp-1">{home.nombre}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">VS</span>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <FlagImage code={away.flagCode} alt={away.nombre} width={32} className="w-8 h-6 object-cover rounded shadow-sm" />
                    <span className="text-xs font-medium text-white text-center line-clamp-1">{away.nombre}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: list */}
      <div className="hidden sm:block p-4 sm:p-6 space-y-3">
        {partidos.map((partido) => {
          const home = getSeleccionBySlug(partido.homeSlug);
          const away = getSeleccionBySlug(partido.awaySlug);
          const { date, time } = formatDate(partido.fecha);

          if (!home || !away) return null;

          return (
            <div
              key={partido.id}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
            >
              {/* Date/Time */}
              <div className="flex-shrink-0 text-center min-w-[80px]">
                {mounted ? (
                  <>
                    <p className="text-xs text-gray-500">{date}</p>
                    <p className="text-sm font-bold" style={{ color: accentColor }}>{time}</p>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-14 bg-white/5 rounded animate-pulse mx-auto mb-1" />
                    <div className="h-4 w-10 bg-white/5 rounded animate-pulse mx-auto" />
                  </>
                )}
              </div>

              {/* Teams */}
              <div className="flex-1 flex items-center justify-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-sm font-medium text-white truncate">{home.nombre}</span>
                  <FlagImage code={home.flagCode} alt={home.nombre} width={28} className="w-7 h-5 object-cover rounded shadow-sm flex-shrink-0" />
                </div>
                <span className="text-xs text-gray-600 font-bold px-1">{labels.vs}</span>
                <div className="flex items-center gap-2 flex-1">
                  <FlagImage code={away.flagCode} alt={away.nombre} width={28} className="w-7 h-5 object-cover rounded shadow-sm flex-shrink-0" />
                  <span className="text-sm font-medium text-white truncate">{away.nombre}</span>
                </div>
              </div>

              {/* Group badge */}
              <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-gray-400">
                {labels.group} {partido.grupo}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timezone indicator */}
      {mounted && timezone && (
        <div className="px-5 sm:px-6 py-3 border-t border-white/5 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#6a7a9a"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg>
          <p className="text-xs text-gray-600">{labels.yourTz}: <span className="text-gray-400">{timezone}</span></p>
        </div>
      )}
    </div>
  );
}

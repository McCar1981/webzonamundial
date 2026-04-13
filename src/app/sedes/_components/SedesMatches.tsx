'use client';

import { useMemo } from 'react';
import { SEDES } from '@/data/sedes';
import { MATCHES } from '@/data/matches';
import { useLanguage } from '@/i18n/LanguageContext';

function formatDateShort(dateStr: string, locale: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' });
}

export function SedesMatches() {
  const { t, locale } = useLanguage();
  const sT = t.sedes;

  const byVenue = useMemo(() => {
    const map = new Map<string, typeof SEDES[0]>();
    SEDES.forEach((sede) => {
      map.set(sede.estadio.toLowerCase().trim(), sede);
    });

    const matches = MATCHES.filter((m) => m.p === 'Fase de grupos'); // mostrar solo fase de grupos para no saturar? o todos
    // Mejor mostrar todos, pero limitar a los primeros 3 por sede y un "+N más"
    const groups = new Map<string, typeof MATCHES>();
    matches.forEach((m) => {
      const key = m.vn.toLowerCase().trim();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    });

    // Mapear cada grupo a su sede
    const result: Array<{ sede: typeof SEDES[0]; matches: typeof MATCHES }> = [];
    SEDES.forEach((sede) => {
      const key = sede.estadio.toLowerCase().trim();
      const list = groups.get(key) || [];
      if (list.length > 0) {
        result.push({ sede, matches: list });
      }
    });
    return result;
  }, []);

  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0B1825] to-[#0F1D32] p-5 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c9a84c]/20 bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5">
          <span className="text-lg">⚽</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{sT.matchesTitle}</h3>
          <p className="text-xs text-[#6a7a9a]">{sT.matchesSub}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {byVenue.map(({ sede, matches }) => {
          const visible = matches.slice(0, 3);
          const remaining = matches.length - 3;
          return (
            <div
              key={sede.slug}
              className="rounded-xl border border-white/5 bg-[#060B14] p-4 transition hover:border-[#c9a84c]/20"
            >
              <div className="mb-3 flex items-center gap-2">
                <img
                  src={`https://flagcdn.com/w40/${sede.paisCodigo.toLowerCase()}.png`}
                  alt={sede.pais}
                  className="h-4 w-6 rounded object-cover"
                />
                <p className="text-sm font-bold text-white">{sede.nombre}</p>
              </div>
              <div className="space-y-2">
                {visible.map((m) => (
                  <div
                    key={m.i}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <img
                        src={`https://flagcdn.com/w20/${m.hf}.png`}
                        alt={m.h}
                        className="h-3 w-4 rounded-sm object-cover"
                      />
                      <span className="text-[#CBD5E1]">vs</span>
                      <img
                        src={`https://flagcdn.com/w20/${m.af}.png`}
                        alt={m.a}
                        className="h-3 w-4 rounded-sm object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-[#6a7a9a]">
                      {formatDateShort(m.d, locale)} · {m.t}
                    </span>
                  </div>
                ))}
                {remaining > 0 && (
                  <p className="text-[10px] text-[#6a7a9a]">+{remaining} {locale === 'en' ? 'more' : 'más'}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useLanguage } from '@/i18n/LanguageContext';

const CONFEDERACIONES = ['Todas', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  conf: string;
  onConfChange: (v: string) => void;
  hostsOnly: boolean;
  onHostsOnlyChange: (v: boolean) => void;
  resultCount: number;
  onClear: () => void;
}

export function SeleccionFilters({
  search,
  onSearchChange,
  conf,
  onConfChange,
  hostsOnly,
  onHostsOnlyChange,
  resultCount,
  onClear,
}: Props) {
  const { t } = useLanguage();
  const sT = t.selecciones;

  const hasFilters = search || conf !== 'Todas' || hostsOnly;

  return (
    <div className="sticky top-0 z-20 -mx-3 mb-6 border-y border-white/5 bg-[#060B14]/95 px-3 py-3 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3"
      >
        {/* Top row: search + actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1"
          >
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a7a9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={sT.buscarPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-[#0B1825] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/20"
            />
          </div>

          <div className="flex items-center gap-3"
          >
            <button
              onClick={() => onHostsOnlyChange(!hostsOnly)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                hostsOnly
                  ? 'border-[#c9a84c]/40 bg-[#c9a84c]/15 text-[#c9a84c]'
                  : 'border-white/10 bg-[#0B1825] text-[#8a94b0] hover:border-white/20'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {sT.soloAnfitriones}
            </button>

            {hasFilters && (
              <button
                onClick={onClear}
                className="text-sm font-semibold text-[#c9a84c] hover:underline"
              >
                {sT.limpiar}
              </button>
            )}
          </div>
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap gap-2"
        >
          {CONFEDERACIONES.map((c) => {
            const active = conf === c;
            return (
              <button
                key={c}
                onClick={() => onConfChange(c)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'border-[#c9a84c]/40 bg-[#c9a84c]/15 text-[#c9a84c]'
                    : 'border-white/10 bg-[#0B1825] text-[#8a94b0] hover:border-white/20 hover:text-white'
                }`}
              >
                {c === 'Todas' ? sT.confederacion : c}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        <div className="text-xs text-[#6a7a9a]"
        >
          <span className="font-semibold text-white"
          >{resultCount}</span> {resultCount === 1 ? 'selección' : 'selecciones'}
        </div>
      </div>
    </div>
  );
}

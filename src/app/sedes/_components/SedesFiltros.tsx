'use client';

import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
  pais: string;
  onPaisChange: (v: string) => void;
  fase: string;
  onFaseChange: (v: string) => void;
  techo: string;
  onTechoChange: (v: string) => void;
  onClear: () => void;
}

const PAISES = ['Todos', 'Estados Unidos', 'México', 'Canadá'];
const FASES = [
  'Todas',
  'Fase de grupos',
  'Octavos',
  'Cuartos',
  'Semifinal',
  'FINAL',
];

export function SedesFiltros({
  pais,
  onPaisChange,
  fase,
  onFaseChange,
  techo,
  onTechoChange,
  onClear,
}: Props) {
  const { t, locale } = useLanguage();
  const sT = t.sedes;

  const hasFilters = pais !== 'Todos' || fase !== 'Todas' || techo !== 'Todos';

  return (
    <div className="sticky top-0 z-20 -mx-3 mb-6 border-y border-white/5 bg-[#060B14]/95 px-3 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* País */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6a7a9a]">{sT.filtroPais}</span>
            <select
              value={pais}
              onChange={(e) => onPaisChange(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0B1825] px-3 py-2 text-sm text-white outline-none focus:border-[#c9a84c]/50"
            >
              <option value="Todos">{sT.todosLosPaises}</option>
              {PAISES.slice(1).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Fase */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6a7a9a]">{sT.filtroFase}</span>
            <select
              value={fase}
              onChange={(e) => onFaseChange(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0B1825] px-3 py-2 text-sm text-white outline-none focus:border-[#c9a84c]/50"
            >
              <option value="Todas">{sT.todasLasFases}</option>
              {FASES.slice(1).map((f) => (
                <option key={f} value={f}>
                  {f === 'FINAL' ? 'Final' : f}
                </option>
              ))}
            </select>
          </div>

          {/* Techo */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6a7a9a]">{sT.filtroTecho}</span>
            <select
              value={techo}
              onChange={(e) => onTechoChange(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0B1825] px-3 py-2 text-sm text-white outline-none focus:border-[#c9a84c]/50"
            >
              <option value="Todos">{locale === 'en' ? 'All' : 'Todos'}</option>
              <option value="true">{sT.conTecho}</option>
              <option value="false">{sT.sinTecho}</option>
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={onClear}
              className="ml-auto text-sm font-semibold text-[#c9a84c] hover:underline"
            >
              {sT.limpiarFiltros}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

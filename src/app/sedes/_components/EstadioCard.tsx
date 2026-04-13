'use client';

import Link from 'next/link';
import { SEDES } from '@/data/sedes';
import { useLanguage } from '@/i18n/LanguageContext';
import { STADIUM_IMAGES } from './stadium-images';
import { SvgIcon } from '@/components/icons';

interface Props {
  sede: typeof SEDES[0];
}

export function EstadioCard({ sede }: Props) {
  const { t } = useLanguage();
  const sT = t.sedes;

  const imageUrl = STADIUM_IMAGES[sede.slug];
  const isFinal = sede.fasesQueAlberga.includes('FINAL');
  const isSemifinal = sede.fasesQueAlberga.includes('Semifinal');
  const isInaugural = sede.partidosDestacados.some((p) =>
    p.toLowerCase().includes('inaugur')
  );

  return (
    <Link
      href={`/sedes/${sede.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/5 bg-[#0B1825] transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a84c]/30 hover:shadow-[0_8px_32px_rgba(201,168,76,0.12)]"
    >
      {/* Imagen del estadio */}
      <div className="relative h-44 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={sede.estadio}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0F1D32] to-[#1a2a3f]">
            <SvgIcon name="match center" size={48} className="inline-block opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          {isFinal && (
            <span className="rounded-full bg-[#c9a84c] px-2.5 py-1 text-[10px] font-black text-[#060B14] shadow-lg">
              FINAL
            </span>
          )}
          {isSemifinal && !isFinal && (
            <span className="rounded-full bg-[#c9a84c]/90 px-2.5 py-1 text-[10px] font-black text-[#060B14] shadow-lg">
              SEMIFINAL
            </span>
          )}
          {isInaugural && (
            <span className="rounded-full bg-green-500 px-2.5 py-1 text-[10px] font-black text-white shadow-lg">
              INAUGURACIÓN
            </span>
          )}
          {sede.techoCerrado && (
            <span className="rounded-full bg-blue-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
              TECHO
            </span>
          )}
        </div>

        {/* Bandera del país */}
        <div className="absolute left-3 top-3">
          <img
            src={`https://flagcdn.com/w80/${sede.paisCodigo.toLowerCase()}.png`}
            alt={sede.pais}
            className="h-6 w-9 rounded border border-white/20 object-cover shadow-lg"
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className="text-base font-bold leading-tight text-white transition-colors group-hover:text-[#c9a84c]">
          {sede.nombre}
        </h3>
        <p className="mt-0.5 text-sm text-[#6a7a9a]">{sede.estadio}</p>

        {/* Stats grid */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-[#060B14] p-2 text-center">
            <p className="text-[10px] uppercase text-[#6a7a9a]">{sT.capacidad}</p>
            <p className="text-sm font-bold text-[#c9a84c]">{sede.capacidad.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-[#060B14] p-2 text-center">
            <p className="text-[10px] uppercase text-[#6a7a9a]">{sT.partidos}</p>
            <p className="text-sm font-bold text-white">{sede.totalPartidos}</p>
          </div>
          <div className="rounded-lg bg-[#060B14] p-2 text-center">
            <p className="text-[10px] uppercase text-[#6a7a9a]">{sT.clima}</p>
            <p className="text-sm font-bold text-white">{sede.clima.tempMedia}</p>
          </div>
        </div>

        {/* Fases */}
        <div className="mb-2 mt-3 flex flex-wrap gap-1">
          {sede.fasesQueAlberga.slice(0, 3).map((fase) => (
            <span
              key={fase}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                fase === 'FINAL' || fase === 'Semifinal'
                  ? 'border border-[#c9a84c]/30 bg-[#c9a84c]/15 text-[#c9a84c]'
                  : 'bg-white/5 text-[#8a94b0]'
              }`}
            >
              {fase}
            </span>
          ))}
          {sede.fasesQueAlberga.length > 3 && (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[#6a7a9a]">
              +{sede.fasesQueAlberga.length - 3}
            </span>
          )}
        </div>

        {/* Hover indicator */}
        <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
          <span className="text-xs text-[#6a7a9a] transition-colors group-hover:text-[#c9a84c]">
            {sT.verGuia}
          </span>
          <span className="text-[#c9a84c] transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}

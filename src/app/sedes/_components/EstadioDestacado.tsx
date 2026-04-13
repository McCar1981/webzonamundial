'use client';

import Link from 'next/link';
import { SEDES } from '@/data/sedes';
import { useLanguage } from '@/i18n/LanguageContext';
import { STADIUM_IMAGES } from './stadium-images';
import { SvgIcon } from '@/components/icons';

interface Props {
  sede: typeof SEDES[0];
  badge: string;
  badgeColor: string;
}

export function EstadioDestacado({ sede, badge, badgeColor }: Props) {
  const { t } = useLanguage();
  const sT = t.sedes;
  const imageUrl = STADIUM_IMAGES[sede.slug];

  return (
    <Link
      href={`/sedes/${sede.slug}`}
      className="group relative block overflow-hidden rounded-3xl border-2 border-[#c9a84c]/30 transition-all duration-300 hover:border-[#c9a84c]/60"
    >
      {/* Background image */}
      <div className="relative h-64 overflow-hidden md:h-72">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={sede.estadio}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0F1D32] to-[#1a2a3f]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        {/* Badge */}
        <span
          className="absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-black shadow-lg"
          style={{ background: badgeColor, color: badgeColor === '#c9a84c' ? '#060B14' : '#fff' }}
        >
          {badge}
        </span>

        {/* Bandera */}
        <img
          src={`https://flagcdn.com/w80/${sede.paisCodigo.toLowerCase()}.png`}
          alt={sede.pais}
          className="mb-3 h-7 w-10 rounded border border-white/20 object-cover shadow-lg"
        />

        <h3 className="text-xl font-black text-white transition-colors group-hover:text-[#c9a84c] md:text-2xl">
          {sede.nombre}
        </h3>
        <p className="mb-3 text-base text-[#8a94b0]">{sede.estadio}</p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#6a7a9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <div>
              <p className="text-xs text-[#6a7a9a]">{sT.capacidad}</p>
              <p className="text-base font-bold text-[#c9a84c]">{sede.capacidad.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SvgIcon name="match center" size={28} className="inline-block" />
            <div>
              <p className="text-xs text-[#6a7a9a]">{sT.partidos}</p>
              <p className="text-base font-bold text-white">{sede.totalPartidos}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SvgIcon name="streaming" size={28} className="inline-block" />
            <div>
              <p className="text-xs text-[#6a7a9a]">{sT.clima}</p>
              <p className="text-base font-bold text-white">{sede.clima.tempMedia}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

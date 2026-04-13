'use client';

import { useState } from 'react';
import { SEDES } from '@/data/sedes';
import { useLanguage } from '@/i18n/LanguageContext';
import { STADIUM_IMAGES } from './stadium-images';

interface Props {
  sedes: typeof SEDES[0][];
}

export function SedesTravelTabs({ sedes }: Props) {
  const { t } = useLanguage();
  const sT = t.sedes;
  const ssT = t.sedeSlug;
  const [active, setActive] = useState(sedes[0]?.slug || '');

  const sede = sedes.find((s) => s.slug === active);
  if (!sede) return null;

  const imageUrl = STADIUM_IMAGES[sede.slug];

  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0B1825] to-[#0F1D32] p-5 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c9a84c]/20 bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5">
          <span className="text-lg">✈️</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{sT.travelTitle}</h3>
          <p className="text-xs text-[#6a7a9a]">{sT.travelSub}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {sedes.map((s) => {
          const isActive = active === s.slug;
          return (
            <button
              key={s.slug}
              onClick={() => setActive(s.slug)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? 'border-[#c9a84c]/40 bg-[#c9a84c]/15 text-[#c9a84c]'
                  : 'border-white/10 bg-[#060B14] text-[#8a94b0] hover:border-white/20 hover:text-white'
              }`}
            >
              {s.nombre}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="relative h-48 overflow-hidden rounded-xl md:h-auto">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={sede.estadio}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0F1D32] to-[#1a2a3f]">
              <span className="text-4xl">🏟️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B14]/80 to-transparent" />
          <div className="absolute bottom-3 left-3">
            <p className="text-lg font-black text-white">{sede.estadio}</p>
            <p className="text-sm text-[#c9a84c]">{sede.ciudad}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-[#060B14] p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-[#6a7a9a]">{ssT.labelVisa}</p>
            <p className="text-sm font-medium text-white">{sede.guiaViaje.visa}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#060B14] p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-[#6a7a9a]">{ssT.labelIdioma}</p>
            <p className="text-sm font-medium text-white">{sede.guiaViaje.idioma}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#060B14] p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-[#6a7a9a]">{ssT.labelMoneda}</p>
            <p className="text-sm font-medium text-white">{sede.guiaViaje.moneda}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#060B14] p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-[#6a7a9a]">{ssT.labelAlEstadio}</p>
            <p className="text-sm font-medium text-white">{sede.transporte.distanciaEstadio}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#060B14] p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-[#6a7a9a]">{ssT.labelAeropuerto}</p>
            <p className="text-sm font-medium text-white">{sede.transporte.aeropuerto}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#060B14] p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-[#6a7a9a]">{sT.guiaFanZone}</p>
            <p className="text-sm font-medium text-white">{sede.guiaViaje.fanZone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

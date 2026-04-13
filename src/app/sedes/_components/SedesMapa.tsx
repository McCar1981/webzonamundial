'use client';

import { useState } from 'react';
import { SEDES } from '@/data/sedes';
import { useLanguage } from '@/i18n/LanguageContext';

// Proyección aproximada de lat/lng a porcentajes dentro del contenedor
function project(lat: number, lng: number) {
  const x = ((lng + 130) / 75) * 100; // lng de -130 a -55
  const y = ((55 - lat) / 40) * 100;  // lat de 15 a 55
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

const PAIS_COLORS: Record<string, string> = {
  'Estados Unidos': '#3b82f6',
  'México': '#22c55e',
  'Canadá': '#ef4444',
};

export function SedesMapa() {
  const { t } = useLanguage();
  const sT = t.sedes;
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full rounded-2xl border border-white/5 bg-[#0B1825] p-4 md:p-6 overflow-hidden">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c9a84c]/20 bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5">
          <svg className="w-5 h-5 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} /><path strokeWidth={2} d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{sT.mapaTitle}</h3>
          <p className="text-xs text-[#6a7a9a]">{sT.mapaSub}</p>
        </div>
      </div>

      <div className="relative aspect-[16/9] w-full rounded-xl bg-[#060B14]">
        {/* Grid sutil */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10%" height="10%" patternUnits="objectBoundingBox">
              <path d="M 10% 0 L 10% 10% M 0 10% L 10% 10%" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Siluetas muy aproximadas de los 3 países */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Canadá */}
          <path
            d="M10 8 L25 5 L55 5 L80 8 L88 18 L80 24 L60 22 L40 22 L20 24 L10 18 Z"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.3"
          />
          {/* USA */}
          <path
            d="M15 24 L28 20 L48 18 L72 20 L84 26 L82 44 L76 54 L68 64 L55 68 L42 64 L34 54 L26 46 L18 38 L15 24 Z"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.3"
          />
          {/* México */}
          <path
            d="M34 58 L44 56 L50 62 L46 74 L38 78 L30 74 L28 64 Z"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.3"
          />
        </svg>

        {/* Puntos de sedes */}
        {SEDES.map((sede) => {
          const pos = project(sede.coordenadas.lat, sede.coordenadas.lng);
          const isHovered = hovered === sede.slug;
          const color = PAIS_COLORS[sede.pais] || '#c9a84c';
          return (
            <a
              key={sede.slug}
              href={`/sedes/${sede.slug}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onMouseEnter={() => setHovered(sede.slug)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className={`inline-block rounded-full border transition-all duration-300 ${
                  isHovered ? 'scale-150' : 'scale-100'
                }`}
                style={{
                  width: isHovered ? 14 : 10,
                  height: isHovered ? 14 : 10,
                  background: color,
                  borderColor: 'rgba(255,255,255,0.8)',
                  boxShadow: `0 0 ${isHovered ? 16 : 8}px ${color}`,
                }}
              />
              {/* Tooltip */}
              {isHovered && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 min-w-[8rem] -translate-x-1/2 rounded-lg border border-white/10 bg-[#060B14] px-3 py-2 text-center shadow-xl">
                  <p className="text-xs font-bold text-white">{sede.nombre}</p>
                  <p className="text-[10px] text-[#6a7a9a]">{sede.estadio}</p>
                </div>
              )}
            </a>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        {Object.entries(PAIS_COLORS).map(([pais, color]) => (
          <div key={pais} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs text-[#8a94b0]">{pais}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

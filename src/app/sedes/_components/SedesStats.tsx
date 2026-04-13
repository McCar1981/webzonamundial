'use client';

import { SEDES } from '@/data/sedes';
import { useLanguage } from '@/i18n/LanguageContext';

const STAT_ICONS: Record<string, React.ReactNode> = {
  stadium: (
    <svg className="w-6 h-6 text-[#c9a84c] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
    </svg>
  ),
  people: (
    <svg className="w-6 h-6 text-[#c9a84c] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ball: (
    <svg className="w-6 h-6 text-[#c9a84c] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
      <path strokeWidth={1.8} d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10zM2 12h20" />
    </svg>
  ),
  roof: (
    <svg className="w-6 h-6 text-[#c9a84c] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  ),
};

export function SedesStats() {
  const { t } = useLanguage();
  const sT = t.sedes;

  const totalCapacidad = SEDES.reduce((sum, s) => sum + s.capacidad, 0);
  const totalPartidos = SEDES.reduce((sum, s) => sum + s.totalPartidos, 0);
  const conTecho = SEDES.filter((s) => s.techoCerrado).length;

  const items = [
    { value: SEDES.length.toString(), label: sT.statsSedes, icon: 'stadium' },
    { value: totalCapacidad.toLocaleString(), label: sT.statsCapacidad, icon: 'people' },
    { value: totalPartidos.toString(), label: sT.statsPartidos, icon: 'ball' },
    { value: conTecho.toString(), label: sT.filtroTecho, icon: 'roof' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/5 bg-[#0B1825] p-4 text-center transition hover:border-[#c9a84c]/20"
        >
          <div className="mb-1">{STAT_ICONS[item.icon]}</div>
          <p className="text-xl font-black text-[#c9a84c]">{item.value}</p>
          <p className="text-xs text-[#6a7a9a]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

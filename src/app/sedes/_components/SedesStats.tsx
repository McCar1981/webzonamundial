'use client';

import { SEDES } from '@/data/sedes';
import { useLanguage } from '@/i18n/LanguageContext';

export function SedesStats() {
  const { t } = useLanguage();
  const sT = t.sedes;

  const totalCapacidad = SEDES.reduce((sum, s) => sum + s.capacidad, 0);
  const totalPartidos = SEDES.reduce((sum, s) => sum + s.totalPartidos, 0);
  const conTecho = SEDES.filter((s) => s.techoCerrado).length;

  const items = [
    { value: SEDES.length.toString(), label: sT.statsSedes, icon: '🏟️' },
    { value: totalCapacidad.toLocaleString(), label: sT.statsCapacidad, icon: '👥' },
    { value: totalPartidos.toString(), label: sT.statsPartidos, icon: '⚽' },
    { value: conTecho.toString(), label: sT.filtroTecho, icon: '🏠' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/5 bg-[#0B1825] p-4 text-center transition hover:border-[#c9a84c]/20"
        >
          <div className="mb-1 text-2xl">{item.icon}</div>
          <p className="text-xl font-black text-[#c9a84c]">{item.value}</p>
          <p className="text-xs text-[#6a7a9a]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

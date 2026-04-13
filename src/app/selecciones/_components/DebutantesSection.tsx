'use client';

import Link from 'next/link';
import FlagImage from '@/components/FlagImage';
import { useLanguage } from '@/i18n/LanguageContext';

interface Team {
  slug: string;
  nombre: string;
  flagCode: string;
  confederacion: string;
  esAnfitrion?: boolean;
}

export function DebutantesSection({ teams }: { teams: Team[] }) {
  const { t } = useLanguage();
  const sT = t.selecciones;

  const debutantes = teams.filter((t) => ['haiti', 'cabo-verde', 'uzbekistan', 'jordania', 'rd-congo'].includes(t.slug));
  const anfitriones = teams.filter((t) => t.esAnfitrion);

  return (
    <section className="mb-16">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/20 to-amber-600/5">
          <span className="text-xl">⭐</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white md:text-3xl">{sT.debutantesTitle}</h2>
          <p className="text-sm text-[#6a7a9a]">{sT.debutantesSub}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Debutantes */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0B1825] to-[#0F1D32] p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#c9a84c]">Debutantes</h3>
          <div className="flex flex-wrap gap-3">
            {debutantes.map((team) => (
              <Link
                key={team.slug}
                href={`/selecciones/${team.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-[#060B14] px-3 py-2 transition hover:border-[#c9a84c]/30"
              >
                <FlagImage
                  code={team.flagCode}
                  alt={team.nombre}
                  width={48}
                  className="h-6 w-9 rounded object-cover shadow"
                />
                <span className="text-sm font-semibold text-white group-hover:text-[#c9a84c]">{team.nombre}</span>
                <span className="text-[10px] text-[#6a7a9a]">{team.confederacion}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Anfitriones */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0B1825] to-[#0F1D32] p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#c9a84c]">Anfitriones</h3>
          <div className="flex flex-wrap gap-3">
            {anfitriones.map((team) => (
              <Link
                key={team.slug}
                href={`/selecciones/${team.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-[#060B14] px-3 py-2 transition hover:border-[#c9a84c]/30"
              >
                <FlagImage
                  code={team.flagCode}
                  alt={team.nombre}
                  width={48}
                  className="h-6 w-9 rounded object-cover shadow"
                />
                <span className="text-sm font-semibold text-white group-hover:text-[#c9a84c]">{team.nombre}</span>
                <span className="rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/15 px-2 py-0.5 text-[10px] font-bold text-[#c9a84c]">2026</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

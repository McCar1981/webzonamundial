'use client';

import Link from 'next/link';
import FlagImage from '@/components/FlagImage';
import { useLanguage } from '@/i18n/LanguageContext';

interface Team {
  slug: string;
  nombre: string;
  emoji?: string;
  grupo: string;
  esAnfitrion?: boolean;
  esPlayoff?: boolean;
  rankingFIFA?: number;
  mundiales: number;
  mejorResultado: string;
  confederacion: string;
  flagCode: string;
}

function ConfederacionBadge({ conf }: { conf: string }) {
  const colors: Record<string, string> = {
    UEFA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    CONMEBOL: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    CONCACAF: 'bg-red-500/10 text-red-400 border-red-500/20',
    CAF: 'bg-green-500/10 text-green-400 border-green-500/20',
    AFC: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    OFC: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${colors[conf] || colors.UEFA}`}>
      {conf}
    </span>
  );
}

export function SeleccionCard({ team }: { team: Team }) {
  const { t } = useLanguage();
  const sT = t.selecciones;

  return (
    <Link
      href={`/selecciones/${team.slug}`}
      className="group relative block rounded-2xl border border-white/5 bg-[#0B1825] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a84c]/40 hover:shadow-[0_12px_40px_rgba(201,168,76,0.15)]"
    >
      {/* Top accent line */}
      <div className="absolute left-0 right-0 top-0 h-0.5 scale-x-0 rounded-t-2xl bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent transition-transform duration-300 group-hover:scale-x-100" />

      {/* Header: flag + badges */}
      <div className="mb-4 flex items-start justify-between">
        <FlagImage
          code={team.flagCode}
          alt={`Bandera de ${team.nombre}`}
          width={128}
          className="h-11 w-16 rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-105"
          fallback={team.emoji}
        />
        <div className="flex flex-col items-end gap-1.5">
          {team.esAnfitrion && (
            <span className="flex items-center gap-1 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/15 px-2 py-0.5 text-[10px] font-bold text-[#c9a84c]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 3.5L18 12h-1.5v6h-9v-6H6L12 5.5z"/></svg>
              2026
            </span>
          )}
          {team.esPlayoff && (
            <span className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-400">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg>
              PO
            </span>
          )}
        </div>
      </div>

      {/* Name + conf */}
      <h3 className="mb-1 truncate text-base font-bold text-white transition-colors group-hover:text-[#c9a84c]">
        {team.nombre}
      </h3>
      <div className="mb-4">
        <ConfederacionBadge conf={team.confederacion} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#060B14]/60 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#6a7a9a]">FIFA</p>
          <p className="text-lg font-bold text-white">#{team.rankingFIFA || 'TBD'}</p>
        </div>
        <div className="rounded-xl bg-[#060B14]/60 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#6a7a9a]">Grupo</p>
          <p className="text-lg font-bold text-[#c9a84c]">{team.grupo}</p>
        </div>
        <div className="rounded-xl bg-[#060B14]/60 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#6a7a9a]">{sT.mundialesJugados}</p>
          <p className="text-base font-bold text-white">{team.mundiales}</p>
        </div>
        <div className="rounded-xl bg-[#060B14]/60 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#6a7a9a]">{sT.mejorResultado}</p>
          <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{team.mejorResultado}</p>
        </div>
      </div>
    </Link>
  );
}

// Server Component
// Sección 7 (parte 1): Grupo asignado en Mundial 2026 + 3 rivales.

import Link from "next/link";
import type { NationalTeam } from "@/types/team";

export default function GroupSection({ team }: { team: NationalTeam }) {
  const group = team.wc_2026?.group_2026;
  if (!group?.letter || !group.teams?.length) return null;

  const rivals = group.teams.filter((t) => t.iso !== team.iso);
  const groupSlug = `grupo-${group.letter.toLowerCase()}`;

  return (
    <section
      id="grupo"
      className="rounded-2xl border border-[#1E293B]/50 p-6 sm:p-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.6), rgba(11,24,37,0.4))",
      }}
    >
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">
            Su grupo · Mundial 2026
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Grupo {group.letter}
          </h2>
          {group.label ? (
            <p className="text-sm text-gray-400 mt-1">{group.label}</p>
          ) : null}
        </div>
        <Link
          href={`/grupos/${groupSlug}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 text-[#C9A84C] text-xs font-bold uppercase tracking-wider hover:bg-[#C9A84C]/10 transition-all"
        >
          Ver grupo y simulador
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rivals.map((r) => (
          <Link
            key={r.iso}
            href={`/selecciones/${slugFromName(r.name)}`}
            className="group rounded-xl border border-[#1E293B]/60 bg-[#0B1825]/50 p-4 transition-all hover:border-[#C9A84C]/30 hover:bg-[#C9A84C]/5"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-12 h-9 rounded-md overflow-hidden flex-shrink-0 border border-white/5"
                style={{ background: "#0B1825" }}
              >
                <img
                  src={`https://flagcdn.com/w160/${r.iso}.png`}
                  alt={`Bandera de ${r.name}`}
                  className="w-full h-full object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white group-hover:text-[#C9A84C] transition-colors truncate">
                  {r.name}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {r.fifa_rank ? `FIFA #${r.fifa_rank}` : "FIFA #—"}
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-600 group-hover:text-[#C9A84C] transition-colors flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {group.notes ? (
        <p className="text-[11px] text-gray-600 mt-4 italic">{group.notes}</p>
      ) : null}
    </section>
  );
}

/**
 * Convierte el nombre del rival a slug coherente con la web.
 * NOTA: hoy esto es heurístico. Cuando tengamos los 48 JSON BIBLIA
 * la función ideal lee el `slug` del JSON correspondiente. Por ahora
 * sanitiza el nombre.
 */
function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

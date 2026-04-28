// Server Component
// Sección 7 (parte 2): los 3 partidos de fase de grupos del equipo en Mundial 2026.

import type { NationalTeam, WCMatch2026 } from "@/types/team";

export default function ScheduleSection({ team }: { team: NationalTeam }) {
  const matches = team.wc_2026?.schedule;
  if (!matches?.length) return null;

  return (
    <section
      id="schedule"
      className="rounded-2xl border border-[#1E293B]/50 p-6 sm:p-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.6), rgba(11,24,37,0.4))",
      }}
    >
      <div className="mb-6">
        <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">
          Sus partidos · Fase de grupos
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Los 3 partidos de {team.name_es}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {matches.map((m, i) => (
          <MatchCard key={i} match={m} ourIso={team.iso} />
        ))}
      </div>

      <p className="text-[11px] text-gray-600 mt-4 italic">
        Calendario sujeto a confirmación oficial de FIFA. Ya en vivo en{" "}
        <span className="text-gray-400">/grupos</span> con los datos del sorteo.
      </p>
    </section>
  );
}

function MatchCard({
  match,
  ourIso,
}: {
  match: WCMatch2026;
  ourIso: string;
}) {
  const dateLabel = formatDate(match.date);
  const venueLabel =
    match.venue?.stadium && !match.venue.stadium.startsWith("[")
      ? `${match.venue.stadium}${match.venue.city ? ` · ${match.venue.city}` : ""}`
      : "Sede por confirmar";

  return (
    <article className="rounded-xl border border-[#1E293B]/60 bg-[#0B1825]/50 p-5 transition-all hover:border-[#C9A84C]/30">
      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
        <span>Jornada {match.matchday}</span>
        <span
          className={
            match.status === "live"
              ? "text-green-400"
              : match.status === "finished"
              ? "text-gray-500"
              : "text-[#C9A84C]"
          }
        >
          {match.status === "live"
            ? "● En vivo"
            : match.status === "finished"
            ? "Finalizado"
            : "Por jugar"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Local */}
        <TeamCell iso={ourIso} />
        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
          vs
        </span>
        {/* Visitante */}
        <TeamCell iso={match.opponent.iso} name={match.opponent.name} />
      </div>

      <div className="text-center text-sm text-white font-semibold mb-1">
        {dateLabel}
      </div>
      {match.kickoff_local || match.kickoff_madrid ? (
        <div className="text-center text-[11px] text-gray-500 mb-3">
          {match.kickoff_local ? `${match.kickoff_local} local` : null}
          {match.kickoff_local && match.kickoff_madrid ? " · " : null}
          {match.kickoff_madrid ? `${match.kickoff_madrid} Madrid` : null}
        </div>
      ) : null}

      <div className="text-center text-[11px] text-gray-500 pt-3 border-t border-white/5">
        {venueLabel}
      </div>
    </article>
  );
}

function TeamCell({ iso, name }: { iso: string; name?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <span className="w-12 h-9 rounded-md overflow-hidden border border-white/5">
        <img
          src={`https://flagcdn.com/w160/${iso}.png`}
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
        />
      </span>
      {name ? (
        <span className="text-xs font-semibold text-white text-center truncate w-full">
          {name}
        </span>
      ) : null}
    </div>
  );
}

function formatDate(raw: string | undefined): string {
  if (!raw || raw.startsWith("[")) return "Fecha por confirmar";
  // Acepta YYYY-MM-DD o ISO completo
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

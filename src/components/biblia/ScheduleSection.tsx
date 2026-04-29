import type { NationalTeam, WCMatch2026 } from "@/types/team";
import SectionCard, { SectionHeader } from "./SectionCard";

export default function ScheduleSection({ team }: { team: NationalTeam }) {
  const matches = team.wc_2026?.schedule;
  if (!matches?.length) return null;

  return (
    <SectionCard id="schedule">
      <SectionHeader
        eyebrow="Sus partidos · Fase de grupos"
        title={`Los 3 partidos de ${team.name_es}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {matches.map((m, i) => (
          <MatchCard key={i} match={m} ourIso={team.iso} />
        ))}
      </div>

      <p className="text-[11px] text-[var(--bb-text-dim)] mt-4 italic">
        Calendario sujeto a confirmación oficial de FIFA. Ya en vivo en{" "}
        <span className="text-[var(--bb-text-muted)]">/grupos</span> con los datos del sorteo.
      </p>
    </SectionCard>
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
    <article
      className="rounded-xl border p-5 transition-all hover:border-[var(--bb-gold)]/30"
      style={{
        borderColor: "var(--bb-border-subtle)",
        background: "var(--bb-card-ghost)",
      }}
    >
      <div className="flex items-center justify-between text-[10px] font-bold text-[var(--bb-text-muted)] uppercase tracking-widest mb-4">
        <span>Jornada {match.matchday}</span>
        <span
          className={
            match.status === "live"
              ? "text-green-400"
              : match.status === "finished"
              ? "text-[var(--bb-text-muted)]"
              : "text-[var(--bb-gold)]"
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
        <TeamCell iso={ourIso} />
        <span className="text-xs font-bold text-[var(--bb-text-dim)] uppercase tracking-widest">
          vs
        </span>
        <TeamCell iso={match.opponent.iso} name={match.opponent.name} />
      </div>

      <div className="text-center text-sm text-white font-semibold mb-1">
        {dateLabel}
      </div>
      {match.kickoff_local || match.kickoff_madrid ? (
        <div className="text-center text-[11px] text-[var(--bb-text-muted)] mb-3">
          {match.kickoff_local ? `${match.kickoff_local} local` : null}
          {match.kickoff_local && match.kickoff_madrid ? " · " : null}
          {match.kickoff_madrid ? `${match.kickoff_madrid} Madrid` : null}
        </div>
      ) : null}

      <div className="text-center text-[11px] text-[var(--bb-text-muted)] pt-3 border-t border-white/5">
        {venueLabel}
      </div>
    </article>
  );
}

function TeamCell({ iso, name }: { iso: string; name?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <span
        className="w-12 h-9 rounded-md overflow-hidden border border-white/5"
        aria-hidden
      >
        <img
          src={`https://flagcdn.com/w160/${iso}.png`}
          alt=""
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
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

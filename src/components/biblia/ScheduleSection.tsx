import type { NationalTeam, WCMatch2026 } from "@/types/team";
import SectionCard, { SectionHeader } from "./SectionCard";
import KickoffDisplay from "./KickoffDisplay";

export default function ScheduleSection({ team }: { team: NationalTeam }) {
  const matches = team.wc_2026?.schedule;
  if (!matches?.length) return null;

  return (
    <SectionCard id="schedule">
      <SectionHeader
        eyebrow="Sus partidos · Fase de grupos"
        title={`Los 3 partidos de ${team.name_es}`}
        subtitle="Las horas se muestran en tu zona horaria local. Pulsa el icono para alternar a la hora del estadio."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {matches.map((m, i) => (
          <MatchCard key={i} match={m} ourIso={team.iso} />
        ))}
      </div>

      <p className="text-[11px] text-[var(--bb-text-dim)] mt-4 italic">
        Datos oficiales de FIFA Mundial 2026 — sorteo confirmado. Ya en vivo en{" "}
        <span className="text-[var(--bb-text-muted)]">/grupos</span> y{" "}
        <span className="text-[var(--bb-text-muted)]">/calendario</span>.
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
  const venueLabel =
    match.venue?.stadium && !match.venue.stadium.startsWith("[")
      ? `${match.venue.stadium}${match.venue.city ? ` · ${match.venue.city}` : ""}`
      : "Sede por confirmar";

  const hasKickoff =
    match.date &&
    !match.date.startsWith("[") &&
    match.kickoff_local &&
    !match.kickoff_local.startsWith("[");

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
        <span
          className="text-xs font-bold text-[var(--bb-text-dim)] uppercase tracking-widest"
          aria-hidden
        >
          vs
        </span>
        <TeamCell iso={match.opponent.iso} name={match.opponent.name} />
      </div>

      {/* Hora multi-zona */}
      <div className="mb-3">
        {hasKickoff && match.kickoff_local && match.date ? (
          <KickoffDisplay
            localDate={match.date}
            localTime={match.kickoff_local}
            city={match.venue?.city}
            countryIso={match.venue?.country_iso}
          />
        ) : (
          <div className="text-center text-sm text-white font-semibold">
            Fecha por confirmar
          </div>
        )}
      </div>

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

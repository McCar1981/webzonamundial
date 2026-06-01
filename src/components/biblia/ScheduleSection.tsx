import type { NationalTeam } from "@/types/team";
import SectionCard, { SectionHeader } from "./SectionCard";
import KickoffDisplay from "./KickoffDisplay";
import { MATCHES, type Match } from "@/data/matches";
import { buildKickoffDate, resolveVenueTimezone } from "@/lib/timezone";
import { SOURCE_TZ } from "@/lib/bracket/match-time";

// Convierte un instante UTC a la hora de pared (YYYY-MM-DD / HH:MM) en una
// zona dada. KickoffDisplay reconstruye el UTC a partir de estos valores.
function wallClock(utc: Date, tz: string): { date: string; time: string } {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(utc);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(utc);
  return { date, time };
}

export default function ScheduleSection({ team }: { team: NationalTeam }) {
  // Fuente única de verdad: el calendario oficial FIFA (src/data/matches.ts).
  // Derivamos los 3 partidos de fase de grupos por el ISO de la selección,
  // así evitamos depender de los datos (a veces incompletos) del JSON de la
  // ficha y mostramos siempre fecha, hora y sede reales.
  const groupMatches = MATCHES.filter(
    (m) =>
      m.p === "Fase de grupos" && (m.hf === team.iso || m.af === team.iso),
  ).sort((a, b) => a.j - b.j);

  if (!groupMatches.length) return null;

  return (
    <SectionCard id="schedule">
      <SectionHeader
        eyebrow="Sus partidos · Fase de grupos"
        title={`Los 3 partidos de ${team.name_es}`}
        subtitle="Las horas se muestran en tu zona horaria local. Pulsa el icono para alternar a la hora del estadio."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {groupMatches.map((m) => (
          <MatchCard key={m.i} match={m} ourIso={team.iso} />
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

function MatchCard({ match, ourIso }: { match: Match; ourIso: string }) {
  const weAreHome = match.hf === ourIso;
  const opponentIso = weAreHome ? match.af : match.hf;
  const opponentName = weAreHome ? match.a : match.h;

  const venueTz = resolveVenueTimezone(match.vc, match.vf);
  const utc = buildKickoffDate(match.d, match.t, SOURCE_TZ);
  const kickoff = utc ? wallClock(utc, venueTz) : null;
  const venueLabel = `${match.vn}${match.vc ? ` · ${match.vc}` : ""}`;

  return (
    <article
      className="rounded-xl border p-5 transition-all hover:border-[var(--bb-gold)]/30"
      style={{
        borderColor: "var(--bb-border-subtle)",
        background: "var(--bb-card-ghost)",
      }}
    >
      <div className="flex items-center justify-between text-[10px] font-bold text-[var(--bb-text-muted)] uppercase tracking-widest mb-4">
        <span>Jornada {match.j}</span>
        <span className="text-[var(--bb-gold)]">Por jugar</span>
      </div>

      <div className="flex items-center justify-between gap-2 mb-4">
        <TeamCell iso={ourIso} />
        <span
          className="text-xs font-bold text-[var(--bb-text-dim)] uppercase tracking-widest"
          aria-hidden
        >
          vs
        </span>
        <TeamCell iso={opponentIso} name={opponentName} />
      </div>

      {/* Hora multi-zona */}
      <div className="mb-3">
        {kickoff ? (
          <KickoffDisplay
            localDate={kickoff.date}
            localTime={kickoff.time}
            city={match.vc}
            countryIso={match.vf}
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

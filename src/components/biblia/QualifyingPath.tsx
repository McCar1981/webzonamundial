// Server Component
// Sección 4 — Camino al Mundial 2026 (eliminatorias).
// La sección más diferenciadora de la BIBLIA según el blueprint:
// resumen narrativo + stats globales + tabla de TODOS los partidos
// + top goleadores + mejor/peor/decisivo.

import type {
  NationalTeam,
  QualifyingMatch,
  MatchStats,
} from "@/types/team";

export default function QualifyingPath({ team }: { team: NationalTeam }) {
  const q = team.wc_2026?.qualifying;
  const summary = team.wc_2026?.qualifying_summary;
  if (!q) return null;

  const matches = q.matches ?? [];
  const ourIso = team.iso;

  return (
    <section
      id="clasificacion"
      className="rounded-2xl border border-[#1E293B]/50 p-6 sm:p-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.6), rgba(11,24,37,0.4))",
      }}
    >
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">
            Camino al Mundial · Eliminatorias 2026
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Cómo llegó {team.name_es} al Mundial
          </h2>
          {q.format ? (
            <p className="text-sm text-gray-400 mt-1">
              {q.confederation_round} · {q.format}
            </p>
          ) : null}
        </div>
        {q.final_position ? (
          <div
            className="rounded-xl border px-4 py-2 text-center"
            style={{
              borderColor: "rgba(201,168,76,0.3)",
              background: "rgba(201,168,76,0.08)",
            }}
          >
            <div className="text-3xl font-black text-[#C9A84C] leading-none">
              #{q.final_position}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">
              Posición final
            </div>
          </div>
        ) : null}
      </div>

      {/* Resumen narrativo */}
      {summary ? (
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-8 pl-4 border-l-2 border-[#C9A84C]/40 italic">
          {summary}
        </p>
      ) : null}

      {/* Stats globales */}
      {q.stats ? <StatsGrid stats={q.stats} /> : null}

      {/* Best / Worst / Decisive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
        <Highlight
          label="Mejor partido"
          tone="ok"
          matchRef={resolveMatchRef(q.best_match?.match_ref, matches, ourIso)}
          reason={q.best_match?.reason}
        />
        <Highlight
          label="Peor partido"
          tone="bad"
          matchRef={resolveMatchRef(q.worst_match?.match_ref, matches, ourIso)}
          reason={q.worst_match?.reason}
        />
        <Highlight
          label="Partido decisivo"
          tone="decisive"
          matchRef={resolveMatchRef(q.decisive_match?.match_ref, matches, ourIso)}
          reason={q.decisive_match?.reason}
        />
      </div>

      {/* Tabla de partidos */}
      {matches.length > 0 ? (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              {matches.length} partidos disputados
            </h3>
            <div className="text-[11px] text-gray-500">
              DT durante el ciclo:{" "}
              <span className="text-gray-300 font-semibold">
                {q.coach_during_qualifying ?? "—"}
              </span>
            </div>
          </div>
          <MatchesTable matches={matches} ourIso={ourIso} />
        </div>
      ) : null}

      {/* Top scorers */}
      {q.top_scorers && q.top_scorers.length > 0 ? (
        <div className="mt-10">
          <h3 className="text-lg font-bold text-white mb-4">
            Goleadores en eliminatorias
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.top_scorers.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[#1E293B]/60 bg-[#0B1825]/50 p-3"
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{
                    background: i === 0
                      ? "linear-gradient(135deg, #C9A84C, #A8893D)"
                      : "rgba(201,168,76,0.1)",
                    color: i === 0 ? "#030712" : "#C9A84C",
                  }}
                >
                  {s.goals}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">
                    {s.player}
                  </div>
                  {s.notes ? (
                    <div className="text-[11px] text-gray-500 truncate">
                      {s.notes}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ─────── Stats grid ─────── */

function StatsGrid({ stats }: { stats: MatchStats }) {
  const items: Array<{ label: string; value: string | number; accent?: boolean }> =
    [
      { label: "PJ", value: stats.played },
      { label: "PG", value: stats.won, accent: true },
      { label: "PE", value: stats.drawn },
      { label: "PP", value: stats.lost },
      { label: "GF", value: stats.goals_for },
      { label: "GC", value: stats.goals_against },
    ];
  if (typeof stats.points === "number") {
    items.push({ label: "Puntos", value: stats.points, accent: true });
  }
  if (typeof stats.win_percentage === "number") {
    items.push({
      label: "% Victorias",
      value: `${stats.win_percentage.toFixed(1)}%`,
    });
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border p-3 text-center"
          style={{
            borderColor: it.accent
              ? "rgba(201,168,76,0.3)"
              : "rgba(255,255,255,0.05)",
            background: it.accent
              ? "rgba(201,168,76,0.06)"
              : "rgba(11,24,37,0.5)",
          }}
        >
          <div
            className={`text-xl sm:text-2xl font-black leading-none ${
              it.accent ? "text-[#C9A84C]" : "text-white"
            }`}
          >
            {it.value}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1.5 font-semibold">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────── Highlight (best / worst / decisive) ─────── */

function Highlight({
  label,
  tone,
  matchRef,
  reason,
}: {
  label: string;
  tone: "ok" | "bad" | "decisive";
  matchRef: { home: string; away: string; date: string } | null;
  reason: string | undefined;
}) {
  if (!reason) return null;
  const palette =
    tone === "ok"
      ? { border: "rgba(34,197,94,0.25)", bg: "rgba(34,197,94,0.05)", chip: "#22c55e" }
      : tone === "bad"
      ? { border: "rgba(239,68,68,0.25)", bg: "rgba(239,68,68,0.05)", chip: "#ef4444" }
      : { border: "rgba(201,168,76,0.3)", bg: "rgba(201,168,76,0.06)", chip: "#C9A84C" };

  return (
    <article
      className="rounded-xl border p-4"
      style={{ borderColor: palette.border, background: palette.bg }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-widest mb-2"
        style={{ color: palette.chip }}
      >
        {label}
      </div>
      {matchRef ? (
        <div className="text-sm font-bold text-white mb-2">
          {matchRef.home} <span className="text-gray-500">vs</span> {matchRef.away}
          <span className="text-gray-500 font-normal ml-2">· {matchRef.date}</span>
        </div>
      ) : null}
      <p className="text-xs text-gray-300 leading-relaxed">{reason}</p>
    </article>
  );
}

function resolveMatchRef(
  ref: string | undefined,
  matches: QualifyingMatch[],
  _ourIso: string
): { home: string; away: string; date: string } | null {
  if (!ref) return null;
  // ref tipo "matchday_14"
  const m = /^matchday_(\d+)$/.exec(ref);
  if (!m) return null;
  const md = parseInt(m[1], 10);
  const match = matches.find((x) => x.matchday === md);
  if (!match) return null;
  return {
    home: match.home.name,
    away: match.away.name,
    date: formatShortDate(match.date),
  };
}

/* ─────── Matches table ─────── */

function MatchesTable({
  matches,
  ourIso,
}: {
  matches: QualifyingMatch[];
  ourIso: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#1E293B]/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#0B1825]/70 text-[10px] uppercase tracking-wider text-gray-500">
            <th className="text-left font-semibold py-3 px-3">J</th>
            <th className="text-left font-semibold py-3 px-3">Fecha</th>
            <th className="text-right font-semibold py-3 px-3">Local</th>
            <th className="text-center font-semibold py-3 px-2">Resultado</th>
            <th className="text-left font-semibold py-3 px-3">Visitante</th>
            <th className="text-left font-semibold py-3 px-3 hidden md:table-cell">
              Sede
            </th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m, i) => {
            const ourSide: "home" | "away" =
              m.home.iso === ourIso ? "home" : "away";
            const us = ourSide === "home" ? m.home : m.away;
            const them = ourSide === "home" ? m.away : m.home;
            const result =
              us.score > them.score
                ? "win"
                : us.score < them.score
                ? "loss"
                : "draw";
            const resultColor =
              result === "win"
                ? "text-green-400"
                : result === "loss"
                ? "text-red-400"
                : "text-gray-400";

            return (
              <tr
                key={i}
                className="border-t border-[#1E293B]/40 hover:bg-[#0B1825]/40 transition-colors"
              >
                <td className="py-2.5 px-3 text-gray-500 font-mono">{m.matchday}</td>
                <td className="py-2.5 px-3 text-gray-300 whitespace-nowrap">
                  {formatShortDate(m.date)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <TeamLabel
                    iso={m.home.iso}
                    name={m.home.name}
                    isUs={m.home.iso === ourIso}
                    align="right"
                  />
                </td>
                <td
                  className={`py-2.5 px-2 text-center font-black tracking-tight ${resultColor}`}
                >
                  {m.home.score} – {m.away.score}
                </td>
                <td className="py-2.5 px-3">
                  <TeamLabel
                    iso={m.away.iso}
                    name={m.away.name}
                    isUs={m.away.iso === ourIso}
                  />
                </td>
                <td className="py-2.5 px-3 text-gray-500 text-xs hidden md:table-cell">
                  <div className="truncate max-w-[200px]">
                    {m.venue.stadium}
                  </div>
                  {m.venue.city ? (
                    <div className="text-[10px] text-gray-600 truncate">
                      {m.venue.city}
                    </div>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TeamLabel({
  iso,
  name,
  isUs,
  align = "left",
}: {
  iso: string;
  name: string;
  isUs: boolean;
  align?: "left" | "right";
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${
        align === "right" ? "flex-row-reverse" : ""
      }`}
    >
      <img
        src={`https://flagcdn.com/w40/${iso}.png`}
        alt=""
        aria-hidden
        className="w-5 h-3.5 object-cover rounded-sm"
      />
      <span
        className={`text-xs font-semibold whitespace-nowrap ${
          isUs ? "text-[#C9A84C]" : "text-gray-300"
        }`}
      >
        {name}
      </span>
    </span>
  );
}

function formatShortDate(raw: string | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

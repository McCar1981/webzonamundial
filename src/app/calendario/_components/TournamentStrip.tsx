"use client";

// TournamentStrip — banda fina de estado del torneo (sustituye al countdown
// de panel completo: el hero compacto no puede gastar 300px en una cuenta
// atrás). Tres estados:
//   1. Antes del saque inaugural → cuenta atrás en una línea.
//   2. Torneo en marcha → "HOY · n partidos · primer saque HH:MM" (o "n EN
//      VIVO" si hay balón rodando) + botón que salta al día de hoy.
//   3. Torneo acabado → cierre con CTA al Match Center.

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import useCountdown from "@/hooks/useCountdown";

const LIVE_RED = "#ff6b57";

interface TournamentStripProps {
  /** true cuando ya pasó la ventana de la final (estado 3). */
  tournamentOver: boolean;
  /** Partidos del día local del usuario (sin filtros). */
  todayCount: number;
  /** Hora local del próximo saque de hoy ("18:00"), o null si no queda ninguno. */
  nextKickoff: string | null;
  /** Partidos EN JUEGO ahora mismo según el feed en vivo. */
  liveCount: number;
  /** Hay sección de hoy a la que saltar. */
  canJumpToToday: boolean;
  onVerHoy: () => void;
}

export function TournamentStrip({
  tournamentOver,
  todayCount,
  nextKickoff,
  liveCount,
  canJumpToToday,
  onVerHoy,
}: TournamentStripProps) {
  const { t } = useLanguage();
  const cT = t.calendario;
  const { d, h, m, s, done } = useCountdown();

  const shell =
    "relative flex flex-wrap items-center justify-center gap-x-4 gap-y-2 overflow-hidden rounded-2xl border px-4 py-3 sm:justify-between";

  // ── Estado 1: cuenta atrás compacta ──────────────────────────────────────
  if (!done) {
    const cells: [number, string][] = [
      [d, cT.dias],
      [h, cT.horas],
      [m, cT.minutos],
      [s, cT.segundos],
    ];
    return (
      <div
        className={`${shell} border-[#c9a84c]/25`}
        style={{ background: "linear-gradient(120deg, rgba(201,168,76,0.12), rgba(15,29,50,0.6))" }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e8d48b]">
          {cT.inauguracion}
        </p>
        <div className="flex items-center gap-1.5">
          {cells.map(([value, label]) => (
            <div
              key={label}
              className="flex min-w-[3.4rem] flex-col items-center rounded-lg border border-[#c9a84c]/20 bg-[#060B14]/60 px-2 py-1"
            >
              <span className="text-base font-black tabular-nums leading-tight text-white">
                {String(value).padStart(2, "0")}
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-wider text-[#8a94b0]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Estado 3: torneo finalizado ──────────────────────────────────────────
  if (tournamentOver) {
    return (
      <div
        className={`${shell} border-white/10`}
        style={{ background: "linear-gradient(120deg, rgba(201,168,76,0.08), rgba(15,29,50,0.6))" }}
      >
        <p className="text-sm font-bold text-[#8a94b0]">🏆 {cT.torneoFinalizado}</p>
        <Link
          href="/app/matchcenter"
          className="text-sm font-extrabold text-[#c9a84c] no-underline hover:underline"
        >
          {cT.verMatchCenter}
        </Link>
      </div>
    );
  }

  // ── Estado 2: torneo en marcha ───────────────────────────────────────────
  const playing = liveCount > 0;
  return (
    <div
      className={`${shell} ${playing ? "border-[#ff6b57]/30" : "border-[#c9a84c]/25"}`}
      style={{
        background: playing
          ? "linear-gradient(120deg, rgba(255,107,87,0.10), rgba(15,29,50,0.6))"
          : "linear-gradient(120deg, rgba(201,168,76,0.12), rgba(15,29,50,0.6))",
      }}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-2 text-sm font-black text-white">
          {playing && (
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ background: LIVE_RED }}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: LIVE_RED }} />
            </span>
          )}
          <span className="rounded-md bg-[#c9a84c]/15 px-2 py-0.5 text-xs font-black tracking-wide text-[#c9a84c]">
            {cT.hoy}
          </span>
          {todayCount} {todayCount === 1 ? cT.partido : cT.partidosHoy}
        </span>
        <span className="text-[13px] text-[#8a94b0]">
          {playing ? (
            <strong className="font-extrabold" style={{ color: LIVE_RED }}>
              {liveCount} {cT.enVivo}
            </strong>
          ) : nextKickoff ? (
            <>
              {cT.primerSaque}{" "}
              <strong className="font-extrabold text-[#e8d48b]">{nextKickoff}</strong>
            </>
          ) : null}
        </span>
      </div>
      {canJumpToToday && (
        <button
          onClick={onVerHoy}
          className="rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#e8d48b] px-4 py-1.5 text-xs font-extrabold text-[#060B14] transition-transform hover:scale-[1.03]"
        >
          {cT.verHoy} ↓
        </button>
      )}
    </div>
  );
}

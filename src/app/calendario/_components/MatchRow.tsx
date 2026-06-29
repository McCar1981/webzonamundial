"use client";

// MatchRow — fila de agenda para escritorio: hora · equipos · estado/marcador
// · fase/estadio. Sustituye al grid de tarjetas de 340px, que dejaba los días
// de 1-2 partidos como dos tarjetitas flotando en un lienzo vacío.

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { matchSlug } from "@/lib/match-center/slug";
import { PHASE_COLORS, flagUrl, GOLD } from "@/data/matches";
import type { Match } from "@/data/matches";
import { matchInstant, fmtTime } from "@/lib/calendario/time";
import { isFinished, isLive, type LiveLite } from "@/lib/calendario/live";

const LIVE_RED = "#ff6b57";

interface MatchRowProps {
  m: Match;
  tz: string;
  live?: LiveLite;
  onClick: () => void;
}

function Flag({ code }: { code: string }) {
  return code && code !== "tbd" ? (
    <Image
      src={flagUrl(code, 80)!}
      alt=""
      width={26}
      height={18}
      className="h-[18px] w-[26px] flex-shrink-0 rounded-[3px] border border-white/10 object-cover"
      unoptimized
    />
  ) : (
    <span className="flex h-[18px] w-[26px] flex-shrink-0 items-center justify-center rounded-[3px] bg-white/5 text-[10px] text-[#6a7a9a]">
      ?
    </span>
  );
}

export function MatchRow({ m, tz, live, onClick }: MatchRowProps) {
  const { t } = useLanguage();
  const cT = t.calendario;

  const isImportant = m.p === "FINAL" || m.p === "Semifinal";
  const phaseColor = PHASE_COLORS[m.p] || GOLD;
  const playing = isLive(live);
  const ended = isFinished(live);
  const instant = matchInstant(m);
  const localTime = instant ? fmtTime(instant, tz) : m.t;

  return (
    <div
      id={`match-${m.i}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group grid cursor-pointer grid-cols-[64px_minmax(0,1fr)] items-center gap-x-4 border-b border-white/5 px-4 py-3 transition-colors last:border-b-0 hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none lg:grid-cols-[64px_minmax(0,1fr)_minmax(0,260px)]`}
      style={{
        background: playing
          ? "linear-gradient(90deg, rgba(255,107,87,0.07), transparent 55%)"
          : isImportant
            ? "linear-gradient(90deg, rgba(201,168,76,0.07), transparent 55%)"
            : undefined,
        scrollMarginTop: 76,
      }}
    >
      {/* Hora local / estado */}
      <div className="flex flex-col items-start">
        {playing ? (
          <>
            <span className="flex items-center gap-1.5 text-[15px] font-black tabular-nums" style={{ color: LIVE_RED }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute h-full w-full animate-ping rounded-full opacity-75" style={{ background: LIVE_RED }} />
                <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: LIVE_RED }} />
              </span>
              {live!.s === "HT" ? "HT" : `${live!.el}'`}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: LIVE_RED }}>
              {live!.s === "HT" ? cT.descanso : cT.enVivo}
            </span>
          </>
        ) : (
          <>
            <span className={`text-[15px] font-black tabular-nums ${ended ? "text-[#6a7a9a]" : "text-[#c9a84c]"}`}>
              {ended ? (live!.s === "PEN" ? cT.penales : cT.finalizado) : localTime}
            </span>
            {ended && <span className="text-[10px] tabular-nums text-[#4a5570]">{localTime}</span>}
          </>
        )}
      </div>

      {/* Equipos + marcador */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
          <span className="truncate text-[14.5px] font-bold text-[#e6e9f2] group-hover:text-white">
            {m.h}
          </span>
          <Flag code={m.hf} />
        </div>
        {playing || ended ? (
          <span
            className="flex-shrink-0 rounded-lg px-2.5 py-0.5 text-[15px] font-black tabular-nums"
            style={{
              color: playing ? LIVE_RED : "#e8d48b",
              background: playing ? "rgba(255,107,87,0.10)" : "rgba(201,168,76,0.10)",
            }}
          >
            {live!.sc[0]} – {live!.sc[1]}
          </span>
        ) : (
          <span className="flex-shrink-0 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10px] font-black text-[#6a7a9a]">
            VS
          </span>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Flag code={m.af} />
          <span className="truncate text-[14.5px] font-bold text-[#e6e9f2] group-hover:text-white">
            {m.a}
          </span>
        </div>
      </div>

      {/* Meta: fase/grupo + estadio (solo pantallas anchas) */}
      <div className="hidden min-w-0 items-center justify-end gap-2 lg:flex">
        {m.g ? (
          <span className="flex-shrink-0 rounded-md bg-[#c9a84c]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#c9a84c]">
            {cT.grupo.toUpperCase()} {m.g} · J{m.j}
          </span>
        ) : (
          <span
            className="flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
            style={{ color: phaseColor, background: `${phaseColor}15` }}
          >
            {cT.phases[m.p] ?? m.p}
          </span>
        )}
        <span className="truncate text-[11.5px] text-[#5d6b89]">
          {m.vn}
          {m.vc ? ` · ${m.vc}` : ""}
        </span>
        {m.hf !== "tbd" && m.af !== "tbd" && m.i < 9000 && matchSlug(m.i) && (
          <Link
            href={`/partido/${matchSlug(m.i)}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 whitespace-nowrap text-[11px] font-bold text-[#c9a84c] hover:underline"
          >
            Ficha
          </Link>
        )}
        <svg
          className="h-3.5 w-3.5 flex-shrink-0 text-[#4a5570] transition-all group-hover:translate-x-0.5 group-hover:text-[#c9a84c]"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

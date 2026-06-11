"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import FlagImage from "@/components/FlagImage";
import { getPartidosByGrupo } from "@/data/calendario";
import { getSeleccionBySlug } from "@/data/selecciones";
import type { Partido } from "@/data/calendario";
import { isFinished, isLive, type LiveMap } from "@/lib/calendario/live";

interface Props {
  grupo: string;
  groupColor: string;
  /** Estado en vivo (matchId → marcador/estado). Vacío fuera del torneo. */
  liveMap?: LiveMap;
}

const LIVE_RED = "#ff6b57";

export default function CalendarioGrupo({ grupo, groupColor, liveMap = {} }: Props) {
  const { locale, t } = useLanguage();
  const [timezone, setTimezone] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setMounted(true);
  }, []);

  const isEN = t.nav.selecciones === "48 Teams";
  const labels = isEN
    ? {
        title: "Match Schedule",
        subtitle: "Times in your local timezone",
        matchday: "Matchday",
        vs: "vs",
        yourTz: "Your timezone",
        finished: "FT",
        live: "LIVE",
        ht: "HT",
        pen: "PENS",
      }
    : {
        title: "Calendario de partidos",
        subtitle: "Horarios en tu zona horaria local",
        matchday: "Jornada",
        vs: "vs",
        yourTz: "Tu zona horaria",
        finished: "Final",
        live: "En vivo",
        ht: "Descanso",
        pen: "Penales",
      };

  const partidos = useMemo(() => getPartidosByGrupo(grupo), [grupo]);

  const jornadasMap = useMemo(() => {
    const map = new Map<number, Partido[]>();
    for (const p of partidos) {
      const arr = map.get(p.jornada) || [];
      arr.push(p);
      map.set(p.jornada, arr);
    }
    return map;
  }, [partidos]);

  const jornadas = useMemo(
    () => Array.from(jornadasMap.entries()).sort((a, b) => a[0] - b[0]),
    [jornadasMap]
  );

  function formatDate(fecha: string, tz: string): string {
    return new Date(fecha).toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: tz,
    });
  }

  function formatTime(fecha: string, tz: string): string {
    return new Date(fecha).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
    });
  }

  function getTeamName(slug: string): string {
    const sel = getSeleccionBySlug(slug);
    return sel?.nombre ?? slug;
  }

  function getTeamFlag(slug: string): string {
    const sel = getSeleccionBySlug(slug);
    return sel?.flagCode ?? "";
  }

  return (
    <div
      className="rounded-3xl border border-white/5 overflow-hidden"
      style={{ background: "#0B0F1A" }}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          {/* Calendar icon */}
          <svg
            className="w-5 h-5 flex-shrink-0"
            style={{ color: groupColor }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-bold text-white">{labels.title}</h3>
        </div>
        <p className="text-sm text-gray-400 ml-8">{labels.subtitle}</p>
      </div>

      {/* Jornadas */}
      <div className="p-4 sm:p-6 space-y-6">
        {jornadas.map(([jornada, matches]) => (
          <div key={jornada}>
            {/* Jornada header */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="h-px flex-1"
                style={{ background: `${groupColor}30` }}
              />
              <span
                className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full"
                style={{
                  color: groupColor,
                  background: `${groupColor}15`,
                  border: `1px solid ${groupColor}30`,
                }}
              >
                {labels.matchday} {jornada}
              </span>
              <div
                className="h-px flex-1"
                style={{ background: `${groupColor}30` }}
              />
            </div>

            {/* Match cards */}
            <div className="space-y-3">
              {matches.map((partido) => {
                const homeName = getTeamName(partido.homeSlug);
                const awayName = getTeamName(partido.awaySlug);
                const homeFlag = getTeamFlag(partido.homeSlug);
                const awayFlag = getTeamFlag(partido.awaySlug);

                const live = liveMap[partido.matchId];
                const playing = isLive(live);
                const ended = isFinished(live);

                return (
                  <div
                    key={partido.id}
                    className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 p-4"
                    style={
                      playing
                        ? { background: "linear-gradient(90deg, rgba(255,107,87,0.08), transparent 60%)" }
                        : undefined
                    }
                  >
                    {/* Date and time / status row */}
                    <div className="flex items-center justify-center gap-3 mb-3">
                      {playing ? (
                        <span className="flex items-center gap-1.5 text-sm font-black" style={{ color: LIVE_RED }}>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute h-full w-full animate-ping rounded-full opacity-75" style={{ background: LIVE_RED }} />
                            <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: LIVE_RED }} />
                          </span>
                          {live!.s === "HT" ? labels.ht : `${live!.el}'`}
                          <span className="text-[10px] font-bold uppercase tracking-wide">· {labels.live}</span>
                        </span>
                      ) : ended ? (
                        <span className="text-sm font-black uppercase tracking-wide" style={{ color: "#6a7a9a" }}>
                          {live!.s === "PEN" ? labels.pen : labels.finished}
                        </span>
                      ) : mounted ? (
                        <>
                          <span className="text-xs text-gray-400">
                            {formatDate(partido.fecha, timezone)}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: "#c9a84c" }}
                          >
                            {formatTime(partido.fecha, timezone)}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
                          <div className="h-4 w-14 rounded bg-white/5 animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Teams row */}
                    <div className="flex items-center justify-center gap-3 sm:gap-5">
                      {/* Home team */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
                        <span className="text-sm sm:text-base font-bold text-white truncate text-right">
                          {homeName}
                        </span>
                        {homeFlag && (
                          <FlagImage
                            code={homeFlag}
                            alt={homeName}
                            width={32}
                            className="rounded-sm flex-shrink-0"
                          />
                        )}
                      </div>

                      {/* Marcador / VS */}
                      {playing || ended ? (
                        <span
                          className="flex-shrink-0 rounded-lg px-2.5 py-0.5 text-base font-black tabular-nums"
                          style={{
                            color: playing ? LIVE_RED : "#e8d48b",
                            background: playing ? "rgba(255,107,87,0.10)" : "rgba(201,168,76,0.10)",
                          }}
                        >
                          {live!.sc[0]} – {live!.sc[1]}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-500 flex-shrink-0 px-1">
                          {labels.vs}
                        </span>
                      )}

                      {/* Away team */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-start min-w-0">
                        {awayFlag && (
                          <FlagImage
                            code={awayFlag}
                            alt={awayName}
                            width={32}
                            className="rounded-sm flex-shrink-0"
                          />
                        )}
                        <span className="text-sm sm:text-base font-bold text-white truncate">
                          {awayName}
                        </span>
                      </div>
                    </div>

                    {/* Stadium info */}
                    <div className="mt-2 text-center">
                      <span className="text-[11px] text-gray-500">
                        {partido.estadio} &middot; {partido.ciudad}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Timezone indicator */}
      <div className="px-6 py-4 border-t border-white/5">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          {/* Clock icon */}
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {labels.yourTz}:{" "}
            {mounted ? (
              <span className="text-gray-400 font-medium">{timezone}</span>
            ) : (
              <span className="inline-block h-3 w-24 rounded bg-white/5 animate-pulse align-middle" />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

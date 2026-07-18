// src/app/_home/sections/MatchCenterBanner.tsx
//
// Banner del Match Center en el HOME (dentro del hero): destaca SIEMPRE un
// partido, aplicando la REGLA FIJA del endpoint /featured:
//   - el partido programado en juego o el próximo;
//   - cuando termina, pasa automáticamente al siguiente programado;
//   - si no queda ninguno, el PRIMER partido del Mundial.
// Se autoactualiza por polling y enlaza al Match Center del partido elegido.
// SVG-only (sin emojis). Solo se oculta si la API falla por completo.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GOLD, GOLD2 } from "../constants";
import FootballScoreboard from "@/components/FootballScoreboard";
import { teamAbbr } from "@/lib/team-abbr";

// Endpoint que decide el partido destacado según la regla fija.
const ENDPOINT = `/api/match-center/featured`;

const IN_PLAY = ["1H", "2H", "ET", "BT", "P", "LIVE", "INT"];
const FINISHED = ["FT", "AET", "PEN"];

interface TeamMeta {
  name: string;
  flag: string;
}
interface Feed {
  matchId: number;
  slug?: string | null;
  status: string;
  elapsed: number;
  kickoff?: string;
  score: [number | null, number | null];
  meta: {
    home: TeamMeta;
    away: TeamMeta;
    venue?: string;
    city?: string;
    phase?: string;
  };
}

function flagUrl(code: string): string {
  return `https://flagcdn.com/w80/${code}.png`;
}

function fmtKickoff(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const time = d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
  return `${date} · ${time}`;
}

// Cuenta atrás hasta el saque. Devuelve null si ya pasó la hora.
function fmtCountdown(target: number, now: number): string | null {
  let diff = Math.floor((target - now) / 1000);
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400);
  diff -= d * 86400;
  const h = Math.floor(diff / 3600);
  diff -= h * 3600;
  const m = Math.floor(diff / 60);
  const s = diff - m * 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  if (h > 0) return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  return `${pad(m)}m ${pad(s)}s`;
}

// Lugar del partido: "Estadio, Ciudad" descartando vacíos y placeholders.
function fmtVenue(venue?: string, city?: string): string | null {
  const parts = [venue, city]
    .map((p) => (p || "").trim())
    .filter((p) => p && p.toLowerCase() !== "amistoso internacional");
  return parts.length ? parts.join(" · ") : null;
}

export function MatchCenterBanner() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [failed, setFailed] = useState(false);
  // Reloj propio (1s) para la cuenta atrás hasta el saque.
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch(ENDPOINT, { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const data = (await res.json()) as Feed;
        if (alive) {
          setFeed(data);
          setFailed(false);
        }
      } catch {
        if (alive && !feed) setFailed(true);
      }
    }

    load();
    const live = feed ? IN_PLAY.includes(feed.status) : false;
    const interval = setInterval(load, live ? 15000 : 60000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed?.status]);

  if (failed || !feed) return null;

  const { status, elapsed, kickoff, score, meta } = feed;
  const live = IN_PLAY.includes(status);
  const finished = FINISHED.includes(status);
  const [hg, ag] = score;
  const hasScore = hg != null && ag != null;

  // URL "bonita" por nombres del partido elegido (el route resuelve slug o id).
  const HREF = `/app/matchcenter/${feed.slug || feed.matchId}`;

  // Marcador solo cuando tiene sentido (en juego / descanso / final). Antes del
  // saque mostramos "VS" en vez de un 0-0 que parece partido ya empezado.
  const showScore = (live || finished || status === "HT") && hasScore;
  const upcoming = !live && !finished && status !== "HT";
  const kickoffText = upcoming ? fmtKickoff(kickoff) : null;
  const venueText = fmtVenue(meta.venue, meta.city);

  // Competición/fase del partido (p. ej. "Fase de grupos" o "Amistoso").
  const isFriendly = (meta.phase || "").toLowerCase().includes("amistoso");
  const competitionLabel = isFriendly
    ? "Amistoso internacional"
    : meta.phase || null;

  // Cuenta atrás hasta el saque (solo si el partido aún no empieza).
  const koMs = kickoff ? new Date(kickoff).getTime() : NaN;
  const countdown =
    upcoming && !Number.isNaN(koMs) ? fmtCountdown(koMs, nowMs) : null;

  let badge: { text: string; color: string; pulse: boolean };
  if (live) {
    const min = elapsed ? `${elapsed}'` : "";
    badge = { text: `EN VIVO ${min}`.trim(), color: "#e63946", pulse: true };
  } else if (status === "HT") {
    badge = { text: "DESCANSO", color: GOLD2, pulse: false };
  } else if (finished) {
    badge = { text: "FINAL", color: "#a69a82", pulse: false };
  } else if (countdown) {
    // En lugar de "POR COMENZAR" mostramos la cuenta atrás viva.
    badge = { text: `FALTAN ${countdown}`, color: GOLD2, pulse: true };
  } else {
    badge = { text: "POR COMENZAR", color: GOLD2, pulse: false };
  }

  return (
    <section className="relative px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href={HREF}
          aria-label={`Match Center: ${meta.home.name} vs ${meta.away.name}`}
          className="group relative block overflow-hidden rounded-3xl border transition-transform duration-300 hover:scale-[1.01]"
          style={{
            borderColor: "rgba(201,168,76,0.35)",
            background:
              "linear-gradient(135deg, rgba(201,168,76,0.14) 0%, rgba(20,17,10,0.85) 45%, rgba(10,9,6,0.95) 100%)",
          }}
        >
          {/* glow decorativo */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(201,168,76,0.18)" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(47,128,255,0.12)" }}
          />

          <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            {/* Bloque equipos + marcador */}
            <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
              {/* Estado + competición (amistoso, fase de grupos, ...) */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide sm:px-3 sm:text-[10px] sm:tracking-wider"
                  style={{
                    background: "rgba(0,0,0,0.35)",
                    color: badge.color,
                    border: `1px solid ${badge.color}55`,
                  }}
                >
                  {badge.pulse && (
                    <span
                      className="zm-mcb-pulse inline-block h-2 w-2 rounded-full"
                      style={{ background: badge.color }}
                    />
                  )}
                  {badge.text}
                </span>
                {competitionLabel && (
                  <span
                    className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide sm:px-3 sm:text-[10px] sm:tracking-wider"
                    style={{
                      background: "rgba(0,0,0,0.35)",
                      color: "#b8ac93",
                      border: "1px solid rgba(174,184,207,0.3)",
                    }}
                  >
                    {competitionLabel}
                  </span>
                )}
              </div>

              {/* Marcador broadcast con banderas montadas por país. Muestra el
                  resultado en vivo/final y "VS" antes del saque (sin parecer 0-0). */}
              <div className="w-full max-w-xl">
                <FootballScoreboard
                  homeTeam={teamAbbr(meta.home.flag, meta.home.name)}
                  awayTeam={teamAbbr(meta.away.flag, meta.away.name)}
                  homeScore={showScore ? hg : null}
                  awayScore={showScore ? ag : null}
                  matchTime={
                    live
                      ? elapsed
                        ? `${elapsed}'`
                        : "EN VIVO"
                      : status === "HT"
                        ? "HT"
                        : finished
                          ? "FINAL"
                          : undefined
                  }
                  homeFlag={flagUrl(meta.home.flag)}
                  awayFlag={flagUrl(meta.away.flag)}
                />
              </div>

              {kickoffText && (
                <span
                  className="whitespace-nowrap text-[12px] font-semibold leading-tight"
                  style={{ color: "#b8ac93" }}
                >
                  {kickoffText}
                </span>
              )}
              {venueText && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-medium leading-tight"
                  style={{ color: "#a69a82" }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    style={{ flexShrink: 0 }}
                  >
                    <path
                      d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  {venueText}
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="flex shrink-0 flex-col items-center gap-1.5 sm:items-end">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#a69a82" }}
              >
                Match Center
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors"
                style={{
                  background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
                  color: "#0a0906",
                }}
              >
                Seguir en directo
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="#0a0906"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </Link>
      </div>

      <style>{`
        @keyframes zmMcbPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.7); }
        }
        .zm-mcb-pulse { animation: zmMcbPulse 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .zm-mcb-pulse { animation: none; }
        }
      `}</style>
    </section>
  );
}

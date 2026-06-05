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
  meta: { home: TeamMeta; away: TeamMeta };
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

export function MatchCenterBanner() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [failed, setFailed] = useState(false);

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
  const kickoffText = !live && !finished && status !== "HT" ? fmtKickoff(kickoff) : null;

  let badge: { text: string; color: string; pulse: boolean };
  if (live) {
    const min = elapsed ? `${elapsed}'` : "";
    badge = { text: `EN VIVO ${min}`.trim(), color: "#e63946", pulse: true };
  } else if (status === "HT") {
    badge = { text: "DESCANSO", color: GOLD2, pulse: false };
  } else if (finished) {
    badge = { text: "FINAL", color: "#8a94b0", pulse: false };
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
              "linear-gradient(135deg, rgba(201,168,76,0.14) 0%, rgba(15,29,50,0.85) 45%, rgba(11,24,37,0.95) 100%)",
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
            <div className="flex flex-1 items-center justify-center gap-4 sm:justify-start sm:gap-6">
              <TeamSide name={meta.home.name} flag={meta.home.flag} />

              <div className="flex min-w-[112px] flex-col items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
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
                <div
                  className="font-black tabular-nums leading-none"
                  style={{ color: "#F4F6FA", fontSize: showScore ? 38 : 30 }}
                >
                  {showScore ? (
                    <span>
                      {hg} <span style={{ color: GOLD, opacity: 0.6 }}>-</span> {ag}
                    </span>
                  ) : (
                    <span style={{ color: GOLD2 }}>VS</span>
                  )}
                </div>
                {kickoffText && (
                  <span
                    className="whitespace-nowrap text-center text-[12px] font-semibold leading-tight"
                    style={{ color: "#aeb8cf" }}
                  >
                    {kickoffText}
                  </span>
                )}
              </div>

              <TeamSide name={meta.away.name} flag={meta.away.flag} />
            </div>

            {/* CTA */}
            <div className="flex shrink-0 flex-col items-center gap-1.5 sm:items-end">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#8a94b0" }}
              >
                Match Center
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors"
                style={{
                  background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
                  color: "#0B1825",
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
                    stroke="#0B1825"
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

function TeamSide({ name, flag }: { name: string; flag: string }) {
  return (
    <div className="flex flex-col items-center gap-2" style={{ minWidth: 84 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={flagUrl(flag)}
        alt={name}
        width={56}
        height={42}
        className="rounded-md shadow-md"
        style={{ objectFit: "cover", border: "1px solid rgba(255,255,255,0.15)" }}
      />
      <span
        className="text-center text-sm font-bold leading-tight"
        style={{ color: "#F4F6FA", maxWidth: 96 }}
      >
        {name}
      </span>
    </div>
  );
}

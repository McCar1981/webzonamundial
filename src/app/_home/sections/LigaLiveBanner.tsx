// LigaLiveBanner — banner de partido de Zona de Ligas al pie del hero.
//
// En modo post-Mundial sustituye al MatchCenterBanner: destaca el partido del
// catálogo de ligas EN VIVO ahora (o el primero de hoy) y enlaza a su Centro
// de Partido. Datos: /api/ligas/live (cacheado en KV 30s; N visitantes = 1
// llamada a api-football). Si el catálogo no tiene partidos hoy (p. ej. lunes
// sin jornada) cae a un CTA estático hacia /ligas — nunca desaparece: es la
// puerta principal al producto de temporada. Escudos de club (URLs de
// api-football), no banderas: mismo patrón que LiveStrip del hub.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GOLD, GOLD2 } from "../constants";

const ENDPOINT = "/api/ligas/live";

const IN_PLAY = new Set(["1H", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);

type Fixture = {
  fixtureId: number;
  competitionSlug: string;
  competitionShort: string;
  kickoff: string;
  status: string;
  elapsed: number | null;
  home: { name: string; logo: string };
  away: { name: string; logo: string };
  score: { home: number | null; away: number | null };
};
type Payload = { mode: "live" | "today" | "none"; fixtures: Fixture[] };

function fmtKickoff(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  return `${date} · ${time}`;
}

/** El partido a destacar: en juego > por jugar hoy > el primero de la lista. */
function pickFixture(fixtures: Fixture[]): Fixture | null {
  if (fixtures.length === 0) return null;
  return (
    fixtures.find((f) => IN_PLAY.has(f.status)) ??
    fixtures.find((f) => !FINISHED.has(f.status)) ??
    fixtures[0]
  );
}

function Side({ name, logo, goals, showScore }: { name: string; logo: string; goals: number | null; showScore: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2.5">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt=""
            width={26}
            height={26}
            loading="lazy"
            style={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }}
          />
        ) : null}
        <span className="truncate text-[15px] font-semibold text-white sm:text-base">{name}</span>
      </span>
      {showScore && (
        <span
          className="text-lg font-bold text-white sm:text-xl"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {goals ?? 0}
        </span>
      )}
    </div>
  );
}

/** CTA estático a /ligas: se sirve cuando hoy no hay partidos del catálogo. */
function FallbackCta() {
  return (
    <section className="relative px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/ligas"
          className="group relative block overflow-hidden rounded-3xl border p-6 transition-transform duration-300 hover:scale-[1.01] sm:p-8"
          style={{
            borderColor: "rgba(201,168,76,0.35)",
            background:
              "linear-gradient(135deg, rgba(201,168,76,0.14) 0%, rgba(15,29,50,0.85) 45%, rgba(11,24,37,0.95) 100%)",
          }}
        >
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#8a94b0" }}
              >
                Zona de Ligas
              </span>
              <div className="mt-1 text-lg font-bold text-white sm:text-xl">
                El fútbol no se acaba: Liga MX, LaLiga, Champions y 16 más
              </div>
              <div className="mt-1 text-[13px]" style={{ color: "#aeb8cf" }}>
                Calendario, clasificación en vivo, predicciones con Fútcoins y fantasy de jornada.
              </div>
            </div>
            <span
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold"
              style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`, color: "#0B1825" }}
            >
              Explorar ligas
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
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
        </Link>
      </div>
    </section>
  );
}

export function LigaLiveBanner() {
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch(ENDPOINT, { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const j = (await res.json()) as Payload;
        if (alive) {
          setData(j);
          setFailed(false);
        }
      } catch {
        if (alive) setFailed(true);
      }
    }

    load();
    // 60s de sondeo basta: el endpoint ya se cachea en KV (30s) y en CDN.
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Cargando: nada todavía (evita el doble salto banner→fallback).
  if (!data && !failed) return null;

  const fixture = data && data.mode !== "none" ? pickFixture(data.fixtures) : null;
  if (!fixture) return <FallbackCta />;

  const live = IN_PLAY.has(fixture.status);
  const finished = FINISHED.has(fixture.status);
  const showScore = live || finished;
  const kickoffText = !showScore ? fmtKickoff(fixture.kickoff) : null;

  let badge: { text: string; color: string; pulse: boolean };
  if (live) {
    const min = fixture.elapsed != null ? `${fixture.elapsed}'` : "";
    badge = { text: `EN VIVO ${min}`.trim(), color: "#e63946", pulse: true };
  } else if (finished) {
    badge = { text: "FINAL", color: "#8a94b0", pulse: false };
  } else {
    badge = { text: "HOY", color: GOLD2, pulse: true };
  }

  const HREF = `/ligas/${fixture.competitionSlug}/${fixture.fixtureId}`;

  return (
    <section className="relative px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href={HREF}
          aria-label={`Centro de Partido: ${fixture.home.name} vs ${fixture.away.name}`}
          className="group relative block overflow-hidden rounded-3xl border transition-transform duration-300 hover:scale-[1.01]"
          style={{
            borderColor: "rgba(201,168,76,0.35)",
            background:
              "linear-gradient(135deg, rgba(201,168,76,0.14) 0%, rgba(15,29,50,0.85) 45%, rgba(11,24,37,0.95) 100%)",
          }}
        >
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
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
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
                      className="zm-llb-pulse inline-block h-2 w-2 rounded-full"
                      style={{ background: badge.color }}
                    />
                  )}
                  {badge.text}
                </span>
                <span
                  className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide sm:px-3 sm:text-[10px] sm:tracking-wider"
                  style={{
                    background: "rgba(0,0,0,0.35)",
                    color: "#aeb8cf",
                    border: "1px solid rgba(174,184,207,0.3)",
                  }}
                >
                  {fixture.competitionShort}
                </span>
              </div>

              <div className="flex w-full max-w-xl flex-col gap-2.5">
                <Side
                  name={fixture.home.name}
                  logo={fixture.home.logo}
                  goals={fixture.score.home}
                  showScore={showScore}
                />
                <Side
                  name={fixture.away.name}
                  logo={fixture.away.logo}
                  goals={fixture.score.away}
                  showScore={showScore}
                />
              </div>

              {kickoffText && (
                <span
                  className="whitespace-nowrap text-[12px] font-semibold leading-tight"
                  style={{ color: "#aeb8cf" }}
                >
                  {kickoffText}
                </span>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-center gap-1.5 sm:items-end">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#8a94b0" }}
              >
                Zona de Ligas
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors"
                style={{
                  background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
                  color: "#0B1825",
                }}
              >
                {live ? "Seguir en directo" : "Centro de Partido"}
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
        @keyframes zmLlbPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.7); }
        }
        .zm-llb-pulse { animation: zmLlbPulse 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .zm-llb-pulse { animation: none; }
        }
      `}</style>
    </section>
  );
}

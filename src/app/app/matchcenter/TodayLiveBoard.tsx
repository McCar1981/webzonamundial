"use client";

// MODO JORNADA — tablero "Hoy · En juego" del hub del Match Center.
//
// Pinta todos los partidos del día con su estado real (en vivo con minuto y
// marcador latiendo, próximos con hora local del usuario, terminados con el
// final) y enlaza al Match Center de cada uno. Se alimenta del endpoint
// /api/match-center/today (KV en lote; cero api-football) con sondeo de 12 s
// solo mientras haya partidos en juego (60 s si no los hay).
//
// En los días de 3-4 partidos simultáneos del Mundial este tablero es la vista
// "de jornada" que ninguna ficha individual puede dar. SVG-only, sin emojis.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const BG2 = "#0F1D32";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#8a94b0";
const DIM = "#6a7a9a";
const RED = "#e63946";
const GREEN = "#10b981";

interface TodayTeam {
  name: string;
  flag: string;
}
interface TodayMatch {
  matchId: number;
  slug: string;
  status: string;
  live: boolean;
  finished: boolean;
  elapsed: number;
  score: [number | null, number | null];
  kickoff: string | null;
  phase: string;
  group: string;
  home: TodayTeam;
  away: TodayTeam;
  possession: [number, number] | null;
  lastEvent: { minute: number; type: string; player: string | null } | null;
}

function flagUrl(code: string): string {
  return `https://flagcdn.com/w40/${code}.png`;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

// Etiqueta corta del último suceso para la línea inferior de la card.
const EVENT_LABEL: Record<string, string> = {
  goal: "Gol",
  penalty_goal: "Gol de penalti",
  own_goal: "Gol en propia",
  yellow: "Amarilla",
  second_yellow: "Segunda amarilla",
  red: "Roja",
  sub: "Cambio",
  var: "Revisión VAR",
  corner: "Córner",
  shot_on: "Remate a puerta",
  shot: "Disparo",
};

export default function TodayLiveBoard() {
  const [matches, setMatches] = useState<TodayMatch[] | null>(null);
  const anyLiveRef = useRef(false);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      try {
        const r = await fetch("/api/match-center/today", { cache: "no-store" });
        if (r.ok) {
          const data = (await r.json()) as { matches: TodayMatch[] };
          if (alive && Array.isArray(data.matches)) {
            setMatches(data.matches);
            anyLiveRef.current = data.matches.some((m) => m.live);
          }
        }
      } catch {
        /* siguiente tick */
      } finally {
        if (alive) timer = setTimeout(load, anyLiveRef.current ? 12000 : 60000);
      }
    };
    load();

    const onVisible = () => {
      if (!alive || document.visibilityState !== "visible") return;
      if (timer) clearTimeout(timer);
      void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!matches || matches.length === 0) return null;

  const anyLive = matches.some((m) => m.live);
  // En jornadas simultáneas, los EN VIVO van primero (luego próximos, luego
  // terminados); desempate por hora de saque. Así la vista lidera con lo que late.
  const rank = (m: TodayMatch) => (m.live ? 0 : m.finished ? 2 : 1);
  const ordered = [...matches].sort(
    (a, b) => rank(a) - rank(b) || (a.kickoff || "").localeCompare(b.kickoff || ""),
  );

  return (
    <section style={{ padding: "0 20px 8px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: MID,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            margin: "0 0 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {anyLive && (
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: RED,
                display: "inline-block",
                animation: "zmTodayPulse 1.2s ease-in-out infinite",
              }}
            />
          )}
          {anyLive ? "Jornada · en juego ahora" : "Jornada de hoy"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
            gap: 12,
          }}
        >
          {ordered.map((m) => {
            const [hg, ag] = m.score;
            const showScore = (m.live || m.finished || m.status === "HT") && hg != null && ag != null;
            const badge = m.live
              ? { text: m.status === "HT" ? "DESCANSO" : `EN VIVO ${m.elapsed}'`, color: RED }
              : m.finished
                ? { text: "FINAL", color: MID }
                : { text: fmtTime(m.kickoff) ? `HOY ${fmtTime(m.kickoff)}` : "POR JUGAR", color: GOLD2 };
            const evLabel = m.lastEvent
              ? `${m.lastEvent.minute}' ${EVENT_LABEL[m.lastEvent.type] ?? ""}${m.lastEvent.player ? ` · ${m.lastEvent.player}` : ""}`
              : null;
            return (
              <Link
                key={m.matchId}
                href={`/app/matchcenter/${m.slug}`}
                style={{
                  display: "block",
                  padding: 14,
                  borderRadius: 14,
                  background: BG2,
                  border: `1px solid ${m.live ? "rgba(230,57,70,0.4)" : "rgba(255,255,255,0.07)"}`,
                  textDecoration: "none",
                  color: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 1,
                      color: badge.color,
                      textTransform: "uppercase",
                    }}
                  >
                    {badge.text}
                  </span>
                  <span style={{ fontSize: 10, color: DIM, fontWeight: 700 }}>
                    {m.group ? `Grupo ${m.group}` : m.phase}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <img
                      src={flagUrl(m.home.flag)}
                      alt=""
                      style={{ width: 26, height: 17, borderRadius: 3, objectFit: "cover", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.home.name}
                    </span>
                  </div>
                  <span
                    className="mc-num"
                    style={{
                      fontSize: showScore ? 18 : 12,
                      fontWeight: 800,
                      color: showScore ? "#fff" : GOLD,
                      flexShrink: 0,
                      minWidth: 44,
                      textAlign: "center",
                    }}
                  >
                    {showScore ? `${hg} - ${ag}` : "VS"}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      minWidth: 0,
                      justifyContent: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.away.name}
                    </span>
                    <img
                      src={flagUrl(m.away.flag)}
                      alt=""
                      style={{ width: 26, height: 17, borderRadius: 3, objectFit: "cover", flexShrink: 0 }}
                    />
                  </div>
                </div>

                {(evLabel || m.possession) && m.live && (
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      fontSize: 11,
                      color: DIM,
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {evLabel ?? ""}
                    </span>
                    {m.possession && (
                      <span style={{ flexShrink: 0, color: GREEN }}>
                        {m.possession[0]}% pos.
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes zmTodayPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @media (prefers-reduced-motion: reduce) {
          [style*="zmTodayPulse"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}

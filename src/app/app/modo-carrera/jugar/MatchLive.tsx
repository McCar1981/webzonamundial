// src/app/app/modo-carrera/jugar/MatchLive.tsx
//
// PARTIDO INTERACTIVO (la pieza "jugable estilo FIFA" del Modo Carrera). Junta
// los tres pilares de jugabilidad:
//   · Pilar 1 — agencia: el DT elige PLAN TÁCTICO antes del saque y toma una
//     DECISIÓN en el minuto 60 (ambas afectan de verdad la simulación).
//   · Pilar 3 — tensión: el marcador NO se revela de golpe; el reloj corre y los
//     goles van cayendo minuto a minuto.
//   · Pilar 2 — plantel: muestra jugadores REALES (FANTASY_ROSTERS) antes del
//     partido y nombra a la figura del encuentro al final.
//
// Al pitar el final entrega el marcador a onFinish(gf, ga); el contenedor lo pasa
// a resolveMatch() para aplicarlo a la carrera. SVG/flags, sin emojis.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, flagUrl } from "./fx";
import { SELECCIONES } from "@/data/selecciones";
import { FANTASY_ROSTERS, type RosterPlayer } from "@/data/fantasy-rosters";
import { classicLabel } from "@/lib/modo-carrera/classics";
import {
  TACTICAL_PLANS,
  planById,
  kickoff,
  secondHalf,
  choicesFor,
  type TacticalPlan,
  type InMatchChoice,
  type LiveMatchState,
  type LiveMatchResult,
} from "@/lib/modo-carrera/match-live";
import type { CareerState, SeasonMatch } from "@/lib/modo-carrera/types";

type Phase = "plan" | "half1" | "decision" | "half2" | "fulltime";

interface GoalEvent {
  minute: number;
  team: "self" | "opp";
  scorer: string;
}

const sel = (slug: string) => SELECCIONES.find((s) => s.slug === slug);

function Flag({ code, size = 26 }: { code?: string; size?: number }) {
  if (!code) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={flagUrl(code)}
      alt=""
      style={{ width: size, height: size * 0.7, objectFit: "cover", borderRadius: 3, boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
    />
  );
}

function keyPlayers(slug: string, n = 3): RosterPlayer[] {
  const roster = FANTASY_ROSTERS[slug] ?? [];
  const fwd = roster.filter((p) => p.pos === "FWD");
  const mid = roster.filter((p) => p.pos === "MID");
  return [...fwd, ...mid].slice(0, n);
}

function pickScorer(slug: string): string {
  const roster = FANTASY_ROSTERS[slug] ?? [];
  const att = roster.filter((p) => p.pos === "FWD" || p.pos === "MID");
  const pool = att.length ? att : roster;
  if (!pool.length) return "Gol en propia";
  return pool[Math.floor(Math.random() * pool.length)].name;
}

function goalMinutes(count: number, lo: number, hi: number): number[] {
  const set = new Set<number>();
  let guard = 0;
  while (set.size < count && guard < 300) {
    set.add(lo + Math.floor(Math.random() * (hi - lo + 1)));
    guard++;
  }
  return [...set].sort((a, b) => a - b);
}

function buildEvents(gfSelf: number, gaOpp: number, selfSlug: string, oppSlug: string, lo: number, hi: number): GoalEvent[] {
  const ev: GoalEvent[] = [];
  for (const m of goalMinutes(gfSelf, lo, hi)) ev.push({ minute: m, team: "self", scorer: pickScorer(selfSlug) });
  for (const m of goalMinutes(gaOpp, lo, hi)) ev.push({ minute: m, team: "opp", scorer: pickScorer(oppSlug) });
  return ev.sort((a, b) => a.minute - b.minute);
}

/** ¿El DT estuvo por detrás en el marcador en algún momento del partido? */
function wasEverBehind(events: GoalEvent[]): boolean {
  let gf = 0;
  let ga = 0;
  for (const e of [...events].sort((a, b) => a.minute - b.minute)) {
    if (e.team === "self") gf++;
    else ga++;
    if (ga > gf) return true;
  }
  return false;
}

export default function MatchLive({
  career,
  match,
  onFinish,
  onCancel,
}: {
  career: CareerState;
  match: SeasonMatch;
  onFinish: (gf: number, ga: number, wasBehind: boolean) => void;
  onCancel: () => void;
}) {
  const selfSlug = career.identity.nationSlug ?? "";
  const oppSlug = match.opponentSlug;
  const selfNat = sel(selfSlug);
  const oppNat = sel(oppSlug);
  const classic = classicLabel(selfSlug, oppSlug);

  const [phase, setPhase] = useState<Phase>("plan");
  const [planId, setPlanId] = useState<string>(TACTICAL_PLANS[0].id);
  const [clock, setClock] = useState(0);
  const [events, setEvents] = useState<GoalEvent[]>([]);
  const lsRef = useRef<LiveMatchState | null>(null);
  const resRef = useRef<LiveMatchResult | null>(null);

  const selfKey = useMemo(() => keyPlayers(selfSlug), [selfSlug]);
  const oppKey = useMemo(() => keyPlayers(oppSlug), [oppSlug]);

  // Reloj: corre en las dos mitades hasta su tope (60' / 90').
  useEffect(() => {
    if (phase !== "half1" && phase !== "half2") return;
    const target = phase === "half1" ? 60 : 90;
    const id = setInterval(() => {
      setClock((c) => (c >= target ? c : c + 1));
    }, 45);
    return () => clearInterval(id);
  }, [phase]);

  // Transición de fase al alcanzar el tope del reloj.
  useEffect(() => {
    if (phase === "half1" && clock >= 60) setPhase("decision");
    if (phase === "half2" && clock >= 90) setPhase("fulltime");
  }, [clock, phase]);

  const startMatch = (plan: TacticalPlan) => {
    const ls = kickoff(career, match, plan);
    lsRef.current = ls;
    setPlanId(plan.id);
    setEvents(buildEvents(ls.gf1, ls.ga1, selfSlug, oppSlug, 3, 58));
    setClock(0);
    setPhase("half1");
  };

  const pickChoice = (choice: InMatchChoice) => {
    const ls = lsRef.current;
    if (!ls) return;
    const res = secondHalf(ls, choice);
    resRef.current = res;
    setEvents((prev) => [...prev, ...buildEvents(res.gf2, res.ga2, selfSlug, oppSlug, 61, 90)]);
    setPhase("half2");
  };

  // Marcador mostrado: goles cuyo minuto ya pasó el reloj.
  const shown = useMemo(() => {
    const visible = events.filter((e) => e.minute <= clock);
    return {
      gf: visible.filter((e) => e.team === "self").length,
      ga: visible.filter((e) => e.team === "opp").length,
      feed: visible,
    };
  }, [events, clock]);

  const res = resRef.current;
  const finalGf = res ? res.gf : shown.gf;
  const finalGa = res ? res.ga : shown.ga;
  const outcome = finalGf > finalGa ? "V" : finalGf < finalGa ? "D" : "E";
  const outColor = outcome === "V" ? GREEN : outcome === "E" ? GOLD : RED;

  const motm = useMemo(() => {
    if (phase !== "fulltime") return "";
    const winnerSlug = finalGf >= finalGa ? selfSlug : oppSlug;
    return pickScorer(winnerSlug);
  }, [phase, finalGf, finalGa, selfSlug, oppSlug]);

  const decisionChoices = phase === "decision" ? choicesFor(shown.gf, shown.ga) : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6,11,20,0.92)",
        padding: 16,
        animation: "mcBannerIn .25s ease both",
      }}
    >
      <style>{`
        @keyframes mlGoal { 0% { transform: scale(.6); opacity: 0; } 50% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes mlPulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        @keyframes mlScore { 0% { transform: scale(1.35); } 100% { transform: scale(1); } }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "94vh",
          overflowY: "auto",
          padding: 24,
          borderRadius: 20,
          background: BG2,
          border: `1px solid ${phase === "fulltime" ? outColor : GOLD}`,
          boxShadow: "0 24px 70px rgba(0,0,0,0.65)",
        }}
      >
        {/* Cabecera: etiqueta de fase / clásico */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          {classic && (
            <div style={{ display: "inline-block", fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase", color: GOLD2, border: `1px solid ${GOLD}66`, background: "rgba(201,168,76,0.12)", borderRadius: 999, padding: "4px 12px", marginBottom: 8 }}>
              Clásico · {classic}
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: GOLD }}>
            {match.label} · {match.home ? "Local" : "Visitante"}
          </div>
        </div>

        {/* Marcador / banderas (visible salvo en la pantalla de plan) */}
        {phase !== "plan" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "8px 0 16px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Flag code={selfNat?.flagCode} size={34} />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", textAlign: "center" }}>{selfNat?.nombre ?? selfSlug}</span>
            </div>
            <div style={{ textAlign: "center", minWidth: 96 }}>
              <div key={`${shown.gf}-${shown.ga}`} style={{ fontSize: 42, fontWeight: 900, color: phase === "fulltime" ? outColor : "#fff", animation: "mlScore .3s ease" }}>
                {shown.gf} - {shown.ga}
              </div>
              {phase !== "fulltime" ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: GREEN }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, animation: "mlPulse 1s infinite" }} />
                  {clock}&#39;
                </div>
              ) : (
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: outColor }}>Final</div>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Flag code={oppNat?.flagCode} size={34} />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", textAlign: "center" }}>{oppNat?.nombre ?? oppSlug}</span>
            </div>
          </div>
        )}

        {/* ── FASE PLAN: jugadores clave + elección táctica ── */}
        {phase === "plan" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "4px 0 18px" }}>
              {[{ nat: selfNat, slug: selfSlug, players: selfKey, mine: true }, { nat: oppNat, slug: oppSlug, players: oppKey, mine: false }].map((side) => (
                <div key={side.slug} style={{ padding: 12, borderRadius: 12, background: BG3, border: `1px solid ${side.mine ? GOLD + "55" : "rgba(255,255,255,0.06)"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Flag code={side.nat?.flagCode} size={20} />
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: "#fff" }}>{side.nat?.nombre ?? side.slug}</span>
                  </div>
                  {side.players.length ? (
                    side.players.map((p) => (
                      <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, padding: "3px 0" }}>
                        <span style={{ color: "#fff", fontWeight: 600 }}>{p.name}</span>
                        <span style={{ color: DIM }}>{p.pos}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 11.5, color: DIM, fontStyle: "italic" }}>Plantel por confirmar</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: GOLD, marginBottom: 10 }}>
              Elige tu plan de partido
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TACTICAL_PLANS.map((p) => {
                const active = p.id === planId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 12,
                      cursor: "pointer",
                      background: active ? "rgba(201,168,76,0.14)" : BG3,
                      border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: active ? GOLD2 : "#fff" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: MID, marginTop: 3, lineHeight: 1.5 }}>{p.description}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="button" onClick={onCancel} style={btnGhost}>Cancelar</button>
              <button type="button" onClick={() => startMatch(planById(planId))} style={btnGold}>
                Saltar al campo
              </button>
            </div>
          </>
        )}

        {/* ── FEED de goles (durante el partido y al final) ── */}
        {(phase === "half1" || phase === "decision" || phase === "half2" || phase === "fulltime") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "4px 0 12px", minHeight: 40 }}>
            {shown.feed.length === 0 ? (
              <div style={{ textAlign: "center", fontSize: 12, color: DIM, fontStyle: "italic", padding: "8px 0" }}>
                Rueda el balón…
              </div>
            ) : (
              shown.feed.map((e, i) => (
                <div
                  key={`${e.minute}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 12px",
                    borderRadius: 10,
                    background: BG3,
                    borderLeft: `3px solid ${e.team === "self" ? GREEN : RED}`,
                    animation: "mlGoal .4s ease both",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 900, color: GOLD2, minWidth: 30 }}>{e.minute}&#39;</span>
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: e.team === "self" ? GREEN : RED }}>GOL</span>
                  <span style={{ fontSize: 12.5, color: "#fff", fontWeight: 600 }}>{e.scorer}</span>
                  <Flag code={(e.team === "self" ? selfNat : oppNat)?.flagCode} size={16} />
                </div>
              ))
            )}
          </div>
        )}

        {/* ── DECISIÓN minuto 60 ── */}
        {phase === "decision" && (
          <>
            <div style={{ textAlign: "center", fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, margin: "6px 0 4px" }}>
              Minuto 60 · tu decisión
            </div>
            <div style={{ textAlign: "center", fontSize: 12.5, color: MID, marginBottom: 12 }}>
              {shown.gf > shown.ga ? "Vas ganando. ¿Cómo gestionas la ventaja?" : shown.gf < shown.ga ? "Vas por detrás. ¿Cómo reaccionas?" : "Todo igualado. ¿Qué arriesgas?"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {decisionChoices.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => pickChoice(ch)}
                  style={{ textAlign: "left", padding: "12px 14px", borderRadius: 12, cursor: "pointer", background: BG3, border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>{ch.name}</div>
                  <div style={{ fontSize: 12, color: MID, marginTop: 3, lineHeight: 1.5 }}>{ch.description}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── FINAL ── */}
        {phase === "fulltime" && (
          <>
            <div style={{ textAlign: "center", fontSize: 16, fontWeight: 900, color: outColor, marginBottom: 10 }}>
              {outcome === "V" ? "Victoria" : outcome === "E" ? "Empate" : "Derrota"}
            </div>
            {motm && (
              <div style={{ textAlign: "center", padding: "10px 14px", borderRadius: 12, background: BG3, border: `1px solid ${GOLD}44`, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: GOLD }}>Figura del partido</div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: "#fff", marginTop: 3 }}>{motm}</div>
              </div>
            )}
            <button type="button" onClick={() => onFinish(finalGf, finalGa, wasEverBehind(events))} style={btnGold}>
              Ver resumen
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const btnGold: React.CSSProperties = {
  flex: 1,
  width: "100%",
  padding: "13px 24px",
  borderRadius: 12,
  border: "none",
  background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
  color: BG,
  fontWeight: 900,
  fontSize: 14.5,
  cursor: "pointer",
  boxShadow: "0 10px 28px rgba(201,168,76,0.3)",
};

const btnGhost: React.CSSProperties = {
  padding: "13px 20px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "transparent",
  color: MID,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

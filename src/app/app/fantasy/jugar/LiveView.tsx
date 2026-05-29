"use client";

// En Vivo — simula la jornada del usuario con simulateGameweek y reproduce el
// timeline de eventos minuto a minuto (puntos acumulándose). Muestra el desglose
// por jugador, capitán/multiplicador, sustituciones automáticas, impacto del
// power-up y el Joker. Botón para confirmar la jornada.

import { useEffect, useMemo, useRef, useState } from "react";
import { simulateGameweek, POWER_UPS, type GameweekResult } from "@/lib/fantasy/scoring";
import { isFantasyLive, countdownToKickoff } from "@/lib/fantasy/season";
import type { FantasyTeamState } from "@/lib/fantasy/types";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, flagUrl, lastName, POS_LABEL, POS_COLOR } from "./fx";

interface Props {
  team: FantasyTeamState;
  onCommit: (points: number) => void;
}

type Phase = "idle" | "playing" | "done";

export default function LiveView({ team, onCommit }: Props) {
  const filled = team.slots.filter((s) => s.playerId).length;
  const ready = filled === 15;

  // Puerta temporal: hasta la inauguración (11 jun 2026) el modo En Vivo está
  // en pretemporada. Se evalúa en cliente para reflejar el paso del tiempo.
  const [live, setLive] = useState<boolean | null>(null);
  const [cd, setCd] = useState(countdownToKickoff());
  useEffect(() => {
    const tick = () => {
      setLive(isFantasyLive());
      setCd(countdownToKickoff());
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const result = useMemo<GameweekResult | null>(() => {
    if (!ready) return null;
    return simulateGameweek(team.slots, team.captainId, team.viceId, team.powerUp, team.gameweek);
  }, [team.slots, team.captainId, team.viceId, team.powerUp, team.gameweek, ready]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [shownMinute, setShownMinute] = useState(0); // minuto de juego mostrado
  const [feed, setFeed] = useState<GameweekResult["timeline"]>([]);
  const timer = useRef<number | null>(null);

  // Reinicia la simulación si cambia el equipo/jornada.
  useEffect(() => {
    setPhase("idle");
    setShownMinute(0);
    setFeed([]);
    if (timer.current) window.clearInterval(timer.current);
  }, [result]);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const play = () => {
    if (!result) return;
    setPhase("playing");
    setShownMinute(0);
    setFeed([]);
    let m = 0;
    timer.current = window.setInterval(() => {
      m += 3;
      setShownMinute(Math.min(m, 95));
      setFeed(result.timeline.filter((e) => e.minute <= m));
      if (m >= 95) {
        if (timer.current) window.clearInterval(timer.current);
        setPhase("done");
        setFeed(result.timeline);
      }
    }, 220);
  };

  const skip = () => {
    if (!result) return;
    if (timer.current) window.clearInterval(timer.current);
    setShownMinute(95);
    setFeed(result.timeline);
    setPhase("done");
  };

  // Puerta temporal: hasta el pitido inicial (11 jun 2026) el modo En Vivo está
  // en pretemporada. El early-return va DESPUÉS de todos los hooks.
  if (live === false) {
    return <PreSeason ready={ready} filled={filled} cd={cd} />;
  }

  if (!ready) {
    return (
      <div style={{ textAlign: "center", padding: 50, color: DIM }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🔴</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Completa tu plantilla para jugar la jornada</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Tienes {filled}/15 jugadores. Ve a Mercado o usa el Auto-draft IA.</div>
      </div>
    );
  }
  if (!result) return null;

  const runningTotal = phase === "done" ? result.total : feedRunning(result, shownMinute);
  const pu = result.powerUp ? POWER_UPS.find((x) => x.id === result.powerUp) : null;

  return (
    <div>
      {/* Marcador */}
      <div style={{ background: "linear-gradient(135deg,#0c1f3a,#0a1525)", border: `1px solid ${GOLD}33`, borderRadius: 16, padding: 18, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>Jornada {result.gameweek} · {phase === "done" ? "Final" : phase === "playing" ? `${shownMinute}'` : "Previa"}</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: GOLD2, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{runningTotal}</div>
        <div style={{ fontSize: 12, color: MID, fontWeight: 700 }}>puntos {phase === "done" ? "totales" : "proyectados"}</div>
        {pu && <div style={{ fontSize: 12, marginTop: 6, color: GOLD2, fontWeight: 700 }}>{pu.emoji} {pu.name} activo · impacto {result.powerUpImpact >= 0 ? "+" : ""}{result.powerUpImpact} pts</div>}
        {result.jokerBonus > 0 && <div style={{ fontSize: 12, marginTop: 4, color: GOLD2, fontWeight: 700 }}>🃏 Joker: +{result.jokerBonus} pts (mejor de la jornada)</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
          {phase === "idle" && <button onClick={play} style={btnPrimary}>▶️ Jugar jornada</button>}
          {phase === "playing" && <button onClick={skip} style={btnGhost}>⏭️ Saltar al final</button>}
          {phase === "done" && (
            <>
              <button onClick={play} style={btnGhost}>↻ Repetir</button>
              <button onClick={() => onCommit(result.total)} style={btnPrimary}>✓ Confirmar jornada (+{result.total})</button>
            </>
          )}
        </div>
        {phase === "playing" && (
          <div style={{ height: 5, borderRadius: 5, background: "rgba(255,255,255,0.1)", marginTop: 14, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(shownMinute / 95) * 100}%`, background: `linear-gradient(90deg,${GOLD},${GOLD2})`, transition: "width .2s" }} />
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        {/* Feed de eventos */}
        <div>
          <div style={sectionTitle}>📡 Narración en vivo</div>
          <div style={{ background: BG2, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 10, maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {feed.length === 0 && <div style={{ color: DIM, fontSize: 13, textAlign: "center", padding: 20 }}>{phase === "idle" ? "Pulsa «Jugar jornada» para comenzar." : "Sin acciones todavía…"}</div>}
            {[...feed].reverse().map((e, i) => (
              <div key={`${e.player}-${e.minute}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8, background: BG3, borderRadius: 8, padding: "7px 10px" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: DIM, width: 30 }}>{e.minute}'</span>
                <span style={{ fontSize: 16 }}>{e.emoji}</span>
                <img src={flagUrl(e.flag)} alt="" style={{ width: 20, height: 14, borderRadius: 2, objectFit: "cover" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lastName(e.player)}</div>
                  <div style={{ fontSize: 11, color: MID }}>{e.label}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: e.finalDelta >= 0 ? GREEN : RED }}>{e.finalDelta >= 0 ? "+" : ""}{e.finalDelta}</span>
              </div>
            ))}
          </div>

          {result.benchAutoSubs.length > 0 && phase === "done" && (
            <div style={{ marginTop: 12 }}>
              <div style={sectionTitle}>♻️ Sustituciones automáticas</div>
              {result.benchAutoSubs.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: MID, background: BG2, borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
                  <b style={{ color: RED }}>{lastName(s.out)}</b> no jugó → entra <b style={{ color: GREEN }}>{lastName(s.in)}</b> (+{s.gained})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desglose por jugador */}
        <div>
          <div style={sectionTitle}>👥 Puntos por jugador</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...result.players].sort((a, b) => b.finalPoints - a.finalPoints).map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, background: BG2, borderRadius: 10, border: "1px solid " + (p.isCaptain ? GOLD : "rgba(255,255,255,0.05)"), padding: "8px 10px" }}>
                <img src={flagUrl(p.flag)} alt="" style={{ width: 26, height: 18, borderRadius: 2, objectFit: "cover", border: `1px solid ${p.color}` }} />
                <span style={{ fontSize: 9, fontWeight: 900, color: POS_COLOR[p.pos], width: 26 }}>{POS_LABEL[p.pos]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {lastName(p.name)}
                    {p.isCaptain && <span style={{ color: GOLD, fontWeight: 900 }}> ©</span>}
                    {p.subbedIn && <span style={{ color: GREEN, fontSize: 10 }}> ↑sub</span>}
                    {!p.played && <span style={{ color: RED, fontSize: 10 }}> no jugó</span>}
                  </div>
                  <div style={{ fontSize: 10, color: DIM }}>
                    base {p.basePoints}
                    {p.multiplier > 1 && <span style={{ color: GOLD2 }}> ·×{p.multiplier}</span>}
                    {p.muro && <span style={{ color: "#38bdf8" }}> ·muro×2</span>}
                    {p.captainFactor > 1 && <span style={{ color: GOLD }}> ·©×{p.captainFactor}</span>}
                    {p.bonus > 0 && <span style={{ color: GREEN }}> ·🎖️+{p.bonus}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: p.finalPoints >= 0 ? "#fff" : RED, fontVariantNumeric: "tabular-nums" }}>{p.finalPoints}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Total parcial mostrado mientras corre el reloj: suma de deltas hasta el minuto.
function feedRunning(result: GameweekResult, minute: number): number {
  let total = 0;
  for (const e of result.timeline) if (e.minute <= minute) total += e.finalDelta;
  return Math.round(total);
}

// Pantalla de pretemporada: el modo En Vivo se desbloquea con el pitido inicial
// del Mundial (11 jun 2026). Mientras tanto el usuario YA puede preparar equipo,
// alineación, coach y ligas; aquí solo se muestra la cuenta atrás.
function PreSeason({ ready, filled, cd }: { ready: boolean; filled: number; cd: { d: number; h: number; m: number; s: number } }) {
  return (
    <div style={{ textAlign: "center", padding: "30px 16px" }}>
      <div style={{ fontSize: 44, marginBottom: 6 }}>⏳</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>El modo En Vivo arranca con el Mundial</div>
      <div style={{ fontSize: 13, color: MID, marginTop: 6, maxWidth: 440, marginInline: "auto", lineHeight: 1.5 }}>
        Puntuará a <b style={{ color: GOLD2 }}>tiempo real</b> con los partidos reales a partir del pitido inicial.
        Hasta entonces, prepara tu equipo: mercado, alineación, capitán, power-ups, coach y ligas.
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
        {([["d", "días"], ["h", "horas"], ["m", "min"], ["s", "seg"]] as const).map(([k, label]) => (
          <div key={k} style={{ background: "linear-gradient(135deg,#0c1f3a,#0a1525)", border: `1px solid ${GOLD}33`, borderRadius: 12, padding: "12px 14px", minWidth: 64 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: GOLD2, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{String(cd[k]).padStart(2, "0")}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: DIM, marginTop: 18 }}>
        Pitido inicial: <b style={{ color: "#fff" }}>11 de junio de 2026</b>
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, background: BG2, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "9px 14px" }}>
        <span style={{ fontSize: 16 }}>{ready ? "✅" : "📋"}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: ready ? GREEN : MID }}>
          {ready ? "Plantilla lista (15/15) — todo a punto para el debut" : `Plantilla ${filled}/15 — complétala en Mercado o con el Auto-draft IA`}
        </span>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 };
const btnPrimary: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#060B14", fontWeight: 800, fontSize: 14, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: BG2, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" };

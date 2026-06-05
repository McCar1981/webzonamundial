"use client";

// En Vivo (Fase 3) — puntúa la jornada del usuario con DATOS REALES de los
// partidos del Mundial (api-football vía Match Center). Resuelve los partidos de
// las selecciones del usuario en la jornada, descarga sus snapshots reales y los
// convierte en puntos con scoreGameweekLive (misma forma que la simulación, así
// que el desglose por jugador, capitán, multiplicador, bonificación y power-ups
// se renderiza igual). Antes del pitido inicial muestra la pretemporada; durante
// la jornada refresca en vivo y solo deja confirmar al terminar los partidos.

import { useEffect, useMemo, useRef, useState } from "react";
import { POWER_UPS, type GameweekResult } from "@/lib/fantasy/scoring";
import { scoreGameweekLive, snapshotStarted, snapshotFinished } from "@/lib/fantasy/scoring.live";
import { matchForFlag } from "@/lib/fantasy/fixtures";
import { getPlayerById } from "@/lib/fantasy/players";
import { isFantasyLive, countdownToKickoff } from "@/lib/fantasy/season";
import type { FantasyTeamState } from "@/lib/fantasy/types";
import type { TransferCost } from "@/lib/fantasy/rules";
import type { LiveSnapshot } from "@/lib/match-center/types";
import type { Match } from "@/data/matches";
import { fetchFantasyLive } from "./api";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, flagUrl, lastName, POS_LABEL, POS_COLOR } from "./fx";

interface Props {
  team: FantasyTeamState;
  onCommit: (points: number) => void;
  transfers: TransferCost;
}

type Phase = "idle" | "playing" | "done";

export default function LiveView({ team, onCommit, transfers }: Props) {
  const filled = team.slots.filter((s) => s.playerId).length;
  const ready = filled === 15;
  const gw = team.gameweek;

  // Puerta temporal: hasta la inauguración (11 jun 2026) el modo En Vivo está en
  // pretemporada. Se evalúa en cliente para reflejar el paso del tiempo.
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

  // Partidos REALES de la jornada en los que el usuario tiene jugadores.
  const myMatches = useMemo<Match[]>(() => {
    const seen = new Set<number>();
    const list: Match[] = [];
    for (const s of team.slots) {
      if (!s.playerId) continue;
      const p = getPlayerById(s.playerId);
      if (!p) continue;
      const fix = matchForFlag(p.flag, gw);
      if (fix && !seen.has(fix.match.i)) {
        seen.add(fix.match.i);
        list.push(fix.match);
      }
    }
    return list.sort((a, b) => (a.d + a.t).localeCompare(b.d + b.t));
  }, [team.slots, gw]);
  const matchIds = useMemo(() => myMatches.map((m) => m.i), [myMatches]);
  const idsKey = matchIds.join("-");

  // Descarga de snapshots reales + refresco mientras la jornada no termine.
  const [snapshots, setSnapshots] = useState<Record<number, LiveSnapshot> | null>(null);
  useEffect(() => {
    if (live !== true || !ready || matchIds.length === 0) {
      setSnapshots(live === true ? {} : null);
      return;
    }
    let alive = true;
    let interval: number | null = null;
    const pull = async () => {
      const snaps = await fetchFantasyLive(matchIds);
      if (!alive) return;
      setSnapshots(snaps);
      const list = Object.values(snaps);
      const finished = list.length > 0 && list.every(snapshotFinished);
      if (finished && interval) {
        window.clearInterval(interval);
        interval = null;
      }
    };
    pull();
    interval = window.setInterval(pull, 30_000);
    return () => {
      alive = false;
      if (interval) window.clearInterval(interval);
    };
  }, [live, ready, idsKey, matchIds]);

  const result = useMemo<GameweekResult | null>(() => {
    if (!ready || !snapshots) return null;
    return scoreGameweekLive(team.slots, team.captainId, team.viceId, team.powerUp, gw, snapshots);
  }, [team.slots, team.captainId, team.viceId, team.powerUp, gw, ready, snapshots]);

  const relevantSnaps = useMemo(
    () => (snapshots ? matchIds.map((id) => snapshots[id]).filter(Boolean) : []),
    [snapshots, matchIds],
  );
  const anyStarted = relevantSnaps.some(snapshotStarted);
  const allFinished = relevantSnaps.length > 0 && relevantSnaps.every(snapshotFinished);

  const [phase, setPhase] = useState<Phase>("idle");
  const [shownMinute, setShownMinute] = useState(0);
  const [feed, setFeed] = useState<GameweekResult["timeline"]>([]);
  const timer = useRef<number | null>(null);

  // Al llegar/actualizar el resultado real, muestra el feed completo (recap). El
  // usuario puede repetir la narración minuto a minuto si quiere.
  useEffect(() => {
    if (timer.current) window.clearInterval(timer.current);
    if (result && anyStarted) {
      setPhase("done");
      setShownMinute(95);
      setFeed(result.timeline);
    } else {
      setPhase("idle");
      setShownMinute(0);
      setFeed([]);
    }
  }, [result, anyStarted]);

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

  // ---- Early returns (después de TODOS los hooks) ----
  if (live === false) return <PreSeason ready={ready} filled={filled} cd={cd} />;

  if (!ready) {
    return (
      <div style={{ textAlign: "center", padding: 50, color: DIM }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🔴</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Completa tu plantilla para jugar la jornada</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Tienes {filled}/15 jugadores. Ve a Mercado o usa el Auto-draft IA.</div>
      </div>
    );
  }

  if (live === null || snapshots === null) {
    return <div style={{ textAlign: "center", padding: 50, color: DIM, fontSize: 14 }}>Cargando datos en vivo…</div>;
  }

  // Sin partidos empezados: jornada por comenzar (datos reales, balón quieto).
  if (!anyStarted || !result) {
    return <Scheduled matches={myMatches} snapshots={snapshots} gw={gw} />;
  }

  const runningTotal = phase === "done" ? result.total : feedRunning(result, shownMinute);
  const pu = result.powerUp ? POWER_UPS.find((x) => x.id === result.powerUp) : null;
  const statusLabel = allFinished ? "Final" : phase === "playing" ? `${shownMinute}'` : "En juego";

  return (
    <div>
      {/* Marcador */}
      <div style={{ background: "linear-gradient(135deg,#0c1f3a,#0a1525)", border: `1px solid ${GOLD}33`, borderRadius: 16, padding: 18, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>Jornada {result.gameweek} · {statusLabel}</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: GOLD2, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{runningTotal}</div>
        <div style={{ fontSize: 12, color: MID, fontWeight: 700 }}>puntos {allFinished ? "totales" : "en vivo"}</div>
        {pu && <div style={{ fontSize: 12, marginTop: 6, color: GOLD2, fontWeight: 700 }}>{pu.emoji} {pu.name} activo · impacto {result.powerUpImpact >= 0 ? "+" : ""}{result.powerUpImpact} pts</div>}
        {result.jokerBonus > 0 && <div style={{ fontSize: 12, marginTop: 4, color: GOLD2, fontWeight: 700 }}>🃏 Joker: +{result.jokerBonus} pts (tu mejor jugador)</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
          {phase !== "playing" && <button onClick={play} style={btnGhost}>↻ Repetir narración</button>}
          {phase === "playing" && <button onClick={skip} style={btnGhost}>⏭️ Saltar al final</button>}
          {allFinished && (
            <button onClick={() => onCommit(result.total)} style={btnPrimary}>
              ✓ Confirmar jornada (+{result.total - transfers.penalty})
            </button>
          )}
        </div>
        {!allFinished && (
          <div style={{ fontSize: 12, marginTop: 10, color: MID, fontWeight: 700 }}>
            Jornada en curso — podrás confirmarla al terminar todos tus partidos.
          </div>
        )}
        {/* Coste de fichajes de la jornada (Fase 2): 2 gratis, −4 pts por extra) */}
        {transfers.transfers > 0 && (
          <div style={{ fontSize: 12, marginTop: 8, fontWeight: 700, color: transfers.penalty > 0 ? RED : GREEN }}>
            {transfers.wildcard
              ? `Comodín activo: ${transfers.transfers} fichajes gratis.`
              : transfers.penalty > 0
                ? `${transfers.transfers} fichajes · ${transfers.free} gratis · ${transfers.paid} con coste = −${transfers.penalty} pts`
                : `${transfers.transfers} fichajes (gratis).`}
          </div>
        )}
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
            {feed.length === 0 && <div style={{ color: DIM, fontSize: 13, textAlign: "center", padding: 20 }}>Sin acciones de tus jugadores todavía…</div>}
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

const STATUS_LABEL: Record<string, string> = {
  NS: "Por comenzar", TBD: "Por confirmar", PST: "Aplazado", "1H": "1ª parte", HT: "Descanso",
  "2H": "2ª parte", ET: "Prórroga", P: "Penaltis", FT: "Final", AET: "Final (pr.)", PEN: "Final (pen.)",
};

// Jornada por comenzar: muestra los partidos reales del usuario, parados, con su
// hora y estado (sin simulación: el balón está quieto hasta el saque real).
function Scheduled({ matches, snapshots, gw }: { matches: Match[]; snapshots: Record<number, LiveSnapshot>; gw: number }) {
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg,#0c1f3a,#0a1525)", border: `1px solid ${GOLD}33`, borderRadius: 16, padding: 18, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>🟢</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>Jornada {gw} · por comenzar</div>
        <div style={{ fontSize: 13, color: MID, marginTop: 6, maxWidth: 460, marginInline: "auto", lineHeight: 1.5 }}>
          Tus puntos se calcularán <b style={{ color: GOLD2 }}>en tiempo real</b> con lo que pase en estos partidos. Vuelve cuando rueden el balón.
        </div>
      </div>
      <div style={sectionTitle}>⚽ Tus partidos de la jornada</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {matches.length === 0 && (
          <div style={{ color: DIM, fontSize: 13, textAlign: "center", padding: 20, background: BG2, borderRadius: 12 }}>
            Aún no hay rivales confirmados para tus selecciones en esta ronda.
          </div>
        )}
        {matches.map((m) => {
          const snap = snapshots[m.i];
          const label = snap ? STATUS_LABEL[snap.status] ?? snap.status : "Por comenzar";
          return (
            <div key={m.i} style={{ display: "flex", alignItems: "center", gap: 10, background: BG2, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: "10px 12px" }}>
              <Team flag={m.hf} name={m.h} />
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: GOLD2 }}>{label}</div>
                <div style={{ fontSize: 10, color: DIM }}>{m.d.slice(8)}/{m.d.slice(5, 7)} · {m.t} ET</div>
              </div>
              <Team flag={m.af} name={m.a} right />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Team({ flag, name, right }: { flag: string; name: string; right?: boolean }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: right ? "flex-end" : "flex-start" }}>
      {right && <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>}
      <img src={flagUrl(flag)} alt="" style={{ width: 26, height: 18, borderRadius: 2, objectFit: "cover" }} />
      {!right && <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>}
    </div>
  );
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

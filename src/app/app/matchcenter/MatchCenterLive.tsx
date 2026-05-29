"use client";

// Experiencia "en vivo" del Match Center. Consume un MatchFeed (guion de
// simulación o snapshot real) y lo reproduce con su propio reloj: cancha
// animada, eventos con animación, locución por voz, marcador, momentum y stats
// que se actualizan en tiempo (casi) real.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Pitch from "./Pitch";
import MatchFx from "./MatchFx";
import Heatmap from "./Heatmap";
import { createSpeaker, type Speaker } from "@/lib/match-center/voice";
import { createSound, type MatchSound } from "@/lib/match-center/sound";
import {
  EMPTY_STATS,
  type LiveStats,
  type MatchEvent,
  type MatchFeed,
  type MatchMeta,
  type Pair,
  type StatKeyframe,
} from "@/lib/match-center/types";

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a", GREEN = "#22c55e", RED = "#ef4444";

const SPEAK_TYPES = new Set([
  "kickoff", "goal", "penalty_goal", "own_goal", "penalty_miss",
  "yellow", "second_yellow", "red", "sub", "var", "save", "chance",
  "half_time", "full_time",
]);

const SPEEDS = [1, 6, 12, 24];

function flagUrl(code: string): string {
  return `https://flagcdn.com/w80/${code}.png`;
}

function lerp(a: number, b: number, f: number): number {
  return a + (b - a) * f;
}
function lerpPair(a: Pair, b: Pair, f: number): Pair {
  return [Math.round(lerp(a[0], b[0], f)), Math.round(lerp(a[1], b[1], f))];
}
function statAt(frames: StatKeyframe[], t: number): LiveStats {
  if (frames.length === 0) return EMPTY_STATS;
  if (t <= frames[0].t) return frames[0].stats;
  for (let i = 1; i < frames.length; i++) {
    if (t <= frames[i].t) {
      const a = frames[i - 1], b = frames[i];
      const f = (t - a.t) / Math.max(1, b.t - a.t);
      return {
        possession: lerpPair(a.stats.possession, b.stats.possession, f),
        shots: lerpPair(a.stats.shots, b.stats.shots, f),
        shotsOn: lerpPair(a.stats.shotsOn, b.stats.shotsOn, f),
        passes: lerpPair(a.stats.passes, b.stats.passes, f),
        fouls: lerpPair(a.stats.fouls, b.stats.fouls, f),
        corners: lerpPair(a.stats.corners, b.stats.corners, f),
        saves: lerpPair(a.stats.saves, b.stats.saves, f),
        yellow: lerpPair(a.stats.yellow, b.stats.yellow, f),
        red: lerpPair(a.stats.red, b.stats.red, f),
        xg: [
          +lerp(a.stats.xg[0], b.stats.xg[0], f).toFixed(2),
          +lerp(a.stats.xg[1], b.stats.xg[1], f).toFixed(2),
        ],
      };
    }
  }
  return frames[frames.length - 1].stats;
}

function clockLabel(sec: number, finished: boolean): string {
  if (finished) return "FINAL";
  const mm = Math.floor(sec / 60);
  if (mm <= 90) return `${Math.max(1, mm)}'`;
  return `90+${mm - 90}'`;
}

const EVENT_ICON: Record<string, string> = {
  goal: "⚽", penalty_goal: "⚽", own_goal: "⚽", penalty_miss: "✗",
  yellow: "🟨", second_yellow: "🟨", red: "🟥", sub: "🔁", var: "📺",
  corner: "⛳", shot_on: "🎯", shot: "↗", save: "🧤", offside: "🚩",
  chance: "❗", injury: "➕", kickoff: "▶", half_time: "⏸", full_time: "🏁",
};

interface Props {
  matchId: number;
  meta: MatchMeta;
  sim: boolean;
}

export default function MatchCenterLive({ matchId, meta, sim }: Props) {
  const [feed, setFeed] = useState<MatchFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sec, setSec] = useState(0);
  const [score, setScore] = useState<Pair>([0, 0]);
  const [stats, setStats] = useState<LiveStats>(EMPTY_STATS);
  const [log, setLog] = useState<MatchEvent[]>([]);
  const [narration, setNarration] = useState<string>("");
  const [ball, setBall] = useState({ x: 0.5, y: 0.5 });
  const [goalPulse, setGoalPulse] = useState<{ side: "home" | "away"; key: number; player?: string } | null>(null);
  const [cardFx, setCardFx] = useState<{ side: "home" | "away"; color: string; key: number; player?: string } | null>(null);
  const [subFx, setSubFx] = useState<{ side: "home" | "away"; key: number; playerOut?: string; playerIn?: string } | null>(null);
  const [secondHalf, setSecondHalf] = useState(false);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(12);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [soundAvailable, setSoundAvailable] = useState(false);

  const feedRef = useRef<MatchFeed | null>(null);
  const secRef = useRef(0);
  const firedRef = useRef<Set<string>>(new Set());
  const speakerRef = useRef<Speaker | null>(null);
  const soundRef = useRef<MatchSound | null>(null);

  // Inicializa el speaker (solo en cliente)
  useEffect(() => {
    const s = createSpeaker("web");
    speakerRef.current = s;
    setVoiceAvailable(s.available());
    return () => s.cancel();
  }, []);

  // Inicializa el motor de sonido (solo en cliente)
  useEffect(() => {
    const snd = createSound();
    soundRef.current = snd;
    setSoundAvailable(snd.available());
    return () => snd.stopAmbient();
  }, []);

  const speak = useCallback((text: string, priority = false) => {
    speakerRef.current?.speak(text, { priority });
  }, []);

  const narrationFor = useCallback((e: MatchEvent): string => {
    return feedRef.current?.narration[e.id] || "";
  }, []);

  // Procesa un evento: animación + voz + marcador + log
  const fireEvent = useCallback(
    (e: MatchEvent, animate: boolean) => {
      if (firedRef.current.has(e.id)) return;
      firedRef.current.add(e.id);

      const snd = soundRef.current;
      const isGoal = e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal";
      if (isGoal && e.side !== "neutral") {
        setScore((s) => {
          const next: Pair = [...s] as Pair;
          if (e.side === "home") next[0] += 1;
          else next[1] += 1;
          return next;
        });
        if (animate) {
          setGoalPulse({ side: e.side, key: Date.now(), player: e.player });
          snd?.whistle(false); // el árbitro pita el gol
          snd?.goal();
        }
      }
      if (animate && e.side !== "neutral") {
        if (e.type === "yellow" || e.type === "second_yellow") {
          setCardFx({ side: e.side, color: "#eab308", key: Date.now(), player: e.player });
          snd?.whistle(false); // falta sancionada
          snd?.card();
        } else if (e.type === "red") {
          setCardFx({ side: e.side, color: "#ef4444", key: Date.now(), player: e.player });
          snd?.whistle(false);
          snd?.card();
        } else if (e.type === "sub") {
          setSubFx({ side: e.side, key: Date.now(), playerOut: e.player, playerIn: e.playerIn });
          snd?.sub();
        } else if (e.type === "save") {
          snd?.save();
        } else if (e.type === "offside" || e.type === "penalty_miss") {
          snd?.whistle(false); // jugada interrumpida
        }
      }
      if (animate) {
        if (e.type === "kickoff") snd?.whistle(false);
        else if (e.type === "half_time" || e.type === "full_time") snd?.whistle(true);
      }
      if (typeof e.x === "number" && typeof e.y === "number") {
        setBall({ x: e.x, y: e.y });
      }
      const text = narrationFor(e);
      if (text) {
        setNarration(text);
        if (animate && SPEAK_TYPES.has(e.type)) speak(text, isGoal || e.type === "red");
      }
      if (e.type === "half_time") setSecondHalf(true);
      if (e.type === "full_time") setFinished(true);
      setLog((l) => [e, ...l].slice(0, 60));
    },
    [narrationFor, speak],
  );

  // Carga del feed
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = sim ? "sim=1&ai=1" : "ai=1";
      const r = await fetch(`/api/match-center/live/${matchId}?${qs}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as MatchFeed;
      feedRef.current = data;
      firedRef.current = new Set();

      if (data.mode === "sim") {
        secRef.current = 0;
        setSec(0);
        setScore([0, 0]);
        setStats(statAt(data.statKeyframes, 0));
        setLog([]);
        setFinished(false);
        setSecondHalf(false);
        setBall({ x: 0.5, y: 0.5 });
      } else {
        // live: marcar lo ya ocurrido sin animar
        for (const e of data.events) firedRef.current.add(e.id);
        secRef.current = data.elapsed * 60;
        setSec(data.elapsed * 60);
        setScore(data.score);
        setStats(data.stats);
        setLog([...data.events].reverse().slice(0, 60));
        setSecondHalf(data.elapsed >= 45 || data.status === "2H" || data.status === "ET");
        setFinished(data.status === "FT" || data.status === "AET" || data.status === "PEN");
      }
      setFeed(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [matchId, sim]);

  useEffect(() => {
    load();
  }, [load]);

  // Reloj + disparo de eventos (modo simulación)
  useEffect(() => {
    if (!feed || feed.mode !== "sim" || paused || finished) return;
    const script = feed;
    const interval = setInterval(() => {
      const dt = 0.25 * speed;
      secRef.current += dt;
      const t = secRef.current;
      setSec(t);
      setStats(statAt(script.statKeyframes, t));
      for (const e of script.events) {
        if (e.t <= t && !firedRef.current.has(e.id)) fireEvent(e, true);
      }
      if (t >= script.durationSeconds) {
        setFinished(true);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [feed, paused, finished, speed, fireEvent]);

  // Reloj de display (modo live)
  useEffect(() => {
    if (!feed || feed.mode !== "live" || finished) return;
    const interval = setInterval(() => {
      secRef.current += 1;
      setSec(secRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [feed, finished]);

  // Polling de datos reales (modo live)
  useEffect(() => {
    if (!feed || feed.mode !== "live" || finished) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/match-center/live/${matchId}?ai=1`, { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as MatchFeed;
        if (data.mode !== "live") return;
        feedRef.current = data;
        secRef.current = data.elapsed * 60;
        setSec(secRef.current);
        setStats(data.stats);
        for (const e of data.events) {
          if (!firedRef.current.has(e.id)) fireEvent(e, true);
        }
        setScore(data.score);
        if (data.status === "FT" || data.status === "AET" || data.status === "PEN") setFinished(true);
      } catch {
        /* reintenta al siguiente tick */
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [feed, finished, matchId, fireEvent]);

  // Limpia el pulso de gol
  useEffect(() => {
    if (!goalPulse) return;
    const t = setTimeout(() => setGoalPulse(null), 3400);
    return () => clearTimeout(t);
  }, [goalPulse]);

  // Limpia FX de tarjeta y cambio
  useEffect(() => {
    if (!cardFx) return;
    const t = setTimeout(() => setCardFx(null), 2700);
    return () => clearTimeout(t);
  }, [cardFx]);
  useEffect(() => {
    if (!subFx) return;
    const t = setTimeout(() => setSubFx(null), 3100);
    return () => clearTimeout(t);
  }, [subFx]);

  function toggleVoice() {
    const s = speakerRef.current;
    if (!s) return;
    const next = !voiceOn;
    s.setEnabled(next);
    setVoiceOn(next);
    if (next) speak(narration || `Bienvenidos al ${meta.home.name} contra ${meta.away.name}.`, true);
  }

  function toggleSound() {
    const snd = soundRef.current;
    if (!snd) return;
    const next = !soundOn;
    snd.setEnabled(next); // resume() interno desbloquea el audio con este gesto
    setSoundOn(next);
    if (next) {
      snd.startAmbient();
      snd.setAmbient(Math.min(1, Math.abs(momentum) * 0.85 + 0.15));
      snd.whistle(false);
    } else {
      snd.stopAmbient();
    }
  }

  function replay() {
    speakerRef.current?.cancel();
    load();
  }

  const phase = useMemo(() => {
    if (finished) return "Final";
    const mm = Math.floor(sec / 60);
    const htFired = log.some((e) => e.type === "half_time");
    if (mm < 1) return "Previa";
    if (htFired && mm >= 45) return "2º tiempo";
    if (mm >= 45 && !htFired) return "Descanso";
    return "1º tiempo";
  }, [sec, finished, log]);

  // Momentum: ventaja instantánea de un equipo (-1 visitante .. +1 local).
  // Combina los eventos recientes (peso por tipo y por frescura) con la
  // desviación de posesión. Alimenta el medidor de ambiente y el sonido.
  const momentum = useMemo(() => {
    const WT: Record<string, number> = {
      goal: 1, penalty_goal: 1, chance: 0.6, shot_on: 0.5, shot: 0.3, corner: 0.22,
    };
    let acc = 0;
    let wsum = 0;
    log.slice(0, 14).forEach((e, idx) => {
      const recency = 1 - idx / 18;
      let w = WT[e.type] ?? 0;
      let side = e.side;
      if (e.type === "save") { w = 0.4; side = e.side === "home" ? "away" : "home"; } // parada => atacó el rival
      if (w === 0 || side === "neutral") return;
      acc += (side === "home" ? 1 : -1) * w * recency;
      wsum += w * recency;
    });
    const evMom = wsum > 0 ? acc / wsum : 0;
    const possMom = ((stats.possession[0] || 50) - 50) / 50;
    return Math.max(-1, Math.min(1, evMom * 0.7 + possMom * 0.3));
  }, [log, stats]);

  // Empuja la intensidad del ambiente al motor de sonido.
  useEffect(() => {
    if (!soundOn) return;
    soundRef.current?.setAmbient(Math.min(1, Math.abs(momentum) * 0.85 + 0.15));
  }, [momentum, soundOn]);

  const lineups = feed
    ? feed.mode === "sim"
      ? { home: feed.homeLineup, away: feed.awayLineup }
      : { home: feed.homeLineup, away: feed.awayLineup }
    : null;

  return (
    <div style={{ background: BG, color: "#fff", minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{`
        @keyframes mcPulse{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}
        @keyframes mcPop{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes mcSlide{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}
        .mc-live-dot{width:8px;height:8px;border-radius:50%;background:${RED};display:inline-block;animation:mcPulse 1.2s infinite}
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 16px 80px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Link href="/app/matchcenter" style={{ color: MID, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            ← Match Center
          </Link>
          <span style={{ fontSize: 11, color: DIM }}>
            {meta.phase} · {meta.venue}, {meta.city}
          </span>
        </div>

        {loading && <Centered>Cargando partido…</Centered>}
        {error && <Centered>Error: {error} <button onClick={load} style={btnGhost}>Reintentar</button></Centered>}

        {feed && lineups && (
          <>
            {/* Marcador */}
            <div style={{ background: BG2, borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", padding: "18px 20px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                {feed.mode === "live" && !finished && <span className="mc-live-dot" />}
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: finished ? MID : GREEN, textTransform: "uppercase" }}>
                  {feed.mode === "sim" ? `Simulación · ${phase}` : phase}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <TeamBlock name={meta.home.name} flag={meta.home.flag} color={meta.home.color} />
                <div style={{ textAlign: "center", minWidth: 130 }}>
                  <div style={{ fontSize: 46, fontWeight: 900, lineHeight: 1 }}>
                    <span style={{ color: GOLD2 }}>{score[0]}</span>
                    <span style={{ color: DIM, margin: "0 10px" }}>-</span>
                    <span style={{ color: GOLD2 }}>{score[1]}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: finished ? MID : GREEN }}>
                    {clockLabel(sec, finished)}
                  </div>
                </div>
                <TeamBlock name={meta.away.name} flag={meta.away.flag} color={meta.away.color} right />
              </div>
            </div>

            {/* Controles */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, alignItems: "center" }}>
              <button onClick={toggleVoice} disabled={!voiceAvailable} style={voiceOn ? btnGold : btnGhost}>
                {voiceOn ? "🎙️ Locución ON" : "🎙️ Locución OFF"}
              </button>
              <button onClick={toggleSound} disabled={!soundAvailable} style={soundOn ? btnGold : btnGhost}>
                {soundOn ? "🔊 Sonido ON" : "🔇 Sonido OFF"}
              </button>
              {feed.mode === "sim" && (
                <>
                  <button onClick={() => setPaused((p) => !p)} disabled={finished} style={btnGhost}>
                    {paused ? "▶ Reanudar" : "⏸ Pausa"}
                  </button>
                  <div style={{ display: "flex", gap: 4, marginLeft: "auto", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: DIM, marginRight: 4 }}>Velocidad</span>
                    {SPEEDS.map((s) => (
                      <button key={s} onClick={() => setSpeed(s)} style={speed === s ? btnGoldSm : btnGhostSm}>
                        {s}×
                      </button>
                    ))}
                  </div>
                </>
              )}
              {finished && (
                <button onClick={replay} style={btnGold}>↻ Repetir</button>
              )}
            </div>

            {/* Locución actual */}
            <div style={{ background: BG3, border: `1px solid ${GOLD}33`, borderRadius: 14, padding: "12px 16px", marginBottom: 14, minHeight: 48, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🎙️</span>
              <span key={narration} style={{ fontSize: 15, fontWeight: 600, animation: "mcSlide .3s ease" }}>
                {narration || "El relato del partido aparecerá aquí…"}
              </span>
            </div>

            {/* Cancha: contenedor con ángulo de cámara (3D) + overlay de FX plano.
                La inclinación se ancla al borde INFERIOR para no invadir los
                paneles de abajo. */}
            <div style={{ position: "relative", marginBottom: 26, borderRadius: 16, perspective: 1400, perspectiveOrigin: "50% 100%" }}>
              <div style={{ transform: "rotateX(11deg)", transformOrigin: "50% 100%", borderRadius: 16, boxShadow: "0 26px 60px rgba(0,0,0,0.55)" }}>
                <Pitch
                  meta={meta}
                  homeLineup={lineups.home}
                  awayLineup={lineups.away}
                  ball={ball}
                  goalPulse={goalPulse}
                  attackBias={(stats.possession[0] || 50) / 100}
                  active={!finished && !(feed.mode === "sim" && paused)}
                  flip={secondHalf}
                />
              </div>
              <MatchFx meta={meta} goalPulse={goalPulse} cardFx={cardFx} subFx={subFx} />
            </div>

            {/* Pulso / momentum + reacción del público */}
            <Momentum stats={stats} meta={meta} momentum={momentum} soundOn={soundOn} />

            {/* Mapa de calor */}
            <div style={{ marginTop: 14 }}>
              <Heatmap log={log} meta={meta} />
            </div>

            {/* Stats + Timeline */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginTop: 14 }}>
              <StatsPanel stats={stats} meta={meta} />
              <Timeline log={log} meta={meta} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 60, textAlign: "center", color: MID, fontSize: 15 }}>{children}</div>
  );
}

function TeamBlock({ name, flag, color, right }: { name: string; flag: string; color: string; right?: boolean }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <img src={flagUrl(flag)} alt={name} style={{ width: 56, height: 38, borderRadius: 6, objectFit: "cover", border: `2px solid ${color}` }} />
      <div style={{ fontWeight: 800, fontSize: 15, textAlign: "center" }}>{name}</div>
    </div>
  );
}

function crowdMood(intensity: number): { label: string; icon: string; color: string } {
  if (intensity >= 0.75) return { label: "Estadio en llamas", icon: "🔥", color: "#ef4444" };
  if (intensity >= 0.5) return { label: "Afición encendida", icon: "📣", color: "#f59e0b" };
  if (intensity >= 0.28) return { label: "Ambiente vibrante", icon: "👏", color: GOLD };
  return { label: "Partido de tanteo", icon: "🎵", color: MID };
}

function Momentum({ stats, meta, momentum, soundOn }: { stats: LiveStats; meta: MatchMeta; momentum: number; soundOn: boolean }) {
  const [ph, pa] = stats.possession;
  const intensity = Math.min(1, Math.abs(momentum) * 0.85 + 0.15);
  const mood = crowdMood(intensity);
  // Posición de la aguja de momentum: 0% = visitante, 100% = local.
  const needle = ((momentum + 1) / 2) * 100;
  const leader = momentum > 0.08 ? meta.home : momentum < -0.08 ? meta.away : null;
  return (
    <div style={{ background: BG2, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: DIM, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
        <span>Pulso del partido</span>
        <span>xG {stats.xg[0].toFixed(2)} – {stats.xg[1].toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden" }}>
        <div style={{ width: `${ph}%`, background: meta.home.color, transition: "width .5s ease", display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: 8, fontSize: 10, fontWeight: 800 }}>{ph}%</div>
        <div style={{ width: `${pa}%`, background: meta.away.color, transition: "width .5s ease", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, fontSize: 10, fontWeight: 800 }}>{pa}%</div>
      </div>

      {/* Momentum: aguja que se inclina hacia quien presiona */}
      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 11, color: DIM, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
        <span>Momentum</span>
        <span style={{ color: leader ? leader.color : MID }}>{leader ? `${leader.name} empuja` : "Equilibrado"}</span>
      </div>
      <div style={{ position: "relative", height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${meta.away.color}, rgba(255,255,255,0.15) 50%, ${meta.home.color})`, overflow: "visible" }}>
        <div style={{
          position: "absolute", top: -3, left: `calc(${needle}% - 8px)`, width: 16, height: 16, borderRadius: "50%",
          background: "#fff", border: `3px solid ${leader ? leader.color : MID}`, transition: "left .6s cubic-bezier(.22,1,.36,1)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }} />
      </div>

      {/* Reacción del público */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22, animation: intensity >= 0.5 ? "mcPulse 0.9s infinite" : undefined }}>{mood.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: DIM, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            <span>Ambiente · {mood.label}</span>
            <span style={{ color: soundOn ? GREEN : DIM }}>{soundOn ? "🔊" : "🔇"}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ width: `${intensity * 100}%`, height: "100%", background: mood.color, transition: "width .6s ease, background .6s ease" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const STAT_ROWS: { key: keyof LiveStats; label: string; color: string; pct?: boolean }[] = [
  { key: "shots", label: "Tiros", color: "#22c55e" },
  { key: "shotsOn", label: "A puerta", color: "#10b981" },
  { key: "possession", label: "Posesión", color: "#3b82f6", pct: true },
  { key: "passes", label: "Pases", color: "#f59e0b" },
  { key: "corners", label: "Córneres", color: "#a855f7" },
  { key: "fouls", label: "Faltas", color: "#ef4444" },
  { key: "saves", label: "Paradas", color: "#06b6d4" },
  { key: "yellow", label: "Amarillas", color: "#eab308" },
];

function StatsPanel({ stats, meta }: { stats: LiveStats; meta: MatchMeta }) {
  return (
    <div style={{ background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 18 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: MID, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Estadísticas</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {STAT_ROWS.map((row) => {
          const [h, a] = stats[row.key] as Pair;
          const total = h + a || 1;
          const hw = row.pct ? h : Math.round((h / total) * 100);
          const aw = row.pct ? a : Math.round((a / total) * 100);
          return (
            <div key={row.key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 700 }}>{row.pct ? `${h}%` : h}</span>
                <span style={{ color: MID }}>{row.label}</span>
                <span style={{ fontWeight: 700 }}>{row.pct ? `${a}%` : a}</span>
              </div>
              <div style={{ display: "flex", gap: 6, height: 7 }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ width: `${hw}%`, background: meta.home.color, transition: "width .5s ease" }} />
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${aw}%`, background: meta.away.color, transition: "width .5s ease" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Timeline({ log, meta }: { log: MatchEvent[]; meta: MatchMeta }) {
  return (
    <div style={{ background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 18 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: MID, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Minuto a minuto</h3>
      {log.length === 0 && <div style={{ color: DIM, fontSize: 13 }}>Aún sin eventos…</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
        {log.map((e) => {
          const side = e.side === "home" ? meta.home : e.side === "away" ? meta.away : null;
          const isGoal = e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal";
          return (
            <div key={e.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8,
              background: isGoal ? "rgba(201,168,76,0.1)" : "transparent",
              animation: "mcSlide .3s ease",
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: DIM, minWidth: 34 }}>
                {e.minute}{e.extra ? `+${e.extra}` : ""}{"'"}
              </span>
              <span style={{ fontSize: 16, minWidth: 22, textAlign: "center" }}>{EVENT_ICON[e.type] || "•"}</span>
              <span style={{ fontSize: 13, fontWeight: isGoal ? 800 : 600, flex: 1 }}>
                {e.player ? `${e.player} ` : ""}
                <span style={{ color: side ? side.color : MID, fontWeight: 700 }}>{side ? side.name : ""}</span>
                {e.detail ? <span style={{ color: DIM }}> · {e.detail}</span> : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const btnGhost: React.CSSProperties = { padding: "9px 14px", borderRadius: 10, background: BG2, border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const btnGold: React.CSSProperties = { padding: "9px 14px", borderRadius: 10, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, border: "none", color: BG, fontWeight: 800, fontSize: 13, cursor: "pointer" };
const btnGhostSm: React.CSSProperties = { padding: "6px 10px", borderRadius: 8, background: BG2, border: "1px solid rgba(255,255,255,0.12)", color: MID, fontWeight: 700, fontSize: 12, cursor: "pointer" };
const btnGoldSm: React.CSSProperties = { padding: "6px 10px", borderRadius: 8, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, border: "none", color: BG, fontWeight: 800, fontSize: 12, cursor: "pointer" };

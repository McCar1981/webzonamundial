// src/lib/match-center/simulation.ts
//
// Motor de simulación de partido DETERMINISTA. A partir de (matchId, seed)
// produce siempre el mismo guion: alineaciones, línea de tiempo de eventos con
// coordenadas, curvas de estadísticas y marcador final. Sirve para:
//   - desarrollar y demostrar el Match Center antes del Mundial,
//   - como fallback cuando no hay partido real en vivo.
//
// La UI reproduce el guion con su propio reloj (segundo a segundo), por lo que
// se siente "en vivo" sin depender del servidor entre tics.

import { buildLineup, FORMATION_NAMES } from "./formations";
import { pickRoster } from "./names";
import { templateNarration } from "./narrator";
import type {
  LiveStats,
  MatchEvent,
  MatchEventType,
  MatchMeta,
  MatchScript,
  Pair,
  StatKeyframe,
  TeamLineup,
} from "./types";
import { EMPTY_STATS } from "./types";

// --- RNG determinista (mulberry32) ---
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function minuteFromT(t: number): { minute: number; extra?: number } {
  const total = Math.floor(t / 60);
  if (t <= 45 * 60) return { minute: Math.max(1, Math.min(45, total + 1)) };
  if (t <= 90 * 60) return { minute: Math.max(46, Math.min(90, total + 1)) };
  return { minute: 90, extra: Math.floor((t - 90 * 60) / 60) + 1 };
}

function pickFormation(rng: () => number): string {
  return FORMATION_NAMES[Math.floor(rng() * FORMATION_NAMES.length)];
}

/** Asigna dorsales realistas (portero #1, resto repartidos del 2 al 23). */
function assignNumbers(rng: () => number, lineup: TeamLineup): void {
  const pool: number[] = [];
  for (let n = 2; n <= 23; n++) pool.push(n);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  let pi = 0;
  for (const p of lineup.starters) {
    p.num = p.pos === "GK" ? 1 : pool[pi++];
  }
}

/** Devuelve el dorsal de un jugador del once con sesgo por zona. */
function pickPlayer(
  rng: () => number,
  lineup: TeamLineup,
  bias: "att" | "def" | "any",
): string {
  let pool = lineup.starters;
  if (bias === "att") pool = lineup.starters.filter((p) => p.pos === "FW" || p.pos === "MF");
  if (bias === "def") pool = lineup.starters.filter((p) => p.pos === "DF" || p.pos === "MF");
  if (pool.length === 0) pool = lineup.starters;
  const p = pool[Math.floor(rng() * pool.length)];
  return p.name || `#${p.num}`;
}

/** Coordenadas de un evento ofensivo según el lado que ataca. */
function attackCoords(rng: () => number, side: "home" | "away"): { x: number; y: number } {
  // home ataca hacia la derecha (x alto), away hacia la izquierda (x bajo).
  const depth = 0.78 + rng() * 0.18; // cerca del área rival
  const x = side === "home" ? depth : 1 - depth;
  const y = 0.28 + rng() * 0.44;
  return { x, y };
}

function weightedGoals(rng: () => number): number {
  const r = rng();
  if (r < 0.06) return 0;
  if (r < 0.24) return 1;
  if (r < 0.52) return 2;
  if (r < 0.76) return 3;
  if (r < 0.91) return 4;
  return 5;
}

let _eidCounter = 0;
function eid(prefix: string): string {
  _eidCounter += 1;
  return `${prefix}-${_eidCounter}`;
}

interface PlannedScore {
  total: number;
  minutes: number[]; // minutos de gol ordenados
  sides: ("home" | "away")[]; // lado de cada gol
}

function planGoals(rng: () => number, demoEarly?: boolean): PlannedScore {
  // DEMO ("Ver demo en vivo"): goles PRONTO y espaciados, para no esperar a ver
  // la celebración. A 12× cada minuto de partido son 5s reales → primer gol a
  // ~5s; separados 4-5 min para que no se solapen con la celebración (~7s).
  if (demoEarly) {
    const minutes = [1, 5, 9, 14];
    const sides: ("home" | "away")[] = ["home", "away", "home", "away"];
    return { total: minutes.length, minutes, sides };
  }
  const total = weightedGoals(rng);
  const sides: ("home" | "away")[] = [];
  for (let i = 0; i < total; i++) {
    // leve ventaja local
    sides.push(rng() < 0.54 ? "home" : "away");
  }
  const minutes = sides
    .map(() => 3 + Math.floor(rng() * 90))
    .sort((a, b) => a - b);
  return { total, minutes, sides };
}

/** Construye el guion completo de un partido simulado. */
export function buildSimulation(
  meta: MatchMeta,
  seedInput?: number,
  opts?: { demoEarly?: boolean },
): MatchScript {
  _eidCounter = 0;
  const seed = (seedInput ?? meta.id * 2654435761) >>> 0;
  const rng = mulberry32(seed);

  const homeFormation = pickFormation(rng);
  const awayFormation = pickFormation(rng);
  const homeLineup = buildLineup(homeFormation);
  const awayLineup = buildLineup(awayFormation);

  // Plantillas con nombres por selección (17 = 11 titulares + suplentes).
  const homeRoster = pickRoster(rng, 17, meta.home.flag);
  const awayRoster = pickRoster(rng, 17, meta.away.flag);
  homeLineup.starters.forEach((p, i) => { p.name = homeRoster[i]; });
  awayLineup.starters.forEach((p, i) => { p.name = awayRoster[i]; });
  assignNumbers(rng, homeLineup);
  assignNumbers(rng, awayLineup);

  const goals = planGoals(rng, opts?.demoEarly);
  const events: MatchEvent[] = [];

  // Saque inicial
  events.push({
    id: eid("ko"),
    t: 0,
    minute: 1,
    type: "kickoff",
    side: "neutral",
    x: 0.5,
    y: 0.5,
  });

  // Goles planificados
  goals.minutes.forEach((min, idx) => {
    const side = goals.sides[idx];
    const lineup = side === "home" ? homeLineup : awayLineup;
    const t = min * 60 + Math.floor(rng() * 50);
    const isPen = rng() < 0.12;
    const coords = attackCoords(rng, side);
    const m = minuteFromT(t);
    events.push({
      id: eid("goal"),
      t,
      minute: m.minute,
      extra: m.extra,
      type: isPen ? "penalty_goal" : "goal",
      side,
      player: pickPlayer(rng, lineup, "att"),
      assist: isPen ? undefined : pickPlayer(rng, lineup, "any"),
      detail: isPen ? "Penalti" : undefined,
      x: coords.x,
      y: coords.y,
    });
  });

  // Eventos de relleno (tiros, córneres, faltas, tarjetas, paradas, ocasiones)
  const fillerTypes: { type: MatchEventType; bias: "att" | "def" | "any"; n: number }[] = [
    { type: "shot_on", bias: "att", n: 6 + Math.floor(rng() * 6) },
    { type: "shot", bias: "att", n: 5 + Math.floor(rng() * 6) },
    { type: "corner", bias: "att", n: 6 + Math.floor(rng() * 6) },
    { type: "save", bias: "def", n: 3 + Math.floor(rng() * 5) },
    { type: "chance", bias: "att", n: 2 + Math.floor(rng() * 4) },
    { type: "offside", bias: "att", n: 2 + Math.floor(rng() * 4) },
    { type: "yellow", bias: "def", n: 2 + Math.floor(rng() * 4) },
  ];

  for (const f of fillerTypes) {
    for (let i = 0; i < f.n; i++) {
      const side: "home" | "away" = rng() < 0.5 ? "home" : "away";
      const lineup = side === "home" ? homeLineup : awayLineup;
      const t = 30 + Math.floor(rng() * (94 * 60 - 60));
      const m = minuteFromT(t);
      const coords = attackCoords(rng, side);
      events.push({
        id: eid(f.type),
        t,
        minute: m.minute,
        extra: m.extra,
        type: f.type,
        side,
        player: pickPlayer(rng, lineup, f.bias),
        detail: f.type === "yellow" ? "Falta táctica" : undefined,
        x: f.type === "corner" ? (side === "home" ? 0.98 : 0.02) : coords.x,
        y: coords.y,
      });
    }
  }

  // Roja ocasional
  if (rng() < 0.22) {
    const side: "home" | "away" = rng() < 0.5 ? "home" : "away";
    const lineup = side === "home" ? homeLineup : awayLineup;
    const t = (55 + Math.floor(rng() * 35)) * 60;
    const m = minuteFromT(t);
    events.push({
      id: eid("red"),
      t,
      minute: m.minute,
      extra: m.extra,
      type: "red",
      side,
      player: pickPlayer(rng, lineup, "def"),
      detail: "Roja directa",
    });
  }

  // Cambios (2-3 por equipo en la segunda mitad)
  for (const side of ["home", "away"] as const) {
    const lineup = side === "home" ? homeLineup : awayLineup;
    const roster = side === "home" ? homeRoster : awayRoster;
    const subs = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < subs; i++) {
      const t = (58 + Math.floor(rng() * 32)) * 60;
      const m = minuteFromT(t);
      events.push({
        id: eid("sub"),
        t,
        minute: m.minute,
        extra: m.extra,
        type: "sub",
        side,
        player: pickPlayer(rng, lineup, "any"),
        playerIn: roster[11 + i] || `#${12 + i}`,
      });
    }
  }

  // Medio tiempo y final
  events.push({ id: eid("ht"), t: 45 * 60 + 30, minute: 45, type: "half_time", side: "neutral" });
  const ftT = 93 * 60 + Math.floor(rng() * 90);
  const ftm = minuteFromT(ftT);
  events.push({ id: eid("ft"), t: ftT, minute: ftm.minute, extra: ftm.extra, type: "full_time", side: "neutral" });

  // Orden cronológico
  events.sort((a, b) => a.t - b.t);

  // Narración por plantilla (la IA la mejora opcionalmente en la ruta)
  const narration: Record<string, string> = {};
  for (const e of events) narration[e.id] = templateNarration(e, meta);

  // Marcador final
  const finalScore: Pair = [
    goals.sides.filter((s) => s === "home").length,
    goals.sides.filter((s) => s === "away").length,
  ];

  // Curvas de estadística por keyframes cada 5 minutos
  const statKeyframes = buildKeyframes(events, rng);

  return {
    mode: "sim",
    matchId: meta.id,
    seed,
    durationSeconds: Math.max(ftT, 94 * 60),
    speed: 1,
    events,
    narration,
    finalScore,
    homeLineup,
    awayLineup,
    statKeyframes,
    meta,
  };
}

function buildKeyframes(events: MatchEvent[], rng: () => number): StatKeyframe[] {
  const frames: StatKeyframe[] = [];
  const basePossHome = 46 + Math.floor(rng() * 12); // 46..57
  const totalPassesAt90 = 850 + Math.floor(rng() * 350);

  for (let min = 0; min <= 95; min += 5) {
    const t = min * 60;
    const upTo = events.filter((e) => e.t <= t);
    const count = (type: MatchEventType, side: "home" | "away"): number =>
      upTo.filter((e) => e.type === type && e.side === side).length;

    const shotsOnH = count("shot_on", "home") + count("goal", "home") + count("penalty_goal", "home");
    const shotsOnA = count("shot_on", "away") + count("goal", "away") + count("penalty_goal", "away");
    const shotsH = shotsOnH + count("shot", "home") + count("chance", "home");
    const shotsA = shotsOnA + count("shot", "away") + count("chance", "away");

    const possNoise = Math.round((rng() - 0.5) * 4);
    const ph = Math.max(35, Math.min(65, basePossHome + possNoise));
    const possession: Pair = [ph, 100 - ph];

    const progress = Math.min(1, t / (90 * 60));
    const passesH = Math.round(totalPassesAt90 * progress * (ph / 100) * 2);
    const passesA = Math.round(totalPassesAt90 * progress * ((100 - ph) / 100) * 2);

    const xgH = +(shotsOnH * 0.18 + count("goal", "home") * 0.3 + count("penalty_goal", "home") * 0.76).toFixed(2);
    const xgA = +(shotsOnA * 0.18 + count("goal", "away") * 0.3 + count("penalty_goal", "away") * 0.76).toFixed(2);

    const stats: LiveStats = {
      possession,
      shots: [shotsH, shotsA],
      shotsOn: [shotsOnH, shotsOnA],
      passes: [passesH, passesA],
      fouls: [count("yellow", "home") + Math.floor(progress * 6), count("yellow", "away") + Math.floor(progress * 6)],
      corners: [count("corner", "home"), count("corner", "away")],
      offsides: [count("offside", "home"), count("offside", "away")],
      saves: [count("save", "home"), count("save", "away")],
      yellow: [count("yellow", "home"), count("yellow", "away")],
      red: [count("red", "home"), count("red", "away")],
      xg: [xgH, xgA],
    };
    frames.push({ t, stats });
  }
  if (frames.length === 0) frames.push({ t: 0, stats: EMPTY_STATS });
  return frames;
}

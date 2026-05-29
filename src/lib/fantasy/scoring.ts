// src/lib/fantasy/scoring.ts
//
// Sistema de puntuación y simulación DETERMINISTA de una jornada. A partir del
// equipo del usuario genera una actuación por jugador (eventos con minuto y
// puntos), aplica el multiplicador "Modo Underdog" del partido, el capitán /
// vice, los power-ups y las sustituciones automáticas de banquillo.

import { getPlayerById, getPlayerPool } from "./players";
import type { FantasyPlayer, FantasyPos, PowerUp, SquadSlot } from "./types";

export interface ScoringRow {
  accion: string;
  puntos: string;
  nota?: string;
  neg?: boolean;
}

export const SCORING_TABLE: ScoringRow[] = [
  { accion: "Jugar 60+ minutos", puntos: "+2" },
  { accion: "Jugar menos de 60 min", puntos: "+1" },
  { accion: "Gol de delantero", puntos: "+5" },
  { accion: "Gol de mediocampista", puntos: "+6", nota: "Más difícil para medios" },
  { accion: "Gol de defensa", puntos: "+8", nota: "Muy premiado" },
  { accion: "Gol de portero", puntos: "+10", nota: "Rarísimo" },
  { accion: "Asistencia", puntos: "+3" },
  { accion: "Portería a cero (DEF/POR)", puntos: "+4 / +5", nota: "Si juega 60+ min" },
  { accion: "Penalti parado (POR)", puntos: "+8" },
  { accion: "3+ tiros a puerta", puntos: "+1" },
  { accion: "MVP del partido", puntos: "+5", nota: "Calculado por IA" },
  { accion: "Hat-trick", puntos: "+5", nota: "Bonus extra" },
  { accion: "Tarjeta amarilla", puntos: "-1", neg: true },
  { accion: "Tarjeta roja", puntos: "-3", neg: true },
  { accion: "Gol en propia", puntos: "-3", neg: true },
  { accion: "Penalti fallado", puntos: "-3", neg: true },
];

export const POWER_UPS: { id: PowerUp; emoji: string; name: string; desc: string }[] = [
  { id: "tridente", emoji: "🔥", name: "Tridente", desc: "Tus 3 mejores jugadores puntúan x1.5 (en vez de solo el capitán)." },
  { id: "muro", emoji: "🛡️", name: "Muro", desc: "Tus defensas puntúan doble esta jornada." },
  { id: "francotirador", emoji: "🎯", name: "Francotirador", desc: "Si tu capitán marca, puntúa x3 en vez de x2." },
  { id: "comodin", emoji: "♻️", name: "Comodín", desc: "Transfers ilimitados esta jornada." },
  { id: "joker", emoji: "🃏", name: "Joker", desc: "Copia los puntos del mejor jugador de la jornada y súmalos." },
];

export interface PlayerEvent {
  minute: number;
  type: string;
  emoji: string;
  points: number;
  label: string;
}

export interface PlayerScore {
  id: string;
  name: string;
  flag: string;
  color: string;
  pos: FantasyPos;
  isCaptain: boolean;
  isVice: boolean;
  subbedIn: boolean;
  played: boolean;
  minutes: number;
  multiplier: number; // multiplicador del partido (Modo Underdog)
  captainFactor: number; // 1 | 1.5 | 2 | 3
  muro: boolean;
  basePoints: number;
  finalPoints: number;
  events: PlayerEvent[];
}

export interface GameweekResult {
  gameweek: number;
  total: number;
  players: PlayerScore[];
  benchAutoSubs: { out: string; in: string; gained: number }[];
  timeline: (PlayerEvent & { player: string; flag: string; finalDelta: number })[];
  powerUp: PowerUp | null;
  powerUpImpact: number;
  jokerBonus: number;
  captainName: string | null;
}

// ---- RNG ----
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GOAL_PTS: Record<FantasyPos, number> = { FWD: 5, MID: 6, DEF: 8, GK: 10 };

/** Genera la actuación base de un jugador en la jornada (sin multiplicadores). */
function simulatePerformance(p: FantasyPlayer, gw: number): { played: boolean; minutes: number; base: number; events: PlayerEvent[] } {
  const rng = mulberry32(hashStr(`${p.id}:gw${gw}`));
  const events: PlayerEvent[] = [];
  if (!p.available || rng() < 0.06) {
    return { played: false, minutes: 0, base: 0, events };
  }
  const sub60 = rng() < 0.18;
  const minutes = sub60 ? 25 + Math.floor(rng() * 34) : 60 + Math.floor(rng() * 31);
  let base = minutes >= 60 ? 2 : 1;
  events.push({ minute: 1, type: "start", emoji: "▶️", points: base, label: minutes >= 60 ? "Titular (90')" : "Disputa parcial" });

  const skill = p.form / 10; // 0..1
  // Goles
  let goals = 0;
  const goalChance = (p.pos === "FWD" ? 0.55 : p.pos === "MID" ? 0.4 : p.pos === "DEF" ? 0.12 : 0.02) * skill;
  for (let i = 0; i < 3; i++) {
    if (rng() < goalChance) {
      goals++;
      const pts = GOAL_PTS[p.pos];
      base += pts;
      events.push({ minute: 10 + Math.floor(rng() * 80), type: "goal", emoji: "⚽", points: pts, label: `Gol (${p.pos})` });
    }
  }
  if (goals >= 3) {
    base += 5;
    events.push({ minute: 88, type: "hattrick", emoji: "🎩", points: 5, label: "¡Hat-trick! Bonus" });
  }
  // Asistencias
  const assistChance = (p.pos === "MID" ? 0.5 : p.pos === "FWD" ? 0.35 : 0.18) * skill;
  for (let i = 0; i < 2; i++) {
    if (rng() < assistChance) {
      base += 3;
      events.push({ minute: 15 + Math.floor(rng() * 70), type: "assist", emoji: "🅰️", points: 3, label: "Asistencia" });
    }
  }
  // Portería a cero / paradas
  if ((p.pos === "GK" || p.pos === "DEF") && minutes >= 60 && rng() < 0.35 + skill * 0.2) {
    const cs = p.pos === "GK" ? 5 : 4;
    base += cs;
    events.push({ minute: 90, type: "cleansheet", emoji: "🧤", points: cs, label: "Portería a cero" });
  }
  if (p.pos === "GK" && rng() < 0.12) {
    base += 8;
    events.push({ minute: 40 + Math.floor(rng() * 40), type: "penalty_save", emoji: "🧤", points: 8, label: "¡Penalti parado!" });
  }
  // Bonus ofensivo / defensivo
  if (rng() < 0.25 * skill) {
    base += 1;
    events.push({ minute: 70, type: "shots", emoji: "🎯", points: 1, label: "3+ tiros a puerta" });
  }
  if ((p.pos === "DEF" || p.pos === "MID") && rng() < 0.3) {
    base += 2;
    events.push({ minute: 75, type: "recover", emoji: "💪", points: 2, label: "5+ recuperaciones" });
  }
  // MVP
  if (base >= 9 && rng() < 0.3) {
    base += 5;
    events.push({ minute: 92, type: "mvp", emoji: "⭐", points: 5, label: "MVP del partido (IA)" });
  }
  // Negativos
  if (rng() < 0.16) {
    base -= 1;
    events.push({ minute: 30 + Math.floor(rng() * 50), type: "yellow", emoji: "🟨", points: -1, label: "Tarjeta amarilla" });
  }
  if (rng() < 0.03) {
    base -= 3;
    events.push({ minute: 60 + Math.floor(rng() * 30), type: "red", emoji: "🟥", points: -3, label: "Tarjeta roja" });
  }
  events.sort((a, b) => a.minute - b.minute);
  return { played: true, minutes, base, events };
}

/** Mejor puntuación base de la jornada entre las estrellas (para el Joker). */
function gameweekBest(gw: number): number {
  let best = 0;
  for (const p of getPlayerPool()) {
    if (!p.real) continue;
    const perf = simulatePerformance(p, gw);
    const v = perf.base * p.next.tier.multiplier;
    if (v > best) best = v;
  }
  return Math.round(best);
}

export function simulateGameweek(slots: SquadSlot[], captainId: string | null, viceId: string | null, powerUp: PowerUp | null, gw: number): GameweekResult {
  const starters = slots.filter((s) => !s.bench && s.playerId);
  const bench = slots.filter((s) => s.bench && s.playerId);

  // Actuaciones base
  type Row = { slot: SquadSlot; p: FantasyPlayer; perf: ReturnType<typeof simulatePerformance>; subbedIn: boolean };
  const rows: Row[] = [];
  const usedBench = new Set<string>();
  const benchAutoSubs: GameweekResult["benchAutoSubs"] = [];

  for (const s of starters) {
    const p = getPlayerById(s.playerId!);
    if (!p) continue;
    let perf = simulatePerformance(p, gw);
    let subbedIn = false;
    let active: FantasyPlayer = p;
    if (!perf.played) {
      // Sustitución automática: primer banquillo compatible que sí juega.
      for (const b of bench) {
        if (usedBench.has(b.slot)) continue;
        const bp = getPlayerById(b.playerId!);
        if (!bp) continue;
        const compatible = p.pos === "GK" ? bp.pos === "GK" : bp.pos !== "GK";
        if (!compatible) continue;
        const bperf = simulatePerformance(bp, gw);
        if (bperf.played) {
          usedBench.add(b.slot);
          benchAutoSubs.push({ out: p.name, in: bp.name, gained: Math.round(bperf.base * bp.next.tier.multiplier) });
          perf = bperf;
          active = bp;
          subbedIn = true;
          break;
        }
      }
    }
    rows.push({ slot: s, p: active, perf, subbedIn });
  }

  // Tridente: marca los 3 mejores por (base * multiplicador)
  const tridenteIds = new Set<string>();
  if (powerUp === "tridente") {
    [...rows]
      .sort((a, b) => b.perf.base * b.p.next.tier.multiplier - a.perf.base * a.p.next.tier.multiplier)
      .slice(0, 3)
      .forEach((r) => tridenteIds.add(r.p.id));
  }

  const captainScoredGoal = (id: string) => rows.find((r) => r.p.id === id)?.perf.events.some((e) => e.type === "goal") ?? false;
  const captainPlayed = rows.some((r) => r.p.id === captainId && r.perf.played);
  const effectiveCaptain = captainPlayed ? captainId : viceId;

  const players: PlayerScore[] = rows.map((r) => {
    const mult = r.p.next.tier.multiplier;
    const muro = powerUp === "muro" && r.p.pos === "DEF";
    let captainFactor = 1;
    if (powerUp === "tridente") {
      if (tridenteIds.has(r.p.id)) captainFactor = 1.5;
    } else if (r.p.id === effectiveCaptain) {
      if (r.p.id === captainId && captainPlayed) {
        captainFactor = powerUp === "francotirador" && captainScoredGoal(r.p.id) ? 3 : 2;
      } else {
        captainFactor = 1.5; // vice
      }
    }
    const muroFactor = muro ? 2 : 1;
    const finalPoints = Math.round(r.perf.base * mult * muroFactor * captainFactor);
    return {
      id: r.p.id,
      name: r.p.name,
      flag: r.p.flag,
      color: r.p.color,
      pos: r.p.pos,
      isCaptain: r.p.id === captainId,
      isVice: r.p.id === viceId,
      subbedIn: r.subbedIn,
      played: r.perf.played,
      minutes: r.perf.minutes,
      multiplier: mult,
      captainFactor,
      muro,
      basePoints: r.perf.base,
      finalPoints,
      events: r.perf.events,
    };
  });

  let total = players.reduce((a, p) => a + p.finalPoints, 0);

  // Joker: suma el mejor jugador de la jornada
  let jokerBonus = 0;
  if (powerUp === "joker") {
    jokerBonus = gameweekBest(gw);
    total += jokerBonus;
  }

  // Impacto del power-up (vs línea base sin power-up)
  let powerUpImpact = 0;
  if (powerUp) {
    const baseline = simulateGameweek(slots, captainId, viceId, null, gw).total;
    powerUpImpact = total - baseline;
  }

  // Timeline ordenado por minuto
  const timeline: GameweekResult["timeline"] = [];
  for (const p of players) {
    const factor = p.multiplier * (p.muro ? 2 : 1) * (p.captainFactor || 1);
    for (const e of p.events) {
      timeline.push({ ...e, player: p.name, flag: p.flag, finalDelta: Math.round(e.points * factor) });
    }
  }
  timeline.sort((a, b) => a.minute - b.minute);

  const cap = captainId ? getPlayerById(captainId) : null;

  return {
    gameweek: gw,
    total,
    players,
    benchAutoSubs,
    timeline,
    powerUp,
    powerUpImpact,
    jokerBonus,
    captainName: cap?.name ?? null,
  };
}

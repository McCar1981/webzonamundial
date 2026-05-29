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
  { accion: "Puntos de bonificación (BPS)", puntos: "+3 / +2 / +1", nota: "Los 3 mejores de cada partido" },
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
  bonus: number; // puntos de bonificación (BPS) ya escalados por capitán
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

type Perf = ReturnType<typeof simulatePerformance>;

/**
 * BPS (Bonus Points System): puntúa la "calidad" de la actuación a partir de los
 * eventos. Se usa solo para repartir la bonificación de cada partido, no es el
 * punto fantasy en sí.
 */
function bpsFromPerf(p: FantasyPlayer, perf: Perf): number {
  if (!perf.played) return 0;
  let bps = perf.minutes >= 60 ? 6 : 3;
  for (const e of perf.events) {
    switch (e.type) {
      case "goal": bps += p.pos === "GK" ? 40 : p.pos === "DEF" ? 36 : p.pos === "MID" ? 30 : 24; break;
      case "assist": bps += 18; break;
      case "cleansheet": bps += 12; break;
      case "penalty_save": bps += 15; break;
      case "mvp": bps += 20; break;
      case "hattrick": bps += 10; break;
      case "recover": bps += 6; break;
      case "shots": bps += 4; break;
      case "yellow": bps -= 3; break;
      case "red": bps -= 9; break;
    }
  }
  return bps;
}

// Caché del reparto de bonus por jornada (mismo gw ⇒ mismo mapa).
const _bonusCache = new Map<number, Map<string, number>>();

/**
 * Reparte la bonificación de cada partido: agrupa el pool por enfrentamiento
 * (selección vs rival del "próximo partido") y da +3/+2/+1 a los tres mejores
 * BPS de cada partido. Devuelve un mapa playerId → bonus (sin escalar).
 */
function gameweekBonusMap(gw: number): Map<string, number> {
  const cached = _bonusCache.get(gw);
  if (cached) return cached;

  const matches = new Map<string, FantasyPlayer[]>();
  for (const p of getPlayerPool()) {
    const key = [p.flag, p.next.opponentCode].sort().join("|");
    const arr = matches.get(key);
    if (arr) arr.push(p);
    else matches.set(key, [p]);
  }

  const bonus = new Map<string, number>();
  const awards = [3, 2, 1];
  for (const group of matches.values()) {
    const ranked = group
      .map((p) => ({ id: p.id, bps: bpsFromPerf(p, simulatePerformance(p, gw)) }))
      .filter((x) => x.bps > 0)
      .sort((a, b) => b.bps - a.bps);
    for (let i = 0; i < ranked.length && i < 3; i++) bonus.set(ranked[i].id, awards[i]);
  }

  _bonusCache.set(gw, bonus);
  return bonus;
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
  const bonusMap = gameweekBonusMap(gw);

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
    // Bonus (BPS): solo si jugó; se escala por capitán/vice como el resto.
    const rawBonus = r.perf.played ? bonusMap.get(r.p.id) ?? 0 : 0;
    const bonus = Math.round(rawBonus * captainFactor);
    const finalPoints = Math.round(r.perf.base * mult * muroFactor * captainFactor) + bonus;
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
      bonus,
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
    // El bonus se reparte al cierre del partido (no se multiplica por el evento).
    if (p.bonus > 0) {
      timeline.push({ minute: 95, type: "bonus", emoji: "🎖️", points: p.bonus, label: "Puntos de bonificación", player: p.name, flag: p.flag, finalDelta: p.bonus });
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

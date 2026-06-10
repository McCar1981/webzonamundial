// src/lib/fantasy/scoring.live.ts
//
// Fase 3 — Puntuación EN VIVO con datos REALES. A diferencia de scoring.ts (que
// SIMULA la jornada de forma determinista para la pretemporada/preview), este
// motor lee los snapshots reales del Match Center (api-football) y atribuye a
// cada jugador del usuario sus goles, asistencias, tarjetas, minutos y portería
// a cero a partir de los eventos REALES del partido de su selección.
//
// Devuelve exactamente la misma forma `GameweekResult` que la simulación, de modo
// que la UI de "En Vivo" no cambia: solo cambia la FUENTE de los datos.

import { getPlayerById } from "./players";
import { matchForFlag, matchTier } from "./fixtures";
import type { GameweekResult, PlayerEvent, PlayerScore } from "./scoring";
import type { FantasyPlayer, FantasyPos, PowerUp, SquadSlot } from "./types";
import type { LiveSnapshot, MatchEvent, Side } from "@/lib/match-center/types";

const GOAL_PTS: Record<FantasyPos, number> = { FWD: 5, MID: 6, DEF: 8, GK: 10 };

/** Estados api-football considerados "partido terminado". */
const FINISHED = new Set(["FT", "AET", "PEN"]);
/** Estados api-football considerados "en juego" (el minuto avanza). */
const IN_PLAY = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

export function snapshotFinished(s: LiveSnapshot | undefined): boolean {
  return !!s && FINISHED.has(s.status);
}
export function snapshotStarted(s: LiveSnapshot | undefined): boolean {
  return !!s && (FINISHED.has(s.status) || IN_PLAY.has(s.status));
}

// ---- Coincidencia de nombres (roster ES vs api-football) ----
// Normaliza: sin acentos, minúsculas, sin puntos/guiones. Acepta igualdad total,
// coincidencia por apellido, o "inicial + apellido" (p. ej. "L. Messi" ~ "Lionel
// Messi").
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.\-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ta = na.split(" ");
  const tb = nb.split(" ");
  const la = ta[ta.length - 1];
  const lb = tb[tb.length - 1];
  if (la === lb && la.length >= 4) {
    // Mismo apellido distintivo. Si AMBOS nombres traen nombre de pila o inicial,
    // exigimos que la inicial coincida: así no se confunde a compañeros con el
    // mismo apellido (p. ej. los tres Martínez de Argentina — Emiliano, Lisandro
    // y Lautaro). Si uno es solo apellido (api-football no siempre da el nombre),
    // se acepta como única opción razonable.
    if (ta.length >= 2 && tb.length >= 2) return ta[0][0] === tb[0][0];
    return true;
  }
  return false;
}

interface RawActions {
  goals: number;
  ownGoals: number;
  assists: number;
  yellow: boolean;
  red: boolean;
  penMiss: number;
}

/** Cuenta las acciones de un nombre (en un lado) a partir de los eventos reales. */
function scanActions(name: string, side: Side, events: MatchEvent[]): RawActions {
  const a: RawActions = { goals: 0, ownGoals: 0, assists: 0, yellow: false, red: false, penMiss: 0 };
  for (const e of events) {
    const isPlayer = e.side === side && namesMatch(e.player, name);
    const isAssist = e.side === side && namesMatch(e.assist, name);
    switch (e.type) {
      case "goal":
      case "penalty_goal":
        if (isPlayer) a.goals++;
        else if (isAssist) a.assists++;
        break;
      case "own_goal":
        // El gol en propia lo registra api-football del lado que se beneficia;
        // lo atribuimos por nombre sin filtrar lado.
        if (namesMatch(e.player, name)) a.ownGoals++;
        break;
      case "penalty_miss":
        if (isPlayer) a.penMiss++;
        break;
      case "yellow":
        if (isPlayer) a.yellow = true;
        break;
      case "red":
      case "second_yellow":
        if (isPlayer) a.red = true;
        break;
    }
  }
  return a;
}

interface LivePerf {
  played: boolean;
  minutes: number;
  base: number;
  events: PlayerEvent[];
  bps: number;
}

const NO_PERF: LivePerf = { played: false, minutes: 0, base: 0, events: [], bps: 0 };

function elapsedOf(snap: LiveSnapshot): number {
  if (FINISHED.has(snap.status)) return 90;
  return Math.min(95, Math.max(0, snap.elapsed || 0));
}

/** Minutos jugados de un nombre según alineación + cambios. */
function minutesOf(name: string, side: Side, snap: LiveSnapshot): { played: boolean; minutes: number; started: boolean } {
  const lineup = side === "home" ? snap.homeLineup : snap.awayLineup;
  const started = !!lineup?.starters.some((s) => s.name && namesMatch(s.name, name));
  const elapsed = elapsedOf(snap);

  const subOut = snap.events.find((e) => e.type === "sub" && e.side === side && namesMatch(e.player, name));
  const subIn = snap.events.find((e) => e.type === "sub" && e.side === side && namesMatch(e.playerIn, name));

  if (started) {
    return { played: true, minutes: subOut ? subOut.minute : elapsed, started: true };
  }
  if (subIn) {
    return { played: true, minutes: Math.max(1, elapsed - subIn.minute), started: false };
  }
  // Sin alineación publicada pero con evento propio → asumimos que jugó.
  const hasEvent = snap.events.some((e) => e.side === side && (namesMatch(e.player, name) || namesMatch(e.assist, name)));
  if (hasEvent && !lineup) return { played: true, minutes: elapsed, started: false };
  return { played: false, minutes: 0, started: false };
}

/** Actuación real de un jugador del usuario en su partido de la jornada. */
function perfFromSnapshot(p: FantasyPlayer, snap: LiveSnapshot | undefined, side: Side): LivePerf {
  if (!snap || !snapshotStarted(snap)) return NO_PERF;

  const mins = minutesOf(p.name, side, snap);
  if (!mins.played) return NO_PERF;

  const events: PlayerEvent[] = [];
  let base = mins.minutes >= 60 ? 2 : 1;
  events.push({ minute: 1, type: "start", emoji: "▶️", points: base, label: mins.started ? "Titular" : "Suplente (entró)" });

  const act = scanActions(p.name, side, snap.events);

  // Goles
  for (let i = 0; i < act.goals; i++) {
    const pts = GOAL_PTS[p.pos];
    base += pts;
    events.push({ minute: 10 + i, type: "goal", emoji: "⚽", points: pts, label: `Gol (${p.pos})` });
  }
  if (act.goals >= 3) {
    base += 5;
    events.push({ minute: 89, type: "hattrick", emoji: "🎩", points: 5, label: "¡Hat-trick! Bonus" });
  }
  // Asistencias
  for (let i = 0; i < act.assists; i++) {
    base += 3;
    events.push({ minute: 12 + i, type: "assist", emoji: "🅰️", points: 3, label: "Asistencia" });
  }
  // Portería a cero (provisional mientras el rival no marque)
  const conceded = side === "home" ? snap.score[1] : snap.score[0];
  if ((p.pos === "GK" || p.pos === "DEF") && mins.minutes >= 60 && conceded === 0) {
    const cs = p.pos === "GK" ? 5 : 4;
    base += cs;
    events.push({ minute: 90, type: "cleansheet", emoji: "🧤", points: cs, label: "Portería a cero" });
  }
  // Negativos
  if (act.ownGoals > 0) {
    base -= 3 * act.ownGoals;
    events.push({ minute: 50, type: "own_goal", emoji: "🥅", points: -3 * act.ownGoals, label: "Gol en propia" });
  }
  if (act.penMiss > 0) {
    base -= 3 * act.penMiss;
    events.push({ minute: 55, type: "penalty_miss", emoji: "❌", points: -3 * act.penMiss, label: "Penalti fallado" });
  }
  if (act.yellow) {
    base -= 1;
    events.push({ minute: 35, type: "yellow", emoji: "🟨", points: -1, label: "Tarjeta amarilla" });
  }
  if (act.red) {
    base -= 3;
    events.push({ minute: 70, type: "red", emoji: "🟥", points: -3, label: "Tarjeta roja" });
  }

  events.sort((a, b) => a.minute - b.minute);

  // BPS (para el reparto de bonificación por partido).
  let bps = mins.minutes >= 60 ? 6 : 3;
  bps += act.goals * (p.pos === "GK" ? 40 : p.pos === "DEF" ? 36 : p.pos === "MID" ? 30 : 24);
  bps += act.assists * 18;
  if ((p.pos === "GK" || p.pos === "DEF") && mins.minutes >= 60 && conceded === 0) bps += 12;
  if (act.goals >= 3) bps += 10;
  if (act.yellow) bps -= 3;
  if (act.red) bps -= 9;
  bps -= act.ownGoals * 6;

  return { played: true, minutes: mins.minutes, base, events, bps };
}

// ---- Reparto de bonificación (BPS) por partido ----
// Reúne a todos los nombres con presencia en cada snapshot (alineaciones +
// eventos), calcula un BPS aproximado e independiente de posición y reparte
// +3/+2/+1 a los tres mejores de cada partido. Devuelve matchId → (nombre
// normalizado → bonus).
function liveBonusMap(snapshots: Record<number, LiveSnapshot>): Map<number, Map<string, number>> {
  const out = new Map<number, Map<string, number>>();
  const awards = [3, 2, 1];

  for (const [idStr, snap] of Object.entries(snapshots)) {
    if (!snapshotStarted(snap)) continue;
    const matchId = Number(idStr);

    const candidates = new Map<string, { name: string; side: Side }>();
    const addCand = (name: string | undefined, side: Side) => {
      if (!name) return;
      const k = `${side}:${norm(name)}`;
      if (!candidates.has(k)) candidates.set(k, { name, side });
    };
    for (const lp of snap.homeLineup?.starters ?? []) addCand(lp.name, "home");
    for (const lp of snap.awayLineup?.starters ?? []) addCand(lp.name, "away");
    for (const e of snap.events) {
      if (e.side === "home" || e.side === "away") {
        addCand(e.player, e.side);
        addCand(e.assist, e.side);
        addCand(e.playerIn, e.side);
      }
    }

    const ranked = [...candidates.values()]
      .map(({ name, side }) => {
        const mins = minutesOf(name, side, snap);
        const act = scanActions(name, side, snap.events);
        const conceded = side === "home" ? snap.score[1] : snap.score[0];
        let bps = mins.played ? (mins.minutes >= 60 ? 6 : 3) : 0;
        bps += act.goals * 30 + act.assists * 18;
        if (mins.minutes >= 60 && conceded === 0) bps += 6;
        if (act.goals >= 3) bps += 10;
        bps -= act.yellow ? 3 : 0;
        bps -= act.red ? 9 : 0;
        bps -= act.ownGoals * 6;
        return { key: norm(name), bps };
      })
      .filter((x) => x.bps > 0)
      .sort((a, b) => b.bps - a.bps);

    const map = new Map<string, number>();
    for (let i = 0; i < ranked.length && i < 3; i++) map.set(ranked[i].key, awards[i]);
    out.set(matchId, map);
  }
  return out;
}

// ── Línea REAL acumulable (stats de torneo del pool) ─────────────────────────

/** Resumen real de un jugador en un partido terminado (para acumulados). */
export interface RealMatchLine {
  played: boolean;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  basePoints: number; // puntos fantasy base (sin multiplicador ni capitán)
}

/** Línea real de `p` en su partido, a partir del snapshot (api-football). */
export function realLineFor(p: FantasyPlayer, snap: LiveSnapshot, side: Side): RealMatchLine {
  const perf = perfFromSnapshot(p, snap, side);
  if (!perf.played) return { played: false, minutes: 0, goals: 0, assists: 0, cleanSheet: false, basePoints: 0 };
  const act = scanActions(p.name, side, snap.events);
  return {
    played: true,
    minutes: perf.minutes,
    goals: act.goals,
    assists: act.assists,
    cleanSheet: perf.events.some((e) => e.type === "cleansheet"),
    basePoints: perf.base,
  };
}

interface Row {
  slot: SquadSlot;
  p: FantasyPlayer;
  perf: LivePerf;
  mult: number;
  matchId: number | null;
  subbedIn: boolean;
}

function resolveRow(slot: SquadSlot, gw: number, snapshots: Record<number, LiveSnapshot>): Row | null {
  const p = getPlayerById(slot.playerId!);
  if (!p) return null;
  const fix = matchForFlag(p.flag, gw);
  const snap = fix ? snapshots[fix.match.i] : undefined;
  const mult = fix ? matchTier(fix.match).multiplier : 1;
  const perf = fix ? perfFromSnapshot(p, snap, fix.side) : NO_PERF;
  return { slot, p, perf, mult, matchId: fix?.match.i ?? null, subbedIn: false };
}

/**
 * Puntúa la jornada del usuario con datos REALES. Misma forma que
 * `simulateGameweek`: capitán/vice, power-ups, sustituciones automáticas,
 * bonificación por partido y timeline de eventos reales.
 */
export function scoreGameweekLive(
  slots: SquadSlot[],
  captainId: string | null,
  viceId: string | null,
  powerUp: PowerUp | null,
  gw: number,
  snapshots: Record<number, LiveSnapshot>,
): GameweekResult {
  const starters = slots.filter((s) => !s.bench && s.playerId);
  const bench = slots.filter((s) => s.bench && s.playerId);
  const bonusMap = liveBonusMap(snapshots);

  const rows: Row[] = [];
  const usedBench = new Set<string>();
  const benchAutoSubs: GameweekResult["benchAutoSubs"] = [];

  for (const s of starters) {
    const row = resolveRow(s, gw, snapshots);
    if (!row) continue;
    let chosen: Row = row;
    if (!row.perf.played) {
      // Sustitución automática: primer banquillo compatible que SÍ jugó.
      for (const b of bench) {
        if (usedBench.has(b.slot)) continue;
        const br = resolveRow(b, gw, snapshots);
        if (!br) continue;
        const compatible = row.p.pos === "GK" ? br.p.pos === "GK" : br.p.pos !== "GK";
        if (!compatible) continue;
        if (br.perf.played) {
          usedBench.add(b.slot);
          benchAutoSubs.push({ out: row.p.name, in: br.p.name, gained: Math.round(br.perf.base * br.mult) });
          chosen = { ...br, slot: s, subbedIn: true };
          break;
        }
      }
    }
    rows.push(chosen);
  }

  // Tridente: marca los 3 mejores por (base * multiplicador).
  const tridenteIds = new Set<string>();
  if (powerUp === "tridente") {
    [...rows]
      .sort((a, b) => b.perf.base * b.mult - a.perf.base * a.mult)
      .slice(0, 3)
      .forEach((r) => tridenteIds.add(r.p.id));
  }

  const captainScoredGoal = (id: string) => rows.find((r) => r.p.id === id)?.perf.events.some((e) => e.type === "goal") ?? false;
  const captainPlayed = rows.some((r) => r.p.id === captainId && r.perf.played);
  const effectiveCaptain = captainPlayed ? captainId : viceId;

  const players: PlayerScore[] = rows.map((r) => {
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
    const rawBonus = r.perf.played && r.matchId != null ? bonusMap.get(r.matchId)?.get(norm(r.p.name)) ?? 0 : 0;
    const bonus = Math.round(rawBonus * captainFactor);
    const finalPoints = Math.round(r.perf.base * r.mult * muroFactor * captainFactor) + bonus;
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
      multiplier: r.mult,
      captainFactor,
      muro,
      basePoints: r.perf.base,
      bonus,
      finalPoints,
      events: r.perf.events,
    };
  });

  let total = players.reduce((a, p) => a + p.finalPoints, 0);

  // Joker: copia los puntos del mejor jugador de tu plantilla esta jornada.
  let jokerBonus = 0;
  if (powerUp === "joker") {
    jokerBonus = rows.reduce((best, r) => Math.max(best, Math.round(r.perf.base * r.mult)), 0);
    total += jokerBonus;
  }

  let powerUpImpact = 0;
  if (powerUp) {
    const baseline = scoreGameweekLive(slots, captainId, viceId, null, gw, snapshots).total;
    powerUpImpact = total - baseline;
  }

  // Timeline ordenado por minuto (eventos reales).
  const timeline: GameweekResult["timeline"] = [];
  for (const p of players) {
    const factor = p.multiplier * (p.muro ? 2 : 1) * (p.captainFactor || 1);
    for (const e of p.events) {
      timeline.push({ ...e, player: p.name, flag: p.flag, finalDelta: Math.round(e.points * factor) });
    }
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

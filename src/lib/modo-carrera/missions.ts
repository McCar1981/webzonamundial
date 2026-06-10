// src/lib/modo-carrera/missions.ts
//
// Motor de MISIONES del Modo Carrera (lógica pura). Genera instancias a partir
// de MISSION_TEMPLATES con su ciclo y caducidad (diaria/semanal/flash/torneo),
// expira las vencidas, permite avanzar el progreso y reclamar la recompensa.
//
// Cada misión lleva un id "estable por ciclo": `${key}#${cycle}`. Así, mientras
// dura el ciclo, no se duplica; cuando cambia (otro día/semana), se regenera.

import type { CareerState, Mission } from "./types";
import { MISSION_TEMPLATES, type MissionTemplate } from "./constants";
import { grantXp, sumReputation } from "./engine";

const nowIso = () => new Date().toISOString();

// ─── Ciclos y caducidades ────────────────────────────────────────────────────
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function endOfDay(d: Date): Date {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}

/**
 * Año-semana tipo ISO (lunes como primer día) en hora LOCAL, coherente con las
 * misiones diarias/flash (que también usan la fecha local del jugador). Antes
 * mezclaba UTC (semanal) con local (diaria), lo que podía desalinear los ciclos.
 */
function isoWeekKey(d: Date): string {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = t.getDay() || 7;
  t.setDate(t.getDate() + 4 - day);
  const yearStart = new Date(t.getFullYear(), 0, 1);
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function endOfWeek(d: Date): Date {
  const e = new Date(d);
  const day = e.getDay() || 7; // 1..7, lunes..domingo
  e.setDate(e.getDate() + (7 - day));
  e.setHours(23, 59, 59, 999);
  return e;
}

interface Cycle {
  id: string;
  expiresAt: string | null;
}

function cycleFor(tpl: MissionTemplate, ref: Date): Cycle {
  switch (tpl.kind) {
    case "diaria":
      return { id: `${tpl.key}#${dateKey(ref)}`, expiresAt: endOfDay(ref).toISOString() };
    case "semanal":
      return { id: `${tpl.key}#${isoWeekKey(ref)}`, expiresAt: endOfWeek(ref).toISOString() };
    case "flash": {
      // Ventana de 6 h alineada al bloque del día para que sea estable por ciclo.
      const block = Math.floor(ref.getHours() / 6); // 0..3
      const exp = new Date(ref);
      exp.setHours((block + 1) * 6, 0, 0, 0);
      return { id: `${tpl.key}#${dateKey(ref)}-b${block}`, expiresAt: exp.toISOString() };
    }
    case "torneo":
    default:
      return { id: `${tpl.key}#torneo`, expiresAt: null };
  }
}

function instantiate(tpl: MissionTemplate, cycle: Cycle): Mission {
  return {
    id: cycle.id,
    kind: tpl.kind,
    title: tpl.title,
    description: tpl.description,
    progress: 0,
    target: tpl.target,
    rewardXp: tpl.rewardXp,
    rewardReputation: tpl.rewardReputation,
    status: "activa",
    expiresAt: cycle.expiresAt,
  };
}

/** Clave de plantilla a partir del id de una misión (`key#cycle`). */
export function missionKey(m: Mission): string {
  const i = m.id.indexOf("#");
  return i >= 0 ? m.id.slice(0, i) : m.id;
}

/**
 * Conjunto de ids de misión que el SERVIDOR habría emitido legítimamente en una
 * ventana reciente (mañana, hoy y los últimos 14 días). Reconstruye los ciclos de
 * cada plantilla con la MISMA función `cycleFor` que los genera, cubriendo
 * diaria, semanal, flash (4 bloques/día) y torneo (id fijo).
 *
 * Incluye MAÑANA porque los ids se generan con la fecha LOCAL del jugador y este
 * conjunto se calcula en el servidor (UTC en Vercel): un jugador por delante de
 * UTC (España de madrugada, Asia, Oceanía) crea ids del día siguiente al del
 * servidor, y sin el +1 sus recompensas legítimas se rechazaban. El día extra
 * también cubre el salto de semana ISO del domingo por la noche.
 *
 * Sirve de lista blanca anti-faucet: la economía solo abona misiones cuyo id
 * pertenece a este conjunto, así un cliente manipulado no puede inventar ids
 * únicos (`racha_torneo#fakeN`) para cobrar la misma recompensa infinitas veces.
 */
export function legitMissionIds(ref: Date = new Date()): Set<string> {
  const ids = new Set<string>();
  for (const tpl of MISSION_TEMPLATES) {
    for (let back = -1; back <= 14; back++) {
      const d = new Date(ref);
      d.setDate(d.getDate() - back);
      // 4 bloques de 6 h cubren las 24 h del día (necesario para las flash).
      for (let h = 0; h < 24; h += 6) {
        const dd = new Date(d);
        dd.setHours(h, 0, 0, 0);
        ids.add(cycleFor(tpl, dd).id);
      }
    }
  }
  return ids;
}

const MAX_HISTORY = 24; // tope de misiones cerradas (reclamada/fallida) a conservar

/**
 * Garantiza que existan las misiones del ciclo actual: expira las vencidas y
 * siembra las que falten. Idempotente — llamar al cargar el Hub.
 */
export function ensureMissions(state: CareerState, ref: Date = new Date()): CareerState {
  const refMs = ref.getTime();
  let missions = state.missions.map((m) => {
    if (m.status === "activa" && m.expiresAt && new Date(m.expiresAt).getTime() < refMs) {
      return { ...m, status: "fallida" as const };
    }
    return m;
  });

  const present = new Set(missions.map((m) => m.id));
  for (const tpl of MISSION_TEMPLATES) {
    const cycle = cycleFor(tpl, ref);
    if (!present.has(cycle.id)) {
      missions = [instantiate(tpl, cycle), ...missions];
    }
  }

  // Poda el historial cerrado para que el JSON no crezca sin límite.
  const open = missions.filter((m) => m.status === "activa" || m.status === "completada");
  const closed = missions
    .filter((m) => m.status === "reclamada" || m.status === "fallida")
    .slice(0, MAX_HISTORY);

  return { ...state, missions: [...open, ...closed], updatedAt: nowIso() };
}

/** Avanza el progreso de una misión; al alcanzar el objetivo pasa a completada. */
export function advanceMission(state: CareerState, id: string, by = 1): CareerState {
  const missions = state.missions.map((m) => {
    if (m.id !== id || m.status !== "activa") return m;
    const progress = Math.min(m.target, m.progress + by);
    return { ...m, progress, status: progress >= m.target ? ("completada" as const) : m.status };
  });
  return { ...state, missions, updatedAt: nowIso() };
}

export interface ClaimResult {
  state: CareerState;
  /** XP y reputación efectivamente otorgadas (0 si no procedía). */
  grantedXp: number;
  grantedReputation: number;
  leveledUp: boolean;
}

/** Reclama la recompensa de una misión completada (XP + reputación). */
export function claimMission(state: CareerState, id: string): ClaimResult {
  const m = state.missions.find((x) => x.id === id);
  if (!m || m.status !== "completada") {
    return { state, grantedXp: 0, grantedReputation: 0, leveledUp: false };
  }

  // Reputación: reparte el premio en prestigio + mediático y recalcula el total.
  const half = Math.ceil(m.rewardReputation / 2);
  const stats = {
    ...state.reputation.stats,
    prestigio: Math.min(100, state.reputation.stats.prestigio + half),
    mediatico: Math.min(100, state.reputation.stats.mediatico + (m.rewardReputation - half)),
  };
  const withRep: CareerState = {
    ...state,
    reputation: { ...state.reputation, stats, total: sumReputation(stats) },
    missions: state.missions.map((x) => (x.id === id ? { ...x, status: "reclamada" as const } : x)),
  };

  const xpRes = grantXp(withRep, m.rewardXp);
  return {
    state: xpRes.state,
    grantedXp: m.rewardXp,
    grantedReputation: m.rewardReputation,
    leveledUp: xpRes.leveledUp,
  };
}

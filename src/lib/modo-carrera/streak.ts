// src/lib/modo-carrera/streak.ts
//
// Racha diaria del Modo Carrera (lógica pura, sin deps de servidor ni React).
// Es el bucle de RETORNO: entrar cada día y reclamar la recompensa mantiene viva
// la racha; saltarse un día la reinicia. Recompensa creciente (XP que sube de
// nivel) con un punto de habilidad extra cada 7 días — el "premio gordo" semanal
// que da motivo para no romper la cadena.
//
// La fecha es siempre el día LOCAL del usuario (YYYY-MM-DD), igual que las
// misiones diarias, para que "hoy" coincida con lo que ve en pantalla.

import type { CareerState, StreakState } from "./types";
import { grantXp, type XpResult } from "./engine";

/** Día local en formato YYYY-MM-DD. */
export function localDay(ref: Date = new Date()): string {
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, "0");
  const d = String(ref.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Resta n días a una clave YYYY-MM-DD (usando medianoche local). */
function dayBefore(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() - 1);
  return localDay(dt);
}

/**
 * XP de la recompensa para el día `n` de la racha. Rampa fuerte la primera semana
 * (60..180) y crecimiento suave después (+4/día hasta un tope de 300, ~día 37):
 * antes se congelaba en el día 7 y una racha de 30 días pagaba igual que una de 7,
 * matando el incentivo de "no romper la cadena".
 */
export function streakXp(dayN: number): number {
  const d = Math.max(dayN, 1);
  const base = 40 + Math.min(d, 7) * 20; // 60..180 la primera semana
  const beyond = Math.max(0, d - 7) * 4; // después sigue subiendo, sin dispararse
  return Math.min(base + beyond, 300);
}

/** ¿El día `n` otorga punto de habilidad? (cada 7 días: hito semanal). */
export function streakGivesPoint(dayN: number): boolean {
  return dayN > 0 && dayN % 7 === 0;
}

export interface StreakStatus {
  /** ¿Se puede reclamar hoy? (no se ha reclamado aún este día local). */
  claimable: boolean;
  /** Racha que QUEDARÍA tras reclamar hoy (1 si se rompió, current+1 si sigue). */
  pendingDay: number;
  /** Racha vigente almacenada. */
  current: number;
  best: number;
  /** XP que daría reclamar hoy. */
  rewardXp: number;
  /** ¿El reclamo de hoy daría punto de habilidad? */
  rewardPoint: boolean;
}

/** Calcula el estado de la racha para "hoy" sin mutar nada. */
export function streakStatus(c: CareerState, ref: Date = new Date()): StreakStatus {
  const today = localDay(ref);
  const s = c.streak;
  const claimable = s.lastClaim !== today;
  // Si la última vez fue ayer, la racha continúa; si no, se reinicia a 1.
  const continues = s.lastClaim === dayBefore(today);
  const pendingDay = !claimable ? s.current : continues ? s.current + 1 : 1;
  return {
    claimable,
    pendingDay,
    current: s.current,
    best: s.best,
    rewardXp: streakXp(pendingDay),
    rewardPoint: streakGivesPoint(pendingDay),
  };
}

export interface StreakClaim {
  state: CareerState;
  claimed: boolean;
  day: number;
  grantedXp: number;
  grantedPoint: boolean;
  leveledUp: boolean;
  levelsGained: number;
}

/**
 * Reclama la recompensa diaria. Idempotente por día: si ya se reclamó hoy,
 * devuelve el estado sin cambios y `claimed: false`. Aplica XP (con subidas de
 * nivel encadenadas) y, en los hitos semanales, un punto de habilidad extra.
 */
export function claimStreak(c: CareerState, ref: Date = new Date()): StreakClaim {
  const status = streakStatus(c, ref);
  if (!status.claimable) {
    return { state: c, claimed: false, day: status.current, grantedXp: 0, grantedPoint: false, leveledUp: false, levelsGained: 0 };
  }

  const today = localDay(ref);
  const day = status.pendingDay;
  const nextStreak: StreakState = {
    current: day,
    best: Math.max(c.streak.best, day),
    lastClaim: today,
  };

  const withStreak: CareerState = { ...c, streak: nextStreak };
  const xpRes: XpResult = grantXp(withStreak, status.rewardXp);
  let state = xpRes.state;

  const grantedPoint = status.rewardPoint;
  if (grantedPoint) {
    state = { ...state, skills: { ...state.skills, points: state.skills.points + 1 } };
  }

  return {
    state,
    claimed: true,
    day,
    grantedXp: status.rewardXp,
    grantedPoint,
    leveledUp: xpRes.leveledUp,
    levelsGained: xpRes.levelsGained,
  };
}

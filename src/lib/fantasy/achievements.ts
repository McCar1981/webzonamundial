// src/lib/fantasy/achievements.ts
//
// Fase 4 — El diferenciador del Fantasy Mundial: logros (medallas), rachas y
// "diferenciales". Todo se DERIVA del estado del equipo (historial, totales,
// chips, plantilla) + el pool de jugadores. No requiere esquema nuevo en la BD:
// es 100% calculable en el cliente a partir de FantasyTeamState.

import { getPlayerById } from "./players";
import type { FantasyPlayer, FantasyTeamState } from "./types";

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  unlocked: boolean;
  /** Progreso 0..1 para los logros con barra (los binarios usan 0 o 1). */
  progress: number;
  /** Texto del progreso ("3/8 jornadas"). */
  progressLabel: string;
  tier: "bronce" | "plata" | "oro" | "leyenda";
}

/** Mejor jornada del historial (mayor puntuación neta). */
export function bestGameweek(team: FantasyTeamState): { gw: number; points: number } | null {
  if (team.history.length === 0) return null;
  return team.history.reduce((best, h) => (h.points > best.points ? h : best), team.history[0]);
}

/** Racha actual de jornadas consecutivas con puntuación positiva (>0), contando
 * desde la última jornada jugada hacia atrás. */
export function positiveStreak(team: FantasyTeamState): number {
  const sorted = [...team.history].sort((a, b) => b.gw - a.gw);
  let streak = 0;
  for (const h of sorted) {
    if (h.points > 0) streak++;
    else break;
  }
  return streak;
}

/** Racha de mejora: jornadas seguidas en las que se superó la puntuación de la
 * jornada anterior (desde la última jugada hacia atrás). */
export function improvingStreak(team: FantasyTeamState): number {
  const sorted = [...team.history].sort((a, b) => a.gw - b.gw);
  let streak = 0;
  for (let i = sorted.length - 1; i > 0; i--) {
    if (sorted[i].points > sorted[i - 1].points) streak++;
    else break;
  }
  return streak;
}

/** Media de puntos por jornada jugada. */
export function avgPerGameweek(team: FantasyTeamState): number {
  if (team.history.length === 0) return 0;
  const sum = team.history.reduce((a, h) => a + h.points, 0);
  return sum / team.history.length;
}

/**
 * "Diferenciales": jugadores de tu once con baja propiedad (ownership). Cuanto
 * más baja la propiedad, más te distingues del resto si puntúan. Solo titulares.
 */
export interface Diferencial {
  player: FantasyPlayer;
  ownership: number;
}

export function diferenciales(team: FantasyTeamState, maxOwnership = 8, limit = 6): Diferencial[] {
  const out: Diferencial[] = [];
  for (const s of team.slots) {
    if (s.bench || !s.playerId) continue;
    const p = getPlayerById(s.playerId);
    if (!p) continue;
    if (p.ownership <= maxOwnership) out.push({ player: p, ownership: p.ownership });
  }
  return out.sort((a, b) => a.ownership - b.ownership).slice(0, limit);
}

function pct(v: number, max: number): number {
  return Math.max(0, Math.min(1, v / max));
}

/**
 * Catálogo de logros. Cada uno se evalúa contra el estado del equipo. Devuelve
 * SIEMPRE la lista completa (bloqueados incluidos) para que la vista muestre el
 * mural de medallas y el progreso.
 */
export function computeAchievements(team: FantasyTeamState): Achievement[] {
  const best = bestGameweek(team);
  const bestPts = best?.points ?? 0;
  const played = team.history.length;
  const streak = positiveStreak(team);
  const improve = improvingStreak(team);
  const chips = team.powerUpsUsed.length;
  const total = team.totalPoints;
  const filled = team.slots.filter((s) => s.playerId).length;
  const diffs = diferenciales(team, 8, 99).length;
  const hasCaptain = !!team.captainId;

  const list: Achievement[] = [
    {
      id: "primer-once",
      icon: "🧩",
      title: "Once de gala",
      desc: "Completa tu plantilla de 15 jugadores.",
      tier: "bronce",
      unlocked: filled >= 15,
      progress: pct(filled, 15),
      progressLabel: `${filled}/15`,
    },
    {
      id: "estratega",
      icon: "⭐",
      title: "Estratega",
      desc: "Designa capitán antes de tu primera jornada.",
      tier: "bronce",
      unlocked: hasCaptain,
      progress: hasCaptain ? 1 : 0,
      progressLabel: hasCaptain ? "Listo" : "Pendiente",
    },
    {
      id: "debut",
      icon: "🚀",
      title: "Debut mundialista",
      desc: "Confirma tu primera jornada.",
      tier: "bronce",
      unlocked: played >= 1,
      progress: pct(played, 1),
      progressLabel: `${Math.min(played, 1)}/1`,
    },
    {
      id: "medio-camino",
      icon: "🗺️",
      title: "A medio camino",
      desc: "Juega 4 jornadas del torneo.",
      tier: "plata",
      unlocked: played >= 4,
      progress: pct(played, 4),
      progressLabel: `${Math.min(played, 4)}/4`,
    },
    {
      id: "maraton",
      icon: "🏁",
      title: "Hasta la final",
      desc: "Juega las 8 jornadas del Mundial.",
      tier: "oro",
      unlocked: played >= 8,
      progress: pct(played, 8),
      progressLabel: `${Math.min(played, 8)}/8`,
    },
    {
      id: "francotirador",
      icon: "🎯",
      title: "Puntería fina",
      desc: "Suma 60+ puntos en una sola jornada.",
      tier: "plata",
      unlocked: bestPts >= 60,
      progress: pct(bestPts, 60),
      progressLabel: `${bestPts}/60`,
    },
    {
      id: "explosion",
      icon: "💥",
      title: "Jornada explosiva",
      desc: "Suma 90+ puntos en una sola jornada.",
      tier: "oro",
      unlocked: bestPts >= 90,
      progress: pct(bestPts, 90),
      progressLabel: `${bestPts}/90`,
    },
    {
      id: "racha-3",
      icon: "🔥",
      title: "En racha",
      desc: "3 jornadas seguidas puntuando.",
      tier: "plata",
      unlocked: streak >= 3,
      progress: pct(streak, 3),
      progressLabel: `${streak}/3`,
    },
    {
      id: "ascenso",
      icon: "📈",
      title: "Imparable",
      desc: "Mejora tu marca 3 jornadas seguidas.",
      tier: "oro",
      unlocked: improve >= 3,
      progress: pct(improve, 3),
      progressLabel: `${improve}/3`,
    },
    {
      id: "alquimista",
      icon: "🧪",
      title: "Alquimista",
      desc: "Usa 3 power-ups distintos en el torneo.",
      tier: "plata",
      unlocked: chips >= 3,
      progress: pct(chips, 3),
      progressLabel: `${chips}/3`,
    },
    {
      id: "diferencial",
      icon: "💎",
      title: "Cazador de gangas",
      desc: "Alinea 3 diferenciales (propiedad ≤ 8%).",
      tier: "oro",
      unlocked: diffs >= 3,
      progress: pct(diffs, 3),
      progressLabel: `${diffs}/3`,
    },
    {
      id: "centurion",
      icon: "💯",
      title: "Centurión",
      desc: "Acumula 250 puntos totales.",
      tier: "oro",
      unlocked: total >= 250,
      progress: pct(total, 250),
      progressLabel: `${total}/250`,
    },
    {
      id: "leyenda",
      icon: "👑",
      title: "Leyenda del Mundial",
      desc: "Acumula 500 puntos totales.",
      tier: "leyenda",
      unlocked: total >= 500,
      progress: pct(total, 500),
      progressLabel: `${total}/500`,
    },
  ];

  return list;
}

/** Resumen rápido para cabeceras: medallas desbloqueadas / total. */
export function achievementSummary(team: FantasyTeamState): { unlocked: number; total: number } {
  const all = computeAchievements(team);
  return { unlocked: all.filter((a) => a.unlocked).length, total: all.length };
}

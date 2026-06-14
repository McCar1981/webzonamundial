// src/lib/cromos/featured.ts
//
// Lógica pura para los 7 cromos destacados de la semana.
// Determinista: mismo seed = mismos 7 cromos para todos durante esa semana.

import { CROMOS, type Cromo } from "./catalog";
import { weekStart, hashStr, mulberry32 } from "@/lib/predictions/gamification";

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const DAY_NAMES_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export interface FeaturedCromo {
  dayIndex: number; // 0-6 (Mon-Sun)
  dayName: string;
  dayNameEs: string;
  cromo: Cromo;
  unlocksAt: string; // YYYY-MM-DD
}

export interface WeeklyFeatured {
  weekKey: string; // YYYY-MM-DD del lunes
  cromos: FeaturedCromo[];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getWeeklyFeatured(now = new Date()): WeeklyFeatured {
  const monday = weekStart(now);
  const weekKey = monday.toISOString().slice(0, 10);

  const rng = mulberry32(hashStr(`featured:${weekKey}`));
  const shuffled = shuffle(CROMOS, rng);

  const cromos: FeaturedCromo[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    cromos.push({
      dayIndex: i,
      dayName: DAY_NAMES[i],
      dayNameEs: DAY_NAMES_ES[i],
      cromo: shuffled[i],
      unlocksAt: d.toISOString().slice(0, 10),
    });
  }

  return { weekKey, cromos };
}

export function featuredClaimKey(weekKey: string, dayIndex: number): string {
  return `featured:${weekKey}:${dayIndex}`;
}

export function isDayClaimable(dayIndex: number, now = new Date()): boolean {
  const todayIndex = (now.getUTCDay() + 6) % 7; // Mon=0, ..., Sun=6
  return dayIndex <= todayIndex;
}

export function formatWeekLabel(weekKey: string): string {
  const [year, month, day] = weekKey.split("-").map(Number);
  const monday = new Date(Date.UTC(year, month - 1, day));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(monday)} - ${fmt(sunday)}`;
}

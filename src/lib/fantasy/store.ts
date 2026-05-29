// src/lib/fantasy/store.ts
//
// Persistencia del equipo fantasy en localStorage (no hay backend). Versionado
// para poder migrar/invalidar sin romper a usuarios antiguos.

import { buildSlots } from "./rules";
import type { FantasyTeamState } from "./types";

const KEY = "zm-fantasy:v2";

export function defaultTeam(): FantasyTeamState {
  return {
    teamName: "Mi Selección",
    formation: "4-3-3",
    slots: buildSlots("4-3-3"),
    captainId: null,
    viceId: null,
    powerUp: null,
    powerUpsUsed: [],
    wildcardUsed: false,
    gameweek: 1,
    totalPoints: 0,
    history: [],
  };
}

export function loadTeam(): FantasyTeamState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FantasyTeamState;
    if (!parsed.slots || !Array.isArray(parsed.slots)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveTeam(team: FantasyTeamState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(team));
  } catch {
    /* cuota llena o modo privado: ignorar */
  }
}

export function clearTeam(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

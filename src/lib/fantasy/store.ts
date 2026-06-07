// src/lib/fantasy/store.ts
//
// Persistencia del equipo fantasy en localStorage (no hay backend). Versionado
// para poder migrar/invalidar sin romper a usuarios antiguos.

import { buildSlots } from "./rules";
import { FREE_TRANSFERS, type FantasyTeamState } from "./types";

const KEY = "zm-fantasy:v2";

export function defaultTeam(): FantasyTeamState {
  return {
    teamName: "Mi Selección",
    creatorSlug: null,
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
    freeTransfers: FREE_TRANSFERS,
    committedSlots: [],
  };
}

/** Rellena campos que pudieran faltar en estados guardados por versiones antiguas. */
export function normalizeTeam(t: FantasyTeamState): FantasyTeamState {
  return {
    ...defaultTeam(),
    ...t,
    freeTransfers: typeof t.freeTransfers === "number" ? t.freeTransfers : FREE_TRANSFERS,
    committedSlots: Array.isArray(t.committedSlots) ? t.committedSlots : [],
    history: Array.isArray(t.history) ? t.history : [],
    powerUpsUsed: Array.isArray(t.powerUpsUsed) ? t.powerUpsUsed : [],
  };
}

export function loadTeam(): FantasyTeamState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FantasyTeamState;
    if (!parsed.slots || !Array.isArray(parsed.slots)) return null;
    return normalizeTeam(parsed);
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

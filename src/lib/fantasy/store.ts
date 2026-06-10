// src/lib/fantasy/store.ts
//
// Persistencia del equipo fantasy en localStorage (no hay backend). Versionado
// para poder migrar/invalidar sin romper a usuarios antiguos.

import { buildSlots } from "./rules";
import { FREE_TRANSFERS, type FantasyTeamState } from "./types";

// v3 = torneo real (11-jun-2026). El v2 era la pretemporada simulada: al migrar
// se CONSERVA la plantilla y se descarta el progreso de pruebas (espejo del SQL
// 2026-23 que hace lo mismo con los usuarios con cuenta; los invitados solo
// existen en localStorage, así que su reset de lanzamiento ocurre aquí).
const KEY = "zm-fantasy:v3";
const LEGACY_KEY = "zm-fantasy:v2";

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
    budgetBonus: 0,
    refundedIds: [],
    gwLock: null,
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
    budgetBonus: typeof t.budgetBonus === "number" ? t.budgetBonus : 0,
    refundedIds: Array.isArray(t.refundedIds) ? t.refundedIds : [],
    gwLock: t.gwLock && typeof t.gwLock.gw === "number" ? t.gwLock : null,
  };
}

/**
 * Migración v2→v3 (reset de lanzamiento): conserva plantilla, formación,
 * capitán, vice, nombre y creador del equipo de pretemporada; pone a cero el
 * progreso de pruebas (jornada, puntos, historial, fichajes, chips, reembolsos).
 * Mismas claves que resetea el SQL 2026-23 en `fantasy_teams.state`. Se ejecuta
 * UNA vez: tras migrar, la clave v2 se elimina.
 */
function migrateLegacy(): FantasyTeamState | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw) as FantasyTeamState;
    if (!old.slots || !Array.isArray(old.slots)) return null;
    const fresh: FantasyTeamState = {
      ...normalizeTeam(old), // conserva plantilla/formación/capitán/nombre/creador
      gameweek: 1,
      totalPoints: 0,
      history: [],
      committedSlots: [], // el armado de la 1ª jornada real es gratis
      freeTransfers: FREE_TRANSFERS,
      powerUp: null,
      powerUpsUsed: [], // los 5 chips vuelven a estar disponibles
      budgetBonus: 0, // sin reembolsos reales todavía
      refundedIds: [],
      gwLock: null,
    };
    window.localStorage.setItem(KEY, JSON.stringify(fresh));
    window.localStorage.removeItem(LEGACY_KEY);
    return fresh;
  } catch {
    return null;
  }
}

export function loadTeam(): FantasyTeamState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return migrateLegacy();
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

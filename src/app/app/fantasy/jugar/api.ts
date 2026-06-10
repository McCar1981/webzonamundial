// src/app/app/fantasy/jugar/api.ts
//
// Cliente del backend real del Fantasy (Fase 1). Envuelve los endpoints
// /api/fantasy/* para que las vistas no toquen fetch directamente. Todas las
// funciones degradan a null/[] si no hay sesión o falla la red: el juego sigue
// funcionando en modo invitado (localStorage).

import type { FantasyTeamState } from "@/lib/fantasy/types";
import type { LiveSnapshot } from "@/lib/match-center/types";
import { handleProRequired } from "@/lib/pro/paywall-client";

export interface FantasyRankEntry {
  position: number;
  user_id: string;
  team_name: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  gameweek: number;
}

export interface FantasyLeague {
  id: string; name: string; code: string; owner_id: string; member_count: number; is_owner: boolean; is_draft: boolean;
}

/** Conflicto de exclusividad en liga Draft: jugador que ya tiene otro manager. */
export interface DraftConflict { player_id: string; held_by: string }

export interface FantasyLeagueStanding {
  position: number; user_id: string; team_name: string; display_name: string; avatar_url: string | null; points: number; is_owner: boolean;
}

/** Equipo guardado en el servidor + creador del registro (para branding). */
export interface ServerTeamResult {
  team: FantasyTeamState | null; // null si el usuario aún no tiene equipo
  favCreator: string | null; // slug del creador con el que se registró
}

export async function fetchServerTeam(): Promise<ServerTeamResult> {
  try {
    const res = await fetch("/api/fantasy/team", { cache: "no-store" });
    if (!res.ok) return { team: null, favCreator: null };
    const data = (await res.json()) as { team: FantasyTeamState | null; favCreator?: string | null };
    return { team: data.team ?? null, favCreator: data.favCreator ?? null };
  } catch {
    return { team: null, favCreator: null };
  }
}

/** Fija el creador del usuario más adelante (quien no lo eligió al registrarse). */
export async function setFantasyCreator(slug: string): Promise<boolean> {
  try {
    const res = await fetch("/api/fantasy/creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Resultado del guardado: ok + Fútcoins/XP abonados al confirmar jornada (0 si no). */
export interface SaveTeamResult {
  ok: boolean;
  futcoins: number;
  xpAwarded: number;
  /** true si el servidor registró la jornada (puntos recalculados con datos reales). */
  confirmed: boolean;
  /** Puntos netos AUTORITATIVOS de la jornada (calculados en servidor), o null. */
  gameweekPoints: number | null;
  /** Liga Draft: jugadores de la alineación que pertenecen a otro manager (guardado RECHAZADO). */
  draftConflicts?: DraftConflict[];
}

/** Guarda el equipo en el servidor. gameweekScore se envía al confirmar jornada. */
export async function saveServerTeam(
  state: FantasyTeamState,
  gameweekScore?: { gw: number; points: number; powerUp: string | null },
): Promise<SaveTeamResult> {
  const fail: SaveTeamResult = { ok: false, futcoins: 0, xpAwarded: 0, confirmed: false, gameweekPoints: null };
  try {
    const res = await fetch("/api/fantasy/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, gameweekScore }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string; conflicts?: DraftConflict[] };
      // Liga Draft: la alineación incluye jugadores de otro manager → el juego
      // muestra cuáles y de quién (el guardado no se aplicó).
      if (res.status === 409 && err.error === "draft_conflict") {
        return { ...fail, draftConflicts: err.conflicts ?? [] };
      }
      // Plantilla cerrada para Free (lock 24h / jornada en juego): abre el
      // paywall global con el copy del límite.
      handleProRequired(err);
      return fail;
    }
    const data = (await res.json()) as { futcoins?: number; xpAwarded?: number; confirmed?: boolean; gameweekPoints?: number | null };
    return {
      ok: true,
      futcoins: data.futcoins ?? 0,
      xpAwarded: data.xpAwarded ?? 0,
      confirmed: data.confirmed ?? false,
      gameweekPoints: data.gameweekPoints ?? null,
    };
  } catch {
    return fail;
  }
}

/**
 * Jugadores pillados por otros managers de mi liga Draft (mapa playerId → dueño).
 * null si no estoy en ninguna liga Draft. El mercado y el picker los bloquean.
 */
export async function fetchDraftTaken(): Promise<{ leagueName: string; taken: Map<string, string> } | null> {
  try {
    const res = await fetch("/api/fantasy/leagues/claims", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { league_id: string | null; league_name: string | null; taken: DraftConflict[] };
    if (!data.league_id) return null;
    return { leagueName: data.league_name ?? "Draft", taken: new Map(data.taken.map((t) => [t.player_id, t.held_by])) };
  } catch {
    return null;
  }
}

/**
 * Snapshots REALES de los partidos de la jornada (Fase 3). Devuelve un mapa
 * matchId → snapshot. Degrada a {} si no hay datos.
 */
export async function fetchFantasyLive(matchIds: number[]): Promise<Record<number, LiveSnapshot>> {
  if (matchIds.length === 0) return {};
  try {
    const res = await fetch(`/api/fantasy/live?ids=${matchIds.join("-")}`, { cache: "no-store" });
    if (!res.ok) return {};
    const data = (await res.json()) as { snapshots: Record<number, LiveSnapshot> };
    return data.snapshots ?? {};
  } catch {
    return {};
  }
}

export async function fetchLeaderboard(
  period: "tournament" | "weekly",
  gw?: number,
  limit = 50,
): Promise<{ rankings: FantasyRankEntry[]; my_position: number | null }> {
  try {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (period === "weekly") { qs.set("period", "weekly"); if (gw) qs.set("gw", String(gw)); }
    const res = await fetch(`/api/fantasy/leaderboard?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return { rankings: [], my_position: null };
    return (await res.json()) as { rankings: FantasyRankEntry[]; my_position: number | null };
  } catch {
    return { rankings: [], my_position: null };
  }
}

export async function fetchMyLeagues(): Promise<FantasyLeague[]> {
  try {
    const res = await fetch("/api/fantasy/leagues", { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { leagues: FantasyLeague[] };
    return data.leagues ?? [];
  } catch {
    return [];
  }
}

export async function createServerLeague(name: string, draft = false): Promise<{ ok: boolean; league?: FantasyLeague; error?: string; proRequired?: boolean }> {
  try {
    const res = await fetch("/api/fantasy/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, draft }),
    });
    const data = (await res.json()) as { ok?: boolean; league?: FantasyLeague; error?: string; code?: string };
    // crear ligas privadas = Pro. Si el gate saltó, abrimos el paywall y avisamos
    // al call-site para que NO muestre además un error rojo (ya hay modal).
    const proRequired = !res.ok && handleProRequired(data, "leagues_create");
    return { ok: res.ok && data.ok !== false, league: data.league, error: data.error, proRequired };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function joinServerLeague(code: string): Promise<{ ok: boolean; league?: FantasyLeague; error?: string; conflicts?: DraftConflict[] }> {
  try {
    const res = await fetch("/api/fantasy/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = (await res.json()) as { ok?: boolean; league?: FantasyLeague; error?: string; conflicts?: DraftConflict[] };
    return { ok: res.ok && data.ok !== false, league: data.league, error: data.error, conflicts: data.conflicts };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** Clasificación de una liga. `gw` opcional → ranking de esa jornada (no el total). */
export async function fetchLeagueStandings(
  id: string,
  gw?: number,
): Promise<{ standings: FantasyLeagueStanding[]; is_owner: boolean; me: string | null }> {
  try {
    const qs = gw ? `?gw=${gw}` : "";
    const res = await fetch(`/api/fantasy/leagues/${id}${qs}`, { cache: "no-store" });
    if (!res.ok) return { standings: [], is_owner: false, me: null };
    const data = (await res.json()) as { standings: FantasyLeagueStanding[]; is_owner?: boolean; me?: string };
    return { standings: data.standings ?? [], is_owner: data.is_owner ?? false, me: data.me ?? null };
  } catch {
    return { standings: [], is_owner: false, me: null };
  }
}

/** Abandonar (miembro) o borrar (dueño) la liga. Devuelve la acción aplicada. */
export async function leaveServerLeague(id: string): Promise<"left" | "deleted" | null> {
  try {
    const res = await fetch(`/api/fantasy/leagues/${id}`, { method: "DELETE" });
    if (!res.ok) return null;
    const data = (await res.json()) as { action?: "left" | "deleted" };
    return data.action ?? "left";
  } catch {
    return null;
  }
}

/** Renombra una liga (solo dueño). */
export async function renameServerLeague(id: string, name: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/fantasy/leagues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Expulsa a un miembro de la liga (solo dueño). */
export async function kickServerMember(id: string, memberId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/fantasy/leagues/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

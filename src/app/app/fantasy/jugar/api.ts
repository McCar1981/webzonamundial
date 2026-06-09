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
  id: string; name: string; code: string; owner_id: string; member_count: number; is_owner: boolean;
}

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
}

/** Guarda el equipo en el servidor. gameweekScore se envía al confirmar jornada. */
export async function saveServerTeam(
  state: FantasyTeamState,
  gameweekScore?: { gw: number; points: number; powerUp: string | null },
): Promise<SaveTeamResult> {
  try {
    const res = await fetch("/api/fantasy/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, gameweekScore }),
    });
    if (!res.ok) {
      // Plantilla cerrada para Free (lock 24h / jornada en juego): abre el
      // paywall global con el copy del límite.
      const err = await res.json().catch(() => ({}));
      handleProRequired(err);
      return { ok: false, futcoins: 0, xpAwarded: 0 };
    }
    const data = (await res.json()) as { futcoins?: number; xpAwarded?: number };
    return { ok: true, futcoins: data.futcoins ?? 0, xpAwarded: data.xpAwarded ?? 0 };
  } catch {
    return { ok: false, futcoins: 0, xpAwarded: 0 };
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

export async function createServerLeague(name: string): Promise<{ ok: boolean; league?: FantasyLeague; error?: string }> {
  try {
    const res = await fetch("/api/fantasy/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = (await res.json()) as { ok?: boolean; league?: FantasyLeague; error?: string };
    if (!res.ok) handleProRequired(data); // crear ligas privadas = Pro
    return { ok: res.ok && data.ok !== false, league: data.league, error: data.error };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function joinServerLeague(code: string): Promise<{ ok: boolean; league?: FantasyLeague; error?: string }> {
  try {
    const res = await fetch("/api/fantasy/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = (await res.json()) as { ok?: boolean; league?: FantasyLeague; error?: string };
    return { ok: res.ok && data.ok !== false, league: data.league, error: data.error };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** Clasificación de una liga. `gw` opcional → ranking de esa jornada (no el total). */
export async function fetchLeagueStandings(
  id: string,
  gw?: number,
): Promise<{ standings: FantasyLeagueStanding[]; is_owner: boolean }> {
  try {
    const qs = gw ? `?gw=${gw}` : "";
    const res = await fetch(`/api/fantasy/leagues/${id}${qs}`, { cache: "no-store" });
    if (!res.ok) return { standings: [], is_owner: false };
    const data = (await res.json()) as { standings: FantasyLeagueStanding[]; is_owner?: boolean };
    return { standings: data.standings ?? [], is_owner: data.is_owner ?? false };
  } catch {
    return { standings: [], is_owner: false };
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

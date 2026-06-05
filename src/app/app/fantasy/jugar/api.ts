// src/app/app/fantasy/jugar/api.ts
//
// Cliente del backend real del Fantasy (Fase 1). Envuelve los endpoints
// /api/fantasy/* para que las vistas no toquen fetch directamente. Todas las
// funciones degradan a null/[] si no hay sesión o falla la red: el juego sigue
// funcionando en modo invitado (localStorage).

import type { FantasyTeamState } from "@/lib/fantasy/types";

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
  id: string; name: string; code: string; owner_id: string; member_count: number;
}

export interface FantasyLeagueStanding {
  position: number; user_id: string; team_name: string; display_name: string; avatar_url: string | null; points: number;
}

/** Equipo guardado en el servidor (null si el usuario aún no tiene). */
export async function fetchServerTeam(): Promise<FantasyTeamState | null> {
  try {
    const res = await fetch("/api/fantasy/team", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { team: FantasyTeamState | null };
    return data.team ?? null;
  } catch {
    return null;
  }
}

/** Guarda el equipo en el servidor. gameweekScore se envía al confirmar jornada. */
export async function saveServerTeam(
  state: FantasyTeamState,
  gameweekScore?: { gw: number; points: number; powerUp: string | null },
): Promise<boolean> {
  try {
    const res = await fetch("/api/fantasy/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, gameweekScore }),
    });
    return res.ok;
  } catch {
    return false;
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
    return { ok: res.ok, league: data.league, error: data.error };
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

export async function fetchLeagueStandings(id: string): Promise<FantasyLeagueStanding[]> {
  try {
    const res = await fetch(`/api/fantasy/leagues/${id}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { standings: FantasyLeagueStanding[] };
    return data.standings ?? [];
  } catch {
    return [];
  }
}

export async function leaveServerLeague(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/fantasy/leagues/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

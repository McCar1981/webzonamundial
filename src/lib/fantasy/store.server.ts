// src/lib/fantasy/store.server.ts
//
// Capa de datos (Supabase) del Fantasy. Igual que en Predicciones: el usuario
// lee/escribe SU equipo con el cliente RLS (createSupabaseServerClient); el
// ranking global y el semanal cruzan usuarios y usan el cliente admin (service
// role) que bypassa RLS. Server-only.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/predictions/admin";
import { normalizeTeam } from "./store";
import type { FantasyTeamState } from "./types";

// ─── Equipo del usuario ──────────────────────────────────────────────────────
export async function getTeam(userId: string): Promise<FantasyTeamState | null> {
  const supa = createSupabaseServerClient();
  const { data } = await supa
    .from("fantasy_teams")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  const state = (data as { state?: FantasyTeamState } | null)?.state;
  if (!state || !Array.isArray(state.slots)) return null;
  return normalizeTeam(state);
}

export async function saveTeam(userId: string, state: FantasyTeamState): Promise<void> {
  const supa = createSupabaseServerClient();
  const { error } = await supa.from("fantasy_teams").upsert(
    {
      user_id: userId,
      team_name: (state.teamName || "Mi Selección").slice(0, 40),
      state,
      total_points: state.totalPoints ?? 0,
      gameweek: state.gameweek ?? 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/**
 * Registra (o actualiza) los puntos de una jornada para el ranking semanal y la
 * auditoría. Lectura propia con RLS; un usuario solo escribe su fila.
 */
export async function recordGameweekScore(
  userId: string,
  gameweek: number,
  points: number,
  powerUp: string | null,
): Promise<void> {
  const supa = createSupabaseServerClient();
  await supa.from("fantasy_gameweek_scores").upsert(
    { user_id: userId, gameweek, points, power_up: powerUp },
    { onConflict: "user_id,gameweek" },
  );
}

// ─── Ranking global (acumulado del torneo) ───────────────────────────────────
export interface FantasyRankEntry {
  position: number;
  user_id: string;
  team_name: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  gameweek: number;
}

export async function getGlobalLeaderboard(limit = 50): Promise<FantasyRankEntry[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("fantasy_teams")
    .select("user_id,team_name,total_points,gameweek")
    .order("total_points", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as { user_id: string; team_name: string; total_points: number; gameweek: number }[];
  return withProfiles(rows.map((r) => ({
    user_id: r.user_id, team_name: r.team_name, points: r.total_points ?? 0, gameweek: r.gameweek ?? 1,
  })));
}

/** Ranking de UNA jornada concreta (semanal). */
export async function getGameweekLeaderboard(gameweek: number, limit = 50): Promise<FantasyRankEntry[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("fantasy_gameweek_scores")
    .select("user_id,points")
    .eq("gameweek", gameweek)
    .order("points", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as { user_id: string; points: number }[];
  return withProfiles(rows.map((r) => ({
    user_id: r.user_id, team_name: "", points: r.points ?? 0, gameweek,
  })));
}

/** Adjunta nombre de equipo (si falta), username y avatar de profiles. */
async function withProfiles(
  rows: { user_id: string; team_name: string; points: number; gameweek: number }[],
): Promise<FantasyRankEntry[]> {
  const admin = adminClient();
  const ids = rows.map((r) => r.user_id);
  const { data: profs } = ids.length
    ? await admin.from("profiles").select("id,username,avatar_url").in("id", ids)
    : { data: [] };
  const pmap = new Map((profs ?? []).map((p) => {
    const r = p as { id: string; username: string | null; avatar_url: string | null };
    return [r.id, r];
  }));
  // team_name puede venir vacío (ranking semanal): lo completamos desde fantasy_teams.
  let teamNames = new Map<string, string>();
  if (rows.some((r) => !r.team_name)) {
    const { data: teams } = ids.length
      ? await admin.from("fantasy_teams").select("user_id,team_name").in("user_id", ids)
      : { data: [] };
    teamNames = new Map((teams ?? []).map((t) => {
      const r = t as { user_id: string; team_name: string };
      return [r.user_id, r.team_name];
    }));
  }
  return rows.map((r, i) => ({
    position: i + 1,
    user_id: r.user_id,
    team_name: r.team_name || teamNames.get(r.user_id) || "Mi Selección",
    display_name: pmap.get(r.user_id)?.username ?? "Anónimo",
    avatar_url: pmap.get(r.user_id)?.avatar_url ?? null,
    points: r.points,
    gameweek: r.gameweek,
  }));
}

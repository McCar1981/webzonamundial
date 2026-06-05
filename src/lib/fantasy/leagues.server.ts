// src/lib/fantasy/leagues.server.ts
//
// Ligas privadas REALES del Fantasy (managers de carne y hueso, no bots). Mismo
// patrón que las ligas de Predicciones: el código de invitación agrupa usuarios
// y la clasificación cruza miembros, por lo que se calcula con el cliente admin
// (service role). Server-only.

import { adminClient } from "@/lib/predictions/admin";
import { leagueCode } from "@/lib/predictions/gamification";

export interface FantasyLeagueOut {
  id: string; name: string; code: string; owner_id: string; member_count: number;
}

export async function createLeague(uid: string, name: string): Promise<FantasyLeagueOut> {
  const admin = adminClient();
  let code = leagueCode(`fty:${uid}:${Date.now()}`);
  // Garantizar unicidad del código.
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await admin.from("fantasy_leagues").select("id").eq("code", code).maybeSingle();
    if (!exists) break;
    code = leagueCode(`fty:${uid}:${Date.now()}:${i}`);
  }
  const { data, error } = await admin.from("fantasy_leagues")
    .insert({ name: name.slice(0, 60), code, owner_id: uid }).select("*").single();
  if (error) throw error;
  const league = data as { id: string; name: string; code: string; owner_id: string };
  await admin.from("fantasy_league_members").insert({ league_id: league.id, user_id: uid });
  return { ...league, member_count: 1 };
}

export async function joinLeague(uid: string, code: string): Promise<{ ok: boolean; error?: string; league?: FantasyLeagueOut }> {
  const admin = adminClient();
  const { data: league } = await admin.from("fantasy_leagues")
    .select("id,name,code,owner_id").eq("code", code.toUpperCase()).maybeSingle();
  if (!league) return { ok: false, error: "league_not_found" };
  const l = league as { id: string; name: string; code: string; owner_id: string };
  await admin.from("fantasy_league_members")
    .upsert({ league_id: l.id, user_id: uid }, { onConflict: "league_id,user_id" });
  const { count } = await admin.from("fantasy_league_members")
    .select("user_id", { count: "exact", head: true }).eq("league_id", l.id);
  return { ok: true, league: { ...l, member_count: count ?? 1 } };
}

export async function leaveLeague(uid: string, leagueId: string): Promise<void> {
  const admin = adminClient();
  await admin.from("fantasy_league_members").delete().eq("league_id", leagueId).eq("user_id", uid);
}

export async function myLeagues(uid: string): Promise<FantasyLeagueOut[]> {
  const admin = adminClient();
  const { data: mem } = await admin.from("fantasy_league_members").select("league_id").eq("user_id", uid);
  const ids = (mem ?? []).map((m) => (m as { league_id: string }).league_id);
  if (!ids.length) return [];
  const { data: leagues } = await admin.from("fantasy_leagues").select("id,name,code,owner_id").in("id", ids);
  const out: FantasyLeagueOut[] = [];
  for (const l of (leagues ?? []) as { id: string; name: string; code: string; owner_id: string }[]) {
    const { count } = await admin.from("fantasy_league_members")
      .select("user_id", { count: "exact", head: true }).eq("league_id", l.id);
    out.push({ ...l, member_count: count ?? 0 });
  }
  return out;
}

export interface FantasyLeagueStanding {
  position: number; user_id: string; team_name: string; display_name: string; avatar_url: string | null; points: number;
}

export async function leagueLeaderboard(leagueId: string): Promise<FantasyLeagueStanding[]> {
  const admin = adminClient();
  const { data: mem } = await admin.from("fantasy_league_members").select("user_id").eq("league_id", leagueId);
  const ids = (mem ?? []).map((m) => (m as { user_id: string }).user_id);
  if (!ids.length) return [];
  const { data: teams } = await admin.from("fantasy_teams")
    .select("user_id,team_name,total_points").in("user_id", ids);
  const tmap = new Map((teams ?? []).map((t) => {
    const r = t as { user_id: string; team_name: string; total_points: number };
    return [r.user_id, r];
  }));
  const { data: profs } = await admin.from("profiles").select("id,username,avatar_url").in("id", ids);
  const pmap = new Map((profs ?? []).map((p) => {
    const r = p as { id: string; username: string | null; avatar_url: string | null };
    return [r.id, r];
  }));
  return ids
    .map((id) => ({ user_id: id, points: tmap.get(id)?.total_points ?? 0, team_name: tmap.get(id)?.team_name ?? "Mi Selección" }))
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({
      position: i + 1,
      user_id: e.user_id,
      team_name: e.team_name,
      display_name: pmap.get(e.user_id)?.username ?? "Anónimo",
      avatar_url: pmap.get(e.user_id)?.avatar_url ?? null,
      points: e.points,
    }));
}

/** ¿Es miembro de la liga? (para autorizar la lectura de su clasificación). */
export async function isMember(uid: string, leagueId: string): Promise<boolean> {
  const admin = adminClient();
  const { data } = await admin.from("fantasy_league_members")
    .select("user_id").eq("league_id", leagueId).eq("user_id", uid).maybeSingle();
  return Boolean(data);
}

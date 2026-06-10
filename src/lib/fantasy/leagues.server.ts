// src/lib/fantasy/leagues.server.ts
//
// Ligas privadas REALES del Fantasy (managers de carne y hueso, no bots). Mismo
// patrón que las ligas de Predicciones: el código de invitación agrupa usuarios
// y la clasificación cruza miembros, por lo que se calcula con el cliente admin
// (service role). Server-only.
//
// Producción: el dueño puede gestionar su liga (renombrar, expulsar, borrar),
// hay topes anti-abuso (miembros por liga / ligas por usuario) y la clasificación
// puede verse por TOTAL del torneo o por JORNADA (reusa fantasy_gameweek_scores).

import { adminClient } from "@/lib/predictions/admin";
import { leagueCode } from "@/lib/predictions/gamification";

// ─── Topes anti-abuso ─────────────────────────────────────────────────────────
// El Fantasy puntúa en cliente; acotamos el tamaño para que una liga no se use
// como vector de spam/relleno y para mantener las consultas baratas.
export const MAX_MEMBERS_PER_LEAGUE = 100;
export const MAX_LEAGUES_OWNED = 20;
export const MAX_LEAGUES_JOINED = 50;

export interface FantasyLeagueOut {
  id: string; name: string; code: string; owner_id: string; member_count: number; is_owner: boolean; is_draft: boolean;
}

/** Conflicto de exclusividad: el jugador ya pertenece a otro manager de la liga Draft. */
export interface DraftConflict { player_id: string; held_by: string }

export type CreateLeagueError = "too_many_leagues" | "bad_name" | "draft_limit";
export type JoinLeagueError = "league_not_found" | "invalid_code" | "league_full" | "too_many_leagues" | "draft_limit";

/** Normaliza el nombre de liga: recorta espacios y limita a 60 chars. "" si vacío. */
function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, 60);
}

async function ownedCount(admin: ReturnType<typeof adminClient>, uid: string): Promise<number> {
  const { count } = await admin.from("fantasy_leagues")
    .select("id", { count: "exact", head: true }).eq("owner_id", uid);
  return count ?? 0;
}

async function joinedCount(admin: ReturnType<typeof adminClient>, uid: string): Promise<number> {
  const { count } = await admin.from("fantasy_league_members")
    .select("user_id", { count: "exact", head: true }).eq("user_id", uid);
  return count ?? 0;
}

async function memberCount(admin: ReturnType<typeof adminClient>, leagueId: string): Promise<number> {
  const { count } = await admin.from("fantasy_league_members")
    .select("user_id", { count: "exact", head: true }).eq("league_id", leagueId);
  return count ?? 0;
}

export async function createLeague(uid: string, name: string, isDraft = false): Promise<{ ok: boolean; error?: CreateLeagueError; league?: FantasyLeagueOut }> {
  const admin = adminClient();
  const clean = cleanName(name);
  if (!clean) return { ok: false, error: "bad_name" };
  if (await ownedCount(admin, uid) >= MAX_LEAGUES_OWNED) return { ok: false, error: "too_many_leagues" };
  // El equipo es ÚNICO y global: para que las reglas de exclusividad de dos
  // ligas no choquen sobre la misma plantilla, cada usuario está como mucho
  // en UNA liga Draft (como dueño o como miembro).
  if (isDraft && (await myDraftLeague(admin, uid))) return { ok: false, error: "draft_limit" };

  let code = leagueCode(`fty:${uid}:${Date.now()}`);
  // Garantizar unicidad del código.
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await admin.from("fantasy_leagues").select("id").eq("code", code).maybeSingle();
    if (!exists) break;
    code = leagueCode(`fty:${uid}:${Date.now()}:${i}`);
  }
  const { data, error } = await admin.from("fantasy_leagues")
    .insert({ name: clean, code, owner_id: uid, is_draft: isDraft }).select("*").single();
  if (error) throw error;
  const league = data as { id: string; name: string; code: string; owner_id: string; is_draft: boolean };
  await admin.from("fantasy_league_members").insert({ league_id: league.id, user_id: uid });

  // Reconciliación anti-carrera: el chequeo previo de ownedCount es TOCTOU (dos
  // creates simultáneos podrían superar el tope). Tras insertar, reverificamos;
  // el que sobra retira su propia liga (cascade borra la membresía).
  if (await ownedCount(admin, uid) > MAX_LEAGUES_OWNED) {
    await admin.from("fantasy_leagues").delete().eq("id", league.id);
    return { ok: false, error: "too_many_leagues" };
  }
  // Liga Draft: el dueño estrena la liga reclamando su plantilla actual.
  if (league.is_draft) await claimPlayers(admin, league.id, uid, await teamPlayerIds(admin, uid));
  return { ok: true, league: { ...league, member_count: 1, is_owner: true } };
}

export async function joinLeague(uid: string, code: string): Promise<{ ok: boolean; error?: JoinLeagueError; league?: FantasyLeagueOut; conflicts?: DraftConflict[] }> {
  const admin = adminClient();
  const norm = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (norm.length !== 6) return { ok: false, error: "invalid_code" };

  const { data: league } = await admin.from("fantasy_leagues")
    .select("id,name,code,owner_id,is_draft").eq("code", norm).maybeSingle();
  if (!league) return { ok: false, error: "league_not_found" };
  const l = league as { id: string; name: string; code: string; owner_id: string; is_draft: boolean };

  // ¿Ya es miembro? Entonces el join es idempotente y no consume cupo.
  const already = await isMember(uid, l.id);
  if (!already) {
    if (await joinedCount(admin, uid) >= MAX_LEAGUES_JOINED) return { ok: false, error: "too_many_leagues" };
    if (await memberCount(admin, l.id) >= MAX_MEMBERS_PER_LEAGUE) return { ok: false, error: "league_full" };
    // Una sola liga Draft por usuario (su equipo global no puede servir a dos amos).
    if (l.is_draft && (await myDraftLeague(admin, uid))) return { ok: false, error: "draft_limit" };
  }

  await admin.from("fantasy_league_members")
    .upsert({ league_id: l.id, user_id: uid }, { onConflict: "league_id,user_id" });
  const count = await memberCount(admin, l.id);

  // Reconciliación anti-carrera: el chequeo previo de aforo es TOCTOU. Si dos
  // joins simultáneos superan el tope, el que sobra retira su propia membresía
  // (solo si acaba de entrar; a un miembro ya existente no se le echa).
  if (!already && count > MAX_MEMBERS_PER_LEAGUE) {
    await admin.from("fantasy_league_members").delete().eq("league_id", l.id).eq("user_id", uid);
    return { ok: false, error: "league_full" };
  }

  // Liga Draft: al entrar se reclama la plantilla actual del que llega. Los
  // jugadores que YA tenía pillados otro miembro quedan en conflicto: el join
  // se permite (no le cerramos la puerta), pero no podrá guardar cambios de
  // alineación hasta deshacerse de ellos (enforcement en PUT /api/fantasy/team).
  let conflicts: DraftConflict[] = [];
  if (l.is_draft) {
    await claimPlayers(admin, l.id, uid, await teamPlayerIds(admin, uid));
    conflicts = await foreignClaims(admin, l.id, uid, await teamPlayerIds(admin, uid));
  }
  return { ok: true, league: { ...l, member_count: count, is_owner: l.owner_id === uid }, conflicts };
}

export async function leaveLeague(uid: string, leagueId: string): Promise<void> {
  const admin = adminClient();
  await admin.from("fantasy_league_members").delete().eq("league_id", leagueId).eq("user_id", uid);
  // Sus jugadores quedan libres para el resto de la liga (si era Draft).
  await admin.from("fantasy_league_player_claims").delete().eq("league_id", leagueId).eq("user_id", uid);
}

/** Renombra una liga. Solo el dueño. Devuelve false si no autorizado o nombre inválido. */
export async function renameLeague(uid: string, leagueId: string, name: string): Promise<boolean> {
  const admin = adminClient();
  const clean = cleanName(name);
  if (!clean) return false;
  if (!(await isOwner(uid, leagueId))) return false;
  await admin.from("fantasy_leagues").update({ name: clean }).eq("id", leagueId);
  return true;
}

/** Expulsa a un miembro. Solo el dueño, y no puede expulsarse a sí mismo (debe borrar la liga). */
export async function kickMember(uid: string, leagueId: string, targetId: string): Promise<boolean> {
  const admin = adminClient();
  if (targetId === uid) return false;
  if (!(await isOwner(uid, leagueId))) return false;
  await admin.from("fantasy_league_members").delete().eq("league_id", leagueId).eq("user_id", targetId);
  // Sus jugadores quedan libres para el resto de la liga (si era Draft).
  await admin.from("fantasy_league_player_claims").delete().eq("league_id", leagueId).eq("user_id", targetId);
  return true;
}

/** Borra la liga entera (cascade a miembros). Solo el dueño. */
export async function deleteLeague(uid: string, leagueId: string): Promise<boolean> {
  const admin = adminClient();
  if (!(await isOwner(uid, leagueId))) return false;
  await admin.from("fantasy_leagues").delete().eq("id", leagueId);
  return true;
}

export async function myLeagues(uid: string): Promise<FantasyLeagueOut[]> {
  const admin = adminClient();
  const { data: mem } = await admin.from("fantasy_league_members").select("league_id").eq("user_id", uid);
  const ids = (mem ?? []).map((m) => (m as { league_id: string }).league_id);
  if (!ids.length) return [];
  const { data: leagues } = await admin.from("fantasy_leagues").select("id,name,code,owner_id,is_draft").in("id", ids);

  // Conteo de miembros de TODAS las ligas en una sola query (antes era N+1: una
  // consulta memberCount por liga). Se tabula en memoria por league_id.
  const { data: allMembers } = await admin.from("fantasy_league_members").select("league_id").in("league_id", ids);
  const counts = new Map<string, number>();
  for (const m of (allMembers ?? []) as { league_id: string }[]) {
    counts.set(m.league_id, (counts.get(m.league_id) ?? 0) + 1);
  }
  return ((leagues ?? []) as { id: string; name: string; code: string; owner_id: string; is_draft: boolean }[])
    .map((l) => ({ ...l, member_count: counts.get(l.id) ?? 0, is_owner: l.owner_id === uid }));
}

export interface FantasyLeagueStanding {
  position: number; user_id: string; team_name: string; display_name: string; avatar_url: string | null; points: number; is_owner: boolean;
}

/**
 * Clasificación de una liga. Por defecto usa el TOTAL del torneo
 * (fantasy_teams.total_points). Si se pasa `gameweek`, ordena por los puntos de
 * ESA jornada (fantasy_gameweek_scores): así una liga puede competir "por jornada".
 */
export async function leagueLeaderboard(leagueId: string, gameweek?: number): Promise<FantasyLeagueStanding[]> {
  const admin = adminClient();
  const { data: lg } = await admin.from("fantasy_leagues").select("owner_id").eq("id", leagueId).maybeSingle();
  const ownerId = (lg as { owner_id: string } | null)?.owner_id ?? null;

  const { data: mem } = await admin.from("fantasy_league_members").select("user_id").eq("league_id", leagueId);
  const ids = (mem ?? []).map((m) => (m as { user_id: string }).user_id);
  if (!ids.length) return [];

  // Puntos: total del torneo o de una jornada concreta.
  const points = new Map<string, number>();
  if (gameweek && gameweek > 0) {
    const { data: scores } = await admin.from("fantasy_gameweek_scores")
      .select("user_id,points").eq("gameweek", gameweek).in("user_id", ids);
    for (const s of (scores ?? []) as { user_id: string; points: number }[]) points.set(s.user_id, s.points);
  } else {
    const { data: teams } = await admin.from("fantasy_teams").select("user_id,total_points").in("user_id", ids);
    for (const t of (teams ?? []) as { user_id: string; total_points: number }[]) points.set(t.user_id, t.total_points);
  }

  // Nombre de equipo + perfil.
  const { data: teams } = await admin.from("fantasy_teams").select("user_id,team_name").in("user_id", ids);
  const tname = new Map((teams ?? []).map((t) => {
    const r = t as { user_id: string; team_name: string };
    return [r.user_id, r.team_name];
  }));
  const { data: profs } = await admin.from("profiles").select("id,username,avatar_url").in("id", ids);
  const pmap = new Map((profs ?? []).map((p) => {
    const r = p as { id: string; username: string | null; avatar_url: string | null };
    return [r.id, r];
  }));

  return ids
    .map((id) => ({ user_id: id, points: points.get(id) ?? 0, team_name: tname.get(id) ?? "Mi Selección" }))
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({
      position: i + 1,
      user_id: e.user_id,
      team_name: e.team_name,
      display_name: pmap.get(e.user_id)?.username ?? "Anónimo",
      avatar_url: pmap.get(e.user_id)?.avatar_url ?? null,
      points: e.points,
      is_owner: e.user_id === ownerId,
    }));
}

/** ¿Es miembro de la liga? (para autorizar la lectura de su clasificación). */
export async function isMember(uid: string, leagueId: string): Promise<boolean> {
  const admin = adminClient();
  const { data } = await admin.from("fantasy_league_members")
    .select("user_id").eq("league_id", leagueId).eq("user_id", uid).maybeSingle();
  return Boolean(data);
}

/** ¿Es el dueño de la liga? (para autorizar gestión: renombrar/expulsar/borrar). */
export async function isOwner(uid: string, leagueId: string): Promise<boolean> {
  const admin = adminClient();
  const { data } = await admin.from("fantasy_leagues")
    .select("owner_id").eq("id", leagueId).maybeSingle();
  return (data as { owner_id: string } | null)?.owner_id === uid;
}

// ─── Ligas DRAFT: exclusividad de jugadores ───────────────────────────────────
// Dentro de una liga Draft cada jugador pertenece a UN manager: el primero que
// guarda su equipo con él (INSERT con PK (league_id, player_id) y ON CONFLICT
// DO NOTHING → primero-que-llega lo garantiza la base de datos, nunca se "roba"
// un claim con un update). Al vender al jugador, salir de la liga o ser
// expulsado, el claim se libera. Como el equipo del usuario es ÚNICO y global,
// cada usuario está como mucho en una liga Draft (tope draft_limit).

/** Plantilla actual del usuario (ids de jugador del estado guardado). */
async function teamPlayerIds(admin: ReturnType<typeof adminClient>, uid: string): Promise<string[]> {
  const { data } = await admin.from("fantasy_teams").select("state").eq("user_id", uid).maybeSingle();
  const state = (data as { state?: { slots?: { playerId?: string | null }[] } } | null)?.state;
  return (state?.slots ?? []).map((s) => s.playerId).filter((id): id is string => Boolean(id));
}

/** Liga Draft del usuario (a lo sumo una), o null. */
async function myDraftLeague(admin: ReturnType<typeof adminClient>, uid: string): Promise<{ id: string; name: string } | null> {
  const { data: mem } = await admin.from("fantasy_league_members").select("league_id").eq("user_id", uid);
  const ids = (mem ?? []).map((m) => (m as { league_id: string }).league_id);
  if (!ids.length) return null;
  const { data } = await admin.from("fantasy_leagues")
    .select("id,name").in("id", ids).eq("is_draft", true).limit(1).maybeSingle();
  return (data as { id: string; name: string } | null) ?? null;
}

/** Reclama jugadores para un usuario. Primero-que-llega: los ya pillados no se tocan. */
async function claimPlayers(admin: ReturnType<typeof adminClient>, leagueId: string, uid: string, playerIds: string[]): Promise<void> {
  if (!playerIds.length) return;
  await admin.from("fantasy_league_player_claims").upsert(
    playerIds.map((pid) => ({ league_id: leagueId, player_id: pid, user_id: uid })),
    { onConflict: "league_id,player_id", ignoreDuplicates: true },
  );
}

/** De estos jugadores, ¿cuáles pertenecen a OTRO manager de la liga? (con su nombre). */
async function foreignClaims(admin: ReturnType<typeof adminClient>, leagueId: string, uid: string, playerIds: string[]): Promise<DraftConflict[]> {
  if (!playerIds.length) return [];
  const { data } = await admin.from("fantasy_league_player_claims")
    .select("player_id,user_id").eq("league_id", leagueId).in("player_id", playerIds).neq("user_id", uid);
  const rows = (data ?? []) as { player_id: string; user_id: string }[];
  if (!rows.length) return [];
  const holderIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = await admin.from("profiles").select("id,username").in("id", holderIds);
  const names = new Map(((profs ?? []) as { id: string; username: string | null }[]).map((p) => [p.id, p.username ?? "otro manager"]));
  return rows.map((r) => ({ player_id: r.player_id, held_by: names.get(r.user_id) ?? "otro manager" }));
}

/**
 * Chequeo previo al guardado del equipo: si el usuario está en una liga Draft y
 * su nueva plantilla contiene jugadores que pertenecen a OTRO miembro, devuelve
 * esos conflictos (el guardado debe rechazarse). [] si no hay liga Draft o no
 * hay conflictos.
 */
export async function draftConflictsForTeam(uid: string, playerIds: string[]): Promise<{ league: string; conflicts: DraftConflict[] }> {
  const admin = adminClient();
  const league = await myDraftLeague(admin, uid);
  if (!league || !playerIds.length) return { league: league?.name ?? "", conflicts: [] };
  return { league: league.name, conflicts: await foreignClaims(admin, league.id, uid, playerIds) };
}

/**
 * Sincroniza los claims del usuario con su plantilla recién guardada: libera lo
 * que ya no tiene y reclama lo nuevo (primero-que-llega). Devuelve los claims
 * que NO pudo conseguir por perder una carrera de guardado simultáneo (rarísimo:
 * el chequeo previo ya filtró; se devuelven como aviso, el próximo guardado con
 * ese jugador será rechazado).
 */
export async function syncDraftClaims(uid: string, playerIds: string[]): Promise<DraftConflict[]> {
  const admin = adminClient();
  const league = await myDraftLeague(admin, uid);
  if (!league) return [];
  // Libera los que ya no están en la plantilla (diff en memoria: evita el
  // filtro NOT IN de PostgREST, quisquilloso con el quoting de strings).
  const { data: mine } = await admin.from("fantasy_league_player_claims")
    .select("player_id").eq("league_id", league.id).eq("user_id", uid);
  const keep = new Set(playerIds);
  const toRelease = ((mine ?? []) as { player_id: string }[]).map((r) => r.player_id).filter((p) => !keep.has(p));
  if (toRelease.length) {
    await admin.from("fantasy_league_player_claims").delete()
      .eq("league_id", league.id).eq("user_id", uid).in("player_id", toRelease);
  }
  // Reclama los nuevos y reporta los que se perdieron por carrera.
  await claimPlayers(admin, league.id, uid, playerIds);
  return foreignClaims(admin, league.id, uid, playerIds);
}

/**
 * Jugadores PILLADOS por otros managers de la liga Draft del usuario (para que
 * el mercado los muestre bloqueados). null si el usuario no está en ninguna.
 */
export async function draftTakenForUser(uid: string): Promise<{ league_id: string; league_name: string; taken: { player_id: string; held_by: string }[] } | null> {
  const admin = adminClient();
  const league = await myDraftLeague(admin, uid);
  if (!league) return null;
  const { data } = await admin.from("fantasy_league_player_claims")
    .select("player_id,user_id").eq("league_id", league.id).neq("user_id", uid);
  const rows = (data ?? []) as { player_id: string; user_id: string }[];
  const holderIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = holderIds.length
    ? await admin.from("profiles").select("id,username").in("id", holderIds)
    : { data: [] };
  const names = new Map(((profs ?? []) as { id: string; username: string | null }[]).map((p) => [p.id, p.username ?? "otro manager"]));
  return {
    league_id: league.id,
    league_name: league.name,
    taken: rows.map((r) => ({ player_id: r.player_id, held_by: names.get(r.user_id) ?? "otro manager" })),
  };
}

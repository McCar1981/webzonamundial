// src/lib/fantasy/store.server.ts
//
// Capa de datos (Supabase) del Fantasy. Igual que en Predicciones: el usuario
// lee/escribe SU equipo con el cliente RLS (createSupabaseServerClient); el
// ranking global y el semanal cruzan usuarios y usan el cliente admin (service
// role) que bypassa RLS. Server-only.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/predictions/admin";
import { grantCoins } from "@/lib/economy/wallet";
import { fantasyGameweekReward } from "@/lib/economy/earn";
import { isValidGameweek, gameweekIsOver, currentGameweek, TOTAL_GAMEWEEKS } from "./fixtures";
import { isFantasyLive } from "./season";
import { excludedInClause } from "@/lib/ranking-exclusions";
import { normalizeTeam } from "./store";
import { FREE_TRANSFERS, type FantasyTeamState } from "./types";

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

/**
 * Creador con el que el usuario se registró (profiles.fav_creator). Sirve para
 * marcar su equipo fantasy con el nombre e imagen de ese creador. Lectura propia
 * con RLS; devuelve null si no llegó vía creador o no hay perfil aún.
 */
export async function getFavCreator(userId: string): Promise<string | null> {
  const supa = createSupabaseServerClient();
  const { data } = await supa
    .from("profiles")
    .select("fav_creator")
    .eq("id", userId)
    .maybeSingle();
  const slug = (data as { fav_creator?: string | null } | null)?.fav_creator;
  return slug && slug.trim() ? slug.trim() : null;
}

export async function saveTeam(userId: string, state: FantasyTeamState): Promise<void> {
  const supa = createSupabaseServerClient();
  // H-001-18: NO persistir total_points del cliente. Se recalcula server-side
  // desde fantasy_gameweek_scores al confirmar cada jornada.
  const { error } = await supa.from("fantasy_teams").upsert(
    {
      user_id: userId,
      team_name: (state.teamName || "Mi Selección").slice(0, 40),
      state,
      gameweek: state.gameweek ?? 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/** Puntos ya registrados de una jornada (o null si no hay fila). Lectura propia (RLS). */
export async function getGameweekScore(userId: string, gameweek: number): Promise<number | null> {
  const supa = createSupabaseServerClient();
  const { data } = await supa
    .from("fantasy_gameweek_scores")
    .select("points")
    .eq("user_id", userId)
    .eq("gameweek", gameweek)
    .maybeSingle();
  const pts = (data as { points?: number } | null)?.points;
  return typeof pts === "number" ? pts : null;
}

/**
 * AUTO-AVANCE de jornada. El avance era 100% manual (el usuario pulsaba
 * "Confirmar"), así que la inmensa mayoría se quedaba clavada en una jornada
 * antigua mientras el torneo avanzaba. Esto lleva el puntero del usuario desde su
 * jornada actual hasta la VIGENTE del torneo, saltando las jornadas ya cerradas.
 *
 * SEGURO ANTE RETROVISOR: NO recalcula puntos de jornadas pasadas (eso permitiría
 * a un usuario nuevo fichar a los goleadores de ayer y cobrar retroactivamente).
 * Solo ARRASTRA el score YA REGISTRADO de cada jornada (el provisional que quedó
 * grabado mientras esa jornada estuvo vigente para él); las jornadas sin registro
 * cuentan 0. Las Fútcoins las paga sweepPendingGameweekCoins (idempotente). Por
 * cada jornada saltada replica el "advance" del cliente: fija committedSlots,
 * repone fichajes, desarma el chip y limpia el lock. Idempotente y best-effort:
 * si nada cambia, no escribe. Devuelve el equipo (avanzado o el mismo).
 */
export async function autoAdvanceGameweeks(userId: string, team: FantasyTeamState): Promise<FantasyTeamState> {
  if (!isFantasyLive()) return team;
  const target = currentGameweek();
  let t = team;
  let guard = 0;
  while (
    t.gameweek < target &&
    isValidGameweek(t.gameweek) &&
    gameweekIsOver(t.gameweek) &&
    guard++ < TOTAL_GAMEWEEKS
  ) {
    const gw = t.gameweek;
    const already = t.history.some((h) => h.gw === gw);
    // Arrastra el score ya registrado de esa jornada (provisional → final); nunca
    // lo recalcula con la alineación actual.
    const recorded = already ? null : await getGameweekScore(userId, gw).catch(() => null);
    t = {
      ...t,
      history: already ? t.history : [...t.history, { gw, points: recorded ?? 0, powerUp: null }],
      gameweek: Math.min(TOTAL_GAMEWEEKS, gw + 1),
      committedSlots: t.slots.map((s) => ({ ...s })),
      freeTransfers: FREE_TRANSFERS,
      powerUp: null,
      gwLock: null,
    };
  }
  if (t !== team) {
    // Mantiene el total del cliente coherente con la suma de jornadas registradas.
    t = { ...t, totalPoints: t.history.reduce((a, h) => a + (h.points || 0), 0) };
    await saveTeam(userId, t);
  }
  return t;
}

// ─── Soporte / Admin (service role, bypassa RLS) ─────────────────────────────
// Solo se invocan desde rutas /api/admin protegidas (cookie de admin o
// ADMIN_TOKEN). Permiten reparar la cuenta de OTRO usuario (p. ej. una víctima de
// un reinicio por error), algo que el cliente RLS no puede hacer.

/** Resuelve userId por nombre de usuario (profiles.username). null si no existe. */
export async function adminResolveUserId(username: string): Promise<string | null> {
  const admin = adminClient();
  const { data } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

/** Equipo guardado de un usuario, leído con service role (sin RLS). */
export async function adminGetTeam(userId: string): Promise<FantasyTeamState | null> {
  const admin = adminClient();
  const { data } = await admin.from("fantasy_teams").select("state").eq("user_id", userId).maybeSingle();
  const state = (data as { state?: FantasyTeamState } | null)?.state;
  if (!state || !Array.isArray(state.slots)) return null;
  return normalizeTeam(state);
}

/** Guarda el estado del equipo de un usuario (service role). */
export async function adminSaveTeamState(userId: string, state: FantasyTeamState): Promise<void> {
  const admin = adminClient();
  const { error } = await admin.from("fantasy_teams").upsert(
    {
      user_id: userId,
      team_name: (state.teamName || "Mi Selección").slice(0, 40),
      state,
      gameweek: state.gameweek ?? 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/**
 * Fija los puntos de una jornada de un usuario (service role) y recalcula su
 * total_points. Para compensaciones de soporte; devuelve el nuevo total.
 */
export async function adminSetGameweekScore(userId: string, gameweek: number, points: number): Promise<number> {
  const admin = adminClient();
  await admin.from("fantasy_gameweek_scores").upsert(
    { user_id: userId, gameweek, points: Math.max(0, Math.round(points)), power_up: null },
    { onConflict: "user_id,gameweek" },
  );
  const { data: scores } = await admin.from("fantasy_gameweek_scores").select("points").eq("user_id", userId);
  const total = (scores ?? []).reduce((sum, s) => sum + ((s as { points?: number }).points ?? 0), 0);
  await admin.from("fantasy_teams").update({ total_points: total }).eq("user_id", userId);
  return total;
}

/**
 * BARRIDO (service role): desatasca de golpe a TODOS los usuarios que se quedaron
 * en una jornada antigua, llevándolos a la VIGENTE. Mismo criterio seguro que
 * autoAdvanceGameweeks: NO recalcula puntos (anti-retrovisor), solo ARRASTRA el
 * score ya registrado de cada jornada saltada; las Fútcoins las paga el barrido
 * por usuario (sweepPendingGameweekCoins) en su próximo GET. Idempotente: a quien
 * ya está en la jornada vigente no lo toca. Devuelve cuántos avanzó.
 */
export async function adminAutoAdvanceAll(): Promise<{ scanned: number; advanced: number; target: number }> {
  const target = currentGameweek();
  if (!isFantasyLive()) return { scanned: 0, advanced: 0, target };
  const admin = adminClient();
  const { data: teams } = await admin.from("fantasy_teams").select("user_id,state").lt("gameweek", target);
  const rows = (teams ?? []) as { user_id: string; state: FantasyTeamState | null }[];

  // Scores ya registrados (user → gw → puntos) para arrastrar sin recalcular.
  const { data: scoreRows } = await admin.from("fantasy_gameweek_scores").select("user_id,gameweek,points");
  const scoreMap = new Map<string, Map<number, number>>();
  for (const s of (scoreRows ?? []) as { user_id: string; gameweek: number; points: number }[]) {
    let m = scoreMap.get(s.user_id);
    if (!m) { m = new Map(); scoreMap.set(s.user_id, m); }
    m.set(s.gameweek, s.points ?? 0);
  }

  let advanced = 0;
  for (const row of rows) {
    if (!row.state || !Array.isArray(row.state.slots)) continue;
    let t = normalizeTeam(row.state);
    const userScores = scoreMap.get(row.user_id);
    let guard = 0;
    let changed = false;
    while (t.gameweek < target && isValidGameweek(t.gameweek) && gameweekIsOver(t.gameweek) && guard++ < TOTAL_GAMEWEEKS) {
      const gw = t.gameweek;
      const already = t.history.some((h) => h.gw === gw);
      const pts = already ? 0 : userScores?.get(gw) ?? 0;
      t = {
        ...t,
        history: already ? t.history : [...t.history, { gw, points: pts, powerUp: null }],
        gameweek: Math.min(TOTAL_GAMEWEEKS, gw + 1),
        committedSlots: t.slots.map((s) => ({ ...s })),
        freeTransfers: FREE_TRANSFERS,
        powerUp: null,
        gwLock: null,
      };
      changed = true;
    }
    if (changed) {
      t = { ...t, totalPoints: t.history.reduce((a, h) => a + (h.points || 0), 0) };
      try {
        await adminSaveTeamState(row.user_id, t);
        advanced++;
      } catch {
        /* sigue con el resto de usuarios */
      }
    }
  }
  return { scanned: rows.length, advanced, target };
}

/**
 * Registra (o actualiza) los puntos de una jornada para el ranking semanal y la
 * auditoría. Lectura propia con RLS; un usuario solo escribe su fila.
 *
 * H-001-18: Recalcula total_points server-side desde gameweek_scores para
 * evitar manipulación del ranking global.
 */
export async function recordGameweekScore(
  userId: string,
  gameweek: number,
  points: number,
  powerUp: string | null,
): Promise<void> {
  // `points` ya viene calculado SERVER-SIDE con datos reales (scoreGameweekFromState),
  // así que no es forjable. El tope solo actúa como cinturón de seguridad ante un
  // bug del motor (un capitán ×6 con bonus puede superar holgadamente los 200).
  const MAX_GW_POINTS = 500;
  const clampedPoints = Math.max(0, Math.min(points, MAX_GW_POINTS));

  const supa = createSupabaseServerClient();
  await supa.from("fantasy_gameweek_scores").upsert(
    { user_id: userId, gameweek, points: clampedPoints, power_up: powerUp },
    { onConflict: "user_id,gameweek" },
  );

  // Recalcular total_points server-side como suma de todos los gameweek scores.
  const admin = adminClient();
  const { data: scores } = await admin
    .from("fantasy_gameweek_scores")
    .select("points")
    .eq("user_id", userId);
  const total = (scores ?? []).reduce((sum, s) => sum + ((s as { points?: number }).points ?? 0), 0);
  await admin.from("fantasy_teams").update({ total_points: total }).eq("user_id", userId);
}

/**
 * Abona Fútcoins + XP a la billetera única por CONFIRMAR una jornada, una sola
 * vez por usuario y jornada. La marca fantasy_coin_claims (PK user_id,gameweek)
 * con INSERT … ON CONFLICT DO NOTHING garantiza el pago único: solo si la fila
 * se insertó (no existía) se abona. Se escribe con service role (admin).
 * Devuelve las Fútcoins abonadas (0 si la jornada ya se había cobrado).
 */
export async function awardGameweekCoins(
  userId: string,
  gameweek: number,
  points: number,
): Promise<{ coins: number; xp: number }> {
  // Anti-faucet: solo se paga por jornadas REALES (1-8) y ya disputadas. Esto
  // bloquea el abuso de enviar jornadas inventadas (gw=999) o cobrar la
  // simulación de pretemporada, ya que los puntos los calcula el cliente.
  if (!isValidGameweek(gameweek) || !gameweekIsOver(gameweek)) return { coins: 0, xp: 0 };
  const admin = adminClient();
  const reward = fantasyGameweekReward(points);
  // Reserva atómica del pago: si ya existía, no inserta ninguna fila.
  const { data: inserted } = await admin
    .from("fantasy_coin_claims")
    .upsert(
      { user_id: userId, gameweek, coins: reward.coins, xp: reward.xp },
      { onConflict: "user_id,gameweek", ignoreDuplicates: true },
    )
    .select("gameweek");
  if (!inserted || inserted.length === 0) return { coins: 0, xp: 0 };
  try {
    await grantCoins(userId, reward.coins, reward.xp, { module: "fantasy" });
  } catch {
    // Si el abono falla tras reservar, liberamos la fila para no dejar la jornada
    // "cobrada" sin haber pagado (si no, jamás se reintentaría). El próximo
    // confirm reintenta; el guardado del equipo no se ve afectado.
    await admin.from("fantasy_coin_claims").delete().eq("user_id", userId).eq("gameweek", gameweek);
    return { coins: 0, xp: 0 };
  }
  return reward;
}

/**
 * Abona las Fútcoins de jornadas YA disputadas que aún no se cobraron. Repara el
 * caso de confirmar una jornada antes de que termine por completo (sus partidos
 * acabaron pero el último de la ventana aún no): en ese momento awardGameweekCoins
 * devuelve 0 y, sin esto, las monedas se perdían para siempre porque el cliente
 * nunca reenvía la jornada. Es idempotente (fantasy_coin_claims) y barato: dos
 * lecturas + un award solo por las jornadas pendientes-y-ya-cerradas. Se llama al
 * confirmar y al abrir el juego (GET). Devuelve lo abonado en esta pasada.
 */
export async function sweepPendingGameweekCoins(userId: string): Promise<{ coins: number; xp: number }> {
  const admin = adminClient();
  const [{ data: scores }, { data: claims }] = await Promise.all([
    admin.from("fantasy_gameweek_scores").select("gameweek,points").eq("user_id", userId),
    admin.from("fantasy_coin_claims").select("gameweek").eq("user_id", userId),
  ]);
  const claimed = new Set((claims ?? []).map((c) => (c as { gameweek: number }).gameweek));
  let coins = 0;
  let xp = 0;
  for (const row of (scores ?? []) as { gameweek: number; points: number }[]) {
    if (claimed.has(row.gameweek)) continue; // ya cobrada
    if (!gameweekIsOver(row.gameweek)) continue; // aún no cerrada → no toca pagar
    const r = await awardGameweekCoins(userId, row.gameweek, row.points);
    coins += r.coins;
    xp += r.xp;
  }
  return { coins, xp };
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
  let q = admin
    .from("fantasy_teams")
    .select("user_id,team_name,total_points,gameweek");
  const excl = excludedInClause();
  if (excl) q = q.not("user_id", "in", excl);
  const { data } = await q.order("total_points", { ascending: false }).limit(limit);
  const rows = (data ?? []) as { user_id: string; team_name: string; total_points: number; gameweek: number }[];
  return withProfiles(rows.map((r) => ({
    user_id: r.user_id, team_name: r.team_name, points: r.total_points ?? 0, gameweek: r.gameweek ?? 1,
  })));
}

/** Ranking de UNA jornada concreta (semanal). */
export async function getGameweekLeaderboard(gameweek: number, limit = 50): Promise<FantasyRankEntry[]> {
  const admin = adminClient();
  let q = admin
    .from("fantasy_gameweek_scores")
    .select("user_id,points")
    .eq("gameweek", gameweek);
  const excl = excludedInClause();
  if (excl) q = q.not("user_id", "in", excl);
  const { data } = await q.order("points", { ascending: false }).limit(limit);
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

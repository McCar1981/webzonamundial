// src/lib/economy/ranking.ts
//
// RANKING GLOBAL del universo ZM. Como las Fútcoins son la moneda ÚNICA que toda
// la app acredita (trivia, predicciones, fantasy, modo carrera…), el ranking que
// mejor refleja "cómo va la gente" en general es el de Fútcoins acumuladas. El XP
// (progresión) se usa solo como desempate para que dos saldos iguales tengan un
// orden estable.
//
// Lee SIEMPRE de la fuente de verdad (profiles) con el cliente admin (service
// role): así el ranking es el mismo saldo que ve el usuario en su cabecera y en
// cada módulo. No escribe nada; es solo lectura/agregación.

import { adminClient } from "@/lib/predictions/admin";
import { levelForXp } from "@/lib/predictions/gamification";
import type { CoinModule } from "@/lib/economy/wallet";

export interface RankingEntry {
  /** Posición global (1 = líder). */
  rank: number;
  /** id del perfil (uuid de Supabase). */
  userId: string;
  /** Nombre de registro; null si aún no completó el onboarding. */
  name: string | null;
  /** Avatar (url) si lo tiene. */
  avatarUrl: string | null;
  /** Slug/código de país para la banderita (puede ser null). */
  country: string | null;
  /** Saldo de Fútcoins (criterio principal del ranking). */
  coins: number;
  /** XP total (desempate y nivel). */
  xp: number;
  /** Nivel derivado del XP. */
  level: number;
}

export interface MyRank {
  userId: string;
  rank: number;
  coins: number;
  xp: number;
  level: number;
  /** Código ISO-3166 alpha-2 (minúsculas) para la banderita; null si sin país. */
  country: string | null;
  /** Total de jugadores con saldo > 0 (denominador del "vas #N de M"). */
  total: number;
}

interface ProfRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  country: string | null;
  coins: number | null;
  xp: number | null;
}

/**
 * Top global por Fútcoins. Solo incluye perfiles con saldo > 0 (un jugador que
 * nunca ganó nada no "compite" todavía). Ordena por coins desc y XP desc como
 * desempate, igual que getUserRank, para que ambas vistas sean coherentes.
 */
export async function getGlobalCoinRanking(limit = 50): Promise<RankingEntry[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("profiles")
    .select("id,username,avatar_url,country,coins,xp")
    .gt("coins", 0)
    .order("coins", { ascending: false })
    .order("xp", { ascending: false })
    // Tercer criterio ESTABLE: sin él, los empates coins+xp salen en orden
    // indefinido y el podio puede "bailar" entre dos cargas seguidas.
    .order("id", { ascending: true })
    .limit(Math.max(1, Math.min(200, limit)));

  const rows = (data ?? []) as ProfRow[];
  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.id,
    name: r.username,
    avatarUrl: r.avatar_url,
    country: r.country,
    coins: r.coins ?? 0,
    xp: r.xp ?? 0,
    level: levelForXp(r.xp ?? 0),
  }));
}

/**
 * Posición global del usuario por Fútcoins. La calcula contando cuántos perfiles
 * tienen MÁS saldo (rank = 1 + nº de jugadores por encima), lo que funciona aunque
 * el usuario esté fuera del top que se muestra. El desempate por XP replica el
 * orden del top: entre saldos iguales, va por delante quien tiene más XP.
 */
export async function getUserRank(uid: string): Promise<MyRank | null> {
  const admin = adminClient();
  const { data } = await admin
    .from("profiles")
    .select("coins,xp,country")
    .eq("id", uid)
    .maybeSingle();
  if (!data) return null;
  const coins = (data as { coins?: number }).coins ?? 0;
  const xp = (data as { xp?: number }).xp ?? 0;
  const country = (data as { country?: string | null }).country ?? null;

  // Los tres counts son independientes entre sí: en paralelo la latencia es
  // 1×RTT en vez de 3×RTT (este cálculo está en el camino del header del lobby).
  const [
    { count: above },   // estrictamente por encima en saldo
    { count: tiedAhead }, // empatados en saldo pero con MÁS XP (desempate)
    { count: total },   // total de jugadores que ya compiten (saldo > 0)
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt("coins", coins),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("coins", coins)
      .gt("xp", xp),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt("coins", 0),
  ]);

  return {
    userId: uid,
    rank: (above ?? 0) + (tiedAhead ?? 0) + 1,
    coins,
    xp,
    level: levelForXp(xp),
    country,
    total: total ?? 0,
  };
}

// ─── Rankings POR MÓDULO (desde el ledger) ──────────────────────────────────
// El ranking global (arriba) usa el SALDO (profiles.coins): "cuántas Fútcoins
// tienes". Los rankings por módulo usan el LEDGER (coin_ledger): "cuántas
// Fútcoins GENERASTE en ESE módulo". Misma moneda en todos, así son comparables
// y cada módulo tiene su propia competencia ("quién va primero en trivia", etc.).

interface ModuleAggRow {
  user_id: string;
  coins: number | null;
  xp: number | null;
}

/**
 * Top de un módulo por Fútcoins generadas en él. La agregación (SUM por usuario)
 * la hace Postgres vía RPC module_coin_ranking; aquí solo hidratamos los perfiles
 * (nombre/avatar/país) de los que aparecen en el top. Mantiene la misma forma que
 * getGlobalCoinRanking para que la UI reutilice el mismo componente.
 */
export async function getModuleCoinRanking(module: CoinModule, limit = 50): Promise<RankingEntry[]> {
  const admin = adminClient();
  const { data } = await admin.rpc("module_coin_ranking", {
    p_module: module,
    p_limit: Math.max(1, Math.min(200, limit)),
  });
  const agg = (data ?? []) as ModuleAggRow[];
  if (!agg.length) return [];

  // Hidratar perfiles de los usuarios del top en una sola consulta.
  const ids = agg.map((a) => a.user_id);
  const { data: profs } = await admin
    .from("profiles")
    .select("id,username,avatar_url,country")
    .in("id", ids);
  const byId = new Map(
    ((profs ?? []) as Pick<ProfRow, "id" | "username" | "avatar_url" | "country">[]).map((p) => [p.id, p]),
  );

  return agg.map((a, i) => {
    const p = byId.get(a.user_id);
    const coins = Number(a.coins ?? 0);
    const xp = Number(a.xp ?? 0);
    return {
      rank: i + 1,
      userId: a.user_id,
      name: p?.username ?? null,
      avatarUrl: p?.avatar_url ?? null,
      country: p?.country ?? null,
      coins,
      xp,
      level: levelForXp(xp),
    };
  });
}

/**
 * Posición de un usuario dentro de un módulo (cuántas Fútcoins generó en él y de
 * cuántos jugadores). La calcula Postgres vía RPC module_coin_user_rank. Devuelve
 * null si el módulo no es válido o el usuario aún no ha generado nada ahí.
 */
export async function getModuleUserRank(module: CoinModule, uid: string): Promise<MyRank | null> {
  const admin = adminClient();
  const { data } = await admin.rpc("module_coin_user_rank", { p_module: module, p_uid: uid });
  const row = Array.isArray(data) ? (data[0] as { rank?: number; coins?: number; xp?: number; total?: number } | undefined) : null;
  if (!row || typeof row.rank !== "number") return null;
  const coins = Number(row.coins ?? 0);
  const xp = Number(row.xp ?? 0);
  // Si no ha generado nada en el módulo, no "compite" aún.
  if (coins <= 0) return null;

  const { data: prof } = await admin
    .from("profiles")
    .select("country")
    .eq("id", uid)
    .maybeSingle();
  const country = ((prof ?? {}) as { country?: string | null }).country ?? null;

  return {
    userId: uid,
    rank: row.rank,
    coins,
    xp,
    level: levelForXp(xp),
    country,
    total: Number(row.total ?? 0),
  };
}

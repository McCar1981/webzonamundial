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

  // Jugadores estrictamente por encima en saldo.
  const { count: above } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gt("coins", coins);

  // Empatados en saldo pero con MÁS XP (van por delante en el desempate).
  const { count: tiedAhead } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("coins", coins)
    .gt("xp", xp);

  // Total de jugadores que ya compiten (saldo > 0).
  const { count: total } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gt("coins", 0);

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

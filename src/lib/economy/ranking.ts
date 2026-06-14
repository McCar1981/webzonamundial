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
import { excludedInClause, isRankingExcluded } from "@/lib/ranking-exclusions";
import { validateFavCreator } from "@/lib/profile-validation";

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
  let q = admin
    .from("profiles")
    .select("id,username,avatar_url,country,coins,xp")
    .gt("coins", 0);
  // Excluir al staff/propietario del ranking ANTES del limit (top sin huecos).
  const excl = excludedInClause();
  if (excl) q = q.not("id", "in", excl);
  const { data } = await q
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
  // El staff/propietario no compite: no tiene posición en el ranking.
  if (isRankingExcluded(uid)) return null;
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

  // Los counts excluyen al staff (excl) para que NADIE cuente al propietario
  // por encima suyo. En paralelo: 1×RTT en vez de 3×RTT (camino del header).
  const excl = excludedInClause();
  const aboveQ = admin.from("profiles").select("id", { count: "exact", head: true }).gt("coins", coins);
  const tiedQ = admin.from("profiles").select("id", { count: "exact", head: true }).eq("coins", coins).gt("xp", xp);
  const totalQ = admin.from("profiles").select("id", { count: "exact", head: true }).gt("coins", 0);
  const [
    { count: above },   // estrictamente por encima en saldo
    { count: tiedAhead }, // empatados en saldo pero con MÁS XP (desempate)
    { count: total },   // total de jugadores que ya compiten (saldo > 0)
  ] = await Promise.all([
    excl ? aboveQ.not("id", "in", excl) : aboveQ,
    excl ? tiedQ.not("id", "in", excl) : tiedQ,
    excl ? totalQ.not("id", "in", excl) : totalQ,
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
  const agg = ((data ?? []) as ModuleAggRow[]).filter((a) => !isRankingExcluded(a.user_id));
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
  if (isRankingExcluded(uid)) return null; // el staff no compite
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

// ─── Ranking POR PAÍS y MEDALLERO DE NACIONES (profiles.country) ─────────────
// La moneda es la misma en todo ZM; aquí cruzamos por `country` (residencia,
// código ISO-3166 alpha-2 que el usuario eligió en pre-registro/perfil). Dos
// lecturas distintas sobre el mismo dato:
//   · getCountryCoinRanking → top de jugadores DE un país ("ranking nacional").
//   · getNationsLeaderboard → MEDALLERO: países ordenados por las Fútcoins que
//     suman sus jugadores ("¿qué afición manda?"). Muy del Mundial.

/** Normaliza un código de país a ISO-2 minúsculas; null si no parece válido. */
function normalizeCountry(v: string | null | undefined): string | null {
  if (!v) return null;
  const c = v.trim().toLowerCase();
  return /^[a-z]{2}$/.test(c) ? c : null;
}

export interface MyCountryRank {
  /** Código ISO-2 (minúsculas) del país del usuario. */
  country: string;
  /** Puesto del usuario DENTRO de su país (1 = líder nacional). */
  rank: number;
  /** Jugadores con saldo > 0 de ese país (denominador del "#N de M"). */
  total: number;
  /** Saldo de Fútcoins del usuario. */
  coins: number;
}

export interface NationRank {
  /** Puesto del país en el medallero (1 = el que más Fútcoins suma). */
  rank: number;
  /** Código ISO-2 (minúsculas) para la banderita. */
  country: string;
  /** Jugadores con saldo > 0 de ese país. */
  players: number;
  /** Suma de Fútcoins de todos sus jugadores (criterio del medallero). */
  coins: number;
  /** Nombre del jugador líder del país (puede ser null si sin username). */
  topName: string | null;
  /** Avatar del líder del país (puede ser null). */
  topAvatar: string | null;
}

/**
 * Top de jugadores DE un país por Fútcoins (mismo criterio que el global:
 * saldo desc, XP desc, id asc). Re-rankea 1..N dentro del país. Excluye staff.
 */
export async function getCountryCoinRanking(country: string, limit = 50): Promise<RankingEntry[]> {
  const code = normalizeCountry(country);
  if (!code) return [];
  const admin = adminClient();
  let q = admin
    .from("profiles")
    .select("id,username,avatar_url,country,coins,xp")
    .ilike("country", code) // case-insensitive: algún perfil legado guardó "MX"
    .gt("coins", 0);
  const excl = excludedInClause();
  if (excl) q = q.not("id", "in", excl);
  const { data } = await q
    .order("coins", { ascending: false })
    .order("xp", { ascending: false })
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
 * Puesto del usuario DENTRO de su propio país. Cuenta cuántos compatriotas
 * tienen más saldo (o empatan en saldo pero con más XP). Devuelve null si el
 * usuario no tiene país, no tiene saldo aún, o es staff.
 */
export async function getUserCountryRank(uid: string): Promise<MyCountryRank | null> {
  if (isRankingExcluded(uid)) return null;
  const admin = adminClient();
  const { data } = await admin.from("profiles").select("coins,xp,country").eq("id", uid).maybeSingle();
  if (!data) return null;
  const coins = (data as { coins?: number }).coins ?? 0;
  const xp = (data as { xp?: number }).xp ?? 0;
  const country = normalizeCountry((data as { country?: string | null }).country);
  if (!country || coins <= 0) return null; // sin país o sin saldo no compite por país

  const excl = excludedInClause();
  const aboveQ = admin.from("profiles").select("id", { count: "exact", head: true }).ilike("country", country).gt("coins", coins);
  const tiedQ = admin.from("profiles").select("id", { count: "exact", head: true }).ilike("country", country).eq("coins", coins).gt("xp", xp);
  const totalQ = admin.from("profiles").select("id", { count: "exact", head: true }).ilike("country", country).gt("coins", 0);
  const [{ count: above }, { count: tiedAhead }, { count: total }] = await Promise.all([
    excl ? aboveQ.not("id", "in", excl) : aboveQ,
    excl ? tiedQ.not("id", "in", excl) : tiedQ,
    excl ? totalQ.not("id", "in", excl) : totalQ,
  ]);

  return { country, rank: (above ?? 0) + (tiedAhead ?? 0) + 1, total: total ?? 0, coins };
}

/**
 * MEDALLERO de naciones: agrupa todos los perfiles con saldo por `country` y
 * los ordena por la suma de Fútcoins de sus jugadores. Pagina la lectura para
 * esquivar el tope silencioso de ~1000 filas de PostgREST (mismo patrón que el
 * ranking de predicciones). Como leemos en orden de saldo desc, el primer
 * perfil que aparece de cada país ya es su líder. Excluye staff.
 */
export async function getNationsLeaderboard(limit = 100): Promise<NationRank[]> {
  const admin = adminClient();
  const excl = excludedInClause();
  const PAGE = 1000;       // tope por respuesta de PostgREST
  const MAX_PAGES = 60;    // ~60k perfiles: backstop defensivo

  interface Acc { coins: number; players: number; topCoins: number; topName: string | null; topAvatar: string | null }
  const byCountry = new Map<string, Acc>();

  for (let page = 0; page < MAX_PAGES; page++) {
    let q = admin
      .from("profiles")
      .select("id,username,avatar_url,country,coins")
      .gt("coins", 0)
      .not("country", "is", null);
    if (excl) q = q.not("id", "in", excl);
    const { data, error } = await q
      .order("coins", { ascending: false })
      .order("id", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) {
      console.error("[ranking] medallero falló en página", page, error.message);
      break;
    }
    const rows = (data ?? []) as { id: string; username: string | null; avatar_url: string | null; country: string | null; coins: number | null }[];
    for (const r of rows) {
      const code = normalizeCountry(r.country);
      if (!code) continue;
      const c = r.coins ?? 0;
      const a = byCountry.get(code) ?? { coins: 0, players: 0, topCoins: -1, topName: null, topAvatar: null };
      a.coins += c;
      a.players += 1;
      if (c > a.topCoins) { a.topCoins = c; a.topName = r.username; a.topAvatar = r.avatar_url; }
      byCountry.set(code, a);
    }
    if (rows.length < PAGE) break;
    if (page === MAX_PAGES - 1) console.error("[ranking] medallero alcanzó MAX_PAGES; posiblemente incompleto");
  }

  const list = [...byCountry.entries()].map(([country, a]) => ({
    country,
    players: a.players,
    coins: a.coins,
    topName: a.topName,
    topAvatar: a.topAvatar,
  }));
  // Orden: más Fútcoins, desempate por más jugadores y luego código (estable).
  list.sort((x, y) => y.coins - x.coins || y.players - x.players || x.country.localeCompare(y.country));
  return list.slice(0, Math.max(1, limit)).map((n, i) => ({ rank: i + 1, ...n }));
}

// ─── Ranking POR CREADOR y RANKING DE COMUNIDADES (profiles.fav_creator) ─────
// Cada usuario puede unirse a la comunidad de un creador oficial (se guarda su
// slug en profiles.fav_creator al registrarse por su enlace o desde el perfil).
// Mismo patrón que naciones, ahora cruzando por creador:
//   · getCreatorCoinRanking → top de jugadores DE una comunidad.
//   · getCreatorsLeaderboard → qué comunidad de creador suma más Fútcoins.
// El slug se valida contra el catálogo de creadores (validateFavCreator).

export interface MyCreatorRank {
  /** Slug del creador del usuario. */
  creator: string;
  /** Puesto del usuario DENTRO de la comunidad (1 = líder de la comunidad). */
  rank: number;
  /** Jugadores con saldo > 0 de esa comunidad. */
  total: number;
  /** Saldo de Fútcoins del usuario. */
  coins: number;
}

export interface CreatorRank {
  /** Puesto de la comunidad (1 = la que más Fútcoins suma). */
  rank: number;
  /** Slug del creador (la UI lo mapea a nombre/imagen). */
  creator: string;
  /** Jugadores con saldo > 0 de esa comunidad. */
  players: number;
  /** Suma de Fútcoins de toda la comunidad (criterio del ranking). */
  coins: number;
  /** Nombre del jugador líder de la comunidad (puede ser null). */
  topName: string | null;
  /** Avatar del líder de la comunidad (puede ser null). */
  topAvatar: string | null;
}

/**
 * Top de jugadores DE la comunidad de un creador, por Fútcoins (mismo criterio
 * que el global). Re-rankea 1..N dentro de la comunidad. Excluye staff. Devuelve
 * [] si el slug no está en el catálogo de creadores.
 */
export async function getCreatorCoinRanking(creator: string, limit = 50): Promise<RankingEntry[]> {
  const slug = validateFavCreator(creator);
  if (!slug) return [];
  const admin = adminClient();
  let q = admin
    .from("profiles")
    .select("id,username,avatar_url,country,coins,xp")
    .eq("fav_creator", slug)
    .gt("coins", 0);
  const excl = excludedInClause();
  if (excl) q = q.not("id", "in", excl);
  const { data } = await q
    .order("coins", { ascending: false })
    .order("xp", { ascending: false })
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
 * Puesto del usuario DENTRO de la comunidad de su creador. Cuenta cuántos
 * compañeros de comunidad tienen más saldo (o empatan con más XP). Devuelve null
 * si el usuario no sigue a ningún creador, no tiene saldo aún, o es staff.
 */
export async function getUserCreatorRank(uid: string): Promise<MyCreatorRank | null> {
  if (isRankingExcluded(uid)) return null;
  const admin = adminClient();
  const { data } = await admin.from("profiles").select("coins,xp,fav_creator").eq("id", uid).maybeSingle();
  if (!data) return null;
  const coins = (data as { coins?: number }).coins ?? 0;
  const xp = (data as { xp?: number }).xp ?? 0;
  const creator = validateFavCreator((data as { fav_creator?: string | null }).fav_creator ?? null);
  if (!creator || coins <= 0) return null; // sin creador o sin saldo no compite por comunidad

  const excl = excludedInClause();
  const aboveQ = admin.from("profiles").select("id", { count: "exact", head: true }).eq("fav_creator", creator).gt("coins", coins);
  const tiedQ = admin.from("profiles").select("id", { count: "exact", head: true }).eq("fav_creator", creator).eq("coins", coins).gt("xp", xp);
  const totalQ = admin.from("profiles").select("id", { count: "exact", head: true }).eq("fav_creator", creator).gt("coins", 0);
  const [{ count: above }, { count: tiedAhead }, { count: total }] = await Promise.all([
    excl ? aboveQ.not("id", "in", excl) : aboveQ,
    excl ? tiedQ.not("id", "in", excl) : tiedQ,
    excl ? totalQ.not("id", "in", excl) : totalQ,
  ]);

  return { creator, rank: (above ?? 0) + (tiedAhead ?? 0) + 1, total: total ?? 0, coins };
}

/**
 * RANKING DE COMUNIDADES: agrupa los perfiles con saldo por su creador
 * (fav_creator) y los ordena por la suma de Fútcoins de la comunidad. Pagina la
 * lectura igual que el medallero. El primer perfil de cada comunidad (orden
 * saldo desc) es su líder. Solo cuenta slugs válidos del catálogo. Excluye staff.
 */
export async function getCreatorsLeaderboard(limit = 100): Promise<CreatorRank[]> {
  const admin = adminClient();
  const excl = excludedInClause();
  const PAGE = 1000;       // tope por respuesta de PostgREST
  const MAX_PAGES = 60;    // ~60k perfiles: backstop defensivo

  interface Acc { coins: number; players: number; topCoins: number; topName: string | null; topAvatar: string | null }
  const byCreator = new Map<string, Acc>();

  for (let page = 0; page < MAX_PAGES; page++) {
    let q = admin
      .from("profiles")
      .select("id,username,avatar_url,fav_creator,coins")
      .gt("coins", 0)
      .not("fav_creator", "is", null);
    if (excl) q = q.not("id", "in", excl);
    const { data, error } = await q
      .order("coins", { ascending: false })
      .order("id", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) {
      console.error("[ranking] ranking de creadores falló en página", page, error.message);
      break;
    }
    const rows = (data ?? []) as { id: string; username: string | null; avatar_url: string | null; fav_creator: string | null; coins: number | null }[];
    for (const r of rows) {
      const slug = validateFavCreator(r.fav_creator ?? null);
      if (!slug) continue;
      const c = r.coins ?? 0;
      const a = byCreator.get(slug) ?? { coins: 0, players: 0, topCoins: -1, topName: null, topAvatar: null };
      a.coins += c;
      a.players += 1;
      if (c > a.topCoins) { a.topCoins = c; a.topName = r.username; a.topAvatar = r.avatar_url; }
      byCreator.set(slug, a);
    }
    if (rows.length < PAGE) break;
    if (page === MAX_PAGES - 1) console.error("[ranking] ranking de creadores alcanzó MAX_PAGES; posiblemente incompleto");
  }

  const list = [...byCreator.entries()].map(([creator, a]) => ({
    creator,
    players: a.players,
    coins: a.coins,
    topName: a.topName,
    topAvatar: a.topAvatar,
  }));
  // Orden: más Fútcoins, desempate por más jugadores y luego slug (estable).
  list.sort((x, y) => y.coins - x.coins || y.players - x.players || x.creator.localeCompare(y.creator));
  return list.slice(0, Math.max(1, limit)).map((n, i) => ({ rank: i + 1, ...n }));
}

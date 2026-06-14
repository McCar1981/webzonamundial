// src/lib/cromos/collection.ts
//
// Lógica de colección de cromos: apertura de sobres, progreso y consultas.
// La escritura va con adminClient (service role) para bypassar RLS; las lecturas
// del usuario pueden hacerse desde el cliente autenticado o con service role.

import { adminClient } from "@/lib/predictions/admin";
import { CROMOS, TOTAL_CROMOS, type Cromo } from "./catalog";

const PACK_SIZE = 3;
const PACK_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 horas entre sobres gratis

const RARITY_WEIGHTS = [
  { rarity: "Plata", weight: 75 },
  { rarity: "Oro", weight: 20 },
  { rarity: "Legendario", weight: 5 },
] as const;

type Rarity = (typeof RARITY_WEIGHTS)[number]["rarity"];

export interface UserCollection {
  ownedIds: Set<number>;
  owned: Cromo[];
  missing: Cromo[];
  total: number;
  collected: number;
  progress: number; // 0..1
  byRarity: Record<Rarity, { collected: number; total: number }>;
  byCategory: Record<string, { collected: number; total: number }>;
}

export interface PackResult {
  cromos: Cromo[];
  nextPackAt: string | null;
}

export interface PackStatus {
  canOpen: boolean;
  nextPackAt: string | null;
  secondsLeft: number;
}

function weightedRandomRarity(): Rarity {
  const total = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of RARITY_WEIGHTS) {
    roll -= r.weight;
    if (roll <= 0) return r.rarity;
  }
  return "Plata";
}

function pickCromoByRarity(excludeIds: Set<number>): Cromo {
  const rarity = weightedRandomRarity();
  const pool = CROMOS.filter((c) => c.rarity === rarity && !excludeIds.has(c.id));
  if (pool.length === 0) {
    // Fallback si no quedan de esa rareza
    const fallback = CROMOS.filter((c) => !excludeIds.has(c.id));
    return fallback[Math.floor(Math.random() * fallback.length)]!;
  }
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/** Lee los cromos que posee un usuario y devuelve la vista de colección. */
export async function getUserCollection(userId: string): Promise<UserCollection> {
  const admin = adminClient();
  const { data } = await admin
    .from("user_cromos")
    .select("cromo_id")
    .eq("user_id", userId);

  const ownedIds = new Set((data ?? []).map((r) => (r as { cromo_id: number }).cromo_id));
  const owned = CROMOS.filter((c) => ownedIds.has(c.id));
  const missing = CROMOS.filter((c) => !ownedIds.has(c.id));

  const byRarity = {
    Legendario: { collected: 0, total: 0 },
    Oro: { collected: 0, total: 0 },
    Plata: { collected: 0, total: 0 },
  };

  const byCategory: Record<string, { collected: number; total: number }> = {};

  for (const c of CROMOS) {
    byRarity[c.rarity as Rarity].total++;
    byCategory[c.category] ??= { collected: 0, total: 0 };
    byCategory[c.category].total++;
    if (ownedIds.has(c.id)) {
      byRarity[c.rarity as Rarity].collected++;
      byCategory[c.category].collected++;
    }
  }

  return {
    ownedIds,
    owned,
    missing,
    total: TOTAL_CROMOS,
    collected: owned.length,
    progress: owned.length / TOTAL_CROMOS,
    byRarity,
    byCategory,
  };
}

/** Devuelve el estado de cooldown del sobre gratuito. */
export async function getPackStatus(userId: string): Promise<PackStatus> {
  const admin = adminClient();
  const { data } = await admin
    .from("cromo_pack_claims")
    .select("opened_at")
    .eq("user_id", userId)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastOpenedAt = (data as { opened_at: string } | null)?.opened_at ?? null;
  if (!lastOpenedAt) {
    return { canOpen: true, nextPackAt: null, secondsLeft: 0 };
  }

  const last = new Date(lastOpenedAt).getTime();
  const next = last + PACK_COOLDOWN_MS;
  const now = Date.now();
  const secondsLeft = Math.max(0, Math.ceil((next - now) / 1000));

  return {
    canOpen: now >= next,
    nextPackAt: new Date(next).toISOString(),
    secondsLeft,
  };
}

/**
 * Abre un sobre de 3 cromos para el usuario.
 * - Respeta el cooldown de 4 horas.
 * - No entrega duplicados (hasta completar la colección).
 * - Registra el claim en cromo_pack_claims.
 */
export async function openPack(userId: string): Promise<PackResult> {
  const status = await getPackStatus(userId);
  if (!status.canOpen) {
    throw new Error("pack_on_cooldown");
  }

  const collection = await getUserCollection(userId);
  const picked: Cromo[] = [];
  const pickedIds = new Set<number>();

  for (let i = 0; i < PACK_SIZE; i++) {
    const exclude = new Set([...collection.ownedIds, ...pickedIds]);
    if (exclude.size >= TOTAL_CROMOS) {
      // Colección completa: permite duplicados para no romper la experiencia
      const dup = CROMOS[Math.floor(Math.random() * CROMOS.length)]!;
      picked.push(dup);
      pickedIds.add(dup.id);
      continue;
    }
    const cromo = pickCromoByRarity(exclude);
    picked.push(cromo);
    pickedIds.add(cromo.id);
  }

  const admin = adminClient();

  // Insertar los cromos en user_cromos (ignorar duplicados)
  const inserts = picked.map((c) => ({
    user_id: userId,
    cromo_id: c.id,
    source: "pack",
  }));
  const { error: insertErr } = await admin
    .from("user_cromos")
    .upsert(inserts, { onConflict: "user_id,cromo_id", ignoreDuplicates: true });
  if (insertErr) throw insertErr;

  // Registrar el sobre abierto
  await admin.from("cromo_pack_claims").insert({
    user_id: userId,
    cromo_1_id: picked[0]!.id,
    cromo_2_id: picked[1]!.id,
    cromo_3_id: picked[2]!.id,
  });

  const newStatus = await getPackStatus(userId);
  return {
    cromos: picked,
    nextPackAt: newStatus.nextPackAt,
  };
}

/** Devuelve el set de cromos favoritos de un usuario. */
export async function getUserFavorites(userId: string): Promise<Set<number>> {
  const admin = adminClient();
  const { data } = await admin
    .from("user_cromo_favorites")
    .select("cromo_id")
    .eq("user_id", userId);

  return new Set((data ?? []).map((r) => (r as { cromo_id: number }).cromo_id));
}

/** Hace toggle de favorito para un cromo. Devuelve true si ahora es favorito. */
export async function toggleFavorite(userId: string, cromoId: number): Promise<boolean> {
  const admin = adminClient();
  const { data } = await admin
    .from("user_cromo_favorites")
    .select("cromo_id")
    .eq("user_id", userId)
    .eq("cromo_id", cromoId)
    .maybeSingle();

  if (data) {
    await admin.from("user_cromo_favorites").delete().eq("user_id", userId).eq("cromo_id", cromoId);
    return false;
  }

  await admin.from("user_cromo_favorites").insert({ user_id: userId, cromo_id: cromoId });
  return true;
}

/** Abreviatura: devuelve solo los IDs de cromos de un usuario. */
export async function getUserCromoIds(userId: string): Promise<Set<number>> {
  const admin = adminClient();
  const { data } = await admin
    .from("user_cromos")
    .select("cromo_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => (r as { cromo_id: number }).cromo_id));
}

/** Añade un cromo específico a un usuario (para recompensas futuras). */
export async function grantCromo(
  userId: string,
  cromoId: number,
  source: string = "reward",
): Promise<{ alreadyOwned: boolean }> {
  const admin = adminClient();
  const { error } = await admin.from("user_cromos").insert({
    user_id: userId,
    cromo_id: cromoId,
    source,
  });
  return { alreadyOwned: (error as { code?: string } | null)?.code === "23505" };
}

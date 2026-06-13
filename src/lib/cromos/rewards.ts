// src/lib/cromos/rewards.ts
//
// Recompensas de cromos por acciones en otros módulos. Cada fuente tiene una
// probabilidad y una clave de idempotencia para evitar farmeo.

import { adminClient } from "@/lib/predictions/admin";
import { CROMOS, TOTAL_CROMOS, type Cromo } from "./catalog";
import { getUserCollection } from "./collection";
import { ALBUM_ACHIEVEMENTS, type Achievement, type AchievementView } from "./achievements";

export interface CromoRewardResult {
  awarded: boolean;
  cromo?: Cromo;
  claimKey: string;
}

const REWARD_CHANCES: Record<string, number> = {
  daily_checkin: 0.15,
  daily_trivia: 0.20,
  prediction_match: 0.10,
  perfect_match: 0.50,
  jornada_bonus: 0.30,
};

/** Elige un cromo aleatorio, preferentemente uno que el usuario no tenga. */
async function pickRewardCromo(userId: string): Promise<Cromo> {
  const { ownedIds } = await getUserCollection(userId);
  const missing = CROMOS.filter((c) => !ownedIds.has(c.id));
  if (missing.length > 0) {
    return missing[Math.floor(Math.random() * missing.length)]!;
  }
  // Colección completa: duplicado aleatorio
  return CROMOS[Math.floor(Math.random() * CROMOS.length)]!;
}

/**
 * Intenta otorgar un cromo de recompensa.
 * - `source`: clave del tipo de recompensa (daily_checkin, daily_trivia, ...)
 * - `claimKey`: clave única de idempotencia (ej: 'daily_checkin:2026-06-11')
 * - `chanceOverride`: probabilidad opcional (0..1)
 */
export async function maybeGrantCromoReward(
  userId: string,
  source: string,
  claimKey: string,
  chanceOverride?: number,
): Promise<CromoRewardResult> {
  const chance = chanceOverride ?? REWARD_CHANCES[source] ?? 0.1;
  const roll = Math.random();

  if (roll > chance) {
    return { awarded: false, claimKey };
  }

  const admin = adminClient();
  const cromo = await pickRewardCromo(userId);

  // Intentar insertar la marca de idempotencia
  const { error } = await admin.from("cromo_reward_claims").insert({
    user_id: userId,
    claim_key: claimKey,
    cromo_id: cromo.id,
    source,
  });

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      // Ya reclamada
      return { awarded: false, claimKey };
    }
    console.error(`[cromos] reward insert failed for ${userId}/${claimKey}:`, error.message);
    return { awarded: false, claimKey };
  }

  // Insertar el cromo en user_cromos (ignorar duplicados)
  await admin.from("user_cromos").insert({
    user_id: userId,
    cromo_id: cromo.id,
    source: "reward",
  }).then(() => {}, () => {});

  return { awarded: true, cromo, claimKey };
}

/** Recompensa diaria por check-in. */
export async function rewardDailyCheckin(userId: string, dayKey: string): Promise<CromoRewardResult> {
  return maybeGrantCromoReward(userId, "daily_checkin", `daily_checkin:${dayKey}`);
}

/** Recompensa diaria por trivia. */
export async function rewardDailyTrivia(userId: string, dayKey: string): Promise<CromoRewardResult> {
  return maybeGrantCromoReward(userId, "daily_trivia", `daily_trivia:${dayKey}`);
}

/** Recompensa por predicción en un partido. */
export async function rewardPredictionMatch(
  userId: string,
  matchId: string,
  pointsEarned: number,
): Promise<CromoRewardResult> {
  const source = pointsEarned > 0 ? "prediction_match" : "prediction_match_zero";
  const chance = pointsEarned > 0 ? undefined : 0; // solo si ganó puntos
  return maybeGrantCromoReward(userId, source, `prediction_match:${matchId}:${userId}`, chance);
}

/** Recompensa por partido perfecto (8/8). */
export async function rewardPerfectMatch(userId: string, matchId: string): Promise<CromoRewardResult> {
  return maybeGrantCromoReward(userId, "perfect_match", `perfect_match:${matchId}:${userId}`);
}

/** Recompensa por bonus de jornada. */
export async function rewardJornadaBonus(userId: string, dayKey: string): Promise<CromoRewardResult> {
  return maybeGrantCromoReward(userId, "jornada_bonus", `jornada_bonus:${dayKey}:${userId}`);
}

/* ─────────── Logros del álbum ─────────── */

/** Evalúa y persiste los logros del álbum para un usuario. */
export async function evaluateAchievements(userId: string): Promise<AchievementView[]> {
  const admin = adminClient();
  const collection = await getUserCollection(userId);

  const toUnlock: string[] = [];
  if (collection.collected >= 1) toUnlock.push("primer_cromo");
  if (collection.byRarity.Legendario.collected >= 1) toUnlock.push("primer_legendario");
  if (collection.byCategory.partidos?.collected === collection.byCategory.partidos?.total) toUnlock.push("completa_partidos");
  if (collection.byCategory["edicion-especial"]?.collected === collection.byCategory["edicion-especial"]?.total) toUnlock.push("completa_edicion_especial");
  if (collection.byCategory.grupos?.collected === collection.byCategory.grupos?.total) toUnlock.push("completa_grupos");
  if (collection.byCategory.sedes?.collected === collection.byCategory.sedes?.total) toUnlock.push("completa_sedes");
  if (collection.byRarity.Legendario.collected === collection.byRarity.Legendario.total) toUnlock.push("completa_legendarios");
  if (collection.collected >= 75) toUnlock.push("mitad_album");
  if (collection.collected >= TOTAL_CROMOS) toUnlock.push("album_completo");

  // Insertar logros nuevos (ignorar duplicados)
  if (toUnlock.length > 0) {
    const inserts = toUnlock.map((id) => ({ user_id: userId, achievement_id: id }));
    await admin.from("cromo_achievements").insert(inserts).then(() => {}, () => {});
  }

  const { data } = await admin
    .from("cromo_achievements")
    .select("achievement_id,unlocked_at")
    .eq("user_id", userId);

  const unlockedMap = new Map(
    (data ?? []).map((r) => [
      (r as { achievement_id: string; unlocked_at: string }).achievement_id,
      (r as { achievement_id: string; unlocked_at: string }).unlocked_at,
    ]),
  );

  return ALBUM_ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id) ?? null,
  }));
}

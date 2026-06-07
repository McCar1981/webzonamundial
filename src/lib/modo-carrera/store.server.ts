// src/lib/modo-carrera/store.server.ts
//
// Capa de datos (Supabase) del Modo Carrera. Igual que en Fantasy/Predicciones:
// el usuario lee/escribe SU partida con el cliente RLS
// (createSupabaseServerClient); el ranking DT cruza usuarios y usa el cliente
// admin (service role) que bypassa RLS. Server-only.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/predictions/admin";
import { grantCoins } from "@/lib/economy/wallet";
import { careerMissionReward } from "@/lib/economy/earn";
import { normalizeCareer } from "./store";
import { rankForOverall, MISSION_TEMPLATES } from "./constants";
import { missionKey, legitMissionIds } from "./missions";
import type { CareerState, CareerRankEntry } from "./types";

// ─── Partida del usuario ─────────────────────────────────────────────────────
export async function getCareer(userId: string): Promise<CareerState | null> {
  const supa = createSupabaseServerClient();
  const { data } = await supa
    .from("modo_carrera_saves")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  const state = (data as { state?: CareerState } | null)?.state;
  if (!state || typeof state !== "object" || !state.identity) return null;
  return normalizeCareer(state);
}

export async function saveCareer(userId: string, state: CareerState): Promise<void> {
  const supa = createSupabaseServerClient();
  const safe = normalizeCareer(state);
  const { error } = await supa.from("modo_carrera_saves").upsert(
    {
      user_id: userId,
      dt_name: (safe.identity.name || "Nuevo DT").slice(0, 40),
      nation_slug: safe.identity.nationSlug,
      philosophy: safe.identity.philosophy,
      overall: safe.progression.overall,
      reputation: safe.reputation.total,
      season: safe.progression.season,
      state: safe,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/**
 * Abona a la billetera única las Fútcoins de las misiones ya RECLAMADAS en el
 * estado, una sola vez por misión. El importe NUNCA se toma de los números que
 * llegan del cliente: se deriva de la plantilla del servidor (MISSION_TEMPLATES)
 * vía la clave estable de la misión, así un cliente manipulado no puede inflar el
 * pago. La idempotencia la garantiza modo_carrera_mission_claims (PK user_id,
 * mission_id) con upsert ON CONFLICT DO NOTHING: solo se abona lo recién insertado.
 * Devuelve el total de Fútcoins/XP abonado en esta llamada (0 si nada era nuevo).
 */
export async function settleCareerMissionRewards(
  userId: string,
  state: CareerState,
): Promise<{ coins: number; xp: number }> {
  // Anti-faucet: solo misiones reclamadas cuyo id es uno que el servidor habría
  // emitido (lista blanca de ciclos reales recientes). Bloquea ids inventados.
  const legit = legitMissionIds();
  const claimed = state.missions.filter((m) => m.status === "reclamada" && legit.has(m.id));
  if (claimed.length === 0) return { coins: 0, xp: 0 };

  // Recompensa autoritativa por misión, derivada de la plantilla (no del cliente).
  const tplByKey = new Map(MISSION_TEMPLATES.map((t) => [t.key, t]));
  const rows = claimed
    .map((m) => {
      const tpl = tplByKey.get(missionKey(m));
      if (!tpl) return null;
      const reward = careerMissionReward(tpl.rewardXp, tpl.rewardReputation);
      return { user_id: userId, mission_id: m.id, mission_key: tpl.key, coins: reward.coins, xp: reward.xp };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (rows.length === 0) return { coins: 0, xp: 0 };

  const admin = adminClient();
  // Reserva atómica: las filas que ya existían no se devuelven (no se vuelven a pagar).
  const { data: inserted } = await admin
    .from("modo_carrera_mission_claims")
    .upsert(rows, { onConflict: "user_id,mission_id", ignoreDuplicates: true })
    .select("mission_id,coins,xp");
  const fresh = (inserted ?? []) as { mission_id: string; coins: number; xp: number }[];
  if (fresh.length === 0) return { coins: 0, xp: 0 };

  let coins = 0;
  let xp = 0;
  for (const r of fresh) {
    coins += r.coins;
    xp += r.xp;
  }
  if (coins === 0 && xp === 0) return { coins, xp };
  try {
    await grantCoins(userId, coins, xp);
  } catch {
    // Si el abono falla tras reservar, liberamos las filas recién insertadas para
    // no dejar misiones "cobradas" sin pagar (si no, jamás se reintentarían). El
    // próximo guardado las vuelve a liquidar; el guardado de la partida no se afecta.
    await admin
      .from("modo_carrera_mission_claims")
      .delete()
      .eq("user_id", userId)
      .in("mission_id", fresh.map((r) => r.mission_id));
    return { coins: 0, xp: 0 };
  }
  return { coins, xp };
}

// ─── Ranking DT (cruza usuarios) ─────────────────────────────────────────────
/** Ranking global de DTs por reputación (desempate por overall). */
export async function getCareerLeaderboard(limit = 50): Promise<CareerRankEntry[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("modo_carrera_saves")
    .select("user_id,dt_name,nation_slug,overall,reputation")
    .order("reputation", { ascending: false })
    .order("overall", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as {
    user_id: string;
    dt_name: string;
    nation_slug: string | null;
    overall: number;
    reputation: number;
  }[];

  const ids = rows.map((r) => r.user_id);
  const { data: profs } = ids.length
    ? await admin.from("profiles").select("id,username,avatar_url").in("id", ids)
    : { data: [] };
  const pmap = new Map(
    (profs ?? []).map((p) => {
      const r = p as { id: string; username: string | null; avatar_url: string | null };
      return [r.id, r];
    }),
  );

  return rows.map((r, i) => ({
    position: i + 1,
    user_id: r.user_id,
    dt_name: r.dt_name || "Nuevo DT",
    nation_slug: r.nation_slug,
    display_name: pmap.get(r.user_id)?.username ?? "Anónimo",
    avatar_url: pmap.get(r.user_id)?.avatar_url ?? null,
    overall: r.overall ?? 50,
    reputation: r.reputation ?? 0,
    rank: rankForOverall(r.overall ?? 50).name,
  }));
}

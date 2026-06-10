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
import { rankForOverall, MISSION_TEMPLATES, xpRequired } from "./constants";
import { missionKey, legitMissionIds } from "./missions";
import type { CareerState, CareerRankEntry } from "./types";

/**
 * H-001-21: Recalcula el overall desde la XP TOTAL de la carrera, de forma
 * autoritativa (server-side). Evita que el cliente envíe overall=99 con xp=0.
 * El argumento debe ser `progression.xpTotal` (XP acumulada de toda la carrera),
 * NO `progression.xp` (residual del nivel actual).
 */
function deriveOverallFromXp(xpTotal: number): number {
  let overall = 50; // nivel inicial
  let accumulated = 0;
  while (overall < 99) {
    const needed = xpRequired(overall);
    if (accumulated + needed > xpTotal) break;
    accumulated += needed;
    overall++;
  }
  return overall;
}

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

  // H-001-21: Recalcular overall y reputation server-side (no confiar en cliente).
  // OJO: se deriva de xpTotal (XP de TODA la carrera), no de progression.xp, que
  // es solo la XP residual del nivel actual (< xpToNext). Usar el residual hacía
  // que el ranking guardara overall≈50 para todos.
  const serverOverall = deriveOverallFromXp(safe.progression.xpTotal);
  // Reputation se deriva de los stats (que ya están acotados por normalizeCareer).
  const repStats = safe.reputation.stats;
  const serverReputation =
    (repStats?.prestigio ?? 0) +
    (repStats?.carisma ?? 0) +
    (repStats?.tactica ?? 0) +
    (repStats?.disciplina ?? 0) +
    (repStats?.mediatico ?? 0) +
    (repStats?.cantera ?? 0);

  const { error } = await supa.from("modo_carrera_saves").upsert(
    {
      user_id: userId,
      dt_name: (safe.identity.name || "Nuevo DT").slice(0, 40),
      nation_slug: safe.identity.nationSlug,
      philosophy: safe.identity.philosophy,
      overall: serverOverall,
      reputation: serverReputation,
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
    await grantCoins(userId, coins, xp, { module: "modo-carrera" });
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
  // user_id (UUID de Supabase Auth) se usa SOLO server-side para unir con perfiles;
  // NUNCA se serializa en la respuesta pública del ranking (evita filtrar el id de
  // auth de cada usuario, que es la clave de RLS).

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
    dt_name: r.dt_name || "Nuevo DT",
    nation_slug: r.nation_slug,
    display_name: pmap.get(r.user_id)?.username ?? "Anónimo",
    avatar_url: pmap.get(r.user_id)?.avatar_url ?? null,
    overall: r.overall ?? 50,
    reputation: r.reputation ?? 0,
    rank: rankForOverall(r.overall ?? 50).name,
  }));
}

// src/lib/modo-carrera/store.server.ts
//
// Capa de datos (Supabase) del Modo Carrera. Igual que en Fantasy/Predicciones:
// el usuario lee/escribe SU partida con el cliente RLS
// (createSupabaseServerClient); el ranking DT cruza usuarios y usa el cliente
// admin (service role) que bypassa RLS. Server-only.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/predictions/admin";
import { normalizeCareer } from "./store";
import { rankForOverall } from "./constants";
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

// src/lib/ligas/leaderboard.ts
//
// Ranking de PREDICTORES por liga (leaderboard de Fútcoins de Zona de Ligas).
// Agrega en Postgres vía RPC liga_prediction_leaderboard (2026-52) y enriquece
// con nombre/avatar de profiles. Patrón del leaderboard del Mundial
// (src/lib/predictions/store.ts getLeaderboard), pero por competition_slug.
//
// Fail-soft: si el RPC aún no está aplicado, devuelve [] (la UI muestra el vacío
// "sé el primero") en vez de romper. Solo backend (service role).

import { adminClient } from "@/lib/predictions/admin";

export interface LigaLeaderboardEntry {
  position: number;
  user: { id: string; display_name: string; avatar_url: string | null };
  coins: number;
  predictions_count: number;
  correct_count: number;
}

interface RpcRow {
  user_id: string;
  total_coins: number | string;
  predictions_count: number | string;
  correct_count: number | string;
}

/**
 * Top predictores de una liga por Fútcoins ganados en predicciones.
 * @param slug  slug del catálogo, o null para el ranking global de predicciones.
 */
export async function getLigaLeaderboard(slug: string | null, limit = 20): Promise<LigaLeaderboardEntry[]> {
  try {
    const admin = adminClient();
    const { data, error } = await admin.rpc("liga_prediction_leaderboard", {
      p_slug: slug,
      p_since: null,
      p_limit: limit,
    });
    if (error) {
      // 42883 = función inexistente (RPC sin aplicar): degrada limpio.
      console.error("[liga-leaderboard] rpc:", error.message);
      return [];
    }
    const rows = (data ?? []) as RpcRow[];
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.user_id);
    const { data: profs } = await admin.from("profiles").select("id,username,avatar_url").in("id", ids);
    const pmap = new Map(
      (profs ?? []).map((p) => [(p as { id: string }).id, p as { username: string | null; avatar_url: string | null }]),
    );

    return rows.map((r, i) => {
      const pr = pmap.get(r.user_id);
      return {
        position: i + 1,
        user: { id: r.user_id, display_name: pr?.username ?? "Anónimo", avatar_url: pr?.avatar_url ?? null },
        coins: Number(r.total_coins) || 0,
        predictions_count: Number(r.predictions_count) || 0,
        correct_count: Number(r.correct_count) || 0,
      };
    });
  } catch (err) {
    console.error("[liga-leaderboard] failed:", (err as Error).message);
    return [];
  }
}

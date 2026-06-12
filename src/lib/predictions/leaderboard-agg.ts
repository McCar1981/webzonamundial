// src/lib/predictions/leaderboard-agg.ts
//
// Agregaciones de ranking sobre la tabla `predictions` SIN el tope silencioso
// de ~1000 filas por respuesta de PostgREST. Con el Mundial en marcha la tabla
// supera ese tope en horas: un SELECT plano "de toda la tabla" agrega solo la
// primera página y deja fuera del ranking a usuarios con alta puntuación
// (bug real del 12-jun, día 2).
//
// Estrategia: primero la RPC (migración 2026-34, agrega en Postgres y escala);
// si aún no está aplicada, fallback que pagina la tabla completa. Ambos
// caminos aplican la exclusión de staff de ranking-exclusions.

import { adminClient } from "./admin";
import { RANKING_EXCLUDED_IDS, isRankingExcluded } from "@/lib/ranking-exclusions";

const PAGE = 1000; // tope de PostgREST por respuesta (default de Supabase)
const MAX_PAGES = 100; // cortafuegos del fallback (100k filas)

export interface PointsAgg {
  user_id: string;
  pts: number;
  count: number;
  correct: number;
}

export interface PodiumAgg {
  user_id: string;
  pts: number;
  correct: number;
  firstAt: string;
}

/** Top-`limit` por puntos de predicciones resueltas. `sinceIso` null = torneo entero; con fecha = semanal. */
export async function aggregateResolvedPoints(sinceIso: string | null, limit: number): Promise<PointsAgg[]> {
  const admin = adminClient();

  const { data: rpcRows, error: rpcErr } = await admin.rpc("prediction_leaderboard", {
    p_since: sinceIso,
    // Pedimos de más para que el filtro de staff no deje el top con huecos.
    p_limit: limit + RANKING_EXCLUDED_IDS.length,
  });
  if (!rpcErr && Array.isArray(rpcRows)) {
    return (rpcRows as { user_id: string; total_points: number | string; predictions_count: number | string; correct_count: number | string }[])
      .filter((r) => !isRankingExcluded(r.user_id))
      .slice(0, Math.max(0, limit))
      .map((r) => ({ user_id: r.user_id, pts: Number(r.total_points), count: Number(r.predictions_count), correct: Number(r.correct_count) }));
  }
  console.error("[predicciones] RPC prediction_leaderboard no disponible (aplicar scripts/sql/2026-34); fallback paginado:", rpcErr?.message);

  const agg = new Map<string, PointsAgg>();
  for (let page = 0; page < MAX_PAGES; page++) {
    let q = admin
      .from("predictions")
      .select("user_id,points_earned,is_correct")
      .not("resolved_at", "is", null);
    if (sinceIso) q = q.gte("resolved_at", sinceIso);
    const { data, error } = await q
      .order("id", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) {
      console.error("[predicciones] fallback de ranking falló en página", page, error.message);
      break;
    }
    const rows = (data ?? []) as { user_id: string; points_earned: number | null; is_correct: boolean | null }[];
    for (const r of rows) {
      if (isRankingExcluded(r.user_id)) continue; // el staff no compite
      const a = agg.get(r.user_id) ?? { user_id: r.user_id, pts: 0, count: 0, correct: 0 };
      a.pts += r.points_earned ?? 0;
      a.count++;
      if (r.is_correct) a.correct++;
      agg.set(r.user_id, a);
    }
    if (rows.length < PAGE) break;
    if (page === MAX_PAGES - 1) console.error("[predicciones] fallback alcanzó MAX_PAGES; ranking posiblemente incompleto");
  }
  return [...agg.values()].sort((a, b) => b.pts - a.pts).slice(0, Math.max(0, limit));
}

/** Podio de UN partido: puntos desc, desempate por aciertos y por quién predijo antes. Solo quienes acertaron algo. */
export async function aggregateMatchPodium(matchId: string, limit: number): Promise<PodiumAgg[]> {
  const admin = adminClient();

  const { data: rpcRows, error: rpcErr } = await admin.rpc("prediction_match_podium", {
    p_match_id: matchId,
    p_limit: limit + RANKING_EXCLUDED_IDS.length,
  });
  if (!rpcErr && Array.isArray(rpcRows)) {
    return (rpcRows as { user_id: string; total_points: number | string; correct_count: number | string; first_at: string }[])
      .filter((r) => !isRankingExcluded(r.user_id))
      .slice(0, Math.max(0, limit))
      .map((r) => ({ user_id: r.user_id, pts: Number(r.total_points), correct: Number(r.correct_count), firstAt: r.first_at }));
  }
  console.error("[predicciones] RPC prediction_match_podium no disponible (aplicar scripts/sql/2026-34); fallback paginado:", rpcErr?.message);

  const agg = new Map<string, PodiumAgg>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await admin
      .from("predictions")
      .select("user_id,points_earned,is_correct,created_at")
      .eq("match_id", matchId)
      .not("resolved_at", "is", null)
      .order("id", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) {
      console.error("[predicciones] fallback de podio falló en página", page, error.message);
      break;
    }
    const rows = (data ?? []) as { user_id: string; points_earned: number | null; is_correct: boolean | null; created_at: string }[];
    for (const r of rows) {
      if (isRankingExcluded(r.user_id)) continue; // el staff no compite
      const a = agg.get(r.user_id) ?? { user_id: r.user_id, pts: 0, correct: 0, firstAt: r.created_at };
      a.pts += r.points_earned ?? 0;
      if (r.is_correct) a.correct++;
      if (r.created_at < a.firstAt) a.firstAt = r.created_at;
      agg.set(r.user_id, a);
    }
    if (rows.length < PAGE) break;
  }
  return [...agg.values()]
    .filter((a) => a.correct > 0) // solo quienes acertaron algo en el partido
    .sort((x, y) => y.pts - x.pts || y.correct - x.correct || (x.firstAt < y.firstAt ? -1 : 1))
    .slice(0, Math.max(0, limit));
}

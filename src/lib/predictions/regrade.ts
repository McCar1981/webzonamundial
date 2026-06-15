// src/lib/predictions/regrade.ts
//
// Re-calificación TOP-UP de partidos ya resueltos, tras corregir los bugs de
// calificación (auditoría 2026-06-12: primer goleador, duelo, cadena, etc.).
// Recalcula cada predicción con el código ACTUAL contra el resultado oficial ya
// guardado en `match_results`, y SOLO SUBE lo que faltó (política de Carlos):
//   • nunca reduce points_earned ni quita Fútcoins/XP (sin recortes);
//   • primer goleador que el bug marcó FALLO y ahora acierta → sube puntos + abona
//     el delta de Fútcoins/XP;
//   • primer goleador / duelo que ahora se ANULAN (feed sin dato) → quita el
//     penalti injusto (is_correct=false → null), sin tocar puntos ni saldo;
//   • abona a cada usuario el delta (≥0) por la puerta atómica grantCoins.
//
// CONSERVADOR para evitar sobre-pago: en el recálculo NO se asume racha activa
// (el ×1.5 de racha no se reconstruye); match_multiplier y early-bird se sacan de
// la fila guardada. No re-evalúa logros ni recompone el resultado desde el feed
// (usa el guardado, así que minute_drama "90+" pasado no se corrige — ese dato no
// se almacenó). Idempotente en la práctica: una 2ª pasada no vuelve a subir nada
// (ya están al máximo) → delta 0.

import { adminClient } from "./admin";
import { scoreBase, applyBonuses } from "./scoring";
import { isEarlyBird } from "./rules";
import { coinsForResolved, xpForResolved } from "./gamification";
import { grantCoins } from "@/lib/economy/wallet";
import type { MatchResultReal, PredictionRow } from "./types";

export interface RegradeUser {
  user_id: string;
  coins_delta: number;
  xp_delta: number;
  predictions_fixed: number;
}
export interface RegradeReport {
  match_id: string;
  found_result: boolean;
  predictions: number;
  changed: number;
  coins_total: number;
  xp_total: number;
  users_affected: number;
  users: RegradeUser[];
  applied: boolean;
  note?: string;
}

export async function regradeMatch(matchId: string, apply: boolean): Promise<RegradeReport> {
  const admin = adminClient();

  // Resultado oficial ya guardado (persiste aunque KV se haya vaciado).
  const { data: mr } = await admin
    .from("match_results")
    .select("result")
    .eq("match_id", matchId)
    .maybeSingle();
  const result = (mr as { result: MatchResultReal } | null)?.result;
  if (!result) {
    return { match_id: matchId, found_result: false, predictions: 0, changed: 0, coins_total: 0, xp_total: 0, users_affected: 0, users: [], applied: apply, note: "sin resultado guardado en match_results" };
  }

  const { data: rows } = await admin
    .from("predictions")
    .select("*")
    .eq("match_id", matchId)
    .not("resolved_at", "is", null)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  const preds = (rows ?? []) as PredictionRow[];

  const byUser = new Map<string, RegradeUser>();
  let changed = 0;

  for (const p of preds) {
    const base = scoreBase(p.prediction_type, p.prediction_data, p.confidence_multiplier, result);
    const wasPro = p.was_pro !== false;
    const final = applyBonuses(base, {
      matchMultiplier: wasPro ? Number(p.match_multiplier) || 1 : 1,
      isEarlyBird: wasPro && isEarlyBird(matchId, new Date(p.created_at)),
      streakActive: false, // conservador: no reconstruimos la racha (evita sobre-pago)
    });

    const oldPts = p.points_earned ?? 0;
    const oldCorrect = p.is_correct; // boolean | null
    const newVoided = final.voided === true;
    const newPts = newVoided ? 0 : final.points;
    const newCorrect: boolean | null = newVoided ? null : final.correct;

    // Solo a favor del usuario (top-up): subir puntos o quitar un penalti injusto.
    let finalCorrect = oldCorrect;
    if (newVoided && oldCorrect === false) finalCorrect = null;       // anular penalti
    else if (newCorrect === true) finalCorrect = true;                // acierto recuperado
    const finalPts = Math.max(oldPts, newPts);                        // nunca reducir

    const pointsUp = finalPts > oldPts;
    const correctChanged = finalCorrect !== oldCorrect;
    if (!pointsUp && !correctChanged) continue;

    const coinDelta = Math.max(0, coinsForResolved(finalPts, Boolean(finalCorrect)) - coinsForResolved(oldPts, Boolean(oldCorrect)));
    const xpDelta = Math.max(0, xpForResolved(finalPts, Boolean(finalCorrect)) - xpForResolved(oldPts, Boolean(oldCorrect)));

    changed++;
    const u = byUser.get(p.user_id) ?? { user_id: p.user_id, coins_delta: 0, xp_delta: 0, predictions_fixed: 0 };
    u.coins_delta += coinDelta;
    u.xp_delta += xpDelta;
    u.predictions_fixed++;
    byUser.set(p.user_id, u);

    if (apply) {
      await admin
        .from("predictions")
        .update({
          points_earned: finalPts,
          is_correct: finalCorrect,
          resolution_breakdown: `${p.resolution_breakdown ?? ""} · re-calificado (top-up auditoría)`.trim(),
        })
        .eq("id", p.id);
    }
  }

  const users = [...byUser.values()];
  if (apply) {
    for (const u of users) {
      if (u.coins_delta > 0 || u.xp_delta > 0) {
        await grantCoins(u.user_id, u.coins_delta, u.xp_delta, { seasonXp: false, module: "predicciones" });
      }
    }
  }

  return {
    match_id: matchId,
    found_result: true,
    predictions: preds.length,
    changed,
    coins_total: users.reduce((s, u) => s + u.coins_delta, 0),
    xp_total: users.reduce((s, u) => s + u.xp_delta, 0),
    users_affected: users.length,
    users,
    applied: apply,
  };
}

/** Re-califica TODOS los partidos con resultado guardado. apply=false = simulación. */
export async function regradeAll(apply: boolean): Promise<{ matches: number; reports: RegradeReport[]; coins_total: number; xp_total: number }> {
  const admin = adminClient();
  const { data } = await admin.from("match_results").select("match_id");
  const ids = (data ?? []).map((r) => (r as { match_id: string }).match_id);
  const reports: RegradeReport[] = [];
  for (const id of ids) {
    reports.push(await regradeMatch(id, apply));
  }
  return {
    matches: ids.length,
    reports: reports.filter((r) => r.changed > 0),
    coins_total: reports.reduce((s, r) => s + r.coins_total, 0),
    xp_total: reports.reduce((s, r) => s + r.xp_total, 0),
  };
}

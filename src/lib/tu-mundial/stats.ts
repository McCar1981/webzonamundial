// src/lib/tu-mundial/stats.ts
//
// Agregador (Node) de "Tu Mundial 2026": el recuerdo personalizado del usuario a
// partir de datos que YA existen (predicciones, ranking, álbum, fantasy). Coste
// marginal cero. Fail-soft por subsistema: si el fantasy o el álbum fallan, el
// recap sigue saliendo con el resto (nunca rompe la página por una consulta
// caída). El tipo y la (de)serialización viven en ./share (edge-safe).

import { getMyStats } from "@/lib/predictions/store";
import { getUserRank } from "@/lib/economy/ranking";
import { getUserCollection } from "@/lib/cromos/collection";
import { getTeam } from "@/lib/fantasy/store.server";
import type { TuMundialStats } from "./share";

export type { TuMundialStats } from "./share";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export async function getTuMundialStats(userId: string, name: string): Promise<TuMundialStats> {
  const [stats, rank, collection, team] = await Promise.all([
    safe(getMyStats(userId), null),
    safe(getUserRank(userId), null),
    safe(getUserCollection(userId), null),
    safe(getTeam(userId), null),
  ]);

  return {
    name: (name || "Aficionado").slice(0, 28),
    points: stats?.total_points ?? 0,
    predictions: stats?.total_predictions ?? 0,
    correct: stats?.correct_predictions ?? 0,
    accuracy: stats?.accuracy_pct ?? 0,
    perfect: stats?.perfect_matches ?? 0,
    rank: rank?.rank ?? null,
    coins: rank?.coins ?? 0,
    level: rank?.level ?? 1,
    albumPct: collection ? Math.round(collection.progress * 100) : 0,
    fantasyPoints: team?.totalPoints ?? 0,
  };
}

// src/lib/predictions/result-store.ts
//
// Staging de resultados oficiales en Vercel KV. Un editor (o una integración
// con un proveedor de datos) deja aquí el MatchResultReal de un partido; el cron
// /api/cron/resolve-predictions lo recoge cuando el partido ha terminado y
// resuelve todas las predicciones. Así se desacopla "entrada del resultado" de
// "momento de resolución".

import { kv } from "@vercel/kv";
import type { MatchResultReal } from "./types";

const KEY = (matchId: string) => `pred:result:${matchId}`;
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

export function resultStoreAvailable(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export async function stageMatchResult(matchId: string, result: MatchResultReal): Promise<void> {
  await kv.set(KEY(matchId), result, { ex: TTL_SECONDS });
}

export async function getStagedResult(matchId: string): Promise<MatchResultReal | null> {
  return (await kv.get<MatchResultReal>(KEY(matchId))) ?? null;
}

export async function clearStagedResult(matchId: string): Promise<void> {
  await kv.del(KEY(matchId));
}

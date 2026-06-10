// src/lib/predictions/result-store.ts
//
// Staging de resultados oficiales. Un editor (o una integración con un proveedor
// de datos) deja aquí el MatchResultReal de un partido; el cron
// /api/cron/resolve-predictions lo recoge cuando el partido ha terminado y
// resuelve todas las predicciones. Así se desacopla "entrada del resultado" de
// "momento de resolución".
//
// PERSISTENCIA DUAL (auditoría predicciones-2026-06-10, NP-04):
//   • Vercel KV → caché rápida con TTL (puede vaciarse; ya ocurrió una vez).
//   • Supabase `match_results` → fuente de verdad DURADERA (con backup).
// El resultado oficial es crítico: sin él las predicciones no se resuelven ni se
// pagan. Por eso ya no vive solo en KV. La lectura cae a Supabase si KV falla.

import { kv } from "@vercel/kv";
import { adminClient } from "./admin";
import type { MatchResultReal } from "./types";

const KEY = (matchId: string) => `pred:result:${matchId}`;
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días (caché)

export function resultStoreAvailable(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export async function stageMatchResult(
  matchId: string,
  result: MatchResultReal,
  meta?: { status?: string; source?: string },
): Promise<void> {
  // Caché KV (rápida, TTL).
  await kv.set(KEY(matchId), result, { ex: TTL_SECONDS });
  // Fuente de verdad duradera (Supabase). No bloquea el staging si falla
  // (p.ej. la tabla aún no existe en algún entorno): KV ya tiene el dato.
  try {
    await adminClient()
      .from("match_results")
      .upsert(
        {
          match_id: matchId,
          result: result as unknown as object,
          status: meta?.status ?? null,
          source: meta?.source ?? null,
          staged_at: new Date().toISOString(),
        },
        { onConflict: "match_id" },
      );
  } catch (e) {
    console.error(`[result-store] persistencia Supabase falló para ${matchId}:`, e);
  }
}

export async function getStagedResult(matchId: string): Promise<MatchResultReal | null> {
  // 1) KV (caché).
  try {
    const cached = await kv.get<MatchResultReal>(KEY(matchId));
    if (cached) return cached;
  } catch (e) {
    console.error(`[result-store] lectura KV falló para ${matchId}:`, e);
  }
  // 2) Fallback a Supabase si KV no lo tiene (flush/TTL) o falló.
  try {
    const { data } = await adminClient()
      .from("match_results")
      .select("result, resolved_at")
      .eq("match_id", matchId)
      .maybeSingle();
    const row = data as { result: MatchResultReal; resolved_at: string | null } | null;
    // Solo devolvemos el resultado si aún no se marcó como resuelto.
    if (row?.result && !row.resolved_at) return row.result;
  } catch (e) {
    console.error(`[result-store] lectura Supabase falló para ${matchId}:`, e);
  }
  return null;
}

export async function clearStagedResult(matchId: string): Promise<void> {
  // Borra la caché KV…
  try {
    await kv.del(KEY(matchId));
  } catch (e) {
    console.error(`[result-store] del KV falló para ${matchId}:`, e);
  }
  // …pero conserva la fila en Supabase como histórico/auditoría: solo la marca
  // como resuelta para que no se vuelva a recoger en otra pasada del cron.
  try {
    await adminClient()
      .from("match_results")
      .update({ resolved_at: new Date().toISOString() })
      .eq("match_id", matchId);
  } catch (e) {
    console.error(`[result-store] marcar resuelto en Supabase falló para ${matchId}:`, e);
  }
}

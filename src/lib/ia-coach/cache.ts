// src/lib/ia-coach/cache.ts
//
// Cache KV de análisis IA Coach. Key incluye:
//   - matchId
//   - dataVersion (cambia si cambian datos: lesiones, DT, etc.)
//   - PROMPT_VERSION (cambia si cambiamos el system prompt)
//   - rotationSlot (rota cada N horas para refrescar el análisis)
//
// ESTRATEGIA "freshness": para que diferentes usuarios no vean siempre
// EXACTAMENTE el mismo análisis, la key incluye un "rotation slot" que
// cambia cada 2 horas. Combinado con temperature 0.7 en la generación,
// cada slot produce un análisis ligeramente distinto. Para un partido,
// en 24h hay ~12 análisis distintos.
//
// Coste: para 10k usuarios/día y 100 partidos visitados/día →
// 100 × 12 = 1.200 generaciones/día × $0.06 = $72/día máximo (peor caso).
// En la práctica mucho menor porque la mayoría visitan los mismos partidos.

import { kv } from "@vercel/kv";
import { PROMPT_VERSION } from "./system-prompt";
import type { IACoachAnalysis } from "./types";

const PREFIX = "ia-coach:analysis:";
// TTL = 2h (alineado con la rotación). El KV expira automáticamente.
const TTL_SECONDS = 2 * 60 * 60;
// Rotación: cada 2h. Para producir variabilidad, no para invalidar.
const ROTATION_HOURS = 2;

/** Slot de tiempo actual: número entero que cambia cada ROTATION_HOURS.
 *  Ej: 2026-05-20 18:30 UTC → slot 24036 (480721 horas / 2). */
function getCurrentSlot(): number {
  return Math.floor(Date.now() / (ROTATION_HOURS * 3600 * 1000));
}

interface CacheEntry {
  analysis: IACoachAnalysis;
  generatedAt: string;
  dataVersion: string;
}

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

function buildKey(matchId: string, dataVersion: string): string {
  const slot = getCurrentSlot();
  return `${PREFIX}${PROMPT_VERSION}:${matchId}:${dataVersion}:s${slot}`;
}

export async function readCache(
  matchId: string,
  dataVersion: string,
): Promise<CacheEntry | null> {
  if (!isKvEnabled()) return null;
  try {
    const k = buildKey(matchId, dataVersion);
    const v = await kv.get<CacheEntry>(k);
    return v || null;
  } catch (err) {
    console.error("[ia-coach] readCache failed:", (err as Error).message);
    return null;
  }
}

export async function writeCache(
  matchId: string,
  dataVersion: string,
  analysis: IACoachAnalysis,
): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    const k = buildKey(matchId, dataVersion);
    const entry: CacheEntry = {
      analysis,
      generatedAt: new Date().toISOString(),
      dataVersion,
    };
    await kv.set(k, entry, { ex: TTL_SECONDS });
  } catch (err) {
    console.error("[ia-coach] writeCache failed:", (err as Error).message);
  }
}

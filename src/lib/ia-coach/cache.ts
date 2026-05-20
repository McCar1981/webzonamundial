// src/lib/ia-coach/cache.ts
//
// Cache KV de análisis IA Coach. Key incluye:
//   - matchId
//   - dataVersion (cambia si cambian datos: lesiones, DT, etc.)
//   - PROMPT_VERSION (cambia si cambiamos el system prompt)
//
// TTL: 7 días (estaremos al inicio del Mundial revisándolo a menudo).
// Si el dataVersion cambia, igualmente se invalida (otra key).

import { kv } from "@vercel/kv";
import { PROMPT_VERSION } from "./system-prompt";
import type { IACoachAnalysis } from "./types";

const PREFIX = "ia-coach:analysis:";
const TTL_SECONDS = 7 * 24 * 60 * 60;

interface CacheEntry {
  analysis: IACoachAnalysis;
  generatedAt: string;
  dataVersion: string;
}

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

function buildKey(matchId: string, dataVersion: string): string {
  return `${PREFIX}${PROMPT_VERSION}:${matchId}:${dataVersion}`;
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

// src/lib/match-center/predictions.ts
//
// Predicción/comparativa PROPIA de api-football (/predictions?fixture=) para el
// Match Center: % de la casa-modelo (1X2), barras comparativas (forma, ataque,
// defensa) equipo vs equipo y un "consejo" textual. Es la lectura del proveedor
// (distinta de las cuotas de mercado de team-odds). 1 request por partido,
// cacheada largo en KV (cambia poco antes del saque). Degrada a null.

import { kv } from "@/lib/kv";

const API_SPORTS_BASE = "https://v3.football.api-sports.io";
const KV_PREFIX = "mc:prediction:v1:";
const KV_TTL = 6 * 60 * 60; // 6 h

function getApiKey(): string | undefined {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}
function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export interface MatchPrediction {
  /** % 1X2 del modelo de api-football (0..1, normalizado). */
  percent: { home: number; draw: number; away: number };
  /** Comparativas 0..1 por aspecto (local vs visitante, suman ~1). */
  comparison: { form?: [number, number]; att?: [number, number]; def?: [number, number] };
  /** Consejo textual del proveedor (p.ej. "Combo Double chance : Spain or draw"). */
  advice?: string;
}

interface RawPercent { home?: string; draw?: string; away?: string }
interface RawPair { home?: string; away?: string }
interface RawPrediction {
  predictions?: { percent?: RawPercent; advice?: string };
  comparison?: { form?: RawPair; att?: RawPair; def?: RawPair };
}

function pct(s: string | undefined): number {
  const n = parseFloat(String(s ?? "").replace("%", "").trim());
  return Number.isFinite(n) ? n / 100 : 0;
}
function pairPct(p: RawPair | undefined): [number, number] | undefined {
  if (!p) return undefined;
  const h = pct(p.home);
  const a = pct(p.away);
  if (h === 0 && a === 0) return undefined;
  return [h, a];
}

export async function getMatchPrediction(matchId: number, fixtureId: number | null): Promise<MatchPrediction | null> {
  const cacheKey = `${KV_PREFIX}${matchId}`;
  if (kvEnabled()) {
    try {
      const cached = await kv.get<MatchPrediction>(cacheKey);
      if (cached) return cached;
    } catch {
      /* sigue a la API */
    }
  }
  const key = getApiKey();
  if (!key || !fixtureId) return null;
  let rows: RawPrediction[] | null = null;
  try {
    const r = await fetch(`${API_SPORTS_BASE}/predictions?fixture=${fixtureId}`, {
      headers: { "x-apisports-key": key },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const json = (await r.json()) as { response?: RawPrediction[] };
    rows = json.response ?? null;
  } catch {
    return null;
  }
  if (!rows || rows.length === 0) return null;
  const p = rows[0];
  const ph = pct(p.predictions?.percent?.home);
  const pd = pct(p.predictions?.percent?.draw);
  const pa = pct(p.predictions?.percent?.away);
  if (ph === 0 && pd === 0 && pa === 0) return null;
  const out: MatchPrediction = {
    percent: { home: ph, draw: pd, away: pa },
    comparison: {
      form: pairPct(p.comparison?.form),
      att: pairPct(p.comparison?.att),
      def: pairPct(p.comparison?.def),
    },
    advice: p.predictions?.advice || undefined,
  };
  if (kvEnabled()) {
    try {
      await kv.set(cacheKey, out, { ex: KV_TTL });
    } catch {
      /* no crítico */
    }
  }
  return out;
}

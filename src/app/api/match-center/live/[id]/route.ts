// src/app/api/match-center/live/[id]/route.ts
//
// Endpoint único del Match Center. Devuelve un MatchFeed para el partido {id}:
//   - mode "live"  -> snapshot real de api-football (si hay fixture mapeado).
//   - mode "sim"   -> guion de simulación determinista (por defecto y fallback).
//
// Query:
//   ?sim=1   fuerza simulación aunque exista fixture real.
//   ?ai=0    desactiva la locución IA (usa solo plantillas).
//
// El cliente reproduce el feed con su propio reloj; en modo live hace polling.

import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { buildMeta, getFixtureId, getCachedSnapshot, getLastSnapshot, cacheSnapshot } from "@/lib/match-center/store";
import { buildSimulation } from "@/lib/match-center/simulation";
import { fetchLiveSnapshot, scheduledSnapshot } from "@/lib/match-center/apiFootball";
import { liveNarration } from "@/lib/match-center/narrator";

// Partidos que SOLO deben mostrar datos reales (nunca simulación). Antes del
// saque se quedan parados en "por comenzar". Derivado de la fuente única de
// partidos programados para el Match Center.
import { PROGRAMMED_MATCH_IDS } from "@/lib/match-center/programmed";
const REAL_ONLY_IDS = new Set<number>(PROGRAMMED_MATCH_IDS);
import { aiNarrateBatch, numericalContext } from "@/lib/match-center/narrator";
import { etToDate } from "@/lib/bracket/match-time";

// Los partidos de FASE DE GRUPOS tampoco simulan: se quedan "preparados para el
// partido" (cuenta atrás al saque) hasta que haya datos reales. Así un partido
// del Mundial nunca se ve como una simulación.
function isGroupStage(phase: string): boolean {
  return /fase de grupos/i.test(phase);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SIMNARR_PREFIX = "mc:simnarr:v2:"; // v2: nombres de jugador (no dorsales)
const SIMNARR_TTL = 24 * 60 * 60;

// CDN corto cuando el balón rueda: el caché edge se SUMA a la antigüedad del
// snapshot (cron/KV), no se solapa — con 10+20s un gol podía llegar 30 s más
// viejo de lo necesario. Fuera de juego el dato no cambia: 10s está bien.
const IN_PLAY_CDN = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);
function liveCacheHeader(status: string): string {
  return IN_PLAY_CDN.has(status)
    ? "public, s-maxage=3, stale-while-revalidate=5"
    : "public, s-maxage=10, stale-while-revalidate=20";
}

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const matchId = parseInt(params.id, 10);
  if (!Number.isInteger(matchId)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const meta = buildMeta(matchId);
  if (!meta) {
    return NextResponse.json({ error: "match not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  // Partidos que nunca simulan: TODO el torneo (cualquier id < 9000, octavos
  // incluidos), además de los solo-reales y la fase de grupos. ANTI-CHEAT: una
  // eliminatoria nunca debe caer a un partido INVENTADO con selecciones reales
  // si api-football falla — violaría la regla de producto "nada inventado". Solo
  // los slots de prueba (id >= 9000) admiten simulación. Antes del saque los del
  // torneo se quedan "por comenzar" con cuenta atrás; aunque se pida ?sim=1 desde
  // el hub no simulan.
  const isTournamentMatch = matchId < 9000;
  const realOnly = isTournamentMatch || REAL_ONLY_IDS.has(matchId) || isGroupStage(meta.phase);
  // ?demo=1: simulación de DEMO explícita (botón "Ver demo en vivo"). Fuerza la
  // simulación aunque el partido sea solo-real, para mostrar el Match Center
  // jugándose en vivo con equipos REALES. El cliente marca la pantalla como
  // SIMULACIÓN para no confundir con un resultado oficial.
  const isDemo = url.searchParams.get("demo") === "1";
  const forceSim = isDemo || (url.searchParams.get("sim") === "1" && !realOnly);
  const useAI = url.searchParams.get("ai") !== "0" && !!process.env.ANTHROPIC_API_KEY;

  // --- Modo live real ---
  if (!forceSim) {
    const fixtureId = await getFixtureId(matchId);
    if (fixtureId) {
      const cached = await getCachedSnapshot(matchId);
      if (cached) {
        return NextResponse.json(cached, {
          headers: { "Cache-Control": liveCacheHeader(cached.status) },
        });
      }
      const snap = await fetchLiveSnapshot(fixtureId, meta);
      if (snap) {
        // Narración SIN bloquear: plantillas + frases IA ya cacheadas (la IA
        // solo la genera el cron, una vez por evento). Antes este endpoint
        // re-narraba el partido ENTERO con Claude en cada cache-miss: +1-5 s
        // de latencia para el visitante y coste repetido de la key compartida.
        snap.narration = await liveNarration(snap.events, meta, matchId, { ai: false });
        await cacheSnapshot(snap);
        return NextResponse.json(snap, {
          headers: { "Cache-Control": liveCacheHeader(snap.status) },
        });
      }
      // El refetch falló (API caída o sin cuota). Si teníamos un snapshot previo
      // —aunque esté algo viejo— lo devolvemos: el último estado REAL conocido es
      // más fiel que reiniciar el partido a "por comenzar". Se autocura cuando la
      // API vuelva a responder.
      const last = await getLastSnapshot(matchId);
      if (last) {
        return NextResponse.json(last, { headers: { "Cache-Control": "no-store" } });
      }
      // si la API falla, caemos a simulación (salvo partidos solo-reales)
    }
    // Partidos solo-reales / fase de grupos: nunca simular. Si aún no hay datos
    // en vivo, devolvemos un estado "por comenzar" con la cuenta atrás al saque
    // (derivada de la hora oficial ET del fixture).
    if (realOnly) {
      const kickoff = etToDate(meta.date, meta.time)?.toISOString();
      return NextResponse.json(scheduledSnapshot(meta, kickoff), {
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  // --- Modo simulación ---
  // En DEMO ("Ver demo en vivo") colocamos los goles muy pronto para no esperar
  // a ver la celebración; en simulación normal/fallback, guion aleatorio realista.
  const script = buildSimulation(meta, undefined, { demoEarly: isDemo });
  if (useAI) {
    const cacheKey = `${SIMNARR_PREFIX}${matchId}:${script.seed}`;
    let aiNarr: Record<string, string> | null = null;
    if (kvEnabled()) {
      try {
        aiNarr = await kv.get<Record<string, string>>(cacheKey);
      } catch {
        aiNarr = null;
      }
    }
    if (!aiNarr) {
      try {
        aiNarr = await aiNarrateBatch(script.events, meta, numericalContext(script.events, meta));
        if (kvEnabled() && aiNarr && Object.keys(aiNarr).length > 0) {
          await kv.set(cacheKey, aiNarr, { ex: SIMNARR_TTL });
        }
      } catch {
        aiNarr = null;
      }
    }
    if (aiNarr) script.narration = { ...script.narration, ...aiNarr };
  }

  return NextResponse.json(script, {
    headers: { "Cache-Control": "no-store" },
  });
}

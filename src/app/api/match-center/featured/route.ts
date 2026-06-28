// src/app/api/match-center/featured/route.ts
//
// Devuelve el partido DESTACADO del Match Center para el banner del hero,
// aplicando la REGLA FIJA (ver src/lib/match-center/programmed.ts):
//   1. Recorre los partidos programados en orden cronológico.
//   2. Salta los que ya terminaron; devuelve el que está en juego o el próximo.
//   3. Si no queda ninguno por jugar, cae al PRIMER partido del Mundial.
//
// La respuesta es un LiveSnapshot (mismo shape que /live/[id]) enriquecido con
// `matchId` y `slug`, de modo que el banner lo pinta y enlaza con una sola
// petición. Degrada limpiamente: si no hay datos en vivo, devuelve el estado
// "por comenzar" con la info disponible.

import { NextResponse } from "next/server";
import { MATCHES } from "@/data/matches";
import { PROGRAMMED_MATCH_IDS, firstWorldCupMatchId } from "@/lib/match-center/programmed";
import {
  buildMeta,
  getCachedSnapshot,
  getLastSnapshot,
  matchSlug,
} from "@/lib/match-center/store";
import { scheduledSnapshot } from "@/lib/match-center/apiFootball";
import { IN_PLAY, FINISHED } from "@/lib/match-center/status";
import type { LiveSnapshot } from "@/lib/match-center/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Ventana de saque (horarios de MATCHES en ET; EDT en junio = UTC-4).
// 210 min: cubre prórroga + tanda de penaltis (con 150 el destacado saltaba al
// siguiente partido en plena tanda).
const POSTMATCH_MS = 210 * 60_000;
// Margen ANTES del saque a partir del cual consultamos el estado real (KV): un
// partido no aparece "en vivo" en api-football más de ~media hora antes. Antes
// de esa franja un partido futuro no puede estar jugándose, así que lo damos por
// "próximo" sin leer KV (clave para no hacer 100+ lecturas con el cuadro lleno).
const PREKICK_MS = 30 * 60_000;
// IN_PLAY / FINISHED: conjuntos compartidos en @/lib/match-center/status.

// Slots de PRUEBA/amistosos (id >= 9000): se "montan" sobre KV con un fixture
// real que cambia de día y de rival, así que su snapshot puede quedar guardado
// de una configuración anterior. Hay que validarlo contra la fila actual.
const TEST_SLOT_MIN = 9000;

/** ¿El snapshot guardado corresponde a la config ACTUAL del slot (mismo saque)?
 *  Un amistoso anterior deja en KV un snapshot FINISHED de otra fecha que, si no
 *  se ignora, haría saltar el hero al inaugural por error y serviría datos viejos. */
function snapshotMatchesConfig(last: LiveSnapshot | null, ko: number): boolean {
  if (!last?.kickoff || Number.isNaN(ko)) return false;
  const t = new Date(last.kickoff).getTime();
  return !Number.isNaN(t) && Math.abs(t - ko) < 12 * 60 * 60_000;
}

function kickoffMs(date: string, time: string): number {
  const iso = `${date}T${time.length === 5 ? time : "00:00"}:00-04:00`;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NaN : t;
}

function isoKickoff(date: string, time: string): string {
  return `${date}T${time.length === 5 ? time : "00:00"}:00-04:00`;
}

/** Aplica la REGLA FIJA y devuelve el matchId destacado. */
async function pickFeaturedId(now: number): Promise<number> {
  const programmed = PROGRAMMED_MATCH_IDS
    .map((id) => MATCHES.find((m) => m.i === id))
    .filter((m): m is NonNullable<typeof m> => !!m)
    .sort((a, b) => kickoffMs(a.d, a.t) - kickoffMs(b.d, b.t));

  // Los partidos van ordenados por saque ascendente. Recorremos saltando los ya
  // jugados (por reloj, SIN leer KV) hasta el primero vigente, y solo ahí
  // consultamos el estado real. Con el cuadro lleno (100+ ids) esto mantiene las
  // lecturas de KV en ~1 por petición en vez de una por cada partido pasado.
  for (const m of programmed) {
    const ko = kickoffMs(m.d, m.t);
    if (Number.isNaN(ko)) continue;

    // ── Slot de PRUEBA (amistoso real montado sobre KV) ──
    // ACABADO (→ siguiente) si pasó la ventana por reloj o si su snapshot REAL
    // del día dice FINISHED. Solo creemos un snapshot cuyo saque coincide con la
    // fila actual: un amistoso anterior (otra fecha) no lo marca terminado mal.
    if (m.i >= TEST_SLOT_MIN) {
      if (now > ko + POSTMATCH_MS) continue;
      const last = await getLastSnapshot(m.i);
      if (snapshotMatchesConfig(last, ko)) {
        if (FINISHED.has(last!.status)) continue;
        if (IN_PLAY.has(last!.status)) return m.i;
      }
      return m.i;
    }

    // ── Partidos reales del Mundial ──
    // Ya pasó por reloj (>3,5 h tras el saque = imposible que siga en juego):
    // terminado, al siguiente SIN leer KV.
    if (now > ko + POSTMATCH_MS) continue;
    // Aún lejos del saque: es el próximo a destacar; no puede estar jugándose.
    if (now < ko - PREKICK_MS) return m.i;
    // En ventana (cerca del saque o jugándose): el estado REAL manda, así el
    // banner avanza al SIGUIENTE en el pitido final real (no a +3,5 h).
    const last = await getLastSnapshot(m.i);
    if (last && FINISHED.has(last.status)) continue; // terminó -> siguiente
    return m.i; // en juego o por empezar -> este
  }

  // Ningún programado vigente: en vez de caer al inaugural (que haría parecer que
  // el torneo "empieza de nuevo"), destacamos el PRÓXIMO partido real por saque
  // que no haya pasado ya (incluye rondas KO aún sin rival fijado en MATCHES).
  return nextUpcomingMatchId(now);
}

/** Próximo partido real por saque que aún no quedó atrás (defensa anti-inaugural). */
function nextUpcomingMatchId(now: number): number {
  const upcoming = MATCHES
    .filter((m) => m.i < TEST_SLOT_MIN)
    .map((m) => ({ id: m.i, ko: kickoffMs(m.d, m.t) }))
    .filter((x) => !Number.isNaN(x.ko) && now <= x.ko + POSTMATCH_MS)
    .sort((a, b) => a.ko - b.ko);
  return upcoming[0]?.id ?? firstWorldCupMatchId();
}

/** Mejor feed disponible para un partido (cacheado > último conocido > por
 *  comenzar). IMPORTANTE: este endpoint NUNCA pega a api-football — lo abre
 *  cada visitante del lobby y en cache-miss masivo agotaría la cuota diaria.
 *  Quien calienta KV es el cron match-center-poll; si el cron se cae durante
 *  un partido, servimos el último snapshot conocido (y el cron alerta). */
async function feedFor(matchId: number): Promise<LiveSnapshot | null> {
  const meta = buildMeta(matchId);
  if (!meta) return null;

  // Slot de PRUEBA: ignora snapshots de una config anterior (otra fecha) — su
  // saque no coincide con la fila actual de MATCHES → servir "por comenzar" con
  // los datos del día en vez de un resultado viejo de otro amistoso.
  const ko = matchId >= TEST_SLOT_MIN ? kickoffMs(meta.date, meta.time) : 0;
  const fresh = (s: LiveSnapshot | null): s is LiveSnapshot =>
    !!s && (matchId < TEST_SLOT_MIN || snapshotMatchesConfig(s, ko));

  const cached = await getCachedSnapshot(matchId);
  if (fresh(cached)) return cached;

  // Último estado conocido (copia durable mc:last:, sobrevive al TTL del
  // snapshot fresco): mejor un dato algo viejo que resetear el hero a "NS".
  const last = await getLastSnapshot(matchId);
  if (fresh(last)) return last;

  // Sin datos en vivo (o snapshot viejo de otra config): estado estático "por
  // comenzar" con la fecha del calendario.
  return scheduledSnapshot(meta, isoKickoff(meta.date, meta.time));
}

export async function GET() {
  const now = Date.now();
  const matchId = await pickFeaturedId(now);
  let feed = await feedFor(matchId);
  // Último recurso: si el id elegido no resuelve meta (estado inconsistente),
  // caemos al primer partido del Mundial antes que dejar el hero sin datos.
  let servedId = matchId;
  if (!feed) {
    servedId = firstWorldCupMatchId();
    feed = await feedFor(servedId);
  }
  if (!feed) {
    return NextResponse.json({ error: "no match" }, { status: 404 });
  }
  // CDN corto cuando el balón rueda (el caché edge se SUMA a la antigüedad del
  // snapshot); fuera de juego el dato apenas cambia y 10s está bien.
  const cdn = IN_PLAY.has(feed.status)
    ? "public, s-maxage=3, stale-while-revalidate=5"
    : "public, s-maxage=10, stale-while-revalidate=20";
  // `meta` siempre desde matches.ts: un snapshot cacheado de un KO pudo hornearse
  // con el slot viejo ("2A vs 2B") antes de fijar el rival; la fila actual manda.
  const freshMeta = buildMeta(servedId);
  return NextResponse.json(
    { matchId: servedId, slug: matchSlug(servedId), ...feed, ...(freshMeta ? { meta: freshMeta } : {}) },
    {
      headers: { "Cache-Control": cdn },
    },
  );
}

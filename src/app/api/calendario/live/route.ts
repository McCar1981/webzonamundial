// src/app/api/calendario/live/route.ts
//
// Estado en vivo REDUCIDO de los partidos del Mundial para la parrilla del
// calendario: { matchId: { s: status, sc: [gl, gv], el: minuto } }.
//
// Fuente: copias durables mc:last: del Match Center (las calienta el cron
// match-center-poll). Este endpoint NUNCA pega a api-football — igual que el
// featured del lobby, lo abre cada visitante y en cache-miss masivo agotaría
// la cuota. Sin KV o sin datos devuelve {} y el calendario pinta horarios.
//
// Solo consulta partidos cuya ventana ya interesa (saque a menos de 90 min o
// pasado): al principio del torneo son un puñado de claves, al final 104 — en
// ambos casos un MGET por bloque. El caché CDN absorbe el polling de los
// clientes (45s), así que KV ve una petición por ventana de caché, no por
// usuario.

import { NextResponse } from "next/server";
import { WC_MATCHES, matchInstant } from "@/lib/calendario/time";
import { IN_PLAY_STATUSES, type LiveLite, type LiveMap } from "@/lib/calendario/live";
import { getLastSnapshotsBulk } from "@/lib/match-center/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const SOON_MS = 90 * 60_000;

export async function GET() {
  const now = Date.now();

  const ids = WC_MATCHES.filter((m) => {
    const at = matchInstant(m);
    return at !== null && at.getTime() <= now + SOON_MS;
  }).map((m) => m.i);

  if (ids.length === 0) {
    // Torneo aún lejos: nada que contar en mucho rato.
    return NextResponse.json({} satisfies LiveMap, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  const snaps = await getLastSnapshotsBulk(ids);

  const map: LiveMap = {};
  let anyLive = false;
  for (const [id, snap] of Object.entries(snaps)) {
    const lite: LiveLite = {
      s: snap.status,
      sc: [snap.score?.[0] ?? 0, snap.score?.[1] ?? 0],
      el: snap.elapsed ?? 0,
    };
    map[Number(id)] = lite;
    if (IN_PLAY_STATUSES.has(lite.s)) anyLive = true;
  }

  // Con balón rodando el marcador cambia: caché corto. Sin partidos en juego,
  // los FT no se mueven y 60s sobra.
  const cdn = anyLive
    ? "public, s-maxage=15, stale-while-revalidate=30"
    : "public, s-maxage=60, stale-while-revalidate=120";

  return NextResponse.json(map, { headers: { "Cache-Control": cdn } });
}

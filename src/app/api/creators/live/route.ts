// GET /api/creators/live
//
// Endpoint p\u00fablico que devuelve los creators en vivo. Solo lee de KV
// (sin llamada a Twitch), as\u00ed que es <50ms.
//
// El componente LiveCreatorsBanner del frontend hace polling a este
// endpoint cada N segundos para refrescar el banner.

import { NextResponse } from "next/server";
import { readLiveStore } from "@/lib/creators-live/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await readLiveStore();
  return NextResponse.json(store, {
    headers: {
      // Cache 30s en CDN, stale-while-revalidate 60s para amortiguar
      // ante r\u00e1fagas de tr\u00e1fico. El cron actualiza KV cada 2 min,
      // as\u00ed que 30s es razonable.
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}

// src/app/api/friendlies/route.ts
//
// Lista de amistosos de selecciones para la página /amistosos:
//   - "live": los que se juegan ahora mismo.
//   - "upcoming": agenda de hoy y mañana (UTC) que aún no ha empezado.
//   - "finished": los de hoy que ya terminaron.
// Degrada a listas vacías si no hay API key configurada.

import { NextResponse } from "next/server";
import {
  apiFootballEnabled,
  fetchFriendliesByDate,
  fetchLiveFriendlies,
} from "@/lib/friendlies/api";
import {
  isFinishedStatus,
  isLiveStatus,
  type FriendlyFixture,
} from "@/lib/friendlies/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function utcDate(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  if (!apiFootballEnabled()) {
    return NextResponse.json({ live: [], upcoming: [], finished: [] });
  }

  const [live, today, tomorrow] = await Promise.all([
    fetchLiveFriendlies(),
    fetchFriendliesByDate(utcDate(0)),
    fetchFriendliesByDate(utcDate(1)),
  ]);

  const byId = new Map<number, FriendlyFixture>();
  for (const f of [...today, ...tomorrow, ...live]) byId.set(f.fixtureId, f);
  const all = [...byId.values()].sort((a, b) => a.date.localeCompare(b.date));

  const liveList = all.filter((f) => isLiveStatus(f.status));
  const finished = all.filter((f) => isFinishedStatus(f.status));
  const upcoming = all.filter(
    (f) => !isLiveStatus(f.status) && !isFinishedStatus(f.status),
  );

  return NextResponse.json(
    { live: liveList, upcoming, finished },
    { headers: { "Cache-Control": "no-store" } },
  );
}

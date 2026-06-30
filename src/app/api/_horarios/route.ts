// TEMPORAL — auditoría de horarios KO contra api-football. Borrar tras usar.
import { NextResponse } from "next/server";
import { MATCHES } from "@/data/matches";
import { getFixtureId } from "@/lib/match-center/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE = "https://v3.football.api-sports.io";
function key() { return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY; }

async function apiGet(path: string): Promise<unknown[] | null> {
  const k = key();
  if (!k) return null;
  try {
    const r = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": k }, cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as { response?: unknown[] };
    return j.response ?? null;
  } catch { return null; }
}

export async function GET() {
  const ko = MATCHES.filter((m) => m.i < 9000 && m.p !== "Fase de grupos");
  const fidByMatch: Record<number, number> = {};
  for (const m of ko) {
    const fid = await getFixtureId(m.i);
    if (fid) fidByMatch[m.i] = fid;
  }
  const fids = Object.values(fidByMatch);
  const dateByFixture: Record<number, { date: string; status: string }> = {};
  for (let i = 0; i < fids.length; i += 20) {
    const batch = fids.slice(i, i + 20).join("-");
    const fx = (await apiGet(`/fixtures?ids=${batch}`)) as
      | { fixture: { id: number; date: string; status: { short: string } } }[]
      | null;
    for (const f of fx ?? []) dateByFixture[f.fixture.id] = { date: f.fixture.date, status: f.fixture.status.short };
  }
  const rows = ko.map((m) => {
    const fid = fidByMatch[m.i] ?? null;
    const api = fid ? dateByFixture[fid] : null;
    return {
      matchId: m.i, phase: m.p, home: m.h, away: m.a,
      matchesTs: `${m.d}T${m.t}:00-04:00`,
      apiDate: api?.date ?? null, apiStatus: api?.status ?? null, fixtureId: fid,
    };
  });
  return NextResponse.json({ rows }, { headers: { "Cache-Control": "no-store" } });
}

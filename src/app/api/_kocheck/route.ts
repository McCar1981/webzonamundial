// src/app/api/_kocheck/route.ts
// TEMPORAL (solo lectura): consulta a api-football los cruces reales de
// eliminatorias y los devuelve mapeados a nuestras banderas, para confirmar la
// asignación de los 8 mejores terceros. Se borra tras la verificación.

import { NextResponse } from "next/server";
import { MATCHES } from "@/data/matches";
import { getFixtureId } from "@/lib/match-center/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE = "https://v3.football.api-sports.io";
function apiKey() {
  return process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}
async function apiGet(path: string): Promise<any[] | null> {
  const k = apiKey();
  if (!k) return null;
  const r = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": k }, cache: "no-store" });
  if (!r.ok) return null;
  const j = await r.json();
  return (j?.response ?? null) as any[] | null;
}

export async function GET() {
  if (!apiKey()) return NextResponse.json({ error: "no api key" }, { status: 503 });

  const real = MATCHES.filter((m) => m.i < 9000);
  // matchId -> fixtureId (KV)
  const fidByMatch: Record<number, number> = {};
  await Promise.all(
    real.map(async (m) => {
      const f = await getFixtureId(m.i);
      if (f) fidByMatch[m.i] = f;
    }),
  );

  const allFids = [...new Set(Object.values(fidByMatch))];
  // fetch fixtures en lotes de 20
  const fxById: Record<number, { homeId: number; awayId: number; homeName: string; awayName: string; status: string; date: string }> = {};
  for (let i = 0; i < allFids.length; i += 20) {
    const chunk = allFids.slice(i, i + 20);
    const resp = await apiGet(`/fixtures?ids=${chunk.join("-")}`);
    for (const f of resp ?? []) {
      fxById[f.fixture.id] = {
        homeId: f.teams.home.id, awayId: f.teams.away.id,
        homeName: f.teams.home.name, awayName: f.teams.away.name,
        status: f.fixture.status?.short ?? "?", date: f.fixture.date,
      };
    }
  }

  // Mapa teamId -> flagCode por IGUALDAD DE CONJUNTOS de fixtures de GRUPO.
  const groupMatches = real.filter((m) => m.p === "Fase de grupos" && fidByMatch[m.i]);
  const flagFids: Record<string, Set<number>> = {};
  const teamFids: Record<number, Set<number>> = {};
  for (const m of groupMatches) {
    const fid = fidByMatch[m.i];
    (flagFids[m.hf] ??= new Set()).add(fid);
    (flagFids[m.af] ??= new Set()).add(fid);
    const fx = fxById[fid];
    if (fx) {
      (teamFids[fx.homeId] ??= new Set()).add(fid);
      (teamFids[fx.awayId] ??= new Set()).add(fid);
    }
  }
  const eq = (a: Set<number>, b: Set<number>) => a.size === b.size && [...a].every((x) => b.has(x));
  const teamIdToFlag: Record<number, string> = {};
  for (const [tid, tset] of Object.entries(teamFids)) {
    for (const [flag, fset] of Object.entries(flagFids)) {
      if (tset.size >= 2 && eq(tset, fset)) { teamIdToFlag[Number(tid)] = flag; break; }
    }
  }

  // Resolver los KO con el mapa
  const ko = real.filter((m) => m.p !== "Fase de grupos").sort((a, b) => a.i - b.i);
  const out = ko.map((m) => {
    const fid = fidByMatch[m.i];
    const fx = fid ? fxById[fid] : null;
    return {
      matchId: m.i, phase: m.p, fixtureId: fid ?? null,
      // lo que tenemos AHORA en matches.ts:
      mineHome: m.h, mineHomeFlag: m.hf, mineAway: m.a, mineAwayFlag: m.af,
      // lo REAL de api-football:
      apiHome: fx?.homeName ?? null, apiHomeFlag: fx ? (teamIdToFlag[fx.homeId] ?? null) : null,
      apiAway: fx?.awayName ?? null, apiAwayFlag: fx ? (teamIdToFlag[fx.awayId] ?? null) : null,
      status: fx?.status ?? null, date: fx?.date ?? null,
    };
  });

  return NextResponse.json({ mappedTeams: Object.keys(teamIdToFlag).length, groupFixtures: groupMatches.length, ko: out });
}

// src/app/api/ligas/predict/route.ts
//
// Predicción 1X2 de Zona de Ligas (usuario logueado). Es la versión "con
// Fútcoins" de la encuesta anónima /api/ligas/vote: aquí el pronóstico se guarda
// a tu nombre y, al resolverse el partido, si aciertas te abona Fútcoins (cron
// resolve-liga-predictions).
//
// GET  ?fixtureId=123 -> { pick: "home"|"draw"|"away"|null }  (null si no logueado)
// POST { fixtureId, slug, pick } -> guarda el pronóstico (solo ANTES del saque)
//
// Integridad server-side: el saque y el estado se leen de api-football (no del
// cliente), así no se puede predecir un partido ya empezado/terminado. El
// competition_slug se valida contra el catálogo y contra la liga real del fixture.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCompetition } from "@/data/competitions";
import { getFixtureDetail } from "@/lib/competitions/api";
import { savePick, getUserPick, type LigaPick } from "@/lib/ligas/predictions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PICKS = new Set<LigaPick>(["home", "draw", "away"]);
const NOT_STARTED = new Set(["NS", "TBD"]); // solo se puede predecir antes del saque

function normFixtureId(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 0 && n < 1e12 ? Math.floor(n) : null;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const id = normFixtureId(new URL(request.url).searchParams.get("fixtureId"));
  if (!id) return NextResponse.json({ error: "invalid_fixture" }, { status: 400 });
  if (!user) return NextResponse.json({ pick: null }, { headers: { "Cache-Control": "private, no-store" } });
  const pick = await getUserPick(user.id, id);
  return NextResponse.json({ pick }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { fixtureId?: unknown; slug?: unknown; pick?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const id = normFixtureId(body.fixtureId);
  const pick = body.pick as LigaPick;
  const slug = typeof body.slug === "string" ? body.slug : "";
  const comp = getCompetition(slug);
  if (!id || !PICKS.has(pick) || !comp) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // Verificación server-side contra api-football: el partido debe existir, ser de
  // esta competición y NO haber empezado. Nunca se confía en el cliente.
  const detail = await getFixtureDetail(id);
  if (!detail) return NextResponse.json({ error: "fixture_not_found" }, { status: 404 });
  if (detail.fixture.competitionId !== comp.apiFootballId) {
    return NextResponse.json({ error: "slug_mismatch" }, { status: 400 });
  }
  if (!NOT_STARTED.has(detail.fixture.status)) {
    return NextResponse.json({ error: "match_started" }, { status: 409 });
  }

  const res = await savePick(user.id, id, slug, pick, detail.fixture.kickoff);
  if (!res.ok) {
    if (res.reason === "exists") return NextResponse.json({ error: "already_predicted" }, { status: 409 });
    if (res.reason === "not_available") return NextResponse.json({ error: "not_available" }, { status: 503 });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, pick });
}

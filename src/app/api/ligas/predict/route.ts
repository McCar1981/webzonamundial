// src/app/api/ligas/predict/route.ts
//
// Predicción 1X2 de Zona de Ligas (usuario logueado). Es la versión "con
// Fútcoins" de la encuesta anónima /api/ligas/vote: aquí el pronóstico se guarda
// a tu nombre y, al resolverse el partido, si aciertas te abona Fútcoins (cron
// resolve-liga-predictions).
//
// GET  ?fixtureId=123 -> { pick, exact: {home,away}|null, authed, boosted }
// POST { fixtureId, slug, pick } -> guarda el 1X2 (solo ANTES del saque)
// POST { fixtureId, slug, market: "exact", scoreHome, scoreAway } -> marcador exacto
//
// Integridad server-side: el saque y el estado se leen de api-football (no del
// cliente), así no se puede predecir un partido ya empezado/terminado. El
// competition_slug se valida contra el catálogo y contra la liga real del fixture.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCompetition } from "@/data/competitions";
import { getFixtureDetail } from "@/lib/competitions/api";
import { savePick, getUserPick, saveScorePick, getUserScorePick, saveTypedPick, getUserTypedPicks, type LigaPick } from "@/lib/ligas/predictions";
import { isBoosted } from "@/lib/ligas/boost";
import { isTypedMarket, validateMarketData, isOla1 } from "@/lib/ligas/predict-markets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PICKS = new Set<LigaPick>(["home", "draw", "away"]);
const NOT_STARTED = new Set(["NS", "TBD"]); // solo se puede predecir antes del saque

function normFixtureId(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 0 && n < 1e12 ? Math.floor(n) : null;
}

// Goles del marcador exacto: entero 0-15 (rango sano; el CHECK de la BD tolera hasta 30).
function normScore(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isInteger(n) && n >= 0 && n <= 15 ? n : null;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const id = normFixtureId(new URL(request.url).searchParams.get("fixtureId"));
  if (!id) return NextResponse.json({ error: "invalid_fixture" }, { status: 400 });
  const noStore = { headers: { "Cache-Control": "private, no-store" } };
  if (!user) return NextResponse.json({ pick: null, exact: null, typed: {}, authed: false, boosted: false }, noStore);
  const [pick, exact, boosted, typed] = await Promise.all([
    getUserPick(user.id, id),
    getUserScorePick(user.id, id),
    isBoosted(user.id, id),
    getUserTypedPicks(user.id, id),
  ]);
  return NextResponse.json({ pick, exact, typed, authed: true, boosted }, noStore);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { fixtureId?: unknown; slug?: unknown; pick?: unknown; market?: unknown; scoreHome?: unknown; scoreAway?: unknown; data?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const id = normFixtureId(body.fixtureId);
  const slug = typeof body.slug === "string" ? body.slug : "";
  const comp = getCompetition(slug);
  const isExact = body.market === "exact";
  const typedMarket = isTypedMarket(body.market) ? body.market : null;
  const pick = body.pick as LigaPick;
  const scoreHome = normScore(body.scoreHome);
  const scoreAway = normScore(body.scoreAway);
  if (!id || !comp) return NextResponse.json({ error: "invalid" }, { status: 400 });
  // Mercados avanzados (over/under, primer gol, ambos marcan): solo Ola 1 por ahora.
  const typedData = typedMarket ? validateMarketData(typedMarket, body.data) : null;
  if (typedMarket) {
    if (!isOla1(slug)) return NextResponse.json({ error: "market_not_available" }, { status: 403 });
    if (!typedData) return NextResponse.json({ error: "invalid" }, { status: 400 });
  } else if (isExact) {
    if (scoreHome == null || scoreAway == null) return NextResponse.json({ error: "invalid" }, { status: 400 });
  } else if (!PICKS.has(pick)) {
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

  const res = typedMarket
    ? await saveTypedPick(user.id, id, slug, typedMarket, typedData!, detail.fixture.kickoff)
    : isExact
      ? await saveScorePick(user.id, id, slug, scoreHome as number, scoreAway as number, detail.fixture.kickoff)
      : await savePick(user.id, id, slug, pick, detail.fixture.kickoff);
  if (!res.ok) {
    if (res.reason === "exists") return NextResponse.json({ error: "already_predicted" }, { status: 409 });
    if (res.reason === "not_available") return NextResponse.json({ error: "not_available" }, { status: 503 });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  if (typedMarket) return NextResponse.json({ ok: true, market: typedMarket, data: typedData });
  return isExact
    ? NextResponse.json({ ok: true, exact: { home: scoreHome, away: scoreAway } })
    : NextResponse.json({ ok: true, pick });
}

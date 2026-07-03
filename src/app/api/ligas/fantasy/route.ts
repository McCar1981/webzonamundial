// src/app/api/ligas/fantasy/route.ts
//
// Once de la jornada del Fantasy de Zona de Ligas.
// GET  ?slug=&round=  -> { pick } | { pick: null }
// POST { slug, round, players:[{id,pos,teamId,name}], captainId } -> guarda tu once
//
// Solo se puede montar el once ANTES de que empiece la jornada (se verifica contra
// api-football, no se confía en el cliente). El cron de puntuación re-deriva la
// posición real de cada jugador desde la plantilla, así que un `pos` manipulado no
// infla puntos.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCompetition } from "@/data/competitions";
import { getCompetitionFixtures } from "@/lib/competitions/api";
import { saveFantasyPick, getUserFantasyPick, type SquadPick } from "@/lib/ligas/fantasy-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const SQUAD_SIZE = 5;
const NOT_STARTED = new Set(["NS", "TBD"]);

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const sp = new URL(request.url).searchParams;
  const slug = sp.get("slug") || "";
  const round = sp.get("round") || "";
  if (!user) return NextResponse.json({ pick: null, authed: false }, { headers: { "Cache-Control": "private, no-store" } });
  const pick = await getUserFantasyPick(user.id, slug, round);
  return NextResponse.json({ pick, authed: true }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { slug?: unknown; round?: unknown; players?: unknown; captainId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug : "";
  const round = typeof body.round === "string" ? body.round : "";
  const comp = getCompetition(slug);
  const rawPlayers = Array.isArray(body.players) ? body.players : [];
  if (!comp || !round || rawPlayers.length !== SQUAD_SIZE) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // Normaliza y valida los jugadores (id numérico, sin duplicados).
  const players: SquadPick[] = [];
  const seen = new Set<number>();
  for (const p of rawPlayers as { id?: unknown; pos?: unknown; teamId?: unknown; name?: unknown }[]) {
    const id = Number(p.id);
    if (!Number.isFinite(id) || seen.has(id)) return NextResponse.json({ error: "invalid_players" }, { status: 400 });
    seen.add(id);
    const pos = ["GK", "DEF", "MID", "FWD"].includes(p.pos as string) ? (p.pos as SquadPick["pos"]) : "FWD";
    players.push({ id, pos, teamId: Number(p.teamId) || 0, name: String(p.name ?? "").slice(0, 60) });
  }
  const captainId = body.captainId != null && seen.has(Number(body.captainId)) ? Number(body.captainId) : null;

  // La jornada no debe haber empezado: al menos un partido de la ronda sin comenzar.
  const fixtures = await getCompetitionFixtures(comp.apiFootballId, { round });
  const open = fixtures.some((f) => NOT_STARTED.has(f.status));
  if (fixtures.length > 0 && !open) {
    return NextResponse.json({ error: "round_closed" }, { status: 409 });
  }

  const res = await saveFantasyPick(user.id, slug, round, players, captainId);
  if (!res.ok) {
    if (res.reason === "exists") return NextResponse.json({ error: "already_picked" }, { status: 409 });
    if (res.reason === "not_available") return NextResponse.json({ error: "not_available" }, { status: 503 });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

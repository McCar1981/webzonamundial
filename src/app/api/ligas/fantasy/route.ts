// src/app/api/ligas/fantasy/route.ts
//
// Once de la jornada del Fantasy de Zona de Ligas.
// GET  ?slug=&round=  -> { pick } | { pick: null }
// POST { slug, round, players:[{id,pos,teamId,name}], captainId } -> guarda tu once
//
// Solo se puede montar el once ANTES de que empiece la jornada (se verifica contra
// api-football, no se confía en el cliente). Cada jugador se valida contra la
// plantilla REAL de su equipo (getTeamSquad): un jugador que no esté en un equipo
// con el partido aún por empezar se rechaza, y su teamId/posición se derivan de la
// plantilla, no del cliente. El cron de puntuación vuelve a re-derivar la posición.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCompetition } from "@/data/competitions";
import { getCompetitionFixtures } from "@/lib/competitions/api";
import { saveFantasyPick, getUserFantasyPick, type SquadPick } from "@/lib/ligas/fantasy-store";
import { getTeamSquad } from "@/lib/ligas/fantasy";
import { SQUAD_SIZE } from "@/lib/ligas/fantasy-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // ── Validación de la jornada ────────────────────────────────────────────
  // Antes bastaba con que UN partido de la ronda no hubiera empezado para dar
  // por abierta la jornada entera: se podía fichar a un jugador cuyo partido ya
  // había terminado, sabiendo su resultado. Y si la ronda no existía —o
  // api-football se quedaba sin cuota y devolvía vacío— la condición
  // `fixtures.length > 0` dejaba pasar CUALQUIER cosa: esos onces se guardaban
  // y no se puntuaban nunca, además de ocupar hueco en el cron que resuelve.
  const fixtures = await getCompetitionFixtures(comp.apiFootballId, { round });
  if (fixtures.length === 0) {
    // Ronda inexistente o no verificable ahora mismo: mejor no guardar que
    // guardar un once que jamás va a puntuar.
    return NextResponse.json({ error: "round_unavailable" }, { status: 409 });
  }

  // Solo se pueden fichar jugadores de equipos cuyo partido de ESTA jornada
  // todavía no ha empezado.
  const equiposAbiertos = new Set<number>();
  for (const f of fixtures) {
    if (!NOT_STARTED.has(f.status)) continue;
    if (f.home?.id) equiposAbiertos.add(f.home.id);
    if (f.away?.id) equiposAbiertos.add(f.away.id);
  }
  if (equiposAbiertos.size === 0) {
    return NextResponse.json({ error: "round_closed" }, { status: 409 });
  }

  // Anti-retrovisor REAL: antes solo se comprobaba que el `teamId` DECLARADO por
  // el cliente estuviera abierto, pero ese campo lo pone el propio cliente. Un
  // POST forjado podía etiquetar a un jugador cuyo partido ya había terminado
  // con el teamId de un equipo abierto y fichar sabiendo el resultado.
  //
  // Ahora se resuelve la plantilla REAL (getTeamSquad, cacheada 7 días en KV) de
  // cada equipo abierto y se deriva el teamId y la posición del jugador desde
  // ahí, ignorando lo que mande el cliente. Un jugador que no esté en ninguna
  // plantilla abierta se rechaza.
  const squadByPlayer = new Map<number, { teamId: number; pos: SquadPick["pos"] }>();
  const equiposSinPlantilla = new Set<number>();
  await Promise.all(
    [...equiposAbiertos].map(async (teamId) => {
      const squad = await getTeamSquad(teamId);
      if (!squad.length) {
        // No se pudo resolver (cuota de api-football agotada, equipo nuevo…):
        // se marca para degradar con tolerancia y no bloquear a un usuario
        // legítimo por un fallo de infraestructura.
        equiposSinPlantilla.add(teamId);
        return;
      }
      for (const pl of squad) squadByPlayer.set(pl.id, { teamId: pl.teamId, pos: pl.position });
    }),
  );

  for (const p of players) {
    const real = squadByPlayer.get(p.id);
    if (real) {
      // Plantilla resuelta: el equipo y la posición mandan sobre el cliente.
      p.teamId = real.teamId;
      p.pos = real.pos;
      continue;
    }
    // Sin plantilla resuelta para su equipo declarado → se tolera (degradación),
    // pero solo si ese equipo declarado está de verdad abierto. En cualquier
    // otro caso, el jugador no pertenece a un equipo abierto: bloqueado.
    const tolerable = equiposSinPlantilla.has(p.teamId) && equiposAbiertos.has(p.teamId);
    if (!tolerable) {
      return NextResponse.json(
        { error: "player_locked", playerId: p.id },
        { status: 409 },
      );
    }
  }

  const res = await saveFantasyPick(user.id, slug, round, players, captainId);
  if (!res.ok) {
    if (res.reason === "exists") return NextResponse.json({ error: "already_picked" }, { status: 409 });
    if (res.reason === "not_available") return NextResponse.json({ error: "not_available" }, { status: 503 });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

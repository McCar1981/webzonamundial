// src/app/api/ligas/vote/route.ts
//
// Encuesta de comunidad "¿Quién ganará?" del Centro de Partido de Zona de Ligas.
// El primer elemento "participa" sobre cada partido: anónimo, sin cuenta, sin
// dinero (la versión con Fútcoins para logueados vendrá después). Sirve de prueba
// social y de germen de la capa jugable.
//
// GET  /api/ligas/vote?fixtureId=123  -> { home, draw, away, total }
// POST /api/ligas/vote { fixtureId, pick: "home"|"draw"|"away" } -> mismos counts
//
// Almacen: un hash KV por fixture (zl:vote:{id}) con hincrby por opción; expira a
// 30 días para no acumular. El "un voto por partido" se resuelve en cliente
// (localStorage) — barrera suave, sin cuenta; el servidor solo evita el flood con
// rate-limit por IP de confianza (x-vercel-forwarded-for), fail-CLOSED sin KV.

import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PICKS = new Set(["home", "draw", "away"]);
const VOTE_TTL_S = 60 * 60 * 24 * 30; // 30 días
const IP_WINDOW_S = 600; // 10 min
const IP_MAX = 40; // votos por IP / ventana (un usuario vota en varios partidos)

const voteKey = (id: string) => `zl:vote:${id}`;

function trustedIp(request: Request): string {
  return request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
}

function normFixtureId(v: unknown): string | null {
  const n = typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
  return /^\d{1,12}$/.test(n) ? n : null;
}

async function readCounts(id: string): Promise<{ home: number; draw: number; away: number; total: number }> {
  let raw: Record<string, unknown> | null = null;
  try {
    raw = await kv.hgetall<Record<string, unknown>>(voteKey(id));
  } catch {
    raw = null;
  }
  const home = Number(raw?.home ?? 0) || 0;
  const draw = Number(raw?.draw ?? 0) || 0;
  const away = Number(raw?.away ?? 0) || 0;
  return { home, draw, away, total: home + draw + away };
}

export async function GET(request: Request) {
  const id = normFixtureId(new URL(request.url).searchParams.get("fixtureId"));
  if (!id) return NextResponse.json({ error: "invalid_fixture" }, { status: 400 });
  const counts = await readCounts(id);
  return NextResponse.json(counts, { headers: { "Cache-Control": "public, s-maxage=15" } });
}

// Fail-CLOSED: sin KV, no aceptamos votos (ni contamos sin freno).
async function allowed(ip: string): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return false;
  try {
    const k = `zl:vote:rate:${ip}`;
    const c = await kv.incr(k);
    if (c === 1) await kv.expire(k, IP_WINDOW_S);
    return c <= IP_MAX;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: { fixtureId?: unknown; pick?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const id = normFixtureId(body.fixtureId);
  const pick = typeof body.pick === "string" ? body.pick : "";
  if (!id || !PICKS.has(pick)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  if (!(await allowed(trustedIp(request)))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const n = await kv.hincrby(voteKey(id), pick, 1);
    if (n === 1) await kv.expire(voteKey(id), VOTE_TTL_S);
  } catch {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json(await readCounts(id));
}

// src/app/api/ligas/mi-club/route.ts
//
// "Mi club": el ancla de retención de la temporada.
// GET    -> { authed, club, next, last, news } (próximo partido, último resultado
//           y noticias del club; fixtures+news cacheados en KV 10 min por club)
// POST   { ligaSlug?, teamId, teamName, teamLogo? } -> guarda liga y club favoritos
// DELETE -> limpia la elección
//
// Requiere la migración 2026-45 (fail-soft: sin columnas responde not_available).

import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCompetition } from "@/data/competitions";
import { getTeamFixtures, type TeamFixture } from "@/lib/competitions/api";
import { getMiClub, setMiClub, clearMiClub } from "@/lib/ligas/mi-club";
import { getAllPublicNoticias } from "@/lib/noticias-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_S = 600; // 10 min: fixtures y noticias del club cambian despacio
const cacheKey = (teamId: number) => `zl:miclub:${teamId}`;

interface ClubNews { slug: string; title: string; date: string }
interface ClubExtra { next: TeamFixture | null; last: TeamFixture | null; news: ClubNews[] }

// Coincidencia de noticia por nombre de club: palabra completa, sin acentos y
// sin distinguir mayúsculas ("américa" casa con "América golea...").
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
function mentionsClub(text: string, club: string): boolean {
  const t = ` ${norm(text)} `;
  const c = norm(club).trim();
  return c.length >= 4 && t.includes(` ${c} `);
}

async function clubExtra(teamId: number, clubName: string): Promise<ClubExtra> {
  try {
    const cached = await kv.get<ClubExtra>(cacheKey(teamId));
    if (cached) return cached;
  } catch { /* sin KV: generamos */ }

  const [nextArr, lastArr, noticias] = await Promise.all([
    getTeamFixtures(teamId, { next: 1 }),
    getTeamFixtures(teamId, { last: 1 }),
    getAllPublicNoticias().catch(() => []),
  ]);
  const news: ClubNews[] = noticias
    .filter((n) => mentionsClub(`${n.title} ${n.excerpt ?? ""}`, clubName))
    .slice(0, 3)
    .map((n) => ({ slug: n.slug, title: n.title, date: n.date }));
  const extra: ClubExtra = { next: nextArr[0] ?? null, last: lastArr[0] ?? null, news };

  try { await kv.set(cacheKey(teamId), extra, { ex: CACHE_TTL_S }); } catch { /* best-effort */ }
  return extra;
}

export async function GET() {
  const user = await getCurrentUser();
  const noStore = { headers: { "Cache-Control": "private, no-store" } };
  if (!user) return NextResponse.json({ authed: false, club: null }, noStore);
  const club = await getMiClub(user.id);
  if (!club) return NextResponse.json({ authed: true, club: null }, noStore);
  const extra = await clubExtra(club.clubId, club.clubName);
  return NextResponse.json({ authed: true, club, ...extra }, noStore);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { ligaSlug?: unknown; teamId?: unknown; teamName?: unknown; teamLogo?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const teamId = Number(body.teamId);
  const teamName = String(body.teamName ?? "").trim().slice(0, 60);
  if (!Number.isInteger(teamId) || teamId <= 0 || teamId > 1e9 || !teamName) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const ligaSlug = typeof body.ligaSlug === "string" && getCompetition(body.ligaSlug) ? body.ligaSlug : null;
  // Solo escudos del CDN de api-sports (nada de URLs arbitrarias en el perfil).
  const rawLogo = typeof body.teamLogo === "string" ? body.teamLogo : "";
  const teamLogo = rawLogo.startsWith("https://media.api-sports.io/") && rawLogo.length < 300 ? rawLogo : null;

  const res = await setMiClub(user.id, { ligaSlug, clubId: teamId, clubName: teamName, clubLogo: teamLogo });
  if (!res.ok) {
    if (res.reason === "not_available") return NextResponse.json({ error: "not_available" }, { status: 503 });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const res = await clearMiClub(user.id);
  return res.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: res.reason ?? "internal" }, { status: res.reason === "not_available" ? 503 : 500 });
}

// src/app/api/ligas/mi-feed/route.ts
//
// El feed personal del hub: para las ligas elegidas por el usuario, sus
// partidos EN VIVO y los próximos de cada una. El mini-feed de cada liga se
// cachea en KV 120s y se COMPARTE entre todos los usuarios que la siguen:
// N usuarios de Liga MX cuestan 1 llamada por ventana, igual que el LiveStrip.
//
// GET -> { authed, ligas: [{ slug, name, short, live: [...], upcoming: [...] }] }

import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCompetition } from "@/data/competitions";
import { getMisLigas } from "@/lib/ligas/mis-ligas";
import { getCompetitionFixtures, type CompetitionFixture } from "@/lib/competitions/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_S = 120;
const UPCOMING = 3;
const feedKey = (slug: string) => `zl:feed:${slug}`;

interface LigaFeed {
  slug: string;
  name: string;
  short: string;
  live: CompetitionFixture[];
  upcoming: CompetitionFixture[];
}

async function ligaFeed(slug: string): Promise<LigaFeed | null> {
  const comp = getCompetition(slug);
  if (!comp) return null;
  try {
    const cached = await kv.get<LigaFeed>(feedKey(slug));
    if (cached) return cached;
  } catch { /* sin KV: generamos */ }

  const [live, upcoming] = await Promise.all([
    getCompetitionFixtures(comp.apiFootballId, { live: true }),
    getCompetitionFixtures(comp.apiFootballId, { next: UPCOMING }),
  ]);
  const liveIds = new Set(live.map((f) => f.fixtureId));
  const feed: LigaFeed = {
    slug: comp.slug,
    name: comp.name,
    short: comp.short,
    live,
    upcoming: upcoming.filter((f) => !liveIds.has(f.fixtureId)).slice(0, UPCOMING),
  };
  try { await kv.set(feedKey(slug), feed, { ex: CACHE_TTL_S }); } catch { /* best-effort */ }
  return feed;
}

export async function GET() {
  const user = await getCurrentUser();
  const noStore = { headers: { "Cache-Control": "private, no-store" } };
  if (!user) return NextResponse.json({ authed: false, ligas: [] }, noStore);

  const slugs = await getMisLigas(user.id);
  if (!slugs.length) return NextResponse.json({ authed: true, ligas: [] }, noStore);

  const feeds = await Promise.all(slugs.map(ligaFeed));
  return NextResponse.json({ authed: true, ligas: feeds.filter(Boolean) }, noStore);
}

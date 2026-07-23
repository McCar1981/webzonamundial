// src/app/api/ligas/mis-noticias/route.ts
//
// Noticias personalizadas del usuario: 1º de sus clubes, 2º de sus ligas.
// GET -> { authed, club: NoticiaLite[], league: NoticiaLite[] }

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMisClubes } from "@/lib/ligas/mi-club";
import { getMisLigas } from "@/lib/ligas/mis-ligas";
import { getPersonalNoticias } from "@/lib/ligas/noticias-personal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const noStore = { headers: { "Cache-Control": "private, no-store" } };
  if (!user) return NextResponse.json({ authed: false, club: [], league: [], breves: [], clubs: [] }, noStore);

  const [clubes, ligas] = await Promise.all([getMisClubes(user.id), getMisLigas(user.id)]);
  const { club, league, breves } = await getPersonalNoticias(clubes.map((c) => c.clubName), ligas);
  return NextResponse.json(
    {
      authed: true,
      club,
      league,
      breves,
      // Escudos de los clubes seguidos: miniatura fallback cuando la noticia no
      // trae imagen (los sirve media.api-sports.io, sin coste de cuota).
      clubs: clubes.map((c) => ({ name: c.clubName, logo: c.clubLogo })),
      generatedAt: new Date().toISOString(),
    },
    noStore,
  );
}

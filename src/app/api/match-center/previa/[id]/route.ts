// src/app/api/match-center/previa/[id]/route.ts
//
// Sirve la PREVIA editorial de un partido (la que el cron publica ~1h antes en
// /noticias) para mostrarla DENTRO del Match Center como acordeón. Devuelve el
// cuerpo de la noticia + las fotos reales de ambas selecciones (jugador estrella
// de la BIBLIA). Si la previa aún no se ha generado, found:false (pero igual
// devuelve las fotos para la cabecera del acordeón).

import { NextResponse } from "next/server";
import { buildMeta } from "@/lib/match-center/store";
import { previaSlugFor } from "@/lib/match-center/previa";
import { getNoticiaBySlugPublic } from "@/lib/noticias-store";
import { etToDate } from "@/lib/bracket/match-time";
import { teamInfo } from "@/lib/friendlies/teamInfo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const matchId = parseInt(params.id, 10);
  if (!Number.isInteger(matchId)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const meta = buildMeta(matchId);
  if (!meta) {
    return NextResponse.json({ error: "match not found" }, { status: 404 });
  }

  // Fotos reales de ambas selecciones (jugador estrella, Wikimedia Commons).
  const [homeInfo, awayInfo] = await Promise.all([
    teamInfo(meta.home.name).catch(() => null),
    teamInfo(meta.away.name).catch(() => null),
  ]);
  const photos = { home: homeInfo?.photo ?? null, away: awayInfo?.photo ?? null };

  const ko = etToDate(meta.date, meta.time);
  let perMatch = true;
  let noticia = ko ? await getNoticiaBySlugPublic(previaSlugFor(meta.home.name, meta.away.name, ko)) : undefined;
  // Margen: la previa se sella con la fecha del saque en hora de España; si el
  // partido cruza medianoche, probamos también el día anterior.
  if (!noticia && ko) {
    const prev = new Date(ko.getTime() - 6 * 60 * 60_000);
    noticia = await getNoticiaBySlugPublic(previaSlugFor(meta.home.name, meta.away.name, prev));
  }
  // Fallback: la PREVIA DIARIA de la jornada (cubre los partidos del día). Así
  // el acordeón siempre tiene análisis real aunque la previa por partido aún no
  // se haya generado. La por-partido, si existe, tiene prioridad.
  if (!noticia && ko) {
    const madridDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(ko);
    noticia = await getNoticiaBySlugPublic(`previa-mundial-${madridDate}`);
    if (noticia) perMatch = false;
  }

  if (!noticia) {
    return NextResponse.json(
      { found: false, photos },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  }

  return NextResponse.json(
    {
      found: true,
      perMatch,
      slug: noticia.slug,
      title: perMatch ? noticia.title : `Previa de la jornada: ${meta.home.name} – ${meta.away.name} y más`,
      excerpt: noticia.excerpt,
      image: noticia.realImage ?? null,
      blocks: noticia.body,
      photos,
    },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
  );
}

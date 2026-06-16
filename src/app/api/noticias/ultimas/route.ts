// GET /api/noticias/ultimas
//
// Endpoint público que devuelve las últimas noticias del Mundial recortadas
// a 6 piezas, proyectando SOLO los campos que la home pinta. Lo consume
// LatestNewsSection (client component) vía fetch en useEffect — page.tsx es
// "use client" y no puede importar getAllPublicNoticias (server-only: lee KV).
//
// La lista ya viene ordenada por frescura desde getAllPublicNoticias()
// (ingestedAt → date), así que aquí solo recortamos y proyectamos.

import { NextResponse } from "next/server";
import { getAllPublicNoticias } from "@/lib/noticias-store";

export const runtime = "nodejs";

// ISR corto: el cron de ingesta publica como mucho cada hora y revalida
// /noticias; 60s mantiene la home fresca sin pagar TTFB en cada visita.
export const revalidate = 60;

/** Solo los campos que la tarjeta de la home necesita. */
export interface UltimaNoticia {
  slug: string;
  title: string;
  excerpt: string;
  cat: string;
  date: string;
  readTime: number;
  realImage: string | null;
  flags: string[];
  ingestedAt: string | null;
}

export async function GET() {
  try {
    const all = await getAllPublicNoticias();
    const items: UltimaNoticia[] = all.slice(0, 6).map((n) => ({
      slug: n.slug,
      title: n.title,
      excerpt: n.excerpt,
      cat: n.cat,
      date: n.date,
      readTime: n.readTime,
      realImage: n.realImage ?? null,
      flags: n.flags ?? [],
      ingestedAt: n.ingestedAt ?? null,
    }));
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    // Fail-soft: la home no debe romperse si KV falla; la sección no se
    // renderiza cuando la lista llega vacía.
    return NextResponse.json({ items: [] });
  }
}

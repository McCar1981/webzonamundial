import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fetchPlayerPhoto } from "@/lib/player-photos";
import type { NationalTeam, Player } from "@/types/team";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/*
  GET /api/admin/player-photos?slug=argentina&format=json
       (header Authorization: Bearer ADMIN_TOKEN)

  - Lee data/teams/{slug}.json
  - Para cada player de likely_squad sin photo_url:
      · Llama Wikipedia API (player-photos.ts)
      · Asigna photo_url + photo_credit
  - Devuelve un patch JSON listo para revisar y mergear al archivo.
  - NO escribe el JSON automáticamente — devuelve el diff en respuesta
    para que Carlos lo revise antes (y porque Vercel filesystem no es
    writable en producción).

  Uso típico:
    curl -H "Authorization: Bearer $ADMIN_TOKEN" \
      "https://www.zonamundial.app/api/admin/player-photos?slug=argentina" \
      -o argentina-photos.json
    # Revisar el JSON, copiar los photo_url al archivo del repo BIBLIA.
*/

function checkAuth(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const auth = req.headers.get("authorization") ?? "";
  const headerToken = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const queryToken = req.nextUrl.searchParams.get("token") ?? "";
  return Boolean(headerToken === token || queryToken === token);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    if (!process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: "ADMIN_TOKEN no configurado" }, { status: 503 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Falta ?slug=" }, { status: 400 });
  }

  const file = path.join(process.cwd(), "data", "teams", `${slug}.json`);
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf-8");
  } catch {
    return NextResponse.json({ error: `No existe data/teams/${slug}.json` }, { status: 404 });
  }

  const team = JSON.parse(raw) as NationalTeam;
  const squad = team.wc_2026?.likely_squad ?? [];

  const results: Array<{
    id: string;
    full_name: string;
    found: boolean;
    photo_url?: string;
    wikipedia_url?: string;
    skipped_reason?: string;
  }> = [];

  // Lookup secuencial (sin saturar Wikipedia API; 26 jugadores ~= 13s)
  for (const p of squad as Player[]) {
    if (p.photo_url) {
      results.push({
        id: p.id ?? p.full_name,
        full_name: p.full_name,
        found: true,
        photo_url: p.photo_url,
        skipped_reason: "ya tenía photo_url",
      });
      continue;
    }
    const photo = await fetchPlayerPhoto(p.full_name);
    if (photo) {
      results.push({
        id: p.id ?? p.full_name,
        full_name: p.full_name,
        found: true,
        photo_url: photo.url,
        wikipedia_url: photo.wikipedia_url,
      });
    } else {
      results.push({
        id: p.id ?? p.full_name,
        full_name: p.full_name,
        found: false,
      });
    }
  }

  return NextResponse.json({
    slug,
    total: squad.length,
    found: results.filter((r) => r.found).length,
    not_found: results.filter((r) => !r.found).length,
    results,
    instructions:
      "Para inyectar al JSON: añadir 'photo_url' a cada player en data/teams/{slug}.json. Las URLs Wikipedia Commons son estables. Atribución: 'Wikipedia Commons' + wikipedia_url.",
  });
}

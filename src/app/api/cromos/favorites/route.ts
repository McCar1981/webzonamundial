// src/app/api/cromos/favorites/route.ts
//
// GET  /api/cromos/favorites → IDs de cromos favoritos del usuario.
// POST /api/cromos/favorites → body { cromoId } toggle favorito.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getUserFavorites, toggleFavorite } from "@/lib/cromos/collection";
import { TOTAL_CROMOS } from "@/lib/cromos/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const favorites = await getUserFavorites(user.id);
  return NextResponse.json({ favoriteIds: Array.from(favorites) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { cromoId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const cromoId = typeof body.cromoId === "number" ? body.cromoId : Number(body.cromoId);
  // Solo ids reales del catálogo (1..150), no cualquier número.
  if (!Number.isInteger(cromoId) || cromoId < 1 || cromoId > TOTAL_CROMOS) {
    return NextResponse.json({ error: "invalid_cromo_id" }, { status: 400 });
  }

  const favorited = await toggleFavorite(user.id, cromoId);
  return NextResponse.json({ favorited });
}

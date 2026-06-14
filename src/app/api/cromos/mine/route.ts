// src/app/api/cromos/mine/route.ts
//
// GET /api/cromos/mine → colección del usuario autenticado.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getUserCollection, getUserFavorites } from "@/lib/cromos/collection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [collection, favorites] = await Promise.all([
    getUserCollection(user.id),
    getUserFavorites(user.id),
  ]);

  return NextResponse.json({
    ownedIds: Array.from(collection.ownedIds),
    total: collection.total,
    collected: collection.collected,
    progress: collection.progress,
    byRarity: collection.byRarity,
    byCategory: collection.byCategory,
    favoriteIds: Array.from(favorites),
  }, { headers: { "Cache-Control": "no-store" } });
}

// src/app/api/cromos/route.ts
//
// GET /api/cromos → catálogo público de cromos (sin auth).

import { NextResponse } from "next/server";
import { CROMOS, CATEGORIES, RARITIES, TOTAL_CROMOS } from "@/lib/cromos/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    cromos: CROMOS,
    categories: CATEGORIES,
    rarities: RARITIES,
    total: TOTAL_CROMOS,
  });
}

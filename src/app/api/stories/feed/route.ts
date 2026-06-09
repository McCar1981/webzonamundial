// GET /api/stories/feed
//
// Feed de Stories (carrusel del Home/app). Devuelve los reels activos agrupados
// por autor/grupo. Con sesión, marca qué reels ya vio el usuario (anillo gastado).

import { NextResponse } from "next/server";
import { safeCurrentUser } from "@/lib/stories/current-user";
import { getFeed } from "@/lib/stories/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await safeCurrentUser();
  const reels = await getFeed(user?.id ?? null);
  return NextResponse.json({ reels });
}

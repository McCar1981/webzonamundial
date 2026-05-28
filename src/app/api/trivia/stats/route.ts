// src/app/api/trivia/stats/route.ts
//
// Estadísticas del usuario. Usa la sesión Supabase si existe; si no, acepta
// ?anonId= para usuarios anónimos.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserStats } from "@/lib/trivia/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  let userId = "";
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    /* anon */
  }
  if (!userId) userId = (url.searchParams.get("anonId") || "").trim();
  if (!userId) {
    return NextResponse.json({ stats: null });
  }

  const stats = await getUserStats(userId);
  return NextResponse.json({ stats });
}

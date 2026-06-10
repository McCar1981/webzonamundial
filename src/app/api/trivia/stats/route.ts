// src/app/api/trivia/stats/route.ts
//
// Estadísticas del usuario. Usa la sesión Supabase si existe; si no, acepta
// ?anonId= para usuarios anónimos.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserStats } from "@/lib/trivia/store";
import { isValidAnonId } from "@/lib/trivia/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Respuesta por usuario (cookie/anonId): cache PRIVADA del navegador. Evita
// que cada navegación al lobby re-pegue a KV sin cachear nada compartido.
const CACHE_HEADERS = { "Cache-Control": "private, max-age=30" };

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
  // Sin sesión solo se pueden leer stats de una identidad anónima con formato
  // válido (anon-…): así un ?anonId=<UUID ajeno> no permite espiar las stats de
  // otro usuario (el id de un usuario autenticado es un UUID, nunca "anon-…").
  // Esto también sirve de anti-enumeración: el día del Mundial este endpoint lo
  // abre cada visitante y todo lo que no parezca un id nuestro se descarta sin
  // tocar KV.
  if (!userId) {
    const anon = (url.searchParams.get("anonId") || "").trim();
    if (isValidAnonId(anon)) userId = anon;
  }
  if (!userId) {
    return NextResponse.json({ stats: null }, { headers: CACHE_HEADERS });
  }

  const stats = await getUserStats(userId);
  return NextResponse.json({ stats }, { headers: CACHE_HEADERS });
}

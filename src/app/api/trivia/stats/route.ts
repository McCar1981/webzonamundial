// src/app/api/trivia/stats/route.ts
//
// Estadísticas del usuario. Usa la sesión Supabase si existe; si no, acepta
// ?anonId= para usuarios anónimos.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserStats } from "@/lib/trivia/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Respuesta por usuario (cookie/anonId): cache PRIVADA del navegador. Evita
// que cada navegación al lobby re-pegue a KV sin cachear nada compartido.
const CACHE_HEADERS = { "Cache-Control": "private, max-age=30" };

// El anonId lo genera el cliente como UUID y lo guarda en localStorage. Todo
// lo que no parezca un id nuestro se descarta SIN tocar KV (anti-enumeración
// y anti-basura: el día del Mundial este endpoint lo abre cada visitante).
const ANON_ID_RE = /^[A-Za-z0-9_-]{8,40}$/;

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
  if (!userId) {
    const anon = (url.searchParams.get("anonId") || "").trim();
    if (ANON_ID_RE.test(anon)) userId = anon;
  }
  if (!userId) {
    return NextResponse.json({ stats: null }, { headers: CACHE_HEADERS });
  }

  const stats = await getUserStats(userId);
  return NextResponse.json({ stats }, { headers: CACHE_HEADERS });
}

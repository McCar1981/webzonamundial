// src/app/api/match-center/comments/[matchId]/route.ts
//
// Comentarios en vivo del Match Center.
//   GET  -> público: devuelve los comentarios recientes del partido.
//   POST -> requiere sesión (Supabase): publica un comentario. La identidad
//           (nombre, país, avatar) se resuelve SIEMPRE en el servidor desde el
//           perfil, nunca desde el cliente, así no se puede falsear.
// Anti-flood: 1 comentario cada COOLDOWN_SECONDS por usuario (vía KV).

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addComment, getComments, type MatchComment } from "@/lib/match-center/comments";
import { resolveMatchId } from "@/lib/match-center/slug";
import { kv } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LEN = 280;
const COOLDOWN_SECONDS = 8;

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, MAX_LEN);
}

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  const matchId = resolveMatchId(params.matchId);
  if (matchId == null) return NextResponse.json({ error: "bad_id" }, { status: 400 });
  const comments = await getComments(matchId, 60);
  // Caché de borde compartida: la lista de comentarios es la MISMA para todos los
  // espectadores. Con cientos sondeando cada 12s, sin caché cada poll iba a origen
  // (Function Invocation + Edge Request + eventos de Observability). Con s-maxage=8
  // se sirve 1 lectura por ventana y el resto desde el edge. swr=15 evita huecos.
  // El POST escribe en KV al instante, así que cualquier lectura a origen tras
  // comentar ya incluye el comentario (y el cliente lo añade de forma optimista).
  return NextResponse.json(
    { comments },
    { headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=15" } },
  );
}

export async function POST(req: Request, { params }: { params: { matchId: string } }) {
  const matchId = resolveMatchId(params.matchId);
  if (matchId == null) return NextResponse.json({ error: "bad_id" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const text = clean(String(body.text ?? ""));
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  // Anti-flood: una marca con NX/EX por usuario; si ya existe, va demasiado rápido.
  if (kvEnabled()) {
    try {
      const ok = await kv.set(`mc:cmt:cd:${user.id}`, 1, { nx: true, ex: COOLDOWN_SECONDS });
      if (ok === null) {
        return NextResponse.json({ error: "rate_limited" }, { status: 429 });
      }
    } catch {
      /* si KV falla, no bloqueamos al usuario */
    }
  }

  // Identidad desde el perfil (server-side).
  let name = "Hincha";
  let country = "";
  let avatar = "";
  try {
    const supabase = createSupabaseServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, country, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    const p = profile as
      | { username?: string | null; country?: string | null; avatar_url?: string | null }
      | null;
    if (p?.username && p.username.trim()) name = p.username.trim().slice(0, 40);
    if (p?.country && /^[a-z]{2}$/i.test(p.country)) country = p.country.toLowerCase();
    if (p?.avatar_url && p.avatar_url.trim()) avatar = p.avatar_url.trim();
  } catch {
    /* degrada a identidad genérica */
  }

  const comment: MatchComment = {
    id: randomUUID(),
    uid: user.id,
    name,
    country,
    avatar,
    text,
    ts: Date.now(),
  };
  await addComment(matchId, comment);

  return NextResponse.json({ comment }, { status: 201 });
}

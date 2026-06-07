// src/app/api/fantasy/creator/route.ts
//
// POST /api/fantasy/creator → fija el creador del usuario (profiles.fav_creator)
// para quien NO lo eligió al registrarse y quiere hacerlo más adelante. El
// equipo fantasy queda marcado con el nombre e imagen de ese creador.
//
// Es opcional por diseño: a quien no elige a nadie no se le hace nada. Este
// endpoint solo entra en juego cuando el usuario decide elegir.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCreadorBySlug } from "@/data/creadores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { slug?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const slug = (body.slug ?? "").trim();
  // Solo se aceptan creadores reales; bloquea valores inventados desde el cliente.
  if (!slug || !getCreadorBySlug(slug)) {
    return NextResponse.json({ error: "bad_request", message: "creador inválido" }, { status: 400 });
  }

  // Update de la propia fila vía RLS (mismo patrón que el onboarding).
  const supa = createSupabaseServerClient();
  const { error } = await supa.from("profiles").update({ fav_creator: slug }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, slug });
}

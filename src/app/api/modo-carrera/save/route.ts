// src/app/api/modo-carrera/save/route.ts
//
// GET  /api/modo-carrera/save → partida del usuario autenticado (null si no tiene).
// PUT  /api/modo-carrera/save → guarda la partida del usuario ({ state }).
//
// Persistencia real del Modo Carrera: sustituye al localStorage cuando hay
// sesión. El localStorage sigue actuando como modo invitado y se sincroniza al
// iniciar sesión (igual que el Fantasy).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCareer, saveCareer } from "@/lib/modo-carrera/store.server";
import type { CareerState } from "@/lib/modo-carrera/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const career = await getCareer(user.id);
  return NextResponse.json({ career });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { state?: CareerState };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const state = body.state;
  if (!state || typeof state !== "object" || !state.identity) {
    return NextResponse.json({ error: "bad_request", message: "state inválido" }, { status: 400 });
  }

  await saveCareer(user.id, state);
  return NextResponse.json({ ok: true });
}

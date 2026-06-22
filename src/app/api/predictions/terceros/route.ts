// src/app/api/predictions/terceros/route.ts
//
// GET  -> detecta sesión (401 anónimo / 200 con el pronóstico guardado) y sirve
//         el pronóstico de mejores terceros del usuario.
// PUT  -> guarda el pronóstico (array de 1..8 letras de grupo A-L, sin repetir).
//
// Clona /api/predictions/bracket: auth con getCurrentUser (supabase.auth.getUser),
// validación estricta del payload, upsert con RLS (cada usuario su fila). No
// otorga recompensas ni toca coins/auth: solo persiste la predicción del juego
// de la landing #1 de tráfico (cierra el bucle de conversión del TercerosPicker).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getUserTerceros, saveUserTerceros } from "@/lib/predictions/terceros-store";

const VALID_LETTERS = new Set(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]);
const MAX_PICKS = 8;

function isValidGroups(v: unknown): v is string[] {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_PICKS) return false;
  const seen = new Set<string>();
  for (const x of v) {
    if (typeof x !== "string" || !VALID_LETTERS.has(x) || seen.has(x)) return false;
    seen.add(x);
  }
  return true;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const prediction = await getUserTerceros(user.id);
  return NextResponse.json({ prediction });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { groups?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!isValidGroups(body.groups)) {
    return NextResponse.json(
      { error: "invalid_groups", message: "El pronóstico debe ser de 1 a 8 grupos válidos (A-L) sin repetir." },
      { status: 400 },
    );
  }

  const ok = await saveUserTerceros(user.id, body.groups);
  if (!ok) return NextResponse.json({ error: "save_failed" }, { status: 503 });
  return NextResponse.json({ ok: true, saved_at: new Date().toISOString() });
}

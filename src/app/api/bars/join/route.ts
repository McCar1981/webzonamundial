// src/app/api/bars/join/route.ts
//
// POST /api/bars/join  → une al usuario autenticado a la porra de un bar.
// Body: { slug, qr?, source? }. Idempotente. Devuelve 401 si no hay sesión
// para que el cliente lleve al login (que vuelve aquí tras autenticar).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getBarBySlug, getMainQr, joinBarPorra } from "@/lib/bars/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { slug?: string; qr?: string; source?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.slug) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const bar = await getBarBySlug(body.slug);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });

  // Resolver el QR concreto (si vino) para atribución; si no, el principal.
  let qrSourceId: string | null = null;
  if (body.qr) {
    const main = await getMainQr(bar.id);
    qrSourceId = main && main.code === body.qr ? main.id : null;
  }

  const result = await joinBarPorra(user.id, bar, {
    source: body.source ?? (body.qr ? "qr" : "link"),
    qrSourceId,
  });
  return NextResponse.json(result);
}

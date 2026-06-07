// src/app/api/bars/join/route.ts
//
// POST /api/bars/join  → une al usuario autenticado a la porra de un bar.
// Body: { slug, qr?, source? }. Idempotente. Devuelve 401 si no hay sesión
// para que el cliente lleve al login (que vuelve aquí tras autenticar).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getBarBySlug, getQrSourceByCode, joinBarPorra, barIsLive } from "@/lib/bars/store";

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

  // Solo se puede entrar en porras públicas (publicadas y con plan activo).
  if (!(await barIsLive(bar))) {
    return NextResponse.json({ error: "bar_not_active" }, { status: 403 });
  }

  // Resolver el QR concreto (si vino) contra TODAS las zonas del bar para la
  // atribución. Si el código no existe en este bar, qr_source_id queda en null.
  let qrSourceId: string | null = null;
  if (body.qr) {
    const src = await getQrSourceByCode(bar.id, body.qr);
    qrSourceId = src?.id ?? null;
  }

  const result = await joinBarPorra(user.id, bar, {
    source: body.source ?? (body.qr ? "qr" : "link"),
    qrSourceId,
  });

  // Contexto de bar: al entrar en la porra dejamos una cookie con el slug para
  // que la experiencia de predicciones (/app/*) mantenga la identidad del bar
  // (banner con logo, color y "volver a la porra"), sin dejar de ser ZM.
  const res = NextResponse.json(result);
  res.cookies.set("zm_bar", bar.slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 días
    sameSite: "lax",
  });
  return res;
}

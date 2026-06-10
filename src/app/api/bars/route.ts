// src/app/api/bars/route.ts
//
// GET   /api/bars  → el bar del usuario (dueño), o null.
// POST  /api/bars  → crea el bar del usuario (+ su porra/liga + QR principal).
// PATCH /api/bars  → actualiza campos editables del bar del usuario.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createBar, getBarByOwner, updateBar, barHasActivePlan } from "@/lib/bars/store";
import { isPro } from "@/lib/pro/entitlement";
import { PRO_REQUIRED_CODE, type ProRequiredPayload } from "@/lib/pro/limits";
import { trackLimitHit } from "@/lib/pro/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const bar = await getBarByOwner(user.id);
  return NextResponse.json({ bar });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Crear un bar es feature Pro (unirse a bares sigue libre para todos).
  // Publicarlo, además, exige el plan de bar (PATCH de abajo): Pro desbloquea
  // crear/configurar; el plan B2B, salir al público.
  if (!(await isPro(user.id, user.email))) {
    trackLimitHit("bars_create");
    const payload: ProRequiredPayload = {
      error: "Crear un bar propio es una función del plan Pro.",
      code: PRO_REQUIRED_CODE,
      feature: "bars_create",
    };
    return NextResponse.json(payload, { status: 403 });
  }

  const existing = await getBarByOwner(user.id);
  if (existing) return NextResponse.json({ error: "already_exists", bar: existing }, { status: 409 });

  let body: { name?: string; city?: string; themeId?: string; kind?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.name || !body.name.trim()) return NextResponse.json({ error: "bad_request", message: "name requerido" }, { status: 400 });

  const bar = await createBar(user.id, { name: body.name, city: body.city, themeId: body.themeId, kind: body.kind === "empresa" ? "empresa" : "bar" });
  return NextResponse.json({ ok: true, bar }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let patch: Record<string, unknown>;
  try { patch = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  // Publicar exige plan activo. Se puede configurar gratis, pero no salir al público.
  if (patch.status === "published") {
    const current = await getBarByOwner(user.id);
    if (!current) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });
    if (!(await barHasActivePlan(current.id))) {
      return NextResponse.json(
        { error: "plan_required", message: "Activa tu plan para publicar tu porra." },
        { status: 403 },
      );
    }
  }

  const bar = await updateBar(user.id, patch);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, bar });
}

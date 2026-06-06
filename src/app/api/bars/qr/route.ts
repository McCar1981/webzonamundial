// src/app/api/bars/qr/route.ts
//
// GET    /api/bars/qr        → fuentes QR del bar del usuario.
// POST   /api/bars/qr        → crea un QR de zona { sourceType?, label? }.
//                              Limitado por plan.maxQrSources (multi-QR es de pago).
// DELETE /api/bars/qr?id=…   → elimina un QR de zona (nunca el principal).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getBarByOwner, listQrSources, createQrSource, deleteQrSource, countQrSources } from "@/lib/bars/store";
import { getPlan } from "@/lib/bars/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const bar = await getBarByOwner(user.id);
  if (!bar) return NextResponse.json({ sources: [] });
  const sources = await listQrSources(bar.id);
  return NextResponse.json({ sources });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const bar = await getBarByOwner(user.id);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });

  const plan = getPlan(bar.plan_id);
  const current = await countQrSources(bar.id);
  if (current >= plan.maxQrSources) {
    return NextResponse.json(
      { error: "plan_limit", message: `Tu plan permite ${plan.maxQrSources} QR. Mejora de plan para añadir más zonas.` },
      { status: 403 }
    );
  }

  let body: { sourceType?: string; label?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  const qr = await createQrSource(user.id, bar.id, { sourceType: body.sourceType, label: body.label });
  if (!qr) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  return NextResponse.json({ ok: true, qr }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const bar = await getBarByOwner(user.id);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const ok = await deleteQrSource(user.id, bar.id, id);
  if (!ok) return NextResponse.json({ error: "cannot_delete" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

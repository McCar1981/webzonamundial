// src/app/api/predictions/cosmetics/route.ts
//
// GET  /api/predictions/cosmetics → catálogo + inventario + equipados + monedas.
// POST /api/predictions/cosmetics → { action: "buy" | "equip" | "unequip", ... }.
//   - buy:     { action:"buy",     id }            compra un cosmético.
//   - equip:   { action:"equip",   id }            equipa un cosmético poseído.
//   - unequip: { action:"unequip", kind }          quita el cosmético de un tipo.
// Auth requerida. La compra (sumidero de monedas) se valida en el backend.

import { NextResponse } from "next/server";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { buyCosmetic, equipCosmetic, getCosmeticsState } from "@/lib/predictions/cosmetics-store";
import { cosmeticDef } from "@/lib/predictions/cosmetics";
import type { CosmeticKind } from "@/lib/predictions/cosmetics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUY_ERROR_STATUS: Record<string, number> = {
  cosmetic_not_found: 404,
  level_required: 403,
  already_owned: 409,
  insufficient_coins: 402,
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // FIX 5: inventario/monedas por-usuario → no cachear en el navegador.
  return NextResponse.json(await getCosmeticsState(user.id), { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // FIX 2: rate-limit de escritura (20 acciones/min: buy/equip/unequip).
  const rl = await rateLimitByUser(user.id, "pred:cosmetic", 20, 60);
  if (rl.limited) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: { action?: string; id?: string; kind?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  if (body.action === "buy") {
    if (!body.id) return NextResponse.json({ error: "bad_request", message: "id requerido" }, { status: 400 });
    const result = await buyCosmetic(user.id, body.id);
    if (!result.ok) return NextResponse.json(result, { status: BUY_ERROR_STATUS[result.error ?? ""] ?? 400 });
    return NextResponse.json(result);
  }

  if (body.action === "equip") {
    if (!body.id) return NextResponse.json({ error: "bad_request", message: "id requerido" }, { status: 400 });
    const def = cosmeticDef(body.id);
    if (!def) return NextResponse.json({ error: "cosmetic_not_found" }, { status: 404 });
    const result = await equipCosmetic(user.id, def.kind, body.id);
    if (!result.ok) return NextResponse.json(result, { status: result.error === "not_owned" ? 403 : 400 });
    return NextResponse.json(result);
  }

  if (body.action === "unequip") {
    const kind = body.kind as CosmeticKind | undefined;
    if (!kind) return NextResponse.json({ error: "bad_request", message: "kind requerido" }, { status: 400 });
    const result = await equipCosmetic(user.id, kind, null);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "bad_request", message: "action inválida" }, { status: 400 });
}

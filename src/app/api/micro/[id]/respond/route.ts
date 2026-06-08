// POST /api/micro/[id]/respond
//
// Responder una micro-predicción dentro de su ventana. Body: { option }.
// La validación de ventana/estado y el anti-doble-respuesta viven en el store.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { respondMicro } from "@/lib/micro/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { option?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.option) return NextResponse.json({ error: "missing_option" }, { status: 400 });

  const result = await respondMicro(user.id, params.id, body.option);
  if (!result.ok) {
    const code = result.error === "not_found" ? 404 : result.error === "already_responded" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status: code });
  }
  return NextResponse.json({
    ok: true,
    response: result.response,
    fire_chain_before: result.fireChainBefore,
    fire_multiplier: result.fireMultiplier,
  }, { status: 201 });
}

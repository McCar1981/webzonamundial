// POST /api/stories/[id]/interact
//
// Interactuar con un widget de la Story (encuesta, micro-reto…).
// Body: { widget_id: string, answer: unknown }.

import { NextResponse } from "next/server";
import { safeCurrentUser } from "@/lib/stories/current-user";
import { recordInteraction } from "@/lib/stories/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await safeCurrentUser();
  // Anónimo (o local sin auth): no se persiste la interacción, pero el widget responde.
  if (!user) return NextResponse.json({ ok: true, anonymous: true });

  let body: { widget_id?: string; answer?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.widget_id) {
    return NextResponse.json({ error: "missing_widget_id" }, { status: 400 });
  }

  const result = await recordInteraction(
    user.id,
    params.id,
    body.widget_id,
    body.answer ?? null
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true, first_interaction: result.firstInteraction });
}

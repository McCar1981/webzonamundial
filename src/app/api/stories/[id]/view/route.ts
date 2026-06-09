// POST /api/stories/[id]/view
//
// Registrar la vista de una Story. Body opcional: { completed?: boolean }.
// Idempotente: el contador solo sube en la primera vista del usuario.

import { NextResponse } from "next/server";
import { safeCurrentUser } from "@/lib/stories/current-user";
import { recordView } from "@/lib/stories/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await safeCurrentUser();
  // Anónimo (o local sin auth): no se trackea, pero no rompemos el visor.
  if (!user) return NextResponse.json({ ok: true, anonymous: true });

  let completed = false;
  try {
    const body = (await req.json()) as { completed?: boolean };
    completed = Boolean(body?.completed);
  } catch {
    // body vacío → vista simple sin completar
  }

  const result = await recordView(user.id, params.id, completed);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    first_view: result.firstView,
    completed: result.completed,
  });
}

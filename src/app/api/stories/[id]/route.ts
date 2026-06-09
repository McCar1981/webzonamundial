// GET /api/stories/[id]
//
// Detalle de una Story. Con sesión incluye el flag `seen` del usuario.

import { NextResponse } from "next/server";
import { safeCurrentUser } from "@/lib/stories/current-user";
import { getStory, deleteStory } from "@/lib/stories/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await safeCurrentUser();
  const story = await getStory(params.id, user?.id ?? null);
  if (!story) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ story });
}

// DELETE /api/stories/[id] — eliminar una Story propia.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await safeCurrentUser();
  const userId = user?.id ?? "demo-user";
  const result = await deleteStory(userId, params.id);
  if (!result.ok) return NextResponse.json({ error: "not_found_or_forbidden" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

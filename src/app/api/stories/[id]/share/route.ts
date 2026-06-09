// POST /api/stories/[id]/share
//
// Registra que el usuario compartió la Story a una red. Body: { to: string }
// (instagram | whatsapp | twitter | tiktok | feed). Sube share_count.

import { NextResponse } from "next/server";
import { safeCurrentUser } from "@/lib/stories/current-user";
import { recordShare } from "@/lib/stories/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await safeCurrentUser();
  if (!user) return NextResponse.json({ ok: true, anonymous: true });

  let to = "feed";
  try {
    const body = (await req.json()) as { to?: string };
    if (body?.to) to = String(body.to).slice(0, 50);
  } catch {
    // sin body → feed por defecto
  }

  const result = await recordShare(user.id, params.id, to);
  if (!result.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, shared_to: to });
}

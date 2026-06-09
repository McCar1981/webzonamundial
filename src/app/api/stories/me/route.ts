// GET /api/stories/me
//
// Stories publicadas por el usuario (las suyas).

import { NextResponse } from "next/server";
import { safeCurrentUser } from "@/lib/stories/current-user";
import { getMyStories } from "@/lib/stories/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await safeCurrentUser();
  const userId = user?.id ?? "demo-user";
  const stories = await getMyStories(userId);
  return NextResponse.json({ stories });
}

/**
 * Admin endpoint: wipes the KV ingest store.
 * Useful when filter rules change and we need to regenerate all autopublished
 * articles from scratch. Protected by CRON_SECRET.
 *
 * Usage:
 *   GET /api/cron/reset-store
 *   Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { revalidatePath } from "next/cache";

const KV_KEY = "noticias:ingested-store";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // Hard delete the KV key entirely + write back an empty store as a fresh
  // state. Some SDK paths cache GET results so a plain SET may not invalidate
  // them; DEL is unambiguous.
  let deleted = 0;
  let beforeCount: number | null = null;
  try {
    const before = await kv.get<{ drafts?: unknown[] }>(KV_KEY);
    beforeCount = Array.isArray(before?.drafts) ? before!.drafts!.length : 0;
    deleted = await kv.del(KV_KEY);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
  // Write a fresh empty store so future reads work without a fallback path.
  await kv.set(KV_KEY, {
    generatedAt: new Date().toISOString(),
    drafts: [],
  });

  // Force-invalidate every news page so visitors see the empty state
  // immediately instead of stale cached HTML.
  try {
    revalidatePath("/noticias");
    revalidatePath("/noticias/[slug]", "page");
    revalidatePath("/noticias/rss.xml");
    revalidatePath("/sitemap.xml");
  } catch {}

  return NextResponse.json({
    ok: true,
    deleted,
    beforeCount,
    message: "Store wiped (DEL + SET). Static articles only until next ingest.",
  });
}

export const dynamic = "force-dynamic";

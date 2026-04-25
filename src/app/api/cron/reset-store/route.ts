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

const KV_KEYS = [
  "noticias:ingested-store",
  "noticias:ingested-store:v2",
  "noticias:ingested-store:v3",
];

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // Hard delete every known KV key (current + legacy) so no stale data
  // can leak through cache layers.
  const deletedDetails: Record<string, number> = {};
  let totalDeleted = 0;
  for (const key of KV_KEYS) {
    try {
      const d = await kv.del(key);
      deletedDetails[key] = d;
      totalDeleted += d;
    } catch (err) {
      deletedDetails[key] = -1;
      console.error("[reset] del failed for", key, (err as Error).message);
    }
  }

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
    totalDeleted,
    deletedDetails,
    message: "All KV keys wiped. Static articles only until next ingest.",
  });
}

export const dynamic = "force-dynamic";

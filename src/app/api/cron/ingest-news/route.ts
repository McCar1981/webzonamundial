/**
 * Cron endpoint: pulls fresh World Cup news from GNews, deduplicates,
 * builds drafts and appends them to data/noticias-ingested.json.
 *
 * On Vercel Cron this is invoked with `Authorization: Bearer ${CRON_SECRET}`.
 * In dev / locally you can hit it manually with the same header.
 *
 * Drafts are NEVER auto-published — they sit in the JSON file with
 * `status: "draft"` until a human (or a future LLM step) reviews them
 * and either rewrites the body or moves them to the static NOTICIAS array.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ingestNews } from "@/lib/noticias-ingest";
import { applyRewrite } from "@/lib/noticias-rewriter";
import { WORLD_CUP_QUERIES } from "@/lib/gnews";
import { readIngestStore, writeIngestStore, getStorePath } from "@/lib/noticias-store";

export async function GET(req: Request) {
  // Auth: Vercel Cron sends Authorization: Bearer ${CRON_SECRET}
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const store = await readIngestStore();
  const knownHashes = new Set(store.drafts.map((d) => d.sourceUrlHash));

  // Vercel Hobby plan caps serverless functions at 60s. Each Claude Haiku
  // rewrite takes 2-4s, so we can safely do ~10 rewrites + the GNews fetches
  // within the budget. The cron runs hourly, so over 24h we accumulate
  // 240 published articles/day rotating through all topics.
  const url = new URL(req.url);
  const skipRewrite = url.searchParams.get("rewrite") === "0";
  const rewriteLimit = parseInt(
    url.searchParams.get("rewriteLimit") ||
      process.env.NEWS_REWRITE_LIMIT ||
      "8",
    10,
  );
  // Pick a small subset of queries per tick (rotate by hour). Full coverage
  // is achieved over 24h since we have 15 queries × ~10 results = 150 articles
  // per full rotation.
  const ALL_QUERIES = Object.keys(WORLD_CUP_QUERIES) as (keyof typeof WORLD_CUP_QUERIES)[];
  const QUERIES_PER_TICK = parseInt(process.env.NEWS_QUERIES_PER_TICK || "4", 10);
  const hourSeed = new Date().getUTCHours();
  const queries: (keyof typeof WORLD_CUP_QUERIES)[] = [];
  for (let i = 0; i < QUERIES_PER_TICK; i++) {
    queries.push(ALL_QUERIES[(hourSeed + i) % ALL_QUERIES.length]);
  }

  const result = await ingestNews({
    knownHashes,
    queries,
    maxPerQuery: 10,
  });

  const rewriteEnabled = !!process.env.ANTHROPIC_API_KEY && !skipRewrite;

  let rewritten = 0;
  let rewriteFailed = 0;
  if (rewriteEnabled) {
    const cap = rewriteLimit > 0 ? Math.min(rewriteLimit, result.drafts.length) : result.drafts.length;
    // Process sequentially to respect rate limits + minimize cost.
    for (let i = 0; i < cap; i++) {
      try {
        result.drafts[i] = await applyRewrite(result.drafts[i]);
        if (result.drafts[i].status === "published") rewritten += 1;
      } catch (err) {
        rewriteFailed += 1;
        console.error("[cron] rewrite failed", (err as Error).message);
      }
    }
  }

  store.drafts.push(...result.drafts);
  // Keep only the last 300 drafts so the file does not balloon
  if (store.drafts.length > 300) {
    store.drafts = store.drafts.slice(-300);
  }
  store.generatedAt = new Date().toISOString();
  await writeIngestStore(store);

  // Force ISR cache invalidation so new articles appear immediately on the
  // public site (next request will re-render hub + every article page).
  try {
    revalidatePath("/noticias");
    revalidatePath("/noticias/[slug]", "page");
    revalidatePath("/noticias/rss.xml");
    revalidatePath("/sitemap.xml");
  } catch (err) {
    console.error("[cron] revalidate failed", (err as Error).message);
  }

  const published = store.drafts.filter((d) => d.status === "published").length;

  return NextResponse.json({
    ok: true,
    queries: queries.length,
    fetched: result.fetched,
    new: result.drafts.length,
    duplicates: result.duplicates,
    rewritten,
    rewriteFailed,
    rewriteEnabled,
    errors: result.errors,
    totalStored: store.drafts.length,
    publishedCount: published,
    storePath: getStorePath(),
  });
}

// Force dynamic so Vercel Cron always hits a fresh execution
export const dynamic = "force-dynamic";
// Allow up to 5 min for fetch + rewrite (Vercel Pro plan; on Hobby cap is 60s)
export const maxDuration = 300;

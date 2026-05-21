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
import { broadcastPush } from "@/lib/push-notifications";
import type { DraftNoticia } from "@/lib/noticias-ingest";

export async function GET(req: Request) {
  // Auth: Vercel Cron sends Authorization: Bearer ${CRON_SECRET}
  // También aceptamos ?secret=XXX como query param para poder
  // invocar el cron manualmente desde el navegador (debug). El
  // secret nunca se logea ni se devuelve en la respuesta.
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerOk = auth === `Bearer ${expected}`;
    const querySecret = new URL(req.url).searchParams.get("secret");
    const queryOk = querySecret === expected;
    if (!headerOk && !queryOk) {
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
      "3", // articles are now longer (600-800 words) so each rewrite takes ~10s
    10,
  );
  // Pick a small subset of queries per tick (rotate by hour). Full coverage
  // is achieved over 24h since we have 15 queries × ~10 results = 150 articles
  // per full rotation.
  const ALL_QUERIES = Object.keys(WORLD_CUP_QUERIES) as (keyof typeof WORLD_CUP_QUERIES)[];
  // Antes 3 queries/tick = 72 req/día de GNews (free tier es 100/día).
  // Subido a 4 = 96 req/día, justo dentro del límite con 4 reqs de margen
  // de seguridad. +33% más cobertura → más probabilidad de noticias frescas
  // en cada tick → más push reales para usuarios.
  // Si se sobre-pasa el límite por error (>100), GNews devuelve 429 y el
  // cron registra el error en `errors[]` pero no rompe nada.
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
  let abortedByTimeout = false;
  let pendingDraftsRetried = 0;
  // Tracking de drafts que pasan a "published" en este tick.
  // Los usamos para disparar web push tras la revalidación.
  const newlyPublished: DraftNoticia[] = [];
  // Soft deadline: stop the rewrite loop ~50s into the request to leave
  // ~10s of headroom under Vercel Hobby's 60s function cap. Any drafts not
  // rewritten remain status: "draft" and will be picked up on the next tick.
  const deadlineMs = Date.now() + 50_000;

  // FASE 1: Reescribir drafts NUEVOS (recién ingestados de GNews).
  if (rewriteEnabled) {
    const cap = rewriteLimit > 0 ? Math.min(rewriteLimit, result.drafts.length) : result.drafts.length;
    for (let i = 0; i < cap; i++) {
      if (Date.now() > deadlineMs) {
        abortedByTimeout = true;
        break;
      }
      try {
        result.drafts[i] = await applyRewrite(result.drafts[i]);
        if (result.drafts[i].status === "published") {
          rewritten += 1;
          newlyPublished.push(result.drafts[i]);
        }
      } catch (err) {
        rewriteFailed += 1;
        console.error("[cron] rewrite failed (new)", (err as Error).message);
      }
    }
  }

  store.drafts.push(...result.drafts);

  // FASE 2: Reescribir drafts ANTIGUOS que quedaron en status:"draft"
  // (p.ej. por fallos transitorios de Claude). Sin esto, los drafts
  // huérfanos nunca se publican. Tomamos los más recientes primero
  // para que la página de noticias quede fresca.
  if (rewriteEnabled && !abortedByTimeout) {
    const pendingDrafts = store.drafts.filter((d) => d.status === "draft");
    // Iteramos sobre los más recientes (final del array, recién pusheados
    // al inicio + drafts pendientes viejos).
    const slotsLeft =
      rewriteLimit > 0 ? Math.max(0, rewriteLimit - rewritten - rewriteFailed) : pendingDrafts.length;
    const retryCap = Math.min(slotsLeft, pendingDrafts.length);
    // Los más nuevos primero (mayor probabilidad de relevancia).
    pendingDrafts.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    for (let i = 0; i < retryCap; i++) {
      if (Date.now() > deadlineMs) {
        abortedByTimeout = true;
        break;
      }
      try {
        const updated = await applyRewrite(pendingDrafts[i]);
        // Reemplazar el draft viejo en store.drafts (match por sourceUrlHash).
        const idx = store.drafts.findIndex((d) => d.sourceUrlHash === pendingDrafts[i].sourceUrlHash);
        if (idx >= 0) {
          // Si se publica AHORA, refrescar ingestedAt para que aparezca arriba
          // del feed (tiebreaker cuando comparte `date` con otras). Sin esto,
          // los drafts viejos retried mantenían su ingestedAt original y se
          // quedaban hundidos detrás de noticias estáticas del mismo día.
          if (updated.status === "published") {
            updated.ingestedAt = new Date().toISOString();
          }
          store.drafts[idx] = updated;
          if (updated.status === "published") {
            rewritten += 1;
            pendingDraftsRetried += 1;
            newlyPublished.push(updated);
          }
        }
      } catch (err) {
        rewriteFailed += 1;
        console.error("[cron] rewrite failed (retry)", (err as Error).message);
      }
    }
  }
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

  // Broadcast Web Push: enviar notificación a todos los suscriptores
  // por cada noticia publicada en este tick.
  // - Si publicamos varias en el mismo tick, mandamos una sola push
  //   (la más reciente) para no abrumar al user.
  // - Si no hay nuevas o no hay VAPID configurado, no hace nada.
  let pushTotal = 0;
  let pushSent = 0;
  let pushGone = 0;
  let pushFailed = 0;
  if (newlyPublished.length > 0) {
    // Tomamos la última publicada (la más relevante del tick).
    const featured = newlyPublished[newlyPublished.length - 1];
    try {
      const result = await broadcastPush({
        kind: "news",
        payload: {
          title:
            newlyPublished.length === 1
              ? "📰 Nueva noticia en ZonaMundial"
              : `📰 ${newlyPublished.length} nuevas noticias`,
          body: featured.title,
          url: `/noticias/${featured.slug}`,
          tag: "news",
          icon: "/img/email/logo-zonamundial.png",
          image: featured.realImage ?? undefined,
        },
      });
      pushTotal = result.total;
      pushSent = result.sent;
      pushGone = result.gone;
      pushFailed = result.failed;
    } catch (err) {
      console.error("[cron] push broadcast failed", (err as Error).message);
    }
  }

  const published = store.drafts.filter((d) => d.status === "published").length;

  return NextResponse.json({
    ok: true,
    queries: queries.length,
    queriesUsed: queries,
    fetched: result.fetched,
    new: result.drafts.length,
    duplicates: result.duplicates,
    rewritten,
    pendingDraftsRetried,
    rewriteFailed,
    rewriteEnabled,
    abortedByTimeout,
    errors: result.errors,
    totalStored: store.drafts.length,
    publishedCount: published,
    push: {
      newlyPublished: newlyPublished.length,
      total: pushTotal,
      sent: pushSent,
      gone: pushGone,
      failed: pushFailed,
    },
    storePath: getStorePath(),
  });
}

// Force dynamic so Vercel Cron always hits a fresh execution
export const dynamic = "force-dynamic";
// Allow up to 5 min for fetch + rewrite (Vercel Pro plan; on Hobby cap is 60s)
export const maxDuration = 300;

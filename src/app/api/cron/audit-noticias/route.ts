/**
 * Cron/admin endpoint: audita las noticias YA publicadas con el MISMO crítico
 * de calidad (Fase 1) y despublica las que no superan el listón.
 *
 * - Las que NO pasan: status → "review" (salen del sitio, sitemap, news-sitemap
 *   y RSS automáticamente, porque todos filtran status === "published").
 *   NO se borran: el dato se conserva, solo se retira de la vista pública.
 * - Idempotente: re-ejecutarlo no cambia nada de lo que ya pasa el filtro.
 *
 * Uso:
 *   GET /api/cron/audit-noticias?secret=XXX            → audita y escribe
 *   GET /api/cron/audit-noticias?secret=XXX&dryRun=1   → solo reporta, no escribe
 *   GET /api/cron/audit-noticias?secret=XXX&limit=20   → procesa como máx N
 *
 * Auth: Authorization: Bearer ${CRON_SECRET} o ?secret=XXX (igual que ingest).
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readIngestStore, writeIngestStore } from "@/lib/noticias-store";
import { evaluateArticle, shouldPublish } from "@/lib/noticias-critic";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerOk = auth === `Bearer ${expected}`;
    const querySecret = new URL(req.url).searchParams.get("secret");
    if (!headerOk && querySecret !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const limit = parseInt(url.searchParams.get("limit") || "0", 10); // 0 = sin límite

  const store = await readIngestStore();
  const published = store.drafts.filter((d) => d.status === "published");
  const allTitles = published.map((d) => d.title);

  // Soft deadline para no exceder el límite de la función serverless.
  const deadlineMs = Date.now() + 280_000;

  let evaluated = 0;
  let kept = 0;
  let demoted = 0;
  let errored = 0;
  const demotedList: { slug: string; title: string; motivos: string }[] = [];
  const cap = limit > 0 ? Math.min(limit, published.length) : published.length;

  for (let i = 0; i < cap; i++) {
    if (Date.now() > deadlineMs) break;
    const d = published[i];
    try {
      const verdict = await evaluateArticle({
        title: d.title,
        body: d.body,
        // El texto fuente original ya no existe tras la reescritura; el crítico
        // juzga el artículo publicado por sus propios méritos. Pasamos los demás
        // títulos para detectar duplicados/canibalización.
        recentTitles: allTitles.filter((t) => t !== d.title),
      });
      evaluated += 1;
      const pass = shouldPublish(verdict);
      // Localizar el draft real en el store (no la copia filtrada).
      const idx = store.drafts.findIndex((x) => x.sourceUrlHash === d.sourceUrlHash);
      if (idx >= 0) {
        store.drafts[idx].critic = verdict ?? undefined;
        if (!pass) {
          demoted += 1;
          demotedList.push({
            slug: d.slug,
            title: d.title,
            motivos: verdict?.motivos ?? "sin veredicto del crítico",
          });
          if (!dryRun) store.drafts[idx].status = "review";
        } else {
          kept += 1;
        }
      }
    } catch (err) {
      errored += 1;
      console.error("[audit] error", d.slug, (err as Error).message);
    }
  }

  if (!dryRun && demoted > 0) {
    await writeIngestStore(store);
    try {
      revalidatePath("/noticias");
      revalidatePath("/noticias/[slug]", "page");
      revalidatePath("/noticias/rss.xml");
      revalidatePath("/news-sitemap.xml");
      revalidatePath("/sitemap.xml");
    } catch (err) {
      console.error("[audit] revalidate failed", (err as Error).message);
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    publishedBefore: published.length,
    evaluated,
    kept,
    demoted,
    errored,
    publishedAfter: published.length - (dryRun ? 0 : demoted),
    demotedList,
  });
}

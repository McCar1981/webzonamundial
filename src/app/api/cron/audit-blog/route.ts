/**
 * Cron/admin endpoint: audita los posts de blog AUTO-GENERADOS (los que viven
 * en KV) con el MISMO crítico de calidad (Fase 1) y marca noindex los que no
 * superan el listón.
 *
 * - Los que NO pasan: noindex = true. Salen del sitemap y se sirven con
 *   robots noindex,follow. NO se borran ni se ocultan: siguen accesibles por
 *   URL; solo se retiran de la indexación de Google.
 * - Los que pasan: noindex = false (idempotente; re-ejecutarlo no cambia nada).
 * - Los posts editoriales ESTÁTICOS (src/content/blog/*.ts) NO se tocan: son
 *   piezas curadas por humanos y no son mutables en runtime.
 *
 * Uso:
 *   GET /api/cron/audit-blog?secret=XXX            → audita y escribe
 *   GET /api/cron/audit-blog?secret=XXX&dryRun=1   → solo reporta, no escribe
 *   GET /api/cron/audit-blog?secret=XXX&limit=20   → procesa como máx N
 *
 * Auth: Authorization: Bearer ${CRON_SECRET} o ?secret=XXX.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readAutoPosts, writeAutoPosts } from "@/lib/blog/store";
import { readEvergreenPosts, writeEvergreenPosts } from "@/lib/blog/evergreen-store";
import { evaluateBlogPost, shouldPublish } from "@/lib/blog/critic-adapter";

export const runtime = "nodejs";
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

  const autoPosts = await readAutoPosts();
  const evergreenPosts = await readEvergreenPosts();
  // Auditamos ambos stores con el MISMO crítico. Todos los títulos sirven para
  // detectar duplicados/canibalización entre piezas.
  const allTitles = [...autoPosts, ...evergreenPosts].map((p) => p.title);

  // Soft deadline para no exceder el límite de la función serverless.
  const deadlineMs = Date.now() + 280_000;

  let evaluated = 0;
  let kept = 0;
  let demoted = 0;
  let errored = 0;
  const demotedList: { slug: string; title: string; motivos: string }[] = [];

  // Lista combinada apuntando a su store de origen para escribir de vuelta.
  const items = [
    ...autoPosts.map((p, idx) => ({ store: "auto" as const, idx, p })),
    ...evergreenPosts.map((p, idx) => ({ store: "evergreen" as const, idx, p })),
  ];
  const cap = limit > 0 ? Math.min(limit, items.length) : items.length;

  for (let i = 0; i < cap; i++) {
    if (Date.now() > deadlineMs) break;
    const { store, idx, p } = items[i];
    try {
      const verdict = await evaluateBlogPost({
        title: p.title,
        body: p.body,
        faq: p.faq,
        // El blog es contenido propio (no hay fuente externa): el crítico lo
        // juzga por sus méritos. Pasamos los demás títulos para detectar
        // duplicados/canibalización.
        recentTitles: allTitles.filter((t) => t !== p.title),
      });
      evaluated += 1;
      const pass = shouldPublish(verdict);
      const target = store === "auto" ? autoPosts : evergreenPosts;
      if (!pass) {
        demoted += 1;
        demotedList.push({
          slug: p.slug,
          title: p.title,
          motivos: verdict?.motivos ?? "sin veredicto del crítico",
        });
        if (!dryRun) target[idx] = { ...p, noindex: true };
      } else {
        kept += 1;
        // Idempotencia: si antes estaba noindex y ahora pasa, lo reindexamos.
        if (!dryRun && p.noindex) target[idx] = { ...p, noindex: false };
      }
    } catch (err) {
      errored += 1;
      console.error("[audit-blog] error", p.slug, (err as Error).message);
    }
  }

  if (!dryRun && evaluated > 0) {
    await Promise.all([
      writeAutoPosts(autoPosts),
      writeEvergreenPosts(evergreenPosts),
    ]);
    try {
      revalidatePath("/blog");
      revalidatePath("/blog/[slug]", "page");
      revalidatePath("/sitemap.xml");
    } catch (err) {
      console.error("[audit-blog] revalidate failed", (err as Error).message);
    }
  }

  const allPosts = [...autoPosts, ...evergreenPosts];
  return NextResponse.json({
    ok: true,
    dryRun,
    autoPostsBefore: autoPosts.length,
    evergreenPostsBefore: evergreenPosts.length,
    evaluated,
    kept,
    demoted,
    errored,
    indexableAfter: allPosts.length - allPosts.filter((p) => p.noindex).length,
    demotedList,
  });
}

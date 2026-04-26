/**
 * Manual rewrite test endpoint.
 * Bypasses GNews entirely. Lets you POST a "fake" article and validates
 * the Claude rewrite + KV publish + revalidate pipeline end-to-end.
 *
 * Useful when:
 *   - GNews quota is exhausted but you want to validate the pipeline
 *   - You want to test how the rewriter handles a specific input
 *   - You want to seed the live site with a curated article
 *
 * Usage (GET, all params via query string for simplicity):
 *
 *   /api/cron/test-rewrite?title=...&description=...&source=...&img=...
 *
 * Auth: Bearer ${CRON_SECRET}
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { applyRewrite } from "@/lib/noticias-rewriter";
import { buildDraftFromGNews } from "@/lib/noticias-ingest";
import { readIngestStore, writeIngestStore } from "@/lib/noticias-store";
import type { GNewsArticle } from "@/lib/gnews";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const sample = url.searchParams.get("sample") === "1";

  // Default sample article for fast smoke test (sample=1)
  const fake: GNewsArticle = sample
    ? {
        title:
          "Mbappé y Francia: el nuevo capitán quiere conquistar el Mundial 2026",
        description:
          "Kylian Mbappé asumirá el liderazgo de la selección francesa en el Mundial 2026 con la responsabilidad de ganar el torneo por tercera vez en la historia del país.",
        content:
          "Kylian Mbappé llega al Mundial 2026 con un nuevo rol: capitán y referente absoluto de Francia tras la era Deschamps. El delantero del Real Madrid acumula más de 50 goles con la selección, y este será su tercer Mundial. Francia llegó a la final en 2022 y ganó el título en 2018. La presión es máxima. La FFF presentó la lista de 26 jugadores el 4 de junio en Saint-Denis.",
        url: `https://example.com/test-${Date.now()}`,
        image:
          "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80&auto=format&fit=crop",
        publishedAt: new Date().toISOString(),
        source: { name: "Redacción ZonaMundial (test)", url: "https://zonamundial.app" },
      }
    : {
        title: url.searchParams.get("title") || "Sin título",
        description: url.searchParams.get("description") || "",
        content: url.searchParams.get("content") || url.searchParams.get("description") || "",
        url: url.searchParams.get("link") || `https://example.com/manual-${Date.now()}`,
        image:
          url.searchParams.get("img") ||
          "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80&auto=format&fit=crop",
        publishedAt: new Date().toISOString(),
        source: {
          name: url.searchParams.get("source") || "Manual",
          url: "https://zonamundial.app",
        },
      };

  if (!fake.title || fake.title === "Sin título") {
    return NextResponse.json(
      { error: "missing 'title' or use ?sample=1" },
      { status: 400 },
    );
  }

  // Build draft (same path as the real ingest)
  const draft = buildDraftFromGNews(fake, 0);

  // Rewrite via Claude
  const rewritten = await applyRewrite(draft);

  if (rewritten.status !== "published") {
    return NextResponse.json({
      ok: false,
      stage: "rewrite",
      message: "Rewrite failed validation (too short or LLM error). Article NOT published.",
      draft: rewritten,
    });
  }

  // Persist to KV
  const store = await readIngestStore();
  store.drafts.push(rewritten);
  store.generatedAt = new Date().toISOString();
  await writeIngestStore(store);

  // Refresh public site
  try {
    revalidatePath("/noticias");
    revalidatePath(`/noticias/${rewritten.slug}`);
    revalidatePath("/noticias/rss.xml");
    revalidatePath("/sitemap.xml");
  } catch {}

  return NextResponse.json({
    ok: true,
    slug: rewritten.slug,
    title: rewritten.title,
    wordCount: rewritten.body
      .filter((b) => b.type === "p" || b.type === "h2" || b.type === "h3")
      .reduce((sum, b) => sum + ((b as { text: string }).text || "").split(/\s+/).length, 0),
    blocks: rewritten.body.length,
    url: `https://webzonamundial-red.vercel.app/noticias/${rewritten.slug}`,
  });
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

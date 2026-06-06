// GET /api/cron/backfill-blog-images
//
// Asigna una imagen RELACIONADA (Wikimedia Commons, con crédito) a los posts
// del blog que aún tienen el placeholder genérico gris. Recorre tanto los posts
// auto-generados (store.ts) como los perennes/Track B (evergreen-store.ts) que
// ya viven en KV y los reescribe en sitio.
//
// Es la pieza que arregla el "muro de tarjetas grises" YA publicado: el cambio
// en el generador solo afecta a los posts NUEVOS; esto repara los existentes.
//
// Auth: Authorization: Bearer ${CRON_SECRET} o ?secret=...
// Params:
//   ?limit=N   máximo de posts a procesar en esta corrida (default 60).
//   ?dry=1     solo informa qué haría, sin escribir en KV.
//   ?force=1   REPROCESA todos los posts (no solo los del placeholder): sirve
//              para CORREGIR imágenes ya asignadas que eran de otro país.
//
// Idempotente sin force: salta los posts que ya tienen una imagen real. Con
// force=1 re-elige imagen para TODOS (vuelve a correr el picker corregido).

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readAutoPosts, writeAutoPosts } from "@/lib/blog/store";
import { readEvergreenPosts, writeEvergreenPosts } from "@/lib/blog/evergreen-store";
import { pickRelatedImage, findRelatedImage } from "@/lib/blog/image-picker";
import type { BlogPost } from "@/lib/blog/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PLACEHOLDER = "/img/blog/placeholder-zm.jpg";

function needsImage(p: BlogPost): boolean {
  return !p.ogImage || p.ogImage === PLACEHOLDER;
}

/** Procesa los posts que necesitan imagen. Devuelve el array (mismas
 * referencias, mutado en sitio) y cuántos se rellenaron. */
async function fillImages(
  posts: BlogPost[],
  budget: { remaining: number },
  dry: boolean,
  used: Set<string>,
  force: boolean,
): Promise<{ filled: number; details: Array<{ slug: string; src: string }> }> {
  const targets = posts.filter((p) => force || needsImage(p));
  let filled = 0;
  const details: Array<{ slug: string; src: string }> = [];

  // Secuencial a propósito: garantiza imágenes DISTINTAS por post (cada elección
  // se añade a `used` antes de la siguiente) y no satura la API de Commons.
  for (const post of targets) {
    if (budget.remaining <= 0) break;
    budget.remaining -= 1;
    const picked = await pickRelatedImage({
      title: post.title,
      keywords: post.keywords ?? [],
      tags: post.tags ?? [],
      category: post.category,
      exclude: used,
    });
    if (picked) {
      used.add(picked.src);
      if (!dry) {
        post.ogImage = picked.src;
        post.ogImageCredit = picked.credit;
      }
      filled += 1;
      details.push({ slug: post.slug, src: picked.src });
    }
  }

  return { filled, details };
}

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const querySecret = new URL(req.url).searchParams.get("secret");
    if (auth !== `Bearer ${expected}` && querySecret !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "60", 10));
  const dry = url.searchParams.get("dry") === "1";
  const probe = url.searchParams.get("probe") === "1";
  const force = url.searchParams.get("force") === "1";
  const budget = { remaining: limit };

  const [auto, evergreen] = await Promise.all([
    readAutoPosts(),
    readEvergreenPosts(),
  ]);

  // Modo diagnóstico: corre el picker sobre los primeros posts que necesitan
  // imagen y devuelve POR QUÉ no se elige (status HTTP, nº de páginas,
  // candidatos, rechazos por filtro). No escribe nada.
  if (probe) {
    const targets = [...auto, ...evergreen]
      .filter((p) => force || needsImage(p))
      .slice(0, 5);
    const diagnostics = await Promise.all(
      targets.map(async (p) => ({
        slug: p.slug,
        category: p.category,
        keywords: p.keywords,
        tags: p.tags,
        diag: await findRelatedImage({
          title: p.title,
          keywords: p.keywords ?? [],
          tags: p.tags ?? [],
          category: p.category,
        }),
      })),
    );
    return NextResponse.json({ ok: true, probe: true, diagnostics });
  }

  const autoNeeded = auto.filter((p) => force || needsImage(p)).length;
  const evergreenNeeded = evergreen.filter((p) => force || needsImage(p)).length;

  // Conjunto compartido de imágenes ya usadas para que cada entrada reciba una
  // foto DISTINTA. En force=1 NO sembramos las actuales: las vamos a reemplazar.
  const used = new Set<string>();
  if (!force) {
    for (const p of [...auto, ...evergreen]) {
      if (!needsImage(p) && p.ogImage) used.add(p.ogImage);
    }
  }

  const autoResult = await fillImages(auto, budget, dry, used, force);
  const evergreenResult = await fillImages(evergreen, budget, dry, used, force);

  let wroteAuto = false;
  let wroteEvergreen = false;
  if (!dry && autoResult.filled > 0) {
    wroteAuto = await writeAutoPosts(auto);
  }
  if (!dry && evergreenResult.filled > 0) {
    wroteEvergreen = await writeEvergreenPosts(evergreen);
  }

  if (!dry && (wroteAuto || wroteEvergreen)) {
    try {
      revalidatePath("/blog");
      revalidatePath("/blog/[slug]", "page");
    } catch (err) {
      console.error("[backfill-blog-images] revalidate failed:", (err as Error).message);
    }
  }

  return NextResponse.json({
    ok: true,
    dry,
    force,
    limit,
    auto: {
      total: auto.length,
      needed: autoNeeded,
      filled: autoResult.filled,
      wrote: wroteAuto,
    },
    evergreen: {
      total: evergreen.length,
      needed: evergreenNeeded,
      filled: evergreenResult.filled,
      wrote: wroteEvergreen,
    },
    remainingBudget: budget.remaining,
    details: [...autoResult.details, ...evergreenResult.details].slice(0, 60),
  });
}

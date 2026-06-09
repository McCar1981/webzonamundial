// GET /api/cron/generate-evergreen
//
// Track B — Genera (o regenera) las piezas PERENNES del blog a partir de un
// DOSSIER de datos verificados: 12 previas de grupo (A-L) + 6 guías de
// selección (GUIDE_SLUGS). El flujo por pieza es:
//   dossier (solo hechos) → buildEvergreenPost (redactor) → crítico-gate →
//   upsert en KV (key separada `blog:evergreen:v1`, sin rotación FIFO).
//
// El crítico es el MISMO que filtra noticias y blog. El dossier se pasa como
// sourceText, así la precisión factual se verifica contra los datos reales.
// Solo se persisten las piezas que SUPERAN el listón (sin paja, alto valor).
//
// Parámetros:
//   ?secret=XXX                 → auth (o Authorization: Bearer ${CRON_SECRET})
//   ?dryRun=1                   → genera + evalúa pero NO persiste
//   ?only=group:A | team:espana → genera una sola pieza (debug)
//   ?limit=N                    → procesa como máx N piezas
//
// Devuelve un detalle por pieza con el veredicto del crítico.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireCron } from "@/lib/auth-helpers";
import { GRUPOS } from "@/data/selecciones";
import {
  buildGroupDossier,
  buildTeamDossier,
  GUIDE_SLUGS,
} from "@/lib/evergreen/dossier";
import { buildEvergreenPost } from "@/lib/evergreen/generator";
import { evaluateBlogPost, shouldPublish } from "@/lib/blog/critic-adapter";
import { upsertEvergreenPost, readEvergreenPosts } from "@/lib/blog/evergreen-store";
import type { BlogCategory } from "@/lib/blog/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Job =
  | { kind: "group"; key: string; category: BlogCategory }
  | { kind: "team"; key: string; category: BlogCategory };

function allJobs(): Job[] {
  const groups: Job[] = Object.keys(GRUPOS).map((letra) => ({
    kind: "group",
    key: letra,
    category: "analisis",
  }));
  const teams: Job[] = GUIDE_SLUGS.map((slug) => ({
    kind: "team",
    key: slug,
    category: "selecciones",
  }));
  return [...groups, ...teams];
}

function selectJobs(only: string | null): Job[] {
  const all = allJobs();
  if (!only) return all;
  const [kind, key] = only.split(":");
  if (kind === "group") {
    return all.filter((j) => j.kind === "group" && j.key === key.toUpperCase());
  }
  if (kind === "team") {
    return all.filter((j) => j.kind === "team" && j.key === key);
  }
  return [];
}

export async function GET(req: NextRequest) {
  const denied = requireCron(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const only = url.searchParams.get("only");
  const limit = parseInt(url.searchParams.get("limit") || "0", 10);

  const jobs = selectJobs(only);
  const cap = limit > 0 ? Math.min(limit, jobs.length) : jobs.length;

  // Títulos perennes ya existentes → el crítico detecta canibalización.
  const existing = await readEvergreenPosts();
  const existingTitles = existing.map((p) => p.title);

  // Soft deadline para no exceder el límite serverless.
  const deadlineMs = Date.now() + 280_000;

  let generated = 0;
  let published = 0;
  let rejected = 0;
  let errored = 0;
  const results: Array<{
    job: string;
    slug?: string;
    title?: string;
    status: "published" | "rejected" | "generation_failed" | "error";
    verdict?: unknown;
    error?: string;
  }> = [];

  for (let i = 0; i < cap; i++) {
    if (Date.now() > deadlineMs) break;
    const job = jobs[i];
    const jobLabel = `${job.kind}:${job.key}`;
    try {
      const dossier =
        job.kind === "group"
          ? await buildGroupDossier(job.key)
          : await buildTeamDossier(job.key);

      const post = await buildEvergreenPost({
        dossier,
        category: job.category,
      });
      if (!post) {
        errored += 1;
        results.push({ job: jobLabel, status: "generation_failed" });
        continue;
      }
      generated += 1;

      // GATE: el crítico evalúa el post; el dossier es el sourceText para
      // verificar precisión factual contra los datos reales.
      const verdict = await evaluateBlogPost({
        title: post.title,
        body: post.body,
        faq: post.faq,
        sourceText: dossier.dossier,
        recentTitles: existingTitles.filter((t) => t !== post.title),
      });

      if (!shouldPublish(verdict)) {
        rejected += 1;
        results.push({
          job: jobLabel,
          slug: post.slug,
          title: post.title,
          status: "rejected",
          verdict,
        });
        continue;
      }

      if (!dryRun) {
        await upsertEvergreenPost(post);
        existingTitles.push(post.title);
      }
      published += 1;
      results.push({
        job: jobLabel,
        slug: post.slug,
        title: post.title,
        status: "published",
        verdict,
      });
    } catch (err) {
      errored += 1;
      results.push({
        job: jobLabel,
        status: "error",
        error: (err as Error).message,
      });
    }
  }

  if (!dryRun && published > 0) {
    try {
      revalidatePath("/blog");
      revalidatePath("/blog/[slug]", "page");
      revalidatePath("/blog/rss.xml");
      revalidatePath("/sitemap.xml");
    } catch (err) {
      console.error("[generate-evergreen] revalidate failed:", (err as Error).message);
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    jobsTotal: jobs.length,
    processed: cap,
    generated,
    published,
    rejected,
    errored,
    results,
  });
}

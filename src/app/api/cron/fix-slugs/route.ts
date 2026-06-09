// src/app/api/cron/fix-slugs/route.ts
//
// Endpoint one-shot que renormaliza los slugs del store de noticias ingeridas.
//
// Motivo: hubo un periodo en que el rewriter (Claude) devolvía slugs con
// caracteres no-ASCII (ñ, tildes) y se guardaban literalmente. Next.js
// rutea por el string exacto, así que las URLs con percent-encoding daban
// 404 (ej: /noticias/espa%C3%B1a-convocatoria... → 404).
//
// Este endpoint recorre todo el store y aplica makeSlug() a cada draft.
// Si el slug nuevo difiere del actual, lo actualiza. Si hay colisión con
// otro draft que ya tenía ese slug, lo registra como conflicto y NO lo
// cambia (para no perder histórico).
//
// Auth: Authorization: Bearer ${CRON_SECRET} o ?secret=XXX.

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { readIngestStore, writeIngestStore } from "@/lib/noticias-store";
import { makeSlug } from "@/lib/noticias-ingest";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireCron(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  const store = await readIngestStore();
  const seen = new Set<string>();
  const renamed: Array<{ from: string; to: string }> = [];
  const conflicts: Array<{ slug: string; reason: string }> = [];

  // Primera pasada: marcar los slugs ya válidos (no cambiarán).
  for (const d of store.drafts) {
    const normalized = makeSlug(d.slug || d.title || "");
    if (normalized === d.slug) {
      seen.add(d.slug);
    }
  }

  // Segunda pasada: para los que necesitan rename, validar que no haya
  // colisión con un slug ya válido.
  for (const d of store.drafts) {
    const normalized = makeSlug(d.slug || d.title || "");
    if (!normalized) {
      conflicts.push({
        slug: d.slug || "(vacío)",
        reason: "no se pudo generar slug",
      });
      continue;
    }
    if (normalized === d.slug) continue;
    if (seen.has(normalized)) {
      conflicts.push({
        slug: d.slug,
        reason: `colisiona con slug existente "${normalized}"`,
      });
      continue;
    }
    renamed.push({ from: d.slug, to: normalized });
    if (!dryRun) {
      d.slug = normalized;
    }
    seen.add(normalized);
  }

  if (!dryRun && renamed.length > 0) {
    store.generatedAt = new Date().toISOString();
    await writeIngestStore(store);
    try {
      revalidatePath("/noticias");
      revalidatePath("/noticias/[slug]", "page");
      revalidatePath("/noticias/rss.xml");
      revalidatePath("/sitemap.xml");
    } catch {
      /* noop */
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    total: store.drafts.length,
    renamedCount: renamed.length,
    conflictsCount: conflicts.length,
    renamed: renamed.slice(0, 50),
    conflicts: conflicts.slice(0, 20),
  });
}
